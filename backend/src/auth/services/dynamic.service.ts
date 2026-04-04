import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

interface DynamicJWTPayload extends JWTPayload {
  verified_credentials?: Array<{ address?: string }>;
}

@Injectable()
export class DynamicService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly config: ConfigService) {
    const envId = this.config.getOrThrow<string>('DYNAMIC_ENVIRONMENT_ID');
    const jwksUri = `https://app.dynamicauth.com/api/v0/sdk/${envId}/.well-known/jwks`;
    this.jwks = createRemoteJWKSet(new URL(jwksUri));
  }

  async verifyToken(token: string): Promise<{ dynamicId: string; walletAddress: string }> {
    try {
      const { payload } = await jwtVerify<DynamicJWTPayload>(token, this.jwks);

      const dynamicId = payload.sub;
      const walletAddress = payload.verified_credentials?.[0]?.address;

      if (!dynamicId || !walletAddress) {
        throw new UnauthorizedException('Invalid token claims');
      }

      return { dynamicId, walletAddress };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
