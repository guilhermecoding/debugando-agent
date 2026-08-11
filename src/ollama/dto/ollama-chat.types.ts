export type OllamaChatRole = 'system' | 'user' | 'assistant';

export type OllamaChatMessage = {
  role: OllamaChatRole;
  content: string;
};

export type OllamaChatRequest = {
  model: string;
  stream: false;
  options: {
    temperature: number;
    top_p: number;
  };
  messages: OllamaChatMessage[];
};

export type OllamaChatResponse = {
  model: string;
  message: OllamaChatMessage;
  done: boolean;
};
