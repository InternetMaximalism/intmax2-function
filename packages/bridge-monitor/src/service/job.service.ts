import {
  BridgeTransaction,
  type BridgeTransactionData,
  BridgeTransactionStatus,
  logger,
} from "@intmax2-function/shared";
import { fetchBridgeGuidTransaction } from "../lib/layerzero";
import type { UpdateParams } from "../types";
import {
  handleFailedStatus,
  handleInflightOrConfirmingStatus,
  handlePayloadStored,
  handleVerifiedStatus,
} from "./process.service";

export const performJob = async () => {
  const bridgeTransactions = await BridgeTransaction.getInstance().fetchBridgeTransactions({
    statuses: [
      BridgeTransactionStatus.QUEUED,
      BridgeTransactionStatus.INFLIGHT,
      BridgeTransactionStatus.CONFIRMING,
      BridgeTransactionStatus.VERIFIED,
      BridgeTransactionStatus.BLOCKED,
    ],
    // alertSent: not true(include undefined)
  });

  const sortedTransactions = bridgeTransactions.sort((a, b) => a.nonce - b.nonce);

  for (const bridgeTransaction of sortedTransactions) {
    await processBridgeTransaction(bridgeTransaction);
  }
};

const processBridgeTransaction = async (bridgeTransaction: BridgeTransactionData) => {
  try {
    const bridgeGuidTransaction = await fetchBridgeGuidTransaction(bridgeTransaction.guid);
    const statusName = bridgeGuidTransaction.status.name as BridgeTransactionStatus;

    let updateParams: UpdateParams = {
      status: statusName,
    };

    switch (statusName) {
      case BridgeTransactionStatus.FAILED: {
        const result = await handleFailedStatus({ bridgeTransaction, bridgeGuidTransaction });
        updateParams = { ...updateParams, ...result };
        break;
      }
      case BridgeTransactionStatus.INFLIGHT:
      case BridgeTransactionStatus.CONFIRMING: {
        const result = await handleInflightOrConfirmingStatus(bridgeTransaction);
        if (result) {
          updateParams = { ...updateParams, ...result };
        }
        break;
      }
      case BridgeTransactionStatus.VERIFIED: {
        const result = await handleVerifiedStatus({
          bridgeTransaction,
          bridgeGuidTransaction,
        });
        updateParams = { ...updateParams, ...result };
        break;
      }
      case BridgeTransactionStatus.PAYLOAD_STORED: {
        const result = await handlePayloadStored({
          bridgeTransaction,
          bridgeGuidTransaction,
        });
        updateParams = { ...updateParams, ...result };
        break;
      }
    }

    await BridgeTransaction.getInstance().updateBridgeTransaction(
      bridgeTransaction.guid,
      updateParams,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to process bridge transaction ${bridgeTransaction.guid}: ${errorMessage}`);

    if (errorMessage.includes("404")) {
      await BridgeTransaction.getInstance().updateBridgeTransaction(bridgeTransaction.guid, {
        status: BridgeTransactionStatus.NOT_FOUND,
      });
      return;
    }

    throw error;
  }
};
