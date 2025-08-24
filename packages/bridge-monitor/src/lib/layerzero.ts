import { API_TIMEOUT, config, logger, sleep } from "@intmax2-function/shared";
import axios, { AxiosError } from "axios";
import { LAYER_ZERO_SCAN_API, MAX_RETRIES, RETRY_DELAY_MS } from "../constants";
import type { BridgeGuidTransaction, BridgeGuidTransactionResponse } from "../types";

export const fetchBridgeGuidTransaction = async (
  guid: string,
  maxRetries: number = MAX_RETRIES,
  retryDelayMs: number = RETRY_DELAY_MS,
) => {
  const layerZeroMessagesUrl = `${LAYER_ZERO_SCAN_API[config.LAYER_ZERO_NETWORK]}/messages/guid/${guid}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(
        `Fetching bridge transaction (attempt ${attempt}/${maxRetries}): ${layerZeroMessagesUrl}`,
      );

      const response = await axios.get<BridgeGuidTransactionResponse>(layerZeroMessagesUrl, {
        timeout: API_TIMEOUT,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.data?.data === undefined) {
        throw new Error("Data is missing in the response");
      }

      const transactions = response.data.data as BridgeGuidTransaction[];
      if (transactions.length === 0) {
        throw new Error("No transactions found");
      }

      return transactions[0];
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      logger.warn(
        `Failed to fetch bridge transaction (attempt ${attempt}/${maxRetries}): ${lastError.message}`,
      );

      if (attempt === maxRetries) {
        break;
      }

      logger.info(`Waiting ${retryDelayMs}ms before retry...`);
      await sleep(retryDelayMs);
    }
  }

  logger.error(
    `Failed to fetch bridge transaction after ${maxRetries} attempts: ${layerZeroMessagesUrl}`,
  );

  if (lastError instanceof AxiosError) {
    throw new Error(
      `Failed to fetch status after ${maxRetries} attempts: ${lastError.response?.status}`,
    );
  }

  throw new Error(
    `Unexpected error while fetching bridge transaction status after ${maxRetries} attempts: ${lastError?.message}`,
  );
};
