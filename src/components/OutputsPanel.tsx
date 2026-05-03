import { useState, useEffect } from 'react';
import type { GeneratedOutputs, TokenUsage, ChatHistories, RefinementKey } from '../types/generation';
import type { OutputTab } from '../types';
import { Spinner } from './Spinner';
import { RefinementChat } from './RefinementChat';
import { RequirementsChips } from './RequirementsChips';
import { GapsForm } from './GapsForm';
import { ResumeDiff } from './ResumeDiff';
import { downloadTxt, downloadZip } from '../lib/export';

interface Props {
  outputs: GeneratedOutputs | null;
  generating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  tokens: TokenUsage | null;
  debugVisible: boolean;
  onToggleDebug: () => void;
  chatHistories: ChatHistories;
  onRefine: (key: RefinementKey, instruction: string) => void;
  refining: RefinementKey | null;
  jobTitle: string;
  resumeText: string;
}

const TABS: { id: OutputTab; label: string }[] = [
  { id: 'resume', label: 'Tailored Resume' },
  { id: 'cover-letter', label: 'Cover Letter' },
  { id: 'cold-outreach', label: 'Cold Outreach' },
];

const TAB_TO_KEY: Record<OutputTab, RefinementKey> = {
  'resume': 'resume',
  'cover-letter': 'coverLetter',
  'cold-outreach': 'coldEmail',
};

const TAB_FILENAME: Record<OutputTab, string> = {
  'resume': 'resume.txt',
  'cover-letter': 'cover-letter.txt',
  'cold-outreach': 'cold-outreach.txt',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function FormattedText({ text }: { text: string }) {
  return (
    <div>
      {text.split('\n').map((line, i) => {
        const trimmed = line.trim();

        if (!trimmed) return <div key={i} className="h-3" />;

        // ALL-CAPS section header
        if (
          trimmed === trimmed.toUpperCase() &&
          /[A-Z]/.test(trimmed) &&
          trimmed.length < 60 &&
          !trimmed.startsWith('-')
        ) {
          return (
            <p
              key={i}
              className="text-[11px] font-bold text-neutral-900 uppercase tracking-wider mt-5 mb-1 border-b border-neutral-100 pb-0.5 first:mt-0"
            >
              {trimmed}
            </p>
          );
        }

        // Bullet point
        if (/^[-•*]\s/.test(trimmed)) {
          return (
            <div key={i} className="flex gap-2 ml-1 my-0.5">
              <span className="text-neutral-400 shrink-0 text-xs leading-relaxed select-none">–</span>
              <span className="text-xs text-neutral-700 leading-relaxed">
                {trimmed.replace(/^[-•*]\s+/, '')}
              </span>
            </div>
          );
        }

        return (
          <p key={i} className="text-xs text-neutral-700 leading-relaxed my-0.5">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

function DocumentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-neutral-300">
      <path
        d="M13 2H6a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 2v6h6M9 12h4M9 16h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OutputsPanel({
  outputs,
  generating,
  canGenerate,
  onGenerate,
  debugVisible,
  onToggleDebug,
  chatHistories,
  onRefine,
  refining,
  jobTitle,
  resumeText,
}: Props) {
  const [activeTab, setActiveTab] = useState<OutputTab>('resume');
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => { setShowDiff(false); }, [outputs]);

  const activeKey = TAB_TO_KEY[activeTab];

  const getTabContent = (tab: OutputTab): string => {
    if (!outputs) return '';
    if (tab === 'resume') return outputs.resume;
    if (tab === 'cover-letter') return outputs.coverLetter;
    return `Subject: ${outputs.coldEmail.subject}\n\n${outputs.coldEmail.body}`;
  };

  const tabContent = getTabContent(activeTab);

  const generateTooltip = !canGenerate
    ? !jobTitle
      ? 'Select a job posting and add your resume first'
      : 'Add your resume first'
    : undefined;

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-4 border-b border-neutral-200 shrink-0 gap-2 flex-wrap">
        <div className="flex items-end gap-0.5">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-3.5 text-xs font-medium transition-all border-b-2 -mb-px whitespace-nowrap ${
                activeTab === id
                  ? 'text-accent border-accent'
                  : 'text-neutral-500 border-transparent hover:text-neutral-800 hover:border-neutral-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 py-2">
          <button
            onClick={onToggleDebug}
            className="text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            {debugVisible ? 'Hide debug' : 'Debug'}
          </button>

          {outputs && (
            <button
              onClick={() => downloadZip(outputs, jobTitle)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap"
            >
              Package .zip
            </button>
          )}

          <button
            onClick={onGenerate}
            disabled={!canGenerate || !!generating}
            title={generateTooltip}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-accent rounded-lg hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {generating && <Spinner size={12} className="text-white" />}
            {generating ? 'Generating…' : outputs ? 'Regenerate' : 'Generate Package'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {generating ? (
          <div className="flex items-center justify-center h-full p-10">
            <div className="text-center">
              <Spinner size={28} className="text-accent mx-auto mb-4" />
              <p className="text-sm font-medium text-neutral-600">Generating your package…</p>
              <p className="text-xs text-neutral-400 mt-1.5">This usually takes 10–20 seconds.</p>
            </div>
          </div>
        ) : !outputs ? (
          <div className="flex items-center justify-center h-full p-10">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mx-auto mb-4">
                <DocumentIcon />
              </div>
              <p className="text-sm font-medium text-neutral-600">No output yet</p>
              <p className="text-xs text-neutral-400 mt-1.5 max-w-xs">
                {canGenerate
                  ? 'Click Generate Package to create your tailored resume, cover letter, and cold outreach email.'
                  : 'Select a job posting and paste your resume on the left, then click Generate Package.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Per-tab actions */}
            <div className="flex items-center justify-between gap-2 mb-4">
              {activeTab === 'resume' && (
                <button
                  onClick={() => setShowDiff(v => !v)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  {showDiff ? 'Hide changes' : 'Show changes'}
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => downloadTxt(tabContent, TAB_FILENAME[activeTab])}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Download .txt
                </button>
                <CopyButton text={tabContent} />
              </div>
            </div>

            {activeTab === 'resume' && (
              <RequirementsChips requirements={outputs.extractedRequirements} />
            )}

            {activeTab === 'resume' && showDiff ? (
              <ResumeDiff original={resumeText} tailored={outputs.resume} />
            ) : (
              <FormattedText text={tabContent} />
            )}

            {activeTab === 'resume' && (
              <GapsForm
                gaps={outputs.gaps}
                onApply={instruction => onRefine('resume', instruction)}
                applying={refining === 'resume'}
              />
            )}

            <RefinementChat
              history={chatHistories[activeKey]}
              isRefining={refining === activeKey}
              onSend={instruction => onRefine(activeKey, instruction)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
