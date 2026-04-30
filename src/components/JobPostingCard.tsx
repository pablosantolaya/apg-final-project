import { useState } from 'react';
import type { JobPosting } from '../types/api';
import { searchJobs } from '../lib/api/jsearch';
import { Spinner } from './Spinner';

interface Props {
  posting: JobPosting | null;
  apiKey: string;
  onSelect: (posting: JobPosting) => void;
  onClear: () => void;
}

type Mode = 'idle' | 'search' | 'paste';

export function JobPostingCard({ posting, apiKey, onSelect, onClear }: Props) {
  const [mode, setMode] = useState<Mode>('idle');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<JobPosting[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [pasteCompany, setPasteCompany] = useState('');

  const resetSearch = () => {
    setMode('idle');
    setResults([]);
    setSearchError(null);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setResults([]);
    try {
      const jobs = await searchJobs(query, location, apiKey);
      if (jobs.length === 0) setSearchError('No results found. Try different keywords or location.');
      else setResults(jobs);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePasteSubmit = () => {
    if (!rawText.trim()) return;
    onSelect({
      title: '',
      company: pasteCompany.trim(),
      location: '',
      description: rawText.trim(),
      url: '',
      postedDate: '',
      employmentType: '',
    });
    setRawText('');
    setPasteCompany('');
    setMode('idle');
  };

  // Selected view
  if (posting) {
    return (
      <div className="border border-neutral-200 rounded-xl bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-neutral-900 leading-snug">
              {posting.title || '(Pasted job posting)'}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {[posting.company, posting.location, posting.employmentType]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <button
            onClick={onClear}
            className="shrink-0 text-xs text-neutral-400 hover:text-neutral-600 underline underline-offset-2"
          >
            Change
          </button>
        </div>
        {posting.description && (
          <p className="mt-2.5 text-xs text-neutral-400 leading-relaxed line-clamp-4">
            {posting.description}
          </p>
        )}
        {posting.url && (
          <a
            href={posting.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-accent hover:underline underline-offset-2"
          >
            View posting
          </a>
        )}
      </div>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <div className="border border-neutral-200 rounded-xl bg-white p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Title or keywords"
            className="flex-1 min-w-0 px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder-neutral-300"
            autoFocus
          />
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Location"
            className="w-28 shrink-0 px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder-neutral-300"
          />
          <button
            onClick={handleSearch}
            disabled={searchLoading || !query.trim()}
            className="shrink-0 px-3 py-2 text-xs font-semibold text-white bg-accent rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1.5"
          >
            {searchLoading && <Spinner size={11} className="text-white" />}
            Search
          </button>
        </div>

        {searchError && <p className="text-xs text-red-500">{searchError}</p>}

        {results.length > 0 && (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {results.map((job, i) => (
              <button
                key={i}
                onClick={() => { resetSearch(); onSelect(job); }}
                className="w-full text-left p-3 rounded-lg border border-neutral-100 hover:border-accent/30 hover:bg-accent/5 transition-all"
              >
                <p className="text-xs font-medium text-neutral-900 leading-snug">{job.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {[job.company, job.location].filter(Boolean).join(' · ')}
                </p>
                {job.description && (
                  <p className="mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {job.description.slice(0, 160)}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={resetSearch}
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Paste mode
  if (mode === 'paste') {
    return (
      <div className="border border-neutral-200 rounded-xl bg-white p-4 space-y-2.5">
        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={7}
          className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder-neutral-300 resize-none leading-relaxed"
          autoFocus
        />
        <input
          type="text"
          value={pasteCompany}
          onChange={e => setPasteCompany(e.target.value)}
          placeholder="Company name (needed for news and recruiter lookup)"
          className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder-neutral-300"
        />
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setMode('idle')}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePasteSubmit}
            disabled={!rawText.trim()}
            className="px-3 py-2 text-xs font-semibold text-white bg-accent rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Use this posting
          </button>
        </div>
      </div>
    );
  }

  // Idle mode
  return (
    <div className="border border-dashed border-neutral-200 rounded-xl bg-white p-4 space-y-2">
      <button
        onClick={() => setMode('search')}
        disabled={!apiKey}
        title={!apiKey ? 'Add a JSearch API key in settings to enable search' : undefined}
        className="w-full px-3 py-2.5 text-xs font-medium text-accent bg-accent/5 border border-accent/20 rounded-lg hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Search for a job
      </button>
      <button
        onClick={() => setMode('paste')}
        className="w-full px-3 py-2.5 text-xs font-medium text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors"
      >
        Paste job description
      </button>
      {!apiKey && (
        <p className="text-xs text-neutral-400 text-center pt-0.5">
          Add a JSearch API key in settings to enable search.
        </p>
      )}
    </div>
  );
}
