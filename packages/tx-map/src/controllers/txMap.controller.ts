import { getTxMapValidation, saveTxMapValidation } from "@intmax2-function/shared";
import type { Context, TypedResponse } from "hono";
import * as txMapService from "../services/txMap.service";

export const saveTxMap = async (c: Context): Promise<TypedResponse> => {
  const body = await c.req.json();
  const parsed = await saveTxMapValidation.parseAsync(body);
  const result = await txMapService.saveTxMap(parsed);
  return c.json(result);
};

export const getTxMap = async (c: Context): Promise<TypedResponse> => {
  const params = c.req.param();
  const parsed = await getTxMapValidation.parseAsync(params);
  const result = await txMapService.getTxMap(parsed.digest);
  return c.json(result);
};
