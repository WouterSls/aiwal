import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';

@Injectable()
export class WalletService {
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.encryptionKey = Buffer.from(
      config.getOrThrow<string>('DELEGATION_ENCRYPTION_KEY'),
      'hex',
    );
  }

  async storeDelegation(
    dynamicUserId: string,
    dynamicWalletId: string,
    decryptedDelegatedShare: string,
    decryptedWalletApiKey: string,
  ): Promise<void> {
    const user = await this.usersService.findByDynamicId(dynamicUserId);
    if (!user) throw new NotFoundException('User not found');

    await this.usersService.updateDelegation(user.id, {
      dynamicWalletId,
      delegatedShare: this.encrypt(decryptedDelegatedShare),
      walletApiKey: this.encrypt(decryptedWalletApiKey),
    });
  }

  async getDecryptedDelegation(userId: string): Promise<{
    dynamicWalletId: string;
    delegatedShare: string;
    walletApiKey: string;
    walletAddress: string;
  }> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.isDelegated() || !user.dynamicWalletId || !user.delegatedShare || !user.walletApiKey) {
      throw new NotFoundException('No active delegation found for user');
    }

    return {
      dynamicWalletId: user.dynamicWalletId,
      delegatedShare: this.decrypt(user.delegatedShare),
      walletApiKey: this.decrypt(user.walletApiKey),
      walletAddress: user.walletAddress,
    };
  }

  private encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
  }

  private decrypt(encoded: string): string {
    const buf = Buffer.from(encoded, 'base64');
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }
}
