import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsOptional()
  agencyId?: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(['PROSPECT', 'VISITE_A_PLANIFIER'])
  @IsOptional()
  pipelineStage?: string;

  @IsString()
  @IsOptional()
  budget?: string;

  @IsEnum(['CASH', 'LOAN'])
  @IsOptional()
  purchaseType?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  interestedProperties?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  zones?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mustHaveFeatures?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nbBedrooms?: string[];

  @IsString()
  @IsOptional()
  availability?: string;

  @IsString()
  @IsOptional()
  additionalNotes?: string;
}
