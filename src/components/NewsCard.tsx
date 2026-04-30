import type { NewsArticle } from '../types/api';
import { Spinner } from './Spinner';

interface Props {
  company: string;
  articles: NewsArticle[];
  loading: boolean;
  error: string | null;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function NewsCard({ company, articles, loading, error }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          {company ? `Recent news about ${company}` : 'Recent news'}
        </span>
        {loading && <Spinner size={11} />}
      </div>

      <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden">
        {error ? (
          <div className="px-4 py-3.5">
            <p className="text-xs text-neutral-500">News unavailable</p>
            <p className="text-xs text-red-400 mt-0.5 leading-relaxed">{error}</p>
          </div>
        ) : loading ? (
          <div className="px-4 py-3.5">
            <p className="text-xs text-neutral-400">Fetching latest news...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="px-4 py-3.5">
            <p className="text-xs text-neutral-400">No recent news found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {articles.map((article, i) => (
              <li key={i}>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 group"
                >
                  <p className="text-xs font-medium text-neutral-800 leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                    {article.title}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {article.source}
                    {article.date ? ` · ${formatDate(article.date)}` : ''}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
