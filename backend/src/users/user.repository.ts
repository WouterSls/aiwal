import { UserEntity, TradingPreset } from './user.entity';

export abstract class UserRepository {
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract findByDynamicId(dynamicId: string): Promise<UserEntity | null>;
  abstract findByWalletAddress(walletAddress: string): Promise<UserEntity | null>;
  abstract create(data: {
    dynamicId: string;
    walletAddress: string;
    preset?: TradingPreset;
  }): Promise<UserEntity>;
  abstract updatePreset(id: string, preset: TradingPreset): Promise<UserEntity>;
  abstract updateDelegation(
    id: string,
    data: {
      dynamicWalletId: string;
      delegatedShare: string;
      walletApiKey: string;
    },
  ): Promise<UserEntity>;
}
