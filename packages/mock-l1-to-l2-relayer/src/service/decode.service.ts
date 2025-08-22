import {
  type BatchedCalldata,
  BLOCK_RANGE_MINIMUM,
  config,
  type DepositsRelayedEvent,
  depositsRelayedEvent,
  fetchEvents,
  RollupAbi,
  type SentMessageEvent,
} from "@intmax2-function/shared";
import {
  decodeFunctionData,
  encodeFunctionData,
  type PublicClient,
  prepareEncodeFunctionData,
} from "viem";
import { MAX_RELAYER_BATCH_SIZE } from "../constants";
import type { ValidDeposits } from "../types";

export const generateDepositsCalldata = async (
  l1Client: PublicClient,
  l1SentMessageEvent: SentMessageEvent,
) => {
  if (!config.MOCK_L1_SENDER_EVENT_DECODE_ENABLED) {
    return [
      { ...l1SentMessageEvent.args, encodedCalldata: l1SentMessageEvent.args.message },
    ] as BatchedCalldata[];
  }

  const { lastProcessedDepositId, depositHashes } = decodeL1SentMessage(l1SentMessageEvent);

  const rejectedIds = await fetchLatestRejectedIds(
    l1Client,
    l1SentMessageEvent.blockNumber,
    lastProcessedDepositId,
  );

  const validDeposits = extractValidDeposits(lastProcessedDepositId, depositHashes, rejectedIds);

  return generateBatchedCalldata(validDeposits, MAX_RELAYER_BATCH_SIZE);
};

export const generateBatchedCalldata = (validDeposits: ValidDeposits, maxBatchSize: number) => {
  const batchedCalldata: BatchedCalldata[] = [];

  if (validDeposits.depositIds.length === 0) {
    return batchedCalldata;
  }

  for (let i = 0; i < validDeposits.depositIds.length; i += maxBatchSize) {
    const batchDepositIds = validDeposits.depositIds.slice(i, i + maxBatchSize);
    const batchHashes = validDeposits.depositHashes.slice(i, i + maxBatchSize);

    const functionData = prepareEncodeFunctionData({
      abi: RollupAbi,
      functionName: "processDeposits",
    });

    const encodedCalldata = encodeFunctionData({
      ...functionData,
      args: [batchDepositIds[batchDepositIds.length - 1], batchHashes],
    });

    batchedCalldata.push({
      encodedCalldata,
    });
  }

  return batchedCalldata;
};

const fetchLatestRejectedIds = async (
  l1Client: PublicClient,
  eventBlockNumber: bigint,
  lastProcessedDepositId: bigint,
) => {
  const depositsRelayedEvents = await fetchEvents<DepositsRelayedEvent>(l1Client, {
    startBlockNumber: eventBlockNumber,
    endBlockNumber: eventBlockNumber,
    blockRange: BLOCK_RANGE_MINIMUM,
    contractAddress: config.LIQUIDITY_CONTRACT_ADDRESS as `0x${string}`,
    eventInterface: depositsRelayedEvent,
    args: {
      upToDepositId: lastProcessedDepositId,
    },
  });
  if (depositsRelayedEvents.length === 0) {
    throw new Error("No DepositsRelayed event found");
  }

  if (depositsRelayedEvents.length > 1) {
    throw new Error("Multiple DepositsAnalyzedAndRelayed events found");
  }

  return [];
};

export const extractValidDeposits = (
  lastProcessedDepositId: bigint,
  depositHashes: string[],
  rejectedIds: bigint[],
) => {
  const prevLastProcessedDepositId =
    lastProcessedDepositId - BigInt(depositHashes.length + rejectedIds.length);

  const allDepositIds = generateDepositIds(prevLastProcessedDepositId, lastProcessedDepositId);
  const rejectedIdSet = new Set(rejectedIds.map((id) => id.toString()));

  const validDeposits = {
    depositIds: [] as bigint[],
    depositHashes: [] as string[],
  };

  let validHashIndex = 0;
  for (const depositId of allDepositIds) {
    if (!rejectedIdSet.has(depositId.toString())) {
      validDeposits.depositIds.push(depositId);
      if (validHashIndex < depositHashes.length) {
        validDeposits.depositHashes.push(depositHashes[validHashIndex]);
        validHashIndex++;
      } else {
        throw new Error("Invalid depositHashes length");
      }
    }
  }

  return validDeposits;
};

export const generateDepositIds = (startId: bigint, endId: bigint) => {
  if (typeof startId !== "bigint" || typeof endId !== "bigint") {
    throw new Error("Inputs must be BigInt");
  }

  if (startId > endId) {
    throw new Error("startId must be less than or equal to endId");
  }

  const result = [];
  for (let i = startId + 1n; i <= endId; i += 1n) {
    result.push(i);
  }

  return result;
};

const decodeL1SentMessage = (l1SentMessageEvent: SentMessageEvent) => {
  const { args } = decodeFunctionData({
    abi: RollupAbi,
    data: l1SentMessageEvent.args.message as `0x${string}`,
  });

  const lastProcessedDepositId = args![0] as bigint;
  const depositHashes = args![1] as `0x${string}`[];

  return { lastProcessedDepositId, depositHashes };
};
