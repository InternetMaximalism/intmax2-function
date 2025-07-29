import { CACHE_KEYS, CACHE_TIMEOUTS, cacheMiddleware } from "@intmax2-function/shared";
import { Hono } from "hono";
import * as indexerController from "../controllers/indexer.controller";

export const route = new Hono();

route.use("/builders/meta", (c, next) =>
  cacheMiddleware(c, next, { expire: CACHE_TIMEOUTS.DETAIL }),
);
route.use("/builders/registration/:address", (c, next) =>
  cacheMiddleware(c, next, { expire: CACHE_TIMEOUTS.DETAIL }),
);
route.use("/builders", (c, next) =>
  cacheMiddleware(c, next, {
    expire: CACHE_TIMEOUTS.BLOCK_BUILDER_INDEXER_LIST,
    key: CACHE_KEYS.BLOCK_BUILDER_INDEXER_LIST,
  }),
);

route.get("/builders/meta", indexerController.getBlockBuilderMeta);
route.get("/builders/registration/:address", indexerController.checkIndexerRegistration);
route.get("/builders", indexerController.listBlockBuilderNodes);
