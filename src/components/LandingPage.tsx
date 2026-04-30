interface Props {
  onStart: () => void;
  onSettings: () => void;
  isConfigured: boolean;
}

function AppIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-accent">
      <rect x="4" y="3" width="20" height="26" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M10 11h12M10 16h12M10 21h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M24 9l2 1.5L28 9l-1.5-2L24 9z" fill="currentColor" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M13 8c0 .28-.02.55-.07.81l1.27.99-1.2 2.08-1.49-.6c-.42.32-.9.57-1.41.74L9.9 13.5H6.1l-.2-1.48a4.51 4.51 0 01-1.41-.74l-1.49.6-1.2-2.08 1.27-.99A4.52 4.52 0 013 8c0-.28.02-.55.07-.81L1.8 6.2 3 4.12l1.49.6c.42-.32.9-.57 1.41-.74L6.1 2.5h3.8l.2 1.48c.51.17.99.42 1.41.74l1.49-.6 1.2 2.08-1.27.99c.05.26.07.53.07.81z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9" cy="9" r="2.5" fill="currentColor" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 3a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2v10M5 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <SearchIcon />,
    title: 'Find the Right Job',
    desc: 'Search live listings via JSearch or paste any job description manually.',
  },
  {
    icon: <SparkleIcon />,
    title: 'AI-Tailored Package',
    desc: 'Gemini generates a resume, cover letter, and cold email in one shot.',
  },
  {
    icon: <ChatIcon />,
    title: 'Refine Until Perfect',
    desc: 'Chat interface to iterate on each document as many times as you need.',
  },
  {
    icon: <DownloadIcon />,
    title: 'Export Anywhere',
    desc: 'Copy to clipboard, download .txt files, or grab a full .zip package.',
  },
];

export function LandingPage({ onStart, onSettings, isConfigured }: Props) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal header */}
      <header className="h-14 border-b border-neutral-100 flex items-center justify-between px-8">
        <span className="text-sm font-semibold text-neutral-800 tracking-tight">APG</span>
        <div className="flex items-center gap-3">
          {!isConfigured && (
            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              Set up API keys before starting
            </span>
          )}
          <button
            onClick={onSettings}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            aria-label="Open settings"
          >
            <GearIcon />
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl w-full">

          {/* App icon */}
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-8">
            <AppIcon />
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 tracking-tight leading-tight mb-5">
            Application Package<br />Generator
          </h1>

          {/* Tagline */}
          <p className="text-base sm:text-lg text-neutral-500 leading-relaxed mb-12 max-w-md mx-auto">
            Turn any job posting into a complete, tailored application package — resume, cover letter, and cold outreach email — powered by Gemini 2.5 Flash.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12 max-w-lg mx-auto text-left">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="flex gap-3.5 p-4 rounded-xl bg-neutral-50 border border-neutral-100 hover:border-neutral-200 transition-colors"
              >
                <span className="text-accent shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-neutral-800 mb-0.5">{f.title}</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white text-sm font-semibold rounded-xl hover:opacity-90 active:opacity-80 transition-opacity shadow-lg shadow-accent/20"
          >
            Start Building
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Sub-note */}
          <p className="text-xs text-neutral-400 mt-6">
            Powered by Google Gemini 2.5 Flash &nbsp;·&nbsp; API keys stay in your browser
          </p>
        </div>
      </main>
    </div>
  );
}
