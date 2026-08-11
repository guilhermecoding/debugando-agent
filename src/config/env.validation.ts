function requireNonEmpty(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return trimmed;
}

function parseNumber(
  name: string,
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
}

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  requireNonEmpty('OLLAMA_MODEL', config.OLLAMA_MODEL as string | undefined);
  requireNonEmpty(
    'OLLAMA_SYSTEM_PROMPT',
    config.OLLAMA_SYSTEM_PROMPT as string | undefined,
  );

  parseNumber('PORT', config.PORT as string | undefined, 3000);
  parseNumber(
    'OLLAMA_TEMPERATURE',
    config.OLLAMA_TEMPERATURE as string | undefined,
    0,
  );
  parseNumber('OLLAMA_TOP_P', config.OLLAMA_TOP_P as string | undefined, 0.1);
  parseNumber(
    'OLLAMA_TIMEOUT_MS',
    config.OLLAMA_TIMEOUT_MS as string | undefined,
    60000,
  );

  return config;
}
