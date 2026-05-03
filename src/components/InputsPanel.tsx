import { useState } from 'react';
import type { Settings } from '../types';
import type { JobContext, JobPosting } from '../types/api';
import { fetchCompanyNews } from '../lib/api/newsapi';
import { JobPostingCard } from './JobPostingCard';
import { NewsCard } from './NewsCard';
import { RecruiterCard } from './RecruiterCard';
import { ResumeCard } from './ResumeCard';
import { ContextCard } from './ContextCard';

interface Props {
  jobContext: JobContext | null;
  onJobContextChange: (ctx: JobContext | null) => void;
  settings: Settings;
  resumeText: string;
  onResumeChange: (text: string) => void;
  userContext: string;
  onUserContextChange: (text: string) => void;
}

export function InputsPanel({
  jobContext,
  onJobContextChange,
  settings,
  resumeText,
  onResumeChange,
  userContext,
  onUserContextChange,
}: Props) {
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  const handleJobSelect = async (posting: JobPosting) => {
    onJobContextChange({ posting, news: [], companyDomain: '' });

    if (!posting.company || !settings.newsApiKey) return;

    setNewsLoading(true);
    setNewsError(null);
    try {
      const news = await fetchCompanyNews(posting.company, settings.newsApiKey);
      onJobContextChange({ posting, news, companyDomain: '' });
    } catch (e) {
      setNewsError(e instanceof Error ? e.message : 'News unavailable');
    } finally {
      setNewsLoading(false);
    }
  };

  const handleClearJob = () => {
    onJobContextChange(null);
    setNewsError(null);
  };

  return (
    <div className="flex flex-col gap-6 p-5 overflow-y-auto">
      {/* Job Posting */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Job Posting
        </span>
        <JobPostingCard
          posting={jobContext?.posting ?? null}
          apiKey={settings.jsearchApiKey}
          onSelect={handleJobSelect}
          onClear={handleClearJob}
        />
      </div>

      {/* News */}
      {jobContext && (
        <NewsCard
          company={jobContext.posting.company}
          articles={jobContext.news}
          loading={newsLoading}
          error={newsError}
        />
      )}

      {/* Recruiters */}
      {jobContext?.posting.company && (
        <RecruiterCard company={jobContext.posting.company} />
      )}

      {/* Resume */}
      <ResumeCard value={resumeText} onChange={onResumeChange} />

      {/* Context */}
      <ContextCard value={userContext} onChange={onUserContextChange} />
    </div>
  );
}
