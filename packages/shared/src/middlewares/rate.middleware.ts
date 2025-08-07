import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { config } from "../config";
import { TooManyRequestsError } from "../lib";

const getClientIP = (c: Context): string => {
  const xForwardedFor = c.req.header("X-Forwarded-For");
  return xForwardedFor
    ? xForwardedFor.split(",")[0].trim()
    : getConnInfo(c).remote.address || "unknown";
};

export const limiter = rateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
  limit: config.RATE_LIMIT, // 1000 requests per windowMs
  standardHeaders: "draft-7",
  keyGenerator: (c) => {
    const ip = getClientIP(c);
    return ip;
  },
  skip: (c) => {
    const xApiKey = c.req.header("X-API-KEY");
    return xApiKey === config.X_API_KEY;
  },
  handler: (c) => {
    const ip = getClientIP(c);
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    throw new TooManyRequestsError("Rate limit exceeded");
  },
});
