import { session, type Session } from '../../core/auth/session';
import { tokenStore } from '../../core/auth/token.store';
import { authenticateUser } from './auth.store';
import type { AuthSession, AuthUser } from './auth.types';

export interface LoginParams {
  phone: string;
  otp: string;
}

export class AuthService {
  static async requestOtp(phone: string): Promise<string> {
    if (!phone || phone.trim().length < 8) {
      throw new Error('Enter a valid phone number');
    }

    return `otp_for_${phone.replace(/\D+/g, '').slice(-4)}`;
  }

  static async verifyOtp(params: LoginParams): Promise<AuthSession> {
    const user: AuthUser = {
      id: `user_${params.phone.replace(/\D+/g, '')}`,
      phone: params.phone,
      name: 'Local farmer',
    };

    const token = `local_token_${params.otp}`;
    const nextSession: Session = {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };

    session.set(nextSession);
    await tokenStore.set(token);
    authenticateUser(user.id, token);

    return {
      user,
      token,
      expiresAt: nextSession.expiresAt,
    };
  }
}
