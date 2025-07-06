import {
  BLOCK_RANGE_MINIMUM,
  fetchEvents,
  LIQUIDITY_CONTRACT_ADDRESS,
  l2MockSentMessageEvent,
  MOCK_L2_SCROLL_MESSENGER_CONTRACT_ADDRESS,
  type SentMessageEvent,
  type WithdrawalClaimableEvent,
  withdrawalClaimableEvent,
} from "@intmax2-function/shared";
import type { PublicClient } from "viem";

export const getL2SentMessage = async (
  ethereumClient: PublicClient,
  startBlockNumber: bigint,
  currentBlockNumber: bigint,
) => {
  const sentMessageEvents = await fetchEvents<SentMessageEvent>(ethereumClient, {
    startBlockNumber,
    endBlockNumber: currentBlockNumber,
    blockRange: BLOCK_RANGE_MINIMUM,
    contractAddress: MOCK_L2_SCROLL_MESSENGER_CONTRACT_ADDRESS,
    eventInterface: l2MockSentMessageEvent,
  });
  const sentEventLogs = sentMessageEvents.map((event) => event.args);

  return sentEventLogs;
};

export const fetchPendingWithdrawalHashes = async (
  ethereumClient: PublicClient,
  startBlockNumber: bigint,
  currentBlockNumber: bigint,
  withdrawalHashes: string[],
) => {
  const events = await fetchEvents<WithdrawalClaimableEvent>(ethereumClient, {
    startBlockNumber,
    endBlockNumber: currentBlockNumber,
    blockRange: BLOCK_RANGE_MINIMUM,
    contractAddress: LIQUIDITY_CONTRACT_ADDRESS,
    eventInterface: withdrawalClaimableEvent,
    args: {
      withdrawalHash: withdrawalHashes,
    },
  });
  const processedEvents = events.map((log) => ({
    ...log.args,
  }));
  const processedHashes = processedEvents.map((event) => event.withdrawalHash);
  const pendingHashes = withdrawalHashes.filter((hash) => !processedHashes.includes(hash));

  return pendingHashes;
};
