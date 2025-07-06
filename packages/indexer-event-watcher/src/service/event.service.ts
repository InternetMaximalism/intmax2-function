import {
  BLOCK_RANGE_MINIMUM,
  type BlockBuilderHeartbeatEvent,
  BUILDER_REGISTRY_CONTRACT_ADDRESS,
  blockBuilderHeartbeatEvent,
  fetchEvents,
} from "@intmax2-function/shared";
import type { PublicClient } from "viem";

export const getHeartBeatEvents = async (
  ethereumClient: PublicClient,
  startBlockNumber: bigint,
  currentBlockNumber: bigint,
) => {
  const heartBeatEvents = await fetchEvents<BlockBuilderHeartbeatEvent>(ethereumClient, {
    startBlockNumber,
    endBlockNumber: currentBlockNumber,
    blockRange: BLOCK_RANGE_MINIMUM,
    contractAddress: BUILDER_REGISTRY_CONTRACT_ADDRESS,
    eventInterface: blockBuilderHeartbeatEvent,
  });

  return heartBeatEvents;
};
