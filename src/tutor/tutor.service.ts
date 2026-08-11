import { Injectable } from '@nestjs/common';
import type { AssistExerciseDto } from './dto/assist-exercise.dto';
import { OllamaService } from '../ollama/ollama.service';
import { PromptBuilder } from './prompt.builder';

export type AssistExerciseResponse = {
  reply: string;
  model: string;
};

@Injectable()
export class TutorService {
  constructor(
    private readonly promptBuilder: PromptBuilder,
    private readonly ollamaService: OllamaService,
  ) {}

  async assist(dto: AssistExerciseDto): Promise<AssistExerciseResponse> {
    const messages = this.promptBuilder.buildMessages(dto);
    const result = await this.ollamaService.chat(messages);

    return {
      reply: result.message.content,
      model: result.model,
    };
  }
}
