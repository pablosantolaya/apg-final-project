import type { TokenUsage, SessionEntry } from '../types/generation';

interface Props {
  tokens: TokenUsage | null;
  sessionLog: SessionEntry[];
  onClose: () => void;
}

const KEY_LABEL: Record<string, string> = {
  resume: 'resume',
  coverLetter: 'cover letter',
  coldEmail: 'cold email',
};

export function DebugPanel({ tokens, sessionLog, onClose }: Props) {
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(sessionLog, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apg-session-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-4 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Debug
        </span>
        <div className="flex items-center gap-3">
          {sessionLog.length > 0 && (
            <button
              onClick={handleExport}
              className="text-[10px] text-accent hover:underline underline-offset-2"
            >
              Export log
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Hide
          </button>
        </div>
      </div>

      {tokens && (
        <div className="flex gap-6 mb-3">
          <div>
            <p className="text-[10px] text-neutral-400">Prompt tokens</p>
            <p className="text-xs font-semibold text-neutral-700">
              {tokens.promptTokens.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400">Output tokens</p>
            <p className="text-xs font-semibold text-neutral-700">
              {tokens.outputTokens.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400">Total</p>
            <p className="text-xs font-semibold text-neutral-700">
              {tokens.totalTokens.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {sessionLog.length === 0 ? (
        <p className="text-xs text-neutral-400">No generations this session.</p>
      ) : (
        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {[...sessionLog].reverse().map((entry, i) => (
            <div key={i} className="flex items-center justify-between text-[10px]">
              <span className="text-neutral-600 truncate max-w-[55%]">
                {entry.action === 'refine' && entry.refinementKey
                  ? `refine ${KEY_LABEL[entry.refinementKey] ?? entry.refinementKey}`
                  : `generate`}{' '}
                — {entry.jobTitle} @ {entry.company}
              </span>
              <span className="text-neutral-400 shrink-0 ml-2">
                {entry.tokens.totalTokens.toLocaleString()} tok · {entry.timestamp.slice(11, 16)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
