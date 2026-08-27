import { supabase } from '../../core/auth/supabase';
import { session, type Session } from '../../core/auth/session';
import { authenticateUser, unauthenticateUser } from './auth.store';
import type { AuthSession, AuthUser } from './auth.types';

export interface LoginParams {
  phone: string;
  otp: string;
}

export class AuthService {
  static pendingPhone: string | null = null;

  static async requestOtp(phone: string): Promise<void> {
    const normalized = phone.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      throw new Error('Enter a valid phone number');
    }
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    if (error) throw new Error(error.message);
    this.pendingPhone = normalized;
  }

  static async verifyOtp(params: LoginParams): Promise<AuthSession> {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: params.phone.trim(),
      token: params.otp.trim(),
      type: 'sms',
    });
    if (error || !data.session || !data.user) {
      throw new Error(error?.message ?? 'OTP verification failed');
    }
    const user: AuthUser = {
      id: data.user.id,
      phone: params.phone,
      name: String(data.user.user_metadata?.name ?? 'Farmer'),
    };
    const token = data.session.access_token;
    const nextSession: Session = {
      userId: user.id,
      token,
      expiresAt: new Date(data.session.expires_at ? data.session.expires_at * 1000 : Date.now()).toISOString(),
    };

    session.set(nextSession);
    authenticateUser(user.id, token);

    return {
      user,
      token,
      expiresAt: nextSession.expiresAt,
    };
  }

  static async restoreSession(): Promise<void> {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      authenticateUser(data.session.user.id, data.session.access_token);
    }
  }

  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    session.clear();
    unauthenticateUser();
  }
}
