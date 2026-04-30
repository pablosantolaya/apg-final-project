interface Props {
  value: string;
  onChange: (text: string) => void;
}

export function ContextCard({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Context
        </span>
        <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
          Optional notes to personalize your package — why you want this role, connections you have, anything to emphasize.
        </p>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. I really want this role because… I know someone at the company…"
        rows={4}
        className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 bg-white text-neutral-800 placeholder-neutral-300 resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all leading-relaxed"
      />
    </div>
  );
}
