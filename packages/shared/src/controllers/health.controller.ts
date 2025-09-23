import type { Context, TypedResponse } from "hono";
import * as healthService from "../services/health.service";

export const healthCheck = (c: Context): TypedResponse => {
  const result = healthService.healthCheck();
  return c.json(result);
};
