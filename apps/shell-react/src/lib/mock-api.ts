import type { AuthUser } from '@mfe/shared-contracts';

type VerifyAuthResponse = {
  user: AuthUser;
};

type ErrorResponse = {
  message?: string;
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
