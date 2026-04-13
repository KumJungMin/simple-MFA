import type { AuthUser, KycStatusResponse } from '@mfe/shared-contracts';

type ErrorResponse = {
  message?: string;
};

type VerifyAuthResponse = {
  user: AuthUser;
};

type CompleteKycResponse = {
  message: string;
  result: KycStatusResponse;
};

async function readResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as T & ErrorResponse;

  if (!response.ok) {
    throw new Error(payload.message ?? 'Request failed.');
  }

  return payload;
}

export async function verifyAuth(apiBase: string, token: string) {
  const response = await fetch(`${apiBase}/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  });

  const payload = await readResponse<VerifyAuthResponse>(response);
  return payload.user;
}

export async function fetchKycStatus(apiBase: string, token: string) {
  const response = await fetch(`${apiBase}/kyc/status?token=${encodeURIComponent(token)}`);
  return readResponse<KycStatusResponse>(response);
}

export async function completeKyc(apiBase: string, token: string) {
  const response = await fetch(`${apiBase}/kyc/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  });

  const payload = await readResponse<CompleteKycResponse>(response);
  return payload.result;
}
