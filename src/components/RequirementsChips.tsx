interface Props {
  requirements: string[] | undefined;
}

export function RequirementsChips({ requirements }: Props) {
  if (!requirements || requirements.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 shrink-0">
        Optimized for
      </span>
      {requirements.map(req => (
        <span
          key={req}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/8 text-accent border border-accent/20"
        >
          {req}
        </span>
      ))}
    </div>
  );
}
