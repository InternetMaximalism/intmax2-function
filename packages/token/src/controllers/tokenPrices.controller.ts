import { tokenPaginationValidation, tokenPricesValidation } from "@intmax2-function/shared";
import type { Context, TypedResponse } from "hono";
import { extractQueriesParams, extractQueryParams } from "../lib/query";
import * as tokenPricesService from "../services/tokenPrices.service";

export const list = async (c: Context): Promise<TypedResponse> => {
  const queries = extractQueryParams(c.req.queries());
  const { contractAddresses } = await tokenPricesValidation.parseAsync(queries);

  const query = extractQueriesParams(c.req.query());
  const paginationOptions = await tokenPaginationValidation.parseAsync(query);

  const result = await tokenPricesService.list(contractAddresses, paginationOptions);
  return c.json(result);
};
