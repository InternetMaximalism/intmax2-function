import {
  BLOCK_RANGE_MINIMUM,
  type DepositEvent,
  type DepositsRelayedEvent,
  depositedEvent,
  depositsRelayedEvent,
  type EventData,
  fetchEvents,
  LIQUIDITY_CONTRACT_ADDRESS,
  LiquidityAbi,
  logger,
} from "@intmax2-function/shared";
import type { Abi, PublicClient } from "viem";

export const getDepositedEvent = async (
  l1Client: PublicClient,
  startBlockNumber: bigint,
  currentBlockNumber: bigint,
  lastProcessedEvent: EventData | null,
) => {
  try {
    const depositEvents = await fetchEvents<DepositEvent>(l1Client, {
      startBlockNumber,
      endBlockNumber: currentBlockNumber,
      blockRange: BLOCK_RANGE_MINIMUM,
      contractAddress: LIQUIDITY_CONTRACT_ADDRESS,
      eventInterface: depositedEvent,
    });

    if (depositEvents.length !== 0 && lastProcessedEvent === null) {
      const lastRelayedDepositId = (await l1Client.readContract({
        address: LIQUIDITY_CONTRACT_ADDRESS,
        abi: LiquidityAbi as Abi,
        functionName: "getLastRelayedDepositId",
        args: [],
        blockNumber: currentBlockNumber,
      })) as bigint;

      const filteredEvents = depositEvents.filter(
        ({ args }) => args.depositId > lastRelayedDepositId,
      );
      return filteredEvents;
    }

    return depositEvents;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error fetching deposited events: ${message}`);
    throw error;
  }
};

export const getDepositsRelayedEvent = async (
  l1Client: PublicClient,
  startBlockNumber: bigint,
  currentBlockNumber: bigint,
) => {
  try {
    const depositsRelayedEvents = await fetchEvents<DepositsRelayedEvent>(l1Client, {
      startBlockNumber,
      endBlockNumber: currentBlockNumber,
      blockRange: BLOCK_RANGE_MINIMUM,
      contractAddress: LIQUIDITY_CONTRACT_ADDRESS,
      eventInterface: depositsRelayedEvent,
    });

    const depositsRelayedEventLogs = depositsRelayedEvents.map((event) => event.args);
    const upToDepositIds = depositsRelayedEventLogs.map((log) => log.upToDepositId);

    return {
      lastUpToDepositId: getMaxDepositId(upToDepositIds),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error fetching depositsRelayedEvent events: ${message}`);
    throw error;
  }
};

const getMaxDepositId = (upToDepositIds: bigint[]) => {
  if (!upToDepositIds || upToDepositIds.length === 0) {
    return 0n;
  }

  return upToDepositIds.reduce((max, current) => {
    return current > max ? current : max;
  });
};
