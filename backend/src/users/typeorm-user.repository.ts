import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, TradingPreset } from './user.entity.js';
import { UserRepository } from './user.repository.js';

@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {
    super();
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOneBy({ id });
  }

  findByDynamicId(dynamicId: string): Promise<UserEntity | null> {
    return this.repo.findOneBy({ dynamicId });
  }

  findByWalletAddress(walletAddress: string): Promise<UserEntity | null> {
    return this.repo.findOneBy({ walletAddress });
  }

  create(data: {
    dynamicId: string;
    walletAddress: string;
    preset?: TradingPreset;
  }): Promise<UserEntity> {
    const user = this.repo.create({
      dynamicId: data.dynamicId,
      walletAddress: data.walletAddress,
      preset: data.preset ?? null,
    });
    return this.repo.save(user);
  }

  async updatePreset(id: string, preset: TradingPreset): Promise<UserEntity> {
    await this.repo.update(id, { preset });
    const updated = await this.repo.findOneBy({ id });
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async updateDelegation(
    id: string,
    data: {
      dynamicWalletId: string;
      delegatedShare: string;
      walletApiKey: string;
    },
  ): Promise<UserEntity> {
    await this.repo.update(id, {
      dynamicWalletId: data.dynamicWalletId,
      delegatedShare: data.delegatedShare,
      walletApiKey: data.walletApiKey,
    });
    const updated = await this.repo.findOneBy({ id });
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }
}
