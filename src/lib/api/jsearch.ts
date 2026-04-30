import type { JSearchResponse, JobPosting } from '../../types/api';

export async function searchJobs(
  query: string,
  location: string,
  apiKey: string,
): Promise<JobPosting[]> {
  const q = location.trim() ? `${query.trim()} in ${location.trim()}` : query.trim();
  const url = new URL('https://jsearch.p.rapidapi.com/search');
  url.searchParams.set('query', q);
  url.searchParams.set('num_pages', '1');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Search failed (${res.status})${text ? ': ' + text.slice(0, 120) : ''}`);
  }

  const json: JSearchResponse = await res.json();

  return (json.data ?? []).slice(0, 5).map(job => ({
    title: job.job_title,
    company: job.employer_name,
    location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '),
    description: job.job_description ?? '',
    url: job.job_apply_link ?? '',
    postedDate: job.job_posted_at_datetime_utc ?? '',
    employmentType: job.job_employment_type ?? '',
  }));
}
