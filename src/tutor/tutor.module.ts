import { Module } from '@nestjs/common';
import { OllamaModule } from '../ollama/ollama.module';
import { PromptBuilder } from './prompt.builder';
import { TutorController } from './tutor.controller';
import { TutorService } from './tutor.service';

@Module({
  imports: [OllamaModule],
  controllers: [TutorController],
  providers: [TutorService, PromptBuilder],
})
export class TutorModule {}
