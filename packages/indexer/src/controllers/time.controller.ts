import type { Context, TypedResponse } from "hono";
import * as timeService from "../services/time.service";

export const getTime = (c: Context): TypedResponse => {
  const result = timeService.getTime();
  return c.json(result);
};
