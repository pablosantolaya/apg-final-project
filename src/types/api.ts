// Raw shapes from external APIs

export interface JSearchJobRaw {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city: string | null;
  job_state: string | null;
  job_country: string | null;
  job_description: string;
  job_apply_link: string;
  job_posted_at_datetime_utc: string | null;
  job_employment_type: string | null;
}

export interface JSearchResponse {
  status: string;
  data: JSearchJobRaw[];
}

// newsapi.ai (formerly EventRegistry) raw shapes
export interface NewsAPIAIArticleRaw {
  uri: string;
  title: string;
  url: string;
  dateTime: string;
  source: { uri: string; title: string };
}

export interface NewsAPIAIResponse {
  articles: {
    results: NewsAPIAIArticleRaw[];
    totalResults: number;
    page: number;
    count: number;
  };
  error?: { message: string };
}

// Normalized types used throughout the app

export interface JobPosting {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  postedDate: string;
  employmentType: string;
}

export interface NewsArticle {
  title: string;
  source: string;
  date: string;
  url: string;
}

export interface JobContext {
  posting: JobPosting;
  news: NewsArticle[];
  companyDomain: string;
}
