import { BadRequestError, config } from "@intmax2-function/shared";
import type { PredicateRequest, PredicateResponse } from "../types";

export class Predicate {
  private static instance: Predicate | undefined;

  public static async getInstance() {
    if (!Predicate.instance) {
      Predicate.instance = new Predicate();
    }
    return Predicate.instance;
  }

  async evaluatePolicy(body: PredicateRequest): Promise<PredicateResponse> {
    try {
      const response = await fetch(config.PREDICATE_API_URL, {
        method: "POST",
        headers: { "x-api-key": config.PREDICATE_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Predicate API error (${response.status}): ${errorText}`);
      }

      return (await response.json()) as PredicateResponse;
    } catch (error) {
      throw new BadRequestError(`Predicate API error: ${(error as Error).message}`);
    }
  }
}
