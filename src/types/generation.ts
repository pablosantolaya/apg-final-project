export interface GeneratedOutputs {
  resume: string;
  coverLetter: string;
  coldEmail: {
    subject: string;
    body: string;
  };
}

export interface TokenUsage {
  promptTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export type RefinementKey = 'resume' | 'coverLetter' | 'coldEmail';

export type ChatHistories = Record<RefinementKey, ChatTurn[]>;

export interface SessionEntry {
  timestamp: string;
  jobTitle: string;
  company: string;
  tokens: TokenUsage;
  action: 'generate' | 'refine';
  refinementKey?: RefinementKey;
}
