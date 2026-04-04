import { TradingPreset } from '../user.entity';

export class UserResponseDto {
  id: string;
  walletAddress: string;
  preset: TradingPreset | null;
  delegationActive: boolean;
  createdAt: Date;

  static from(user: {
    id: string;
    walletAddress: string;
    preset: TradingPreset | null;
    delegationActive: boolean;
    createdAt: Date;
  }): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.walletAddress = user.walletAddress;
    dto.preset = user.preset;
    dto.delegationActive = user.delegationActive;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
