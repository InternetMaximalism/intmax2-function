import { fetchPredicateSignaturesValidation } from "@intmax2-function/shared";
import type { Context } from "hono";
import * as predicateService from "../services/predicate.service";

export const fetchPredicateSignatures = async (c: Context) => {
  const body = await c.req.json();
  const parsed = await fetchPredicateSignaturesValidation.parseAsync(body);
  const signatures = await predicateService.fetchPredicateSignatures(parsed);
  return c.json(signatures);
};
