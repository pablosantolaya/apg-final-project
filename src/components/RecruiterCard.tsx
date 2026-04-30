interface Props {
  company: string;
}

const ROLES = [
  { label: 'Recruiter', keyword: 'recruiter' },
  { label: 'Talent Acquisition', keyword: 'talent acquisition' },
  { label: 'Hiring Manager', keyword: 'hiring manager' },
  { label: 'People Operations', keyword: 'people operations' },
];

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="shrink-0">
      <path
        d="M2 9L9 2M9 2H4.5M9 2v4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RecruiterCard({ company }: Props) {
  // Drop division suffixes ("Disney Entertainment and ESPN...") for cleaner search terms
  const brand = company.split(/\s+and\s+/i)[0].trim();

  if (!brand) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        Find recruiters at {brand}
      </span>

      <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Search LinkedIn for people in recruiting roles at {brand}. Sign in to filter by 2nd-degree connections for the most reachable contacts.
          </p>
        </div>

        <ul className="divide-y divide-neutral-100">
          {ROLES.map(({ label, keyword }) => {
            const q = encodeURIComponent(`${brand} ${keyword}`);
            const url = `https://www.linkedin.com/search/results/people/?keywords=${q}&origin=GLOBAL_SEARCH_HEADER`;
            return (
              <li key={keyword}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-2.5 group hover:bg-neutral-50 transition-colors"
                >
                  <span className="text-xs font-medium text-neutral-700 group-hover:text-accent transition-colors">
                    {label}
                  </span>
                  <span className="text-neutral-400 group-hover:text-accent transition-colors">
                    <ExternalLinkIcon />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
