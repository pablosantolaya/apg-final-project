import { useState } from 'react';
import type { GapItem } from '../types/generation';
import { Spinner } from './Spinner';

interface Props {
  gaps: GapItem[] | undefined;
  onApply: (instruction: string) => void;
  applying: boolean;
}

export function GapsForm({ gaps, onApply, applying }: Props) {
  const [open, setOpen] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!gaps || gaps.length === 0) return null;

  const filledAnswers = Object.entries(answers).filter(([, v]) => v.trim());
  const canApply = filledAnswers.length > 0 && !applying;

  const handleApply = () => {
    const lines = filledAnswers
      .map(([req, ans]) => `- ${req}: ${ans.trim()}`)
      .join('\n');
    onApply(
      `Incorporate these additional experiences into the resume bullets:\n${lines}\nRewrite relevant bullets to reflect this experience. Do not fabricate details not provided.`,
    );
    setAnswers({});
  };

  return (
    <div className="mt-6 border border-neutral-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-600">
            Strengthen your application
          </span>
          <span className="text-[10px] font-medium text-white bg-amber-400 rounded-full px-1.5 py-0.5 leading-none">
            {gaps.length}
          </span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={`text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="px-4 py-4 space-y-4">
          <p className="text-xs text-neutral-500 leading-relaxed">
            These job requirements aren't fully addressed in your resume. Add your experience below to strengthen the next refinement.
          </p>

          {gaps.map(gap => (
            <div key={gap.requirement} className="space-y-1.5">
              <p className="text-[11px] font-semibold text-neutral-800">{gap.requirement}</p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">{gap.question}</p>
              <textarea
                value={answers[gap.requirement] ?? ''}
                onChange={e => setAnswers(prev => ({ ...prev, [gap.requirement]: e.target.value }))}
                placeholder="Describe your experience…"
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-white text-neutral-800 placeholder-neutral-300 resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all leading-relaxed"
              />
            </div>
          ))}

          <button
            onClick={handleApply}
            disabled={!canApply}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-accent rounded-lg hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {applying && <Spinner size={12} className="text-white" />}
            {applying ? 'Applying…' : 'Apply my answers'}
            {!applying && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
