import {
  BLOCK_RANGE_MINIMUM,
  type DepositEvent,
  type DepositEventLog,
  type DepositsRelayedEvent,
  type DepositsRelayedEventData,
  depositedEvent,
  depositsRelayedEvent,
  fetchEvents,
  LIQUIDITY_CONTRACT_ADDRESS,
  LIQUIDITY_CONTRACT_DEPLOYED_BLOCK,
  LiquidityAbi,
  logger,
  validateBlockRange,
} from "@intmax2-function/shared";
import type { Abi, PublicClient } from "viem";
import { DEPOSIT_EVENT_MAX_ATTEMPTS, MULTICALL_SIZE } from "../constants";
import type { TokenInfo } from "../types";

export const fetchUnprocessedDepositTokenEntries = async (
  ethereumClient: PublicClient,
  currentBlockNumber: bigint,
  lastProcessedEvent: DepositsRelayedEventData | null,
) => {
  const { depositIds, startBlockNumber } = await getDepositIds(
    ethereumClient,
    currentBlockNumber,
    lastProcessedEvent,
  );
  if (depositIds.length === 0) {
    return {
      depositIds,
      tokenInfoMap: new Map(),
    };
  }

  const fromBlockNumber = await calculateDepositStartNumber(
    ethereumClient,
    currentBlockNumber,
    startBlockNumber,
    depositIds,
  );

  const depositEventLogs = await getDepositLogs(
    ethereumClient,
    fromBlockNumber,
    currentBlockNumber,
    depositIds,
  );
  const tokenInfoMap = await mapDepositsToTokenInfo(ethereumClient, depositEventLogs);

  return {
    depositIds,
    tokenInfoMap,
  };
};

const getDepositIds = async (
  ethereumClient: PublicClient,
  currentBlockNumber: bigint,
  lastProcessedEvent: DepositsRelayedEventData | null,
) => {
  const { startBlockNumber, lastUpToDepositId } =
    await getStartBlockNumberAndLastUpToDepositId(lastProcessedEvent);

  const isValid = validateBlockRange("depositsRelayedEvent", startBlockNumber, currentBlockNumber);
  if (!isValid) {
    logger.info("Skipping depositsRelayedEvent due to invalid block range.");
    return {
      depositIds: [],
      startBlockNumber,
    };
  }

  const depositsRelayedEvents = await fetchEvents<DepositsRelayedEvent>(ethereumClient, {
    startBlockNumber,
    endBlockNumber: currentBlockNumber,
    blockRange: BLOCK_RANGE_MINIMUM,
    contractAddress: LIQUIDITY_CONTRACT_ADDRESS,
    eventInterface: depositsRelayedEvent,
  });

  if (depositsRelayedEvents.length === 0) {
    return {
      depositIds: [],
      startBlockNumber,
    };
  }

  const depositIds = generateDepositIds(depositsRelayedEvents, lastUpToDepositId);

  return {
    depositIds,
    startBlockNumber,
  };
};

const getStartBlockNumberAndLastUpToDepositId = async (
  lastProcessedEvent: DepositsRelayedEventData | null,
) => {
  if (lastProcessedEvent) {
    const startBlockNumber = BigInt(lastProcessedEvent?.lastBlockNumber + 1);

    return {
      startBlockNumber,
      lastUpToDepositId: lastProcessedEvent.lastUpToDepositId ?? 0,
    };
  }

  return {
    startBlockNumber: BigInt(LIQUIDITY_CONTRACT_DEPLOYED_BLOCK),
    lastUpToDepositId: 0,
  };
};

const generateDepositIds = (
  events: DepositsRelayedEvent[],
  lastUpToDepositId: number,
): number[] => {
  const latestEvent = events[events.length - 1];
  const upToDepositId = Number((latestEvent.args as { upToDepositId: bigint }).upToDepositId);

  const depositIds = Array.from(
    { length: upToDepositId - lastUpToDepositId },
    (_, index) => lastUpToDepositId + index + 1,
  );
  logger.info(`Generated deposit IDs: ${depositIds.join(", ")}`);

  return depositIds;
};

const calculateDepositStartNumber = async (
  ethereumClient: PublicClient,
  currentBlockNumber: bigint,
  startBlockNumber: bigint,
  depositIds: number[],
) => {
  if (depositIds.length === 0) {
    throw new Error("No deposit IDs provided");
  }

  let attempts = 0;
  const minDepositId = Math.min(...depositIds);

  while (attempts < DEPOSIT_EVENT_MAX_ATTEMPTS) {
    const events = await fetchEvents<DepositEvent>(ethereumClient, {
      startBlockNumber: startBlockNumber,
      endBlockNumber: currentBlockNumber,
      blockRange: BLOCK_RANGE_MINIMUM,
      contractAddress: LIQUIDITY_CONTRACT_ADDRESS,
      eventInterface: depositedEvent,
      args: {
        depositId: [BigInt(minDepositId)],
      },
    });

    if (events.length > 0) {
      const minDepositBlockNumber = events[0].blockNumber;
      logger.debug(
        `calculateDepositStartNumber found deposit event at block ${minDepositBlockNumber}`,
      );
      return BigInt(minDepositBlockNumber);
    }

    startBlockNumber -= BLOCK_RANGE_MINIMUM;
    attempts++;

    if (startBlockNumber <= 0n) {
      throw new Error("Start block number would become negative");
    }
  }

  throw new Error("Failed to fetch Deposit events");
};

const getDepositLogs = async (
  ethereumClient: PublicClient,
  fromBlockNumber: bigint,
  currentBlockNumber: bigint,
  depositIds: number[],
) => {
  const depositEvents = await fetchEvents<DepositEvent>(ethereumClient, {
    startBlockNumber: fromBlockNumber,
    endBlockNumber: currentBlockNumber,
    blockRange: BLOCK_RANGE_MINIMUM,
    contractAddress: LIQUIDITY_CONTRACT_ADDRESS,
    eventInterface: depositedEvent,
    args: {
      depositId: depositIds.map(BigInt),
    },
  });

  return depositEvents.map(({ args }) => args);
};

const mapDepositsToTokenInfo = async (
  ethereumClient: PublicClient,
  depositLogs: DepositEventLog[],
) => {
  const tokenIndexSet = new Set(depositLogs.map(({ tokenIndex }) => tokenIndex));
  const tokenIndexes = Array.from(tokenIndexSet);

  const results = await ethereumClient.multicall({
    contracts: tokenIndexes.map((tokenIndex) => {
      return {
        address: LIQUIDITY_CONTRACT_ADDRESS,
        abi: LiquidityAbi as Abi,
        functionName: "getTokenInfo",
        args: [BigInt(tokenIndex)],
      };
    }),
    batchSize: MULTICALL_SIZE,
  });

  const tokenInfoMap = new Map<number, TokenInfo>();

  results.forEach((result, index) => {
    const tokenIndex = tokenIndexes[index];
    if (result.status !== "success") {
      throw new Error(`Failed to fetch token info for token index ${tokenIndex}`);
    }

    tokenInfoMap.set(tokenIndex, {
      ...(result.result as TokenInfo),
    });
  });

  return tokenInfoMap;
};
