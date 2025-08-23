import { z } from "zod";
import { addressSchema } from "./address.validation";

export const fetchPredicateSignaturesValidation = z.strictObject({
  from: addressSchema,
  to: addressSchema,
  data: z.string(),
  msg_value: z.string(),
  chain_id: z.number().min(1).optional(),
});

export type FetchPredicateSignatureValidationType = z.infer<
  typeof fetchPredicateSignaturesValidation
>;
