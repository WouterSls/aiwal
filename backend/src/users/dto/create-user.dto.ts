import { IsString, IsIn, IsNotEmpty } from 'class-validator';
import { TradingPreset } from '../user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  dynamicId: string;

  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsIn(['institutional', 'degen'])
  preset: TradingPreset;
}
