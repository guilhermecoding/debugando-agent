import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/configuration';
import type {
  OllamaChatMessage,
  OllamaChatRequest,
  OllamaChatResponse,
} from './dto/ollama-chat.types';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async chat(messages: OllamaChatMessage[]): Promise<OllamaChatResponse> {
    const ollama = this.configService.get('ollama', { infer: true });
    const url = `${ollama.baseUrl.replace(/\/$/, '')}/api/chat`;

    const body: OllamaChatRequest = {
      model: ollama.model,
      stream: false,
      options: {
        temperature: ollama.temperature,
        top_p: ollama.topP,
      },
      messages,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ollama.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        this.logger.error(
          `Ollama responded with ${response.status}: ${errorBody}`,
        );
        throw new ServiceUnavailableException(
          `Ollama request failed with status ${response.status}`,
        );
      }

      const data = (await response.json()) as OllamaChatResponse;

      if (!data?.message?.content) {
        throw new ServiceUnavailableException(
          'Ollama returned an empty or invalid chat response',
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Unknown Ollama error';
      this.logger.error(`Failed to reach Ollama at ${url}: ${message}`);
      throw new ServiceUnavailableException('Unable to reach Ollama chat API');
    } finally {
      clearTimeout(timeout);
    }
  }
}
