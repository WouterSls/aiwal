import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { constants, createHmac, privateDecrypt, timingSafeEqual } from 'crypto';
import { DelegationWebhookData } from '../dto/delegation-webhook.dto.js';

@Injectable()
export class WebhookService {
  constructor(private readonly config: ConfigService) {}

  verifySignature(rawBody: Buffer, signature: string): void {
    const secret = this.config.getOrThrow<string>('DYNAMIC_WEBHOOK_SECRET');
    const computed = createHmac('sha256', secret).update(rawBody).digest('hex');
    const expected = signature?.startsWith('sha256=') ? signature.slice(7) : signature;

    if (!expected || expected.length !== 64) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const valid = timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(expected, 'hex'),
    );

    if (!valid) throw new BadRequestException('Invalid webhook signature');
  }

  decryptMaterials(data: DelegationWebhookData): {
    decryptedDelegatedShare: string;
    decryptedWalletApiKey: string;
  } {
    const privateKey = this.config
      .getOrThrow<string>('DYNAMIC_RSA_PRIVATE_KEY')
      .replace(/\\n/g, '\n');

    try {
      const decryptedDelegatedShare = privateDecrypt(
        { key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING },
        Buffer.from(data.encryptedDelegatedShare, 'base64'),
      ).toString('utf8');

      const decryptedWalletApiKey = privateDecrypt(
        { key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING },
        Buffer.from(data.encryptedWalletApiKey, 'base64'),
      ).toString('utf8');

      return { decryptedDelegatedShare, decryptedWalletApiKey };
    } catch {
      throw new BadRequestException('Failed to decrypt delegation materials');
    }
  }
}
