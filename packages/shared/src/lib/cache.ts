import { REDIS_ENABLED } from "../constants";
import { nodeCache } from "./nodeCache";
import { RedisClient } from "./redis";

export const cache = REDIS_ENABLED ? RedisClient.getInstance() : nodeCache;
