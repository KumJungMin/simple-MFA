import type { Channel } from './channel';

export interface UrlQueryParams {
  channel?: Channel;
  token?: string;
  redirect?: string;
  lang?: string;
  entry?: string;
}
