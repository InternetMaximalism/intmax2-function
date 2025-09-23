import { addressSchema } from "@intmax2-function/shared";
import type { Context, TypedResponse } from "hono";
import * as indexerService from "../services/indexer.service";

export const listBlockBuilderNodes = async (c: Context): Promise<TypedResponse> => {
  const result = await indexerService.listBlockBuilderNodes();
  return c.json(result);
};

export const getBlockBuilderMeta = async (c: Context): Promise<TypedResponse> => {
  const result = await indexerService.getBlockBuilderMeta();
  return c.json(result);
};

export const checkIndexerRegistration = async (c: Context): Promise<TypedResponse> => {
  const inputAddress = c.req.param("address");
  const address = await addressSchema.parseAsync(inputAddress);

  const result = await indexerService.checkIndexerRegistration(address);
  return c.json(result);
};
