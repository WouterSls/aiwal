import { Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity, TradingPreset } from './user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UserRepository) {}

  async findById(id: string): Promise<UserEntity> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findByDynamicId(dynamicId: string): Promise<UserEntity | null> {
    return this.repo.findByDynamicId(dynamicId);
  }

  findByWalletAddress(walletAddress: string): Promise<UserEntity | null> {
    return this.repo.findByWalletAddress(walletAddress);
  }

  async findOrCreate(data: {
    dynamicId: string;
    walletAddress: string;
  }): Promise<UserEntity> {
    const existing = await this.repo.findByDynamicId(data.dynamicId);
    if (existing) return existing;
    return this.repo.create(data);
  }

  create(data: {
    dynamicId: string;
    walletAddress: string;
    preset: TradingPreset;
  }): Promise<UserEntity> {
    return this.repo.create(data);
  }

  updatePreset(id: string, preset: TradingPreset): Promise<UserEntity> {
    return this.repo.updatePreset(id, preset);
  }

  updateDelegation(
    id: string,
    data: {
      dynamicWalletId: string;
      delegatedShare: string;
      walletApiKey: string;
    },
  ): Promise<UserEntity> {
    return this.repo.updateDelegation(id, data);
  }
}
