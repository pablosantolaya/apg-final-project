import { useState } from 'react';
import { useSettings } from './lib/useSettings';
import { SettingsModal } from './components/SettingsModal';
import { InputsPanel } from './components/InputsPanel';
import { OutputsPanel } from './components/OutputsPanel';
import { DebugPanel } from './components/DebugPanel';
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

const EMPTY_HISTORIES: ChatHistories = { resume: [], coverLetter: [], coldEmail: [] };

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-neutral-500">
      <path
        d="M8 10a2 2 0 100-4 2 2 0 000 4z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 8c0 .28-.02.55-.07.81l1.27.99-1.2 2.08-1.49-.6c-.42.32-.9.57-1.41.74L9.9 13.5H6.1l-.2-1.48a4.51 4.51 0 01-1.41-.74l-1.49.6-1.2-2.08 1.27-.99A4.52 4.52 0 013 8c0-.28.02-.55.07-.81L1.8 6.2 3 4.12l1.49.6c.42-.32.9-.57 1.41-.74L6.1 2.5h3.8l.2 1.48c.51.17.99.42 1.41.74l1.49-.6 1.2 2.08-1.27.99c.05.26.07.53.07.81z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const body = lines
    .slice(subjectIdx + 1)
    .join('\n')
    .trim();
  return { subject, body };
}

export default function App() {
  const { settings, updateSettings, isConfigured } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [jobContext, setJobContext] = useState<JobContext | null>(() => loadJson(JOB_CONTEXT_KEY));
  const [resumeText, setResumeText] = useState<string>(() => localStorage.getItem(RESUME_KEY) ?? '');
  const [userContext, setUserContext] = useState<string>(() => localStorage.getItem(CONTEXT_KEY) ?? '');
  const [outputs, setOutputs] = useState<GeneratedOutputs | null>(() => loadJson(OUTPUTS_KEY));

  // Preserved for multi-turn refinement context
  const [originalUserMsg, setOriginalUserMsg] = useState<string | null>(null);
  const [originalOutputs, setOriginalOutputs] = useState<GeneratedOutputs | null>(null);

  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState<RefinementKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenUsage | null>(null);
  const [sessionLog, setSessionLog] = useState<SessionEntry[]>([]);
  const [debugVisible, setDebugVisible] = useState(false);
  const [chatHistories, setChatHistories] = useState<ChatHistories>(EMPTY_HISTORIES);

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

    const currentHistory = chatHistories[key];

    try {
      const { text, tokens: usage } = await refineOutput(
        key,
        originalUserMsg,
        originalOutput,
        currentHistory,
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

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="h-14 shrink-0 bg-white border-b border-neutral-200 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold tracking-tight text-neutral-900 shrink-0">
            Application Package Generator
          </span>
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

      {/* Two-pane layout — stacks vertically on mobile */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <aside className="md:w-72 xl:w-80 shrink-0 border-b md:border-b-0 md:border-r border-neutral-200 bg-neutral-50 overflow-y-auto max-h-[45vh] md:max-h-none">
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
