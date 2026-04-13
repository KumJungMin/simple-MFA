import type { Channel, UrlQueryParams } from '@mfe/shared-contracts';

const DEFAULT_TOKEN = 'valid-token-user-001';

function readChannel(value: string | null): Channel | undefined {
  return value === 'A' || value === 'B' ? value : undefined;
}

export function readQueryParams(): UrlQueryParams {
  const searchParams = new URLSearchParams(window.location.search);

  return {
    channel: readChannel(searchParams.get('channel')),
    entry: searchParams.get('entry') ?? undefined,
    lang: searchParams.get('lang') ?? undefined,
    redirect: searchParams.get('redirect') ?? undefined,
    token: searchParams.get('token') ?? undefined
  };
}

export function getShellRuntime() {
  const query = readQueryParams();

  return {
    apiBase: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4175',
    kycRemoteUrl:
      import.meta.env.VITE_KYC_REMOTE_URL ??
      (import.meta.env.DEV ? 'http://localhost:5174/src/remote.ts' : '/mfe/kyc/remote/kyc-app.js'),
    query,
    token: query.token ?? DEFAULT_TOKEN
  };
}
