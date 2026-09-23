import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/configuration';
import type { OllamaChatMessage } from '../ollama/dto/ollama-chat.types';
import type { AssistExerciseDto } from './dto/assist-exercise.dto';

@Injectable()
export class PromptBuilder {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  buildMessages(dto: AssistExerciseDto): OllamaChatMessage[] {
    const systemPrompt = this.configService.get('ollama.systemPrompt', {
      infer: true,
    });

    const level = this.normalize(dto.level);
    const structureType = this.normalize(dto.structureType);
    const statement = this.normalize(dto.statement);
    const solution = this.normalize(dto.solution);

    const userContent = [
      '[CONTEXTO DA QUESTÃO]',
      `Nível: ${level}`,
      `Estrutura: ${structureType}`,
      `Enunciado: ${statement}`,
      `Solução: ${solution}`,
    ].join('\n');

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];
  }

  private normalize(value: string): string {
    return value.trim();
  }
}
