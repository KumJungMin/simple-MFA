import type { AuthUser } from './auth';
import type { KycStatusResponse } from './kyc';

export interface EntryFlowResult {
  success: boolean;
  nextStep: 'AUTH' | 'KYC' | 'DONE' | 'ERROR';
  user?: AuthUser;
  kyc?: KycStatusResponse;
  errorCode?: string;
  errorMessage?: string;
}
