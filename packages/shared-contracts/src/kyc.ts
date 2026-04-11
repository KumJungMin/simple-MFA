import type { Channel } from './channel';

export type KycStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

export interface KycStatusResponse {
  userId: string;
  channel: Channel;
  status: KycStatus;
  updatedAt: string;
  reason?: string;
}

export interface KycResult {
  userId: string;
  status: KycStatus;
  checkedAt: string;
}
