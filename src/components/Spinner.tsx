export function Spinner({
  size = 14,
  className = 'text-neutral-400',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={`animate-spin shrink-0 ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="24 14"
        strokeLinecap="round"
      />
    </svg>
  );
}
