import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

@Injectable()
export class GoogleVerifierService {
  private client: OAuth2Client;

  constructor(private readonly config: ConfigService) {
    this.client = new OAuth2Client(this.config.get<string>('google.clientId'));
  }

  async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.config.get<string>('google.clientId'),
      });
      const payload = ticket.getPayload();
      if (!payload?.email || !payload.email_verified) {
        throw new UnauthorizedException('Google account not verified');
      }
      return {
        sub: payload.sub!,
        email: payload.email,
        email_verified: !!payload.email_verified,
        name: payload.name,
        picture: payload.picture,
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
