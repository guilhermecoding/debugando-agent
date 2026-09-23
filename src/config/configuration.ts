export type AppConfig = {
  port: number;
  ollama: {
    baseUrl: string;
    model: string;
    systemPrompt: string;
    temperature: number;
    topP: number;
    timeoutMs: number;
  };
};

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL ?? '',
    systemPrompt: process.env.OLLAMA_SYSTEM_PROMPT ?? '',
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE ?? '0'),
    topP: parseFloat(process.env.OLLAMA_TOP_P ?? '0.1'),
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS ?? '60000', 10),
  },
});
