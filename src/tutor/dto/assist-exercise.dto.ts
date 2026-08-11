import { IsNotEmpty, IsString } from 'class-validator';

export class AssistExerciseDto {
  @IsString()
  @IsNotEmpty()
  level!: string;

  @IsString()
  @IsNotEmpty()
  structureType!: string;

  @IsString()
  @IsNotEmpty()
  statement!: string;

  @IsString()
  @IsNotEmpty()
  solution!: string;
}
