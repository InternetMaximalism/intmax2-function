import {
  BridgeTransaction,
  BridgeTransactionData,
  BridgeTransactionStatus,
} from "@intmax2-function/shared";

export const performJob = async () => {
  const bridgeTransactions = await BridgeTransaction.getInstance().fetchAllBridgeTransactions();

  const sortedTransactions = bridgeTransactions.sort((a, b) => a.nonce - b.nonce);

  for (const bridgeTransaction of sortedTransactions) {
    await processBridgeTransaction(bridgeTransaction, sortedTransactions);
  }
};

const processBridgeTransaction = async (
  bridgeTransaction: BridgeTransactionData,
  allTransactions: BridgeTransactionData[],
) => {
  if (bridgeTransaction.status === BridgeTransactionStatus.DELIVERED) {
    return;
  }
};
