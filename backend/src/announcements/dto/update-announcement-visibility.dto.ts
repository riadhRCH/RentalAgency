import { IsBoolean } from 'class-validator';

export class UpdateAnnouncementVisibilityDto {
  @IsBoolean()
  isVisible: boolean;
}
