export type KycStatus = 'pending' | 'approved' | 'rejected';

export interface KycResult {
  userId: string;
  status: KycStatus;
  checkedAt: string;
}
