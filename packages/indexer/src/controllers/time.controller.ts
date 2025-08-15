import type { Context } from "hono";
import * as timeService from "../services/time.service";

export const getTime = (c: Context) => {
  const result = timeService.getTime();
  return c.json(result);
};
