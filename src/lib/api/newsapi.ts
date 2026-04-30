import type { NewsAPIAIResponse, NewsArticle } from '../../types/api';

export async function fetchCompanyNews(
  company: string,
  apiKey: string,
): Promise<NewsArticle[]> {
  const url = new URL('https://newsapi.ai/api/v1/article/getArticles');
  // Drop division suffixes ("Disney Entertainment and ESPN...") and skip exact-phrase
  // quoting so partial matches on the brand name still return results.
  const brand = company.split(/\s+and\s+/i)[0].trim();
  url.searchParams.set('keyword', brand);
  url.searchParams.set('lang', 'eng');
  url.searchParams.set('articlesCount', '5');
  url.searchParams.set('sortBy', 'date');
  url.searchParams.set('apiKey', apiKey);

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `NewsAPI error (${res.status})`);
  }

  const json: NewsAPIAIResponse = await res.json();

  if (json.error) {
    throw new Error(json.error.message);
  }

  return (json.articles?.results ?? [])
    .filter(a => a.title)
    .slice(0, 5)
    .map(a => ({
      title: a.title,
      source: a.source.title,
      date: a.dateTime,
      url: a.url,
    }));
}
