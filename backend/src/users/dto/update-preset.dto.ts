import { IsIn } from 'class-validator';
import { TradingPreset } from '../user.entity.js';

export class UpdatePresetDto {
  @IsIn(['institutional', 'degen'])
  preset: TradingPreset;
}
