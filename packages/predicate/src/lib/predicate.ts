import { BadRequestError, config, logger, sleep } from "@intmax2-function/shared";
import type { PredicateRequest, PredicateResponse } from "../types";

export class Predicate {
  private static instance: Predicate | undefined;
  private readonly maxRetries: number = 3;
  private readonly initialDelayMs: number = 1000;

  public static async getInstance() {
    if (!Predicate.instance) {
      Predicate.instance = new Predicate();
    }
    return Predicate.instance;
  }

  async evaluatePolicy(body: PredicateRequest): Promise<PredicateResponse> {
    try {
      const response = await this.fetchWithRetry(config.PREDICATE_API_URL, {
        method: "POST",
        headers: {
          "x-api-key": config.PREDICATE_API_KEY,
          "Content-Type": "application/json",
        },
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

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = this.maxRetries,
  ): Promise<Response> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, options);

        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }

        lastError = new Error(`Server error: ${response.status}`);
      } catch (error) {
        lastError = error as Error;
      }

      logger.warn(`Fetch attempt ${attempt + 1} failed: ${lastError?.message}`);

      if (attempt < retries) {
        const delayMs = this.initialDelayMs * Math.pow(2, attempt);
        await sleep(delayMs);
      }
    }

    throw lastError || new Error("Failed after retries");
  }
}
