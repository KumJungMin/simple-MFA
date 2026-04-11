import type { Channel } from './channel';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  channel: Channel;
  accessToken: string;
  refreshToken?: string;
  isAuthenticated: boolean;
}
