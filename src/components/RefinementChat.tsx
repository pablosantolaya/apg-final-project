import { useState } from 'react';
import type { ChatTurn } from '../types/generation';
import { Spinner } from './Spinner';

interface Props {
  history: ChatTurn[];
  isRefining: boolean;
  onSend: (message: string) => void;
}

export function RefinementChat({ history, isRefining, onSend }: Props) {
  const [input, setInput] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isRefining) return;
    onSend(trimmed);
    setInput('');
  };

  const userTurnCount = history.filter(t => t.role === 'user').length;

  return (
    <div className="border-t border-neutral-100 mt-6 pt-4">
      {userTurnCount > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setHistoryOpen(v => !v)}
            className="text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            {historyOpen ? 'Hide' : 'Show'} refinement history ({userTurnCount}{' '}
            {userTurnCount === 1 ? 'turn' : 'turns'})
          </button>

          {historyOpen && (
            <div className="mt-2 space-y-2">
              {history.map((turn, i) => (
                <div
                  key={i}
                  className={`text-xs px-3 py-2 rounded-lg border ${
                    turn.role === 'user'
                      ? 'bg-accent/5 border-accent/10 text-neutral-700'
                      : 'bg-neutral-50 border-neutral-100 text-neutral-500'
                  }`}
                >
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">
                    {turn.role === 'user' ? 'You' : 'Gemini'}
                  </span>
                  <span className="leading-relaxed line-clamp-4">{turn.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Refine this output… (e.g. Make the tone more confident)"
          disabled={isRefining}
          className="flex-1 px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-800 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isRefining}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-accent rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {isRefining && <Spinner size={12} className="text-white" />}
          {isRefining ? 'Refining…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
