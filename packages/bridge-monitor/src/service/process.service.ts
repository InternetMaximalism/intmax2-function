import {
  API_TIMEOUT,
  BridgeTransactionData,
  config,
  Discord,
  logger,
  MAINNET_BRIDGE_O_APP_CONTRACT_ADDRESS,
  MainnetBridgeOAppAbi,
} from "@intmax2-function/shared";
import axios, { AxiosError } from "axios";
import type { Abi } from "viem";
import { LAYER_ZERO_SCAN_API } from "../constants";
import { l1Client } from "../lib/blockchain";
import type { BridgeGuidTransaction, BridgeGuidTransactionResponse } from "../types";
import { submitTransaction } from "./submit.service";

export const fetchBridgeGuidTransaction = async (guid: string) => {
  const layerZeroMessagesUrl = `${LAYER_ZERO_SCAN_API[config.LAYER_ZERO_NETWORK]}/messages/guid/${guid}`;
  try {
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
    logger.error(
      `Failed to fetch bridge transaction status url: ${layerZeroMessagesUrl} ${error instanceof Error ? error.message : error}`,
    );
    // 404

    if (error instanceof AxiosError) {
      throw new Error(`Failed to fetch status: ${error.response?.status}`);
    }

    throw new Error(
      `Unexpected error while fetching bridge transaction status: ${
        error instanceof Error ? error.message : error
      }`,
    );
  }
};

export const handleFailedStatus = async (_: BridgeGuidTransaction) => {
  await submitTransaction("clear");
};

export const handleInflightOrConfirming = async (bridgeTransaction: BridgeTransactionData) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // TODO
  if (bridgeTransaction.updatedAt.toDate() < twentyFourHoursAgo) {
    await Discord.getInstance().sendMessageWitForReady(
      "FATAL",
      `INFLIGHT/CONFIRMING status persists over 24 hours: ${bridgeTransaction.guid}`,
    );
  }
};

export const handleVerifiedStatus = async (bridgeTransaction: BridgeTransactionData) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const verifiedTimestamp = bridgeTransaction.verifiedAt
    ? bridgeTransaction.verifiedAt.toDate()
    : bridgeTransaction.createdAt.toDate();

  // TODO:
  if (verifiedTimestamp < twentyFourHoursAgo) {
    await submitTransaction("manualRetry");
  }
};

export const handlePayloadStored = async (bridgeGuidTransaction: BridgeGuidTransaction) => {
  const hasStored = await hasStoredPayload();

  if (hasStored) {
    await submitTransaction("manualRetry");
  } else {
    await Discord.getInstance().sendMessageWitForReady(
      "FATAL",
      `PAYLOAD_STORED but hasStoredPayload is false: ${bridgeGuidTransaction.guid}`,
    );
  }
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
