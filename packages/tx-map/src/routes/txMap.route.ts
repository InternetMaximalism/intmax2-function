import { CACHE_TIMEOUTS, cacheMiddleware } from "@intmax2-function/shared";
import { Hono } from "hono";
import * as txMapController from "../controllers/txMap.controller";

export const route = new Hono();

route.post("/", txMapController.saveTxMap);

route.use("/*", (c, next) => cacheMiddleware(c, next, { expire: CACHE_TIMEOUTS.DETAIL }));
route.get("/:digest", txMapController.getTxMap);
