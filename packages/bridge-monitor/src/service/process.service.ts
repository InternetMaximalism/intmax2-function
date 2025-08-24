import {
  API_TIMEOUT,
  BridgeTransactionData,
  config,
  Discord,
  logger,
  MAINNET_BRIDGE_O_APP_CONTRACT_ADDRESS,
  MainnetBridgeOAppAbi,
  sleep,
} from "@intmax2-function/shared";
import axios, { AxiosError } from "axios";
import type { Abi } from "viem";
import { LAYER_ZERO_SCAN_API, MAX_RETRIES, RETRY_DELAY_MS } from "../constants";
import { l1Client } from "../lib/blockchain";
import type { BridgeGuidTransaction, BridgeGuidTransactionResponse } from "../types";
import { submitTransaction } from "./submit.service";

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

export const handleFailedStatus = async (_: BridgeGuidTransaction) => {
  await submitTransaction("clear");

  return {
    clearedAt: new Date(),
  };
};

export const handleInflightOrConfirmingStatus = async (
  bridgeTransaction: BridgeTransactionData,
) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (bridgeTransaction.createdAt.toDate() < twentyFourHoursAgo) {
    Discord.getInstance().initialize();
    await Discord.getInstance().sendMessageWitForReady(
      "FATAL",
      `INFLIGHT/CONFIRMING status persists over 24 hours: ${bridgeTransaction.guid}`,
    );

    return {
      alertSent: true,
      lastAlertAt: new Date(),
    };
  }

  return null;
};

export const handleVerifiedStatus = async (bridgeTransaction: BridgeTransactionData) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (bridgeTransaction.verifiedAt && bridgeTransaction.verifiedAt.toDate() < twentyFourHoursAgo) {
    await submitTransaction("manualRetry");

    return {
      alertSent: true,
      lastAlertAt: new Date(),
    };
  }

  return {
    verifiedAt: new Date(),
  };
};

export const handlePayloadStored = async (bridgeGuidTransaction: BridgeGuidTransaction) => {
  const hasStored = await hasStoredPayload();

  if (hasStored) {
    await submitTransaction("manualRetry");

    return {
      manualRetryAt: new Date(),
    };
  }

  Discord.getInstance().initialize();
  await Discord.getInstance().sendMessageWitForReady(
    "FATAL",
    `PAYLOAD_STORED but hasStoredPayload is false: ${bridgeGuidTransaction.guid}`,
  );

  return {
    alertSent: true,
    lastAlertAt: new Date(),
  };
};

const hasStoredPayload = async () => {
  const currentBlockNumber = await l1Client.getBlockNumber();

  const args = [
    {
      srcEid: "srcEid",
      sender: "sender",
      nonce: "nonce",
      guid: "guid",
      message: "message",
    },
  ];

  const isStored = await l1Client.readContract({
    address: MAINNET_BRIDGE_O_APP_CONTRACT_ADDRESS,
    abi: MainnetBridgeOAppAbi as Abi,
    functionName: "hasStoredPayload",
    args,
    blockNumber: currentBlockNumber,
  });

  return isStored as boolean;
};
