import { useState, useEffect } from 'react';
import type { Settings } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (next: Partial<Settings>) => void;
}

type FieldDef = {
  key: keyof Settings;
  label: string;
  description: string;
  linkHref: string;
};

const FIELDS: FieldDef[] = [
  {
    key: 'geminiApiKey',
    label: 'Gemini API Key',
    description: 'Powers resume, cover letter, and outreach generation via Google Gemini.',
    linkHref: 'https://aistudio.google.com/apikey',
  },
  {
    key: 'jsearchApiKey',
    label: 'JSearch API Key (RapidAPI)',
    description: 'Enables live job posting searches via JSearch on RapidAPI.',
    linkHref: 'https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch',
  },
  {
    key: 'newsApiKey',
    label: 'NewsAPI Key',
    description: 'Pulls recent company news to personalize outreach messages.',
    linkHref: 'https://newsapi.ai/register',
  },
];

export function SettingsModal({ isOpen, onClose, settings, onSave }: Props) {
  const [draft, setDraft] = useState<Settings>(settings);
  const [savedVisible, setSavedVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setDraft(settings);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(draft);
    setSavedVisible(true);
    setTimeout(() => setSavedVisible(false), 2000);
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Settings</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              API keys are stored locally in your browser.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            aria-label="Close settings"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M11 3L3 11M3 3l8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="px-6 py-5 space-y-5">
          {FIELDS.map(({ key, label, description, linkHref }) => (
            <div key={key}>
              <div className="flex items-baseline justify-between mb-1.5">
                <label
                  htmlFor={key}
                  className="text-xs font-medium text-neutral-700"
                >
                  {label}
                </label>
                <a
                  href={linkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline underline-offset-2"
                >
                  Get a key
                </a>
              </div>
              <input
                id={key}
                type="password"
                value={draft[key]}
                onChange={e =>
                  setDraft(prev => ({ ...prev, [key]: e.target.value }))
                }
                placeholder="••••••••••••••••"
                autoComplete="off"
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 border-t border-neutral-100">
          <span
            className={`text-xs font-medium text-emerald-600 transition-opacity duration-700 ${
              savedVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Saved
          </span>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-accent rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
