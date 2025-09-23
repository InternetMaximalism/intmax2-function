import type { Context, TypedResponse } from "hono";
import * as proxyService from "../services/proxy.service";

export const getProxyMeta = async (c: Context): Promise<TypedResponse> => {
  const result = await proxyService.getProxyMeta();
  return c.json(result);
};
