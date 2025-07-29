import { CACHE_TIMEOUTS, cacheMiddleware } from "@intmax2-function/shared";
import { Hono } from "hono";
import { etag } from "hono/etag";
import * as proxyController from "../controllers/proxy.controller";

export const route = new Hono();

route.use("*", etag());
route.use("*", (c, next) => cacheMiddleware(c, next, { expire: CACHE_TIMEOUTS.DETAIL }));

route.get("/meta", proxyController.getProxyMeta);
