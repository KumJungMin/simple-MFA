import type { Channel, UrlQueryParams } from '@mfe/shared-contracts';

const DEFAULT_TOKEN = 'valid-token-user-001';

function readChannel(value: string | null): Channel | undefined {
  return value === 'A' || value === 'B' ? value : undefined;
}

function readQueryParams(): UrlQueryParams {
  const searchParams = new URLSearchParams(window.location.search);

  return {
    channel: readChannel(searchParams.get('channel')),
    entry: searchParams.get('entry') ?? undefined,
    lang: searchParams.get('lang') ?? undefined,
    redirect: searchParams.get('redirect') ?? undefined,
    token: searchParams.get('token') ?? undefined
  };
}

export function getStandaloneRuntime() {
  const query = readQueryParams();

  return {
    apiBase: import.meta.env.VITE_API_BASE_URL ?? '/api',
    query,
    token: query.token ?? DEFAULT_TOKEN
  };
}
