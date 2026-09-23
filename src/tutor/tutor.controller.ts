import { Body, Controller, Post } from '@nestjs/common';
import { AssistExerciseDto } from './dto/assist-exercise.dto';
import { TutorService } from './tutor.service';

@Controller('tutor')
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Post('assist')
  assist(@Body() dto: AssistExerciseDto) {
    return this.tutorService.assist(dto);
  }
}
