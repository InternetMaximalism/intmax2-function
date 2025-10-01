export type TxMapData = {
  digest: string;
  data: string;
  expiresAt: Date;
};

export interface CachedResponse {
  body: string;
  headers: Record<string, string>;
  status: number;
}

export interface CacheOptions {
  expire: number;
  key?: string;
}
