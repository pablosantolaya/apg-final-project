import type { JobContext } from '../../types/api';

export function buildSystemPrompt(): string {
  return `You are an expert career coach and professional writer. Your task is to produce a complete, tailored job application package for the applicant.

RULES:
- Write in first person (the applicant's voice)
- Keep the resume to one page of content (plain text, approximately 600–900 words)
- The cover letter should be 3–4 paragraphs: opening hook, relevant experience, culture/motivation fit, call to action
- The cold outreach email should be short (5–8 sentences), conversational, and reference recent company news if provided
- Do NOT fabricate experience, skills, credentials, or dates not present in the applicant's resume
- Return exactly the JSON structure requested — no extra text, no markdown fences

TAILORING (apply aggressively — changes must be clearly visible):
- Identify the top 5–7 required skills and keywords from the job description
- Rewrite EVERY bullet using the exact terminology and keywords from the job posting where applicable — do not preserve the applicant's original phrasing if better wording exists in the job description
- Reorder bullets within each entry so the most relevant ones for this role come FIRST
- Where the applicant's experience directly addresses a job requirement, state that connection explicitly — never leave it implicit
- Open the most relevant role's first bullet with the strongest quantified achievement that maps to the job's primary requirement
- The cover letter opening must reference the specific role title and one concrete detail (product, initiative, or challenge) from the job description
- The cold email must reference a specific company news item or product if available; otherwise reference a specific aspect of the role

FORMATTING (plain text, newlines only — no markdown):
- Section headers in ALL CAPS on their own line (e.g. EXPERIENCE, EDUCATION, SKILLS)
- One blank line between sections
- Each bullet point on its own line starting with "- "
- Job/school entries on their own line, followed immediately by bullet points
- Cover letter paragraphs separated by blank lines
- No markdown symbols (#, **, __, etc.)

ANALYSIS (populate accurately based on the job description and resume provided):
- extractedRequirements: List exactly the top 5-7 skills/keywords you identified as the most critical requirements from the job description — use the exact terms from the posting
- gaps: List up to 4 requirements from the job description that the applicant's resume does NOT address or addresses only weakly. For each, write a short, direct question (max 20 words) asking the applicant if they have relevant experience to add. If the resume fully covers all requirements, return an empty array.`;
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

## Tailoring Instructions from Applicant
${userContext.trim() || 'No specific instructions — apply general best practices for this role.'}

---
Generate the application package as JSON with keys: resume (string), coverLetter (string), coldEmail (object with subject and body strings).`;
}
