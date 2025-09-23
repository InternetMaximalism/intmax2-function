import { tokenIndexesValidation, tokenPaginationValidation } from "@intmax2-function/shared";
import type { Context, TypedResponse } from "hono";
import { extractQueriesParams, extractQueryParams } from "../lib/query";
import * as tokenMapsService from "../services/tokenMaps.service";

export const list = async (c: Context): Promise<TypedResponse> => {
  const queries = extractQueryParams(c.req.queries());
  const { tokenIndexes } = await tokenIndexesValidation.parseAsync(queries);

  const query = extractQueriesParams(c.req.query());
  const paginationOptions = await tokenPaginationValidation.parseAsync(query);

  const result = await tokenMapsService.list(tokenIndexes, paginationOptions);
  return c.json(result);
};
