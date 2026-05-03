import type { GeneratedOutputs, TokenUsage, ChatTurn, RefinementKey } from '../../types/generation';

const MODEL = 'gemini-2.5-flash';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 4000;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    resume: { type: 'STRING' },
    coverLetter: { type: 'STRING' },
    coldEmail: {
      type: 'OBJECT',
      properties: {
        subject: { type: 'STRING' },
        body: { type: 'STRING' },
      },
      required: ['subject', 'body'],
    },
    extractedRequirements: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
    gaps: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          requirement: { type: 'STRING' },
          question: { type: 'STRING' },
        },
        required: ['requirement', 'question'],
      },
    },
  },
  required: ['resume', 'coverLetter', 'coldEmail', 'extractedRequirements', 'gaps'],
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function geminiPost(
  url: string,
  body: object,
): Promise<{ text: string; tokens: TokenUsage }> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAY_MS);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      lastError = new Error(json?.error?.message ?? `Gemini error (${res.status})`);
      if (res.status === 503 || res.status === 429) continue;
      throw lastError;
    }

    const json = await res.json();
    const text: string | undefined = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned an empty response');

    const usage = json.usageMetadata ?? {};
    return {
      text,
      tokens: {
        promptTokens: usage.promptTokenCount ?? 0,
        outputTokens: usage.candidatesTokenCount ?? 0,
        totalTokens: usage.totalTokenCount ?? 0,
      },
    };
  }

  throw lastError;
}

export async function generatePackage(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
): Promise<{ outputs: GeneratedOutputs; tokens: TokenUsage }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const { text, tokens } = await geminiPost(url, {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  return { outputs: JSON.parse(text) as GeneratedOutputs, tokens };
}

export async function refineOutput(
  outputType: RefinementKey,
  originalUserMessage: string,
  originalOutput: string,
  chatHistory: ChatTurn[],
  instruction: string,
  apiKey: string,
): Promise<{ text: string; tokens: TokenUsage }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const isColdEmail = outputType === 'coldEmail';
  const docLabel = isColdEmail ? 'cold outreach email' : outputType === 'resume' ? 'resume' : 'cover letter';

  const systemText = isColdEmail
    ? `You are refining a cold outreach email for a job application. Apply the user's instructions and return ONLY the updated email in this exact format:\n\nSubject: [subject line]\n\n[email body]\n\nNo commentary.`
    : `You are refining a ${docLabel} for a job application. Apply the user's instructions and return ONLY the updated document text.\n\nFORMATTING RULES:\n- Section headers in ALL CAPS on their own line\n- Bullet points start with "- " on their own line\n- Blank line between sections\n- No markdown symbols\n\nNo commentary.`;

  // Strictly alternating user/model turns required by Gemini
  const historyContents = chatHistory.map(turn => ({
    role: turn.role === 'user' ? 'user' : 'model',
    parts: [{ text: turn.content }],
  }));

  const contents = [
    { role: 'user', parts: [{ text: originalUserMessage }] },
    { role: 'model', parts: [{ text: originalOutput }] },
    ...historyContents,
    { role: 'user', parts: [{ text: instruction }] },
  ];

  return geminiPost(url, {
    system_instruction: { parts: [{ text: systemText }] },
    contents,
  });
}
