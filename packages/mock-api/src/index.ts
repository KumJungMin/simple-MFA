import type { KycResult, KycStatus } from '@mfe/shared-contracts';

const statuses: KycStatus[] = ['pending', 'approved', 'rejected'];

export function getMockKycStatus(userId: string): KycResult {
  const pick = statuses[userId.length % statuses.length];

  return {
    userId,
    status: pick,
    checkedAt: new Date().toISOString()
  };
}
