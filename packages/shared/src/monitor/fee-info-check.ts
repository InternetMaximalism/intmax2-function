import axios from "axios";
import { INDEXER_REQUEST_TIMEOUT } from "../constants";
import { logger } from "../lib";
import type { BuilderFeeInfoResponse } from "../types";

export const requestFeeInfoCheck = async (url: string, maxRetries = 3, retryDelay = 1000) => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get<BuilderFeeInfoResponse>(`${url}/fee-info`, {
        timeout: INDEXER_REQUEST_TIMEOUT,
        headers: {
          Accept: "application/json",
        },
      });

      logger.debug(`Health check successful for ${url}: (v${response.data.version})`);

      return response.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Health check failed for ${url}: ${lastError.message}`);

      if (attempt < maxRetries) {
        logger.warn(
          `Retrying health check for ${url} in ${retryDelay}ms (attempt ${attempt}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || new Error(`Health check failed after ${maxRetries} attempts`);
};
