import { IsIn } from 'class-validator';
import { TradingPreset } from '../user.entity';

export class UpdatePresetDto {
  @IsIn(['institutional', 'degen'])
  preset: TradingPreset;
}
