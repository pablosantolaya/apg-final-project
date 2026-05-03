import { useState, useRef, useEffect } from 'react';
import { useSettings } from './lib/useSettings';
import { SettingsModal } from './components/SettingsModal';
import { LandingPage } from './components/LandingPage';
import { InputsPanel } from './components/InputsPanel';
import { OutputsPanel } from './components/OutputsPanel';
import { DebugPanel } from './components/DebugPanel';
import { Spinner } from './components/Spinner';
import { generatePackage, refineOutput } from './lib/api/gemini';
import { buildSystemPrompt, buildUserMessage } from './lib/prompts/systemPrompt';
import type { JobContext } from './types/api';
import type {
  GeneratedOutputs,
  TokenUsage,
  SessionEntry,
  ChatHistories,
  RefinementKey,
} from './types/generation';

const JOB_CONTEXT_KEY = 'apg-job-context';
const RESUME_KEY = 'apg-resume';
const CONTEXT_KEY = 'apg-context';
const OUTPUTS_KEY = 'apg-outputs';
const PANEL_WIDTH_KEY = 'apg-panel-width';

const EMPTY_HISTORIES: ChatHistories = { resume: [], coverLetter: [], coldEmail: [] };
const DEFAULT_PANEL_WIDTH = 360;

function loadJson<T>(key: string): T | null {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

function parseColdEmailText(text: string): { subject: string; body: string } {
  const lines = text.split('\n');
  const subjectIdx = lines.findIndex(l => /^subject:/i.test(l.trim()));
  if (subjectIdx === -1) return { subject: '', body: text.trim() };
  const subject = lines[subjectIdx].replace(/^subject:\s*/i, '').trim();
  const body = lines.slice(subjectIdx + 1).join('\n').trim();
  return { subject, body };
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-neutral-500">
      <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 8c0 .28-.02.55-.07.81l1.27.99-1.2 2.08-1.49-.6c-.42.32-.9.57-1.41.74L9.9 13.5H6.1l-.2-1.48a4.51 4.51 0 01-1.41-.74l-1.49.6-1.2-2.08 1.27-.99A4.52 4.52 0 013 8c0-.28.02-.55.07-.81L1.8 6.2 3 4.12l1.49.6c.42-.32.9-.57 1.41-.74L6.1 2.5h3.8l.2 1.48c.51.17.99.42 1.41.74l1.49-.6 1.2 2.08-1.27.99c.05.26.07.53.07.81z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  const { settings, updateSettings, isConfigured } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Show landing page unless user already has outputs from a previous session
  const [view, setView] = useState<'landing' | 'main'>(() =>
    loadJson(OUTPUTS_KEY) ? 'main' : 'landing',
  );

  const [jobContext, setJobContext] = useState<JobContext | null>(() => loadJson(JOB_CONTEXT_KEY));
  const [resumeText, setResumeText] = useState<string>(() => localStorage.getItem(RESUME_KEY) ?? '');
  const [userContext, setUserContext] = useState<string>(() => localStorage.getItem(CONTEXT_KEY) ?? '');
  const [outputs, setOutputs] = useState<GeneratedOutputs | null>(() => loadJson(OUTPUTS_KEY));

  const [originalUserMsg, setOriginalUserMsg] = useState<string | null>(null);
  const [originalOutputs, setOriginalOutputs] = useState<GeneratedOutputs | null>(null);

  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState<RefinementKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenUsage | null>(null);
  const [sessionLog, setSessionLog] = useState<SessionEntry[]>([]);
  const [debugVisible, setDebugVisible] = useState(false);
  const [chatHistories, setChatHistories] = useState<ChatHistories>(EMPTY_HISTORIES);

  // Resizable panel state
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem(PANEL_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_PANEL_WIDTH;
  });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const dragRef = useRef<{
    startX: number;
    startWidth: number;
    move: ((e: MouseEvent) => void) | null;
    up: (() => void) | null;
  }>({ startX: 0, startWidth: DEFAULT_PANEL_WIDTH, move: null, up: null });

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
      // Cleanup any dangling drag listeners
      if (dragRef.current.move) document.removeEventListener('mousemove', dragRef.current.move);
      if (dragRef.current.up) document.removeEventListener('mouseup', dragRef.current.up);
    };
  }, []);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current.startX = e.clientX;
    dragRef.current.startWidth = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    dragRef.current.move = (ev: MouseEvent) => {
      const delta = ev.clientX - dragRef.current.startX;
      const next = Math.max(260, Math.min(640, dragRef.current.startWidth + delta));
      setPanelWidth(next);
    };

    dragRef.current.up = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (dragRef.current.move) document.removeEventListener('mousemove', dragRef.current.move);
      if (dragRef.current.up) document.removeEventListener('mouseup', dragRef.current.up);
      dragRef.current.move = null;
      dragRef.current.up = null;
      // Persist the chosen width
      localStorage.setItem(PANEL_WIDTH_KEY, String(panelWidth));
    };

    document.addEventListener('mousemove', dragRef.current.move);
    document.addEventListener('mouseup', dragRef.current.up);
  };

  const handleJobContextChange = (ctx: JobContext | null) => {
    setJobContext(ctx);
    if (ctx) localStorage.setItem(JOB_CONTEXT_KEY, JSON.stringify(ctx));
    else localStorage.removeItem(JOB_CONTEXT_KEY);
  };

  const handleResumeChange = (text: string) => {
    setResumeText(text);
    localStorage.setItem(RESUME_KEY, text);
  };

  const handleUserContextChange = (text: string) => {
    setUserContext(text);
    localStorage.setItem(CONTEXT_KEY, text);
  };

  const canGenerate = !!jobContext?.posting && !!resumeText.trim() && !!settings.geminiApiKey;

  const addLogEntry = (entry: SessionEntry) => setSessionLog(prev => [...prev, entry]);

  const handleGenerate = async () => {
    if (!canGenerate || !jobContext) return;
    setGenerating(true);
    setError(null);
    const userMsg = buildUserMessage({ jobContext, resumeText, userContext });
    try {
      const { outputs: result, tokens: usage } = await generatePackage(
        buildSystemPrompt(),
        userMsg,
        settings.geminiApiKey,
      );
      setOutputs(result);
      setOriginalOutputs(result);
      setOriginalUserMsg(userMsg);
      setChatHistories(EMPTY_HISTORIES);
      setTokens(usage);
      localStorage.setItem(OUTPUTS_KEY, JSON.stringify(result));
      addLogEntry({
        timestamp: new Date().toISOString(),
        jobTitle: jobContext.posting.title,
        company: jobContext.posting.company,
        tokens: usage,
        action: 'generate',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleRefine = async (key: RefinementKey, instruction: string) => {
    if (!outputs || !originalOutputs || !originalUserMsg || !jobContext) return;
    setRefining(key);
    setError(null);

    const originalOutput =
      key === 'coldEmail'
        ? `Subject: ${originalOutputs.coldEmail.subject}\n\n${originalOutputs.coldEmail.body}`
        : originalOutputs[key];

    try {
      const { text, tokens: usage } = await refineOutput(
        key,
        originalUserMsg,
        originalOutput,
        chatHistories[key],
        instruction,
        settings.geminiApiKey,
      );

      let newOutputs: GeneratedOutputs;
      if (key === 'coldEmail') {
        const { subject, body } = parseColdEmailText(text);
        newOutputs = { ...outputs, coldEmail: { subject, body } };
      } else {
        newOutputs = { ...outputs, [key]: text };
      }

      setOutputs(newOutputs);
      localStorage.setItem(OUTPUTS_KEY, JSON.stringify(newOutputs));
      setTokens(usage);

      setChatHistories(prev => ({
        ...prev,
        [key]: [
          ...prev[key],
          { role: 'user' as const, content: instruction },
          { role: 'assistant' as const, content: text },
        ],
      }));

      addLogEntry({
        timestamp: new Date().toISOString(),
        jobTitle: jobContext.posting.title,
        company: jobContext.posting.company,
        tokens: usage,
        action: 'refine',
        refinementKey: key,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refinement failed');
    } finally {
      setRefining(null);
    }
  };

  if (view === 'landing') {
    return (
      <>
        <LandingPage
          onStart={() => setView('main')}
          onSettings={() => setSettingsOpen(true)}
          isConfigured={isConfigured}
        />
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onSave={updateSettings}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="h-14 shrink-0 bg-white border-b border-neutral-200 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setView('landing')}
            className="text-sm font-semibold tracking-tight text-neutral-900 hover:text-accent transition-colors"
          >
            APG
          </button>
          {!isConfigured && (
            <span className="hidden sm:inline-flex items-center text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
              API keys missing
            </span>
          )}
          {error && (
            <span className="hidden sm:inline-flex items-center text-[10px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 truncate max-w-xs">
              {error}
            </span>
          )}
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors shrink-0"
          aria-label="Open settings"
        >
          <GearIcon />
        </button>
      </header>

      {/* === GENERATING (no outputs yet) — full-screen spinner === */}
      {generating && !outputs ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white gap-4 p-10">
          <Spinner size={32} className="text-accent" />
          <div className="text-center">
            <p className="text-sm font-semibold text-neutral-800">Generating your package…</p>
            <p className="text-xs text-neutral-400 mt-1.5">
              Gemini is tailoring your resume, cover letter, and cold outreach email.
            </p>
            <p className="text-xs text-neutral-300 mt-3">This usually takes 10–20 seconds</p>
          </div>
        </div>

      ) : !outputs ? (
        /* === PRE-GENERATION — full-width inputs, sticky Generate bar === */
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto bg-neutral-50">
            <div className="max-w-2xl mx-auto px-6 py-6 w-full">
              <InputsPanel
                jobContext={jobContext}
                onJobContextChange={handleJobContextChange}
                settings={settings}
                resumeText={resumeText}
                onResumeChange={handleResumeChange}
                userContext={userContext}
                onUserContextChange={handleUserContextChange}
              />
            </div>
          </div>

          {/* Sticky action bar */}
          <div className="shrink-0 border-t border-neutral-200 bg-white px-6 py-4 flex items-center justify-between gap-4">
            <p className="text-xs text-neutral-400 leading-relaxed hidden sm:block">
              {canGenerate
                ? 'Ready — click Generate Package to build your tailored materials.'
                : 'Select a job posting and paste your resume to continue.'}
            </p>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              title={
                !settings.geminiApiKey
                  ? 'Add your Gemini API key in Settings'
                  : !jobContext?.posting
                  ? 'Select a job posting first'
                  : !resumeText.trim()
                  ? 'Paste your resume first'
                  : undefined
              }
              className="ml-auto flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-accent rounded-xl hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-accent/20"
            >
              Generate Package
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

      ) : (
        /* === POST-GENERATION — resizable split layout === */
        <div className="flex flex-col md:flex-row flex-1 min-h-0">

          {/* Left pane — resizable on desktop */}
          <aside
            style={!isMobile ? { width: panelWidth, minWidth: panelWidth } : undefined}
            className="shrink-0 border-b md:border-b-0 md:border-r border-neutral-200 bg-neutral-50 overflow-y-auto max-h-[40vh] md:max-h-none"
          >
            <InputsPanel
              jobContext={jobContext}
              onJobContextChange={handleJobContextChange}
              settings={settings}
              resumeText={resumeText}
              onResumeChange={handleResumeChange}
              userContext={userContext}
              onUserContextChange={handleUserContextChange}
            />
          </aside>

          {/* Drag handle — desktop only */}
          <div
            onMouseDown={handleDragStart}
            className="hidden md:flex w-1.5 shrink-0 bg-neutral-200 hover:bg-accent/50 cursor-col-resize transition-colors items-center justify-center group"
            title="Drag to resize"
          >
            <div className="h-10 w-0.5 rounded-full bg-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Right pane — outputs */}
          <main className="flex-1 bg-white min-w-0 flex flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <OutputsPanel
                outputs={outputs}
                generating={generating}
                canGenerate={canGenerate}
                onGenerate={handleGenerate}
                tokens={tokens}
                debugVisible={debugVisible}
                onToggleDebug={() => setDebugVisible(v => !v)}
                chatHistories={chatHistories}
                onRefine={handleRefine}
                refining={refining}
                jobTitle={jobContext?.posting.title ?? ''}
                resumeText={resumeText}
              />
            </div>
            {debugVisible && (
              <DebugPanel
                tokens={tokens}
                sessionLog={sessionLog}
                onClose={() => setDebugVisible(false)}
              />
            )}
          </main>
        </div>
      )}

      {/* Footer */}
      <footer className="h-8 shrink-0 bg-white border-t border-neutral-100 flex items-center justify-center">
        <span className="text-[10px] text-neutral-400">
          Built for [Class Name] &nbsp;·&nbsp; Group [N]
        </span>
      </footer>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
      />
    </div>
  );
}
