import type { Context, Next } from "hono";
import { cache } from "../lib";
import type { CachedResponse, CacheOptions } from "../types";

const validateKeys = ["perPage", "cursor", "tokenIndexes", "contractAddresses"];

export const cacheMiddleware = async (c: Context, next: Next, options: CacheOptions) => {
  if (c.req.method !== "GET") {
    await next();
    return;
  }

  const cacheKey = options.key || getCacheKey(c);
  const cachedResponse = await cache.get<CachedResponse>(cacheKey);
  if (cachedResponse) {
    c.header("X-Cache", "HIT");

    const response = new Response(cachedResponse.body, {
      status: cachedResponse.status,
      headers: new Headers(cachedResponse.headers),
    });

    return response;
  }

  await next();

  const response = c.res;
  const status = response.status;

  if (status >= 200 && status < 300) {
    const originalResponse = c.res.clone();
    const responseBody = await originalResponse.text();
    const cacheResponse: CachedResponse = {
      body: responseBody,
      headers: {},
      status: originalResponse.status,
    };

    originalResponse.headers.forEach((value, key) => {
      cacheResponse.headers[key] = value;
    });

    c.header("X-Cache", "MISS");

    await cache.set(cacheKey, cacheResponse, options.expire);
  }
  return;
};

const getCacheKey = (c: Context) => {
  const path = c.req.path;
  const keys = Object.keys(c.req.query())
    .filter((key) => validateKeys.includes(key))
    .sort((a, b) => a.localeCompare(b));

  if (keys.length === 0) {
    return path;
  }

  const cacheKey = `${path}-${keys.map((key) => `${key}=${c.req.query()[key]}`).join("-")}`;

  return cacheKey;
};
