import { TradingPreset } from '../user.entity.js';

export class UserResponseDto {
  id: string;
  walletAddress: string;
  preset: TradingPreset | null;
  createdAt: Date;

  static from(user: {
    id: string;
    walletAddress: string;
    preset: TradingPreset | null;
    createdAt: Date;
  }): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.walletAddress = user.walletAddress;
    dto.preset = user.preset;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
