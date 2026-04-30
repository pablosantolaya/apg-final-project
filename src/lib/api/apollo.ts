import type { ApolloResponse, Recruiter } from '../../types/api';

const RECRUITER_TITLES = [
  'recruiter',
  'talent acquisition',
  'hiring manager',
  'people operations',
];

// Strip everything after " and " to drop division suffixes like
// "Disney Entertainment and ESPN Product & Technology" -> "Disney Entertainment".
// Also strips legal suffixes, lowercases, removes non-alphanumeric, appends .com.
// Still fails for rebrands (Meta/Facebook), short tickers (GS), non-.com TLDs.
// Use the manual domain override in the UI for those cases.
export function inferCompanyDomain(company: string): string {
  return company
    .replace(/\s+(inc\.?|llc\.?|corp\.?|ltd\.?|co\.?|company|group|holdings?)\.?\s*$/i, '')
    .split(/\s+and\s+/i)[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .concat('.com');
}

export async function fetchRecruiters(
  companyDomain: string,
  apiKey: string,
): Promise<Recruiter[]> {
  const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({
      q_organization_domains_list: [companyDomain],
      person_titles: RECRUITER_TITLES,
      page: 1,
      per_page: 10,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: '' }));
    throw new Error(body.message ?? `Apollo error (${res.status})`);
  }

  const json: ApolloResponse = await res.json();

  return (json.people ?? []).slice(0, 3).map(p => ({
    name: p.name,
    title: p.title ?? '',
    linkedinUrl: p.linkedin_url ?? null,
    email: p.email ?? null,
  }));
}
