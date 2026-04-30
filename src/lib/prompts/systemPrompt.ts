import type { JobContext } from '../../types/api';

export function buildSystemPrompt(): string {
  return `You are an expert career coach and professional writer. Your task is to produce a complete, tailored job application package for the applicant.

RULES:
- Write in first person (the applicant's voice)
- Keep the resume to one page of content (plain text, approximately 600–900 words)
- The cover letter should be 3–4 paragraphs: opening hook, relevant experience, culture/motivation fit, call to action
- The cold outreach email should be short (5–8 sentences), conversational, and reference recent company news if provided
- Do NOT fabricate experience, skills, credentials, or dates not present in the applicant's resume
- Tailor every document specifically to the job posting's requirements and language
- Return exactly the JSON structure requested — no extra text, no markdown fences

FORMATTING (plain text, newlines only — no markdown):
- Section headers in ALL CAPS on their own line (e.g. EXPERIENCE, EDUCATION, SKILLS)
- One blank line between sections
- Each bullet point on its own line starting with "- "
- Job/school entries on their own line, followed immediately by bullet points
- Cover letter paragraphs separated by blank lines
- No markdown symbols (#, **, __, etc.)`;
}

interface UserPayload {
  jobContext: JobContext;
  resumeText: string;
  userContext: string;
}

export function buildUserMessage({ jobContext, resumeText, userContext }: UserPayload): string {
  const { posting, news } = jobContext;

  const newsSnippet =
    news.length > 0
      ? news
          .slice(0, 3)
          .map(a => `- ${a.title} (${a.source}, ${a.date.slice(0, 10)})`)
          .join('\n')
      : 'No recent news available.';

  return `## Job Posting
Title: ${posting.title}
Company: ${posting.company}
Location: ${posting.location ?? 'Not specified'}
${posting.description ? `\nDescription:\n${posting.description.slice(0, 3000)}` : ''}

## Applicant Resume
${resumeText}

## Recent Company News
${newsSnippet}

## Applicant Notes
${userContext.trim() || 'None provided.'}

---
Generate the application package as JSON with keys: resume (string), coverLetter (string), coldEmail (object with subject and body strings).`;
}
