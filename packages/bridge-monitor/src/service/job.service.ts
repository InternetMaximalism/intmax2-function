import {
  BridgeTransaction,
  type BridgeTransactionData,
  BridgeTransactionStatus,
} from "@intmax2-function/shared";
import {
  fetchBridgeGuidTransaction,
  handleFailedStatus,
  handleInflightOrConfirming,
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
  });

  const sortedTransactions = bridgeTransactions.sort((a, b) => a.nonce - b.nonce);

  for (const bridgeTransaction of sortedTransactions) {
    await processBridgeTransaction(bridgeTransaction, sortedTransactions);
  }
};

const processBridgeTransaction = async (
  bridgeTransaction: BridgeTransactionData,
  allTransactions: BridgeTransactionData[],
) => {
  const bridgeGuidTransaction = await fetchBridgeGuidTransaction(bridgeTransaction.guid);
  const statusName = bridgeGuidTransaction.status.name;

  switch (statusName) {
    case BridgeTransactionStatus.FAILED:
      await handleFailedStatus(bridgeGuidTransaction);
      break;

    case BridgeTransactionStatus.INFLIGHT:
    case BridgeTransactionStatus.CONFIRMING:
      await handleInflightOrConfirming(bridgeTransaction);
      break;

    case BridgeTransactionStatus.VERIFIED:
      await handleVerifiedStatus(bridgeTransaction);
      break;

    case BridgeTransactionStatus.PAYLOAD_STORED:
      await handlePayloadStored(bridgeGuidTransaction);
      break;
  }

  // updateStatus

  // if (statusName === BridgeTransactionStatus.DELIVERED) {
  // }
};
