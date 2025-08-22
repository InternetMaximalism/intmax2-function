import {
  BLOCK_RANGE_MINIMUM,
  fetchEvents,
  l1SentMessageEvent,
  MOCK_L1_SCROLL_MESSENGER_CONTRACT_ADDRESS,
  MOCK_L1_SENDER_CONTRACT_ADDRESS,
  type SentMessageEvent,
} from "@intmax2-function/shared";
import type { PublicClient } from "viem";

export const fetchSentMessages = async (
  l1Client: PublicClient,
  startBlockNumber: bigint,
  currentBlockNumber: bigint,
) => {
  const l1SentMessageEvents = await fetchEvents<SentMessageEvent>(l1Client, {
    startBlockNumber,
    endBlockNumber: currentBlockNumber,
    blockRange: BLOCK_RANGE_MINIMUM,
    contractAddress: MOCK_L1_SCROLL_MESSENGER_CONTRACT_ADDRESS,
    eventInterface: l1SentMessageEvent,
    args: {
      sender: MOCK_L1_SENDER_CONTRACT_ADDRESS,
    },
  });

  return l1SentMessageEvents;
};
