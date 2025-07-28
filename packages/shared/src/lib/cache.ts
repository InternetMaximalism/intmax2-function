import { config } from "../config";
import { nodeCache } from "./nodeCache";
import { RedisClient } from "./redis";

export const cache = config.REDIS_ENABLED ? RedisClient.getInstance() : nodeCache;
