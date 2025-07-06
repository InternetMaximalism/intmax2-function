import type { PublicClient } from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDepositedEvent, getDepositsRelayedEvent } from "./event.service";

vi.mock("@intmax2-function/shared", () => ({
  BLOCK_RANGE_MINIMUM: 1000n,
  LIQUIDITY_CONTRACT_ADDRESS: "0x1234567890123456789012345678901234567890",
  LiquidityAbi: [
    {
      name: "getLastRelayedDepositId",
      type: "function",
      inputs: [],
      outputs: [{ type: "uint256" }],
    },
  ],
  depositedEvent: {
    name: "Deposited",
    type: "event",
  },
  depositsRelayedEvent: {
    name: "DepositsRelayed",
    type: "event",
  },
  fetchEvents: vi.fn(),
  logger: {
    error: vi.fn(),
  },
}));

import {
  fetchEvents,
  LIQUIDITY_CONTRACT_ADDRESS,
  LiquidityAbi,
  logger,
} from "@intmax2-function/shared";

describe("Event Function", () => {
  let mockEthereumClient: PublicClient;

  beforeEach(() => {
    mockEthereumClient = {
      readContract: vi.fn(),
    } as unknown as PublicClient;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getDepositedEvent", () => {
    const startBlockNumber = 1000n;
    const currentBlockNumber = 2000n;

    it("should return filtered deposit events when lastProcessedEvent is null and events exist", async () => {
      const mockDepositEvents = [
        {
          args: { depositId: 5n },
          blockNumber: 1500n,
          transactionHash: "0xabc123",
        },
        {
          args: { depositId: 10n },
          blockNumber: 1600n,
          transactionHash: "0xdef456",
        },
        {
          args: { depositId: 15n },
          blockNumber: 1700n,
          transactionHash: "0x789xyz",
        },
      ];
      const lastRelayedDepositId = 7n;

      vi.mocked(fetchEvents).mockResolvedValue(mockDepositEvents);
      vi.mocked(mockEthereumClient.readContract).mockResolvedValue(lastRelayedDepositId);

      const result = await getDepositedEvent(
        mockEthereumClient,
        startBlockNumber,
        currentBlockNumber,
        null,
      );

      expect(fetchEvents).toHaveBeenCalledWith(mockEthereumClient, {
        startBlockNumber,
        endBlockNumber: currentBlockNumber,
        blockRange: 1000n,
        contractAddress: LIQUIDITY_CONTRACT_ADDRESS,
        eventInterface: expect.any(Object),
      });

      expect(mockEthereumClient.readContract).toHaveBeenCalledWith({
        address: LIQUIDITY_CONTRACT_ADDRESS,
        abi: LiquidityAbi,
        functionName: "getLastRelayedDepositId",
        args: [],
        blockNumber: currentBlockNumber,
      });

      expect(result).toEqual([
        {
          args: { depositId: 10n },
          blockNumber: 1600n,
          transactionHash: "0xdef456",
        },
        {
          args: { depositId: 15n },
          blockNumber: 1700n,
          transactionHash: "0x789xyz",
        },
      ]);
    });

    it("should return all events when lastProcessedEvent is not null", async () => {
      const mockDepositEvents = [
        {
          args: { depositId: 5n },
          blockNumber: 1500n,
          transactionHash: "0xabc123",
        },
      ];
      const lastProcessedEvent = { blockNumber: 1400n };

      vi.mocked(fetchEvents).mockResolvedValue(mockDepositEvents);

      const result = await getDepositedEvent(
        mockEthereumClient,
        startBlockNumber,
        currentBlockNumber,
        lastProcessedEvent as any,
      );

      expect(result).toEqual(mockDepositEvents);
      expect(mockEthereumClient.readContract).not.toHaveBeenCalled();
    });

    it("should return empty array when no events exist and lastProcessedEvent is null", async () => {
      vi.mocked(fetchEvents).mockResolvedValue([]);

      const result = await getDepositedEvent(
        mockEthereumClient,
        startBlockNumber,
        currentBlockNumber,
        null,
      );

      expect(result).toEqual([]);
      expect(mockEthereumClient.readContract).not.toHaveBeenCalled();
    });

    it("should return empty array when all events are filtered out", async () => {
      const mockDepositEvents = [
        {
          args: { depositId: 3n },
          blockNumber: 1500n,
          transactionHash: "0xabc123",
        },
        {
          args: { depositId: 5n },
          blockNumber: 1600n,
          transactionHash: "0xdef456",
        },
      ];
      const lastRelayedDepositId = 10n;

      vi.mocked(fetchEvents).mockResolvedValue(mockDepositEvents);
      vi.mocked(mockEthereumClient.readContract).mockResolvedValue(lastRelayedDepositId);

      // Act
      const result = await getDepositedEvent(
        mockEthereumClient,
        startBlockNumber,
        currentBlockNumber,
        null,
      );

      expect(result).toEqual([]);
    });

    it("should handle and re-throw fetchEvents error", async () => {
      const error = new Error("Network error");
      vi.mocked(fetchEvents).mockRejectedValue(error);

      await expect(
        getDepositedEvent(mockEthereumClient, startBlockNumber, currentBlockNumber, null),
      ).rejects.toThrow("Network error");

      expect(logger.error).toHaveBeenCalledWith("Error fetching deposited events: Network error");
    });

    it("should handle and re-throw readContract error", async () => {
      const mockDepositEvents = [{ args: { depositId: 5n } }];
      const error = new Error("Contract read error");

      vi.mocked(fetchEvents).mockResolvedValue(mockDepositEvents as any);
      vi.mocked(mockEthereumClient.readContract).mockRejectedValue(error);

      await expect(
        getDepositedEvent(mockEthereumClient, startBlockNumber, currentBlockNumber, null),
      ).rejects.toThrow("Contract read error");

      expect(logger.error).toHaveBeenCalledWith(
        "Error fetching deposited events: Contract read error",
      );
    });

    it("should handle unknown error types", async () => {
      const unknownError = "String error";
      vi.mocked(fetchEvents).mockRejectedValue(unknownError);

      await expect(
        getDepositedEvent(mockEthereumClient, startBlockNumber, currentBlockNumber, null),
      ).rejects.toBe(unknownError);

      expect(logger.error).toHaveBeenCalledWith("Error fetching deposited events: Unknown error");
    });
  });

  describe("getDepositsRelayedEvent", () => {
    const startBlockNumber = 1000n;
    const currentBlockNumber = 2000n;

    it("should return the maximum upToDepositId from relayed events", async () => {
      const mockRelayedEvents = [
        {
          args: { upToDepositId: 5n },
          blockNumber: 1500n,
          transactionHash: "0xabc123",
        },
        {
          args: { upToDepositId: 15n },
          blockNumber: 1600n,
          transactionHash: "0xdef456",
        },
        {
          args: { upToDepositId: 10n },
          blockNumber: 1700n,
          transactionHash: "0x789xyz",
        },
      ];

      vi.mocked(fetchEvents).mockResolvedValue(mockRelayedEvents);

      const result = await getDepositsRelayedEvent(
        mockEthereumClient,
        startBlockNumber,
        currentBlockNumber,
      );

      expect(fetchEvents).toHaveBeenCalledWith(mockEthereumClient, {
        startBlockNumber,
        endBlockNumber: currentBlockNumber,
        blockRange: 1000n,
        contractAddress: LIQUIDITY_CONTRACT_ADDRESS,
        eventInterface: expect.any(Object),
      });

      expect(result).toEqual({
        lastUpToDepositId: 15n,
      });
    });

    it("should return 0n when no events exist", async () => {
      vi.mocked(fetchEvents).mockResolvedValue([]);

      const result = await getDepositsRelayedEvent(
        mockEthereumClient,
        startBlockNumber,
        currentBlockNumber,
      );

      expect(result).toEqual({
        lastUpToDepositId: 0n,
      });
    });

    it("should handle single event", async () => {
      const mockRelayedEvents = [
        {
          args: { upToDepositId: 42n },
          blockNumber: 1500n,
          transactionHash: "0xabc123",
        },
      ];

      vi.mocked(fetchEvents).mockResolvedValue(mockRelayedEvents);

      const result = await getDepositsRelayedEvent(
        mockEthereumClient,
        startBlockNumber,
        currentBlockNumber,
      );

      expect(result).toEqual({
        lastUpToDepositId: 42n,
      });
    });

    it("should handle and re-throw fetchEvents error", async () => {
      const error = new Error("Fetch error");
      vi.mocked(fetchEvents).mockRejectedValue(error);

      await expect(
        getDepositsRelayedEvent(mockEthereumClient, startBlockNumber, currentBlockNumber),
      ).rejects.toThrow("Fetch error");

      expect(logger.error).toHaveBeenCalledWith(
        "Error fetching depositsRelayedEvent events: Fetch error",
      );
    });

    it("should handle unknown error types", async () => {
      const unknownError = { custom: "error" };
      vi.mocked(fetchEvents).mockRejectedValue(unknownError);

      await expect(
        getDepositsRelayedEvent(mockEthereumClient, startBlockNumber, currentBlockNumber),
      ).rejects.toBe(unknownError);

      expect(logger.error).toHaveBeenCalledWith(
        "Error fetching depositsRelayedEvent events: Unknown error",
      );
    });
  });

  describe("getMaxDepositId (tested through getDepositsRelayedEvent)", () => {
    it("should return 0n for empty array", async () => {
      vi.mocked(fetchEvents).mockResolvedValue([]);

      const result = await getDepositsRelayedEvent(mockEthereumClient, 1000n, 2000n);

      expect(result.lastUpToDepositId).toBe(0n);
    });

    it("should return the maximum value from array of bigints", async () => {
      const mockEvents = [
        { args: { upToDepositId: 1n } },
        { args: { upToDepositId: 100n } },
        { args: { upToDepositId: 50n } },
        { args: { upToDepositId: 75n } },
      ];

      vi.mocked(fetchEvents).mockResolvedValue(mockEvents as any);

      const result = await getDepositsRelayedEvent(mockEthereumClient, 1000n, 2000n);

      expect(result.lastUpToDepositId).toBe(100n);
    });

    it("should handle single element array", async () => {
      const mockEvents = [{ args: { upToDepositId: 42n } }];

      vi.mocked(fetchEvents).mockResolvedValue(mockEvents as any);

      const result = await getDepositsRelayedEvent(mockEthereumClient, 1000n, 2000n);

      expect(result.lastUpToDepositId).toBe(42n);
    });

    it("should handle duplicate maximum values", async () => {
      const mockEvents = [
        { args: { upToDepositId: 50n } },
        { args: { upToDepositId: 100n } },
        { args: { upToDepositId: 100n } },
        { args: { upToDepositId: 25n } },
      ];

      vi.mocked(fetchEvents).mockResolvedValue(mockEvents as any);

      const result = await getDepositsRelayedEvent(mockEthereumClient, 1000n, 2000n);

      expect(result.lastUpToDepositId).toBe(100n);
    });
  });
});
