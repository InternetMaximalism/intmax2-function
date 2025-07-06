import {
  Alchemy,
  ITX_AMOUNT_TO_LIQUIDITY,
  logger,
  MintedEvent,
  TransferredToLiquidityEvent,
} from "@intmax2-function/shared";
import { hexToNumber } from "viem";
import { afterEach, beforeEach, describe, expect, it, type MockedFunction, vi } from "vitest";
import { getMintedEvent, getTransferredToLiquidityEvent } from "./event.service";
import { shouldExecuteAction } from "./interval.service";
import { mint } from "./mint.service";
import { executeAutomaticOperations, processEvents } from "./process.service";
import { transferToLiquidity } from "./transfer.service";

vi.mock("@intmax2-function/shared", () => ({
  Alchemy: {
    getInstance: vi.fn(),
  },
  ITX_AMOUNT_TO_LIQUIDITY: 1000000n,
  MINT_INTERVAL_WEEKS: 4,
  TRANSFER_INTERVAL_WEEKS: 1,
  createNetworkClient: vi.fn(),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("viem", () => ({
  hexToNumber: vi.fn(),
}));

vi.mock("./event.service", () => ({
  getMintedEvent: vi.fn(),
  getTransferredToLiquidityEvent: vi.fn(),
}));

vi.mock("./interval.service", () => ({
  shouldExecuteAction: vi.fn(),
}));

vi.mock("./mint.service", () => ({
  mint: vi.fn(),
}));

vi.mock("./transfer.service", () => ({
  transferToLiquidity: vi.fn(),
}));

describe("Event Processing Service", () => {
  let mockEthereumClient: any;
  let mockMintEvent: any;
  let mockAlchemyInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMintEvent = {
      getLatestEventByType: vi.fn(),
      addEvent: vi.fn(),
    };

    mockAlchemyInstance = {
      getBlock: vi.fn(),
    };

    (Alchemy.getInstance as any).mockReturnValue(mockAlchemyInstance);
    (hexToNumber as any).mockImplementation((hex: string) => parseInt(hex, 16));
  });

  describe("processEvents", () => {
    const startBlockNumber = 1000n;
    const currentBlockNumber = 2000n;

    it("should process new mint and transfer events", async () => {
      const mockMintedEvent: MintedEvent = {
        name: "Minted",
        address: "0x1234567890123456789012345678901234567890",
        blockNumber: 1500n,
        blockTimestamp: "0x64a1b2c3",
        blockHash: "0xblockhash123",
        transactionHash: "0xabc123",
        args: {
          amount: 1000n,
        },
      };

      const mockTransferEvent: TransferredToLiquidityEvent = {
        name: "TransferredToLiquidity",
        address: "0x1234567890123456789012345678901234567890",
        blockNumber: 1600n,
        blockTimestamp: "0x64a1b2c4",
        blockHash: "0xblockhash456",
        transactionHash: "0xdef456",
        args: {
          amount: 2000n,
        },
      };

      mockMintEvent.getLatestEventByType
        .mockResolvedValueOnce(null) // mint
        .mockResolvedValueOnce(null); // transferToLiquidity

      (getMintedEvent as MockedFunction<any>).mockResolvedValue([mockMintedEvent]);
      (getTransferredToLiquidityEvent as MockedFunction<any>).mockResolvedValue([
        mockTransferEvent,
      ]);

      (hexToNumber as MockedFunction<any>)
        .mockReturnValueOnce(1684567747) // mint event timestamp
        .mockReturnValueOnce(1684567748); // transfer event timestamp

      await processEvents(mockEthereumClient, mockMintEvent, startBlockNumber, currentBlockNumber);

      expect(getMintedEvent).toHaveBeenCalledWith(
        mockEthereumClient,
        startBlockNumber,
        currentBlockNumber,
      );
      expect(getTransferredToLiquidityEvent).toHaveBeenCalledWith(
        mockEthereumClient,
        startBlockNumber,
        currentBlockNumber,
      );

      expect(mockMintEvent.addEvent).toHaveBeenCalledTimes(2);
      expect(mockMintEvent.addEvent).toHaveBeenCalledWith({
        type: "mint",
        blockNumber: 1500,
        blockTimestamp: 1684567747000,
        transactionHash: "0xabc123",
      });
      expect(mockMintEvent.addEvent).toHaveBeenCalledWith({
        type: "transferToLiquidity",
        blockNumber: 1600,
        blockTimestamp: 1684567748000,
        transactionHash: "0xdef456",
      });
    });

    it("should not save events that are not new", async () => {
      const existingTxHash = "0xexisting123";
      const mockExistingEvent = { transactionHash: existingTxHash };

      mockMintEvent.getLatestEventByType
        .mockResolvedValueOnce(mockExistingEvent) // mint
        .mockResolvedValueOnce(mockExistingEvent); // transferToLiquidity

      const mockSameEvent = {
        blockNumber: 1500n,
        blockTimestamp: "0x64a1b2c3",
        transactionHash: existingTxHash,
      };

      (getMintedEvent as MockedFunction<any>).mockResolvedValue([mockSameEvent]);
      (getTransferredToLiquidityEvent as MockedFunction<any>).mockResolvedValue([mockSameEvent]);

      await processEvents(mockEthereumClient, mockMintEvent, startBlockNumber, currentBlockNumber);

      expect(mockMintEvent.addEvent).not.toHaveBeenCalled();
    });

    it("should handle empty new events", async () => {
      mockMintEvent.getLatestEventByType.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      (getMintedEvent as MockedFunction<any>).mockResolvedValue([]);
      (getTransferredToLiquidityEvent as MockedFunction<any>).mockResolvedValue([]);

      await processEvents(mockEthereumClient, mockMintEvent, startBlockNumber, currentBlockNumber);

      expect(mockMintEvent.addEvent).not.toHaveBeenCalled();
    });
  });

  describe("executeAutomaticOperations", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should execute mint operation when conditions are met", async () => {
      const mockLastMintedEvent = { createdAt: { toDate: () => new Date("2024-01-01T11:00:00Z") } };
      const mockReceipt = {
        blockNumber: 1500,
        hash: "0xMintHash123",
      };
      const mockBlock = { timestamp: 1704110400n }; // 2024-01-01T12:00:00Z

      mockMintEvent.getLatestEventByType
        .mockResolvedValueOnce(mockLastMintedEvent) // mint
        .mockResolvedValueOnce(null); // transferToLiquidity

      (shouldExecuteAction as MockedFunction<any>)
        .mockReturnValueOnce(true) // mint
        .mockReturnValueOnce(false); // transfer
      (mint as MockedFunction<any>).mockResolvedValue(mockReceipt);
      mockAlchemyInstance.getBlock.mockResolvedValue(mockBlock);

      await executeAutomaticOperations(mockEthereumClient, mockMintEvent);

      expect(shouldExecuteAction).toHaveBeenCalledWith({
        now: Date.now(),
        mintEvent: mockLastMintedEvent,
        intervalWeeks: 4,
        actionName: "mint",
      });
      expect(mint).toHaveBeenCalledWith(mockEthereumClient);
      expect(mockMintEvent.addEvent).toHaveBeenCalledWith({
        type: "mint",
        blockNumber: 1500,
        blockTimestamp: 1704110400000,
        transactionHash: "0xminthash123",
      });
      expect(logger.info).toHaveBeenCalledWith("Executing mint operation");
    });

    it("should execute transfer operation when conditions are met", async () => {
      const mockLastTransferEvent = {
        createdAt: { toDate: () => new Date("2024-01-01T11:00:00Z") },
      };
      const mockReceipt = {
        blockNumber: 1600,
        hash: "0xTransferHash456",
      };
      const mockBlock = { timestamp: 1704110400n };

      mockMintEvent.getLatestEventByType
        .mockResolvedValueOnce(null) // mint
        .mockResolvedValueOnce(mockLastTransferEvent); // transferToLiquidity

      (shouldExecuteAction as MockedFunction<any>)
        .mockReturnValueOnce(false) // mint
        .mockReturnValueOnce(true); // transfer
      (transferToLiquidity as MockedFunction<any>).mockResolvedValue(mockReceipt);
      mockAlchemyInstance.getBlock.mockResolvedValue(mockBlock);

      await executeAutomaticOperations(mockEthereumClient, mockMintEvent);

      expect(shouldExecuteAction).toHaveBeenCalledWith({
        now: Date.now(),
        mintEvent: null,
        intervalWeeks: 4,
        actionName: "mint",
      });
      expect(shouldExecuteAction).toHaveBeenCalledWith({
        now: Date.now(),
        mintEvent: mockLastTransferEvent,
        intervalWeeks: 1,
        actionName: "transfer",
      });
      expect(transferToLiquidity).toHaveBeenCalledWith(
        mockEthereumClient,
        BigInt(ITX_AMOUNT_TO_LIQUIDITY),
      );
      expect(mockMintEvent.addEvent).toHaveBeenCalledWith({
        type: "transferToLiquidity",
        blockNumber: 1600,
        blockTimestamp: 1704110400000,
        transactionHash: "0xtransferhash456",
      });
      expect(logger.info).toHaveBeenCalledWith("Executing transfer to liquidity operation");
    });

    it("should execute both operations when both conditions are met", async () => {
      const mockLastMintedEvent = { createdAt: { toDate: () => new Date("2024-01-01T11:00:00Z") } };
      const mockLastTransferEvent = {
        createdAt: { toDate: () => new Date("2024-01-01T10:00:00Z") },
      };

      const mockMintReceipt = { blockNumber: 1500, hash: "0xMintHash" };
      const mockTransferReceipt = { blockNumber: 1600, hash: "0xTransferHash" };
      const mockBlock = { timestamp: 1704110400n };

      mockMintEvent.getLatestEventByType
        .mockResolvedValueOnce(mockLastMintedEvent)
        .mockResolvedValueOnce(mockLastTransferEvent);

      (shouldExecuteAction as MockedFunction<any>)
        .mockReturnValueOnce(true) // mint
        .mockReturnValueOnce(true); // transfer
      (mint as MockedFunction<any>).mockResolvedValue(mockMintReceipt);
      (transferToLiquidity as MockedFunction<any>).mockResolvedValue(mockTransferReceipt);
      mockAlchemyInstance.getBlock.mockResolvedValue(mockBlock);

      await executeAutomaticOperations(mockEthereumClient, mockMintEvent);

      expect(mint).toHaveBeenCalled();
      expect(transferToLiquidity).toHaveBeenCalled();
      expect(mockMintEvent.addEvent).toHaveBeenCalledTimes(2);
    });

    it("should not execute operations when conditions are not met", async () => {
      mockMintEvent.getLatestEventByType.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      (shouldExecuteAction as MockedFunction<any>)
        .mockReturnValueOnce(false) // mint
        .mockReturnValueOnce(false); // transfer

      await executeAutomaticOperations(mockEthereumClient, mockMintEvent);

      expect(mint).not.toHaveBeenCalled();
      expect(transferToLiquidity).not.toHaveBeenCalled();
      expect(mockMintEvent.addEvent).not.toHaveBeenCalled();
    });

    it("should log appropriate messages", async () => {
      const mockLastMintedEvent = { createdAt: { toDate: () => new Date("2024-01-01T11:00:00Z") } };

      mockMintEvent.getLatestEventByType
        .mockResolvedValueOnce(mockLastMintedEvent)
        .mockResolvedValueOnce(null);

      (shouldExecuteAction as MockedFunction<any>)
        .mockReturnValueOnce(false) // mint
        .mockReturnValueOnce(false); // transfer

      await executeAutomaticOperations(mockEthereumClient, mockMintEvent);

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Should mint: false"));
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Should transfer: false"));
    });
  });

  describe("Error handling", () => {
    it("should handle errors in processEvents gracefully", async () => {
      mockMintEvent.getLatestEventByType.mockRejectedValue(new Error("Database error"));

      await expect(processEvents(mockEthereumClient, mockMintEvent, 1000n, 2000n)).rejects.toThrow(
        "Database error",
      );
    });

    it("should handle errors in executeAutomaticOperations gracefully", async () => {
      mockMintEvent.getLatestEventByType.mockRejectedValue(new Error("Database error"));

      await expect(executeAutomaticOperations(mockEthereumClient, mockMintEvent)).rejects.toThrow(
        "Database error",
      );
    });

    it("should handle mint operation failure", async () => {
      mockMintEvent.getLatestEventByType.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      (shouldExecuteAction as MockedFunction<any>)
        .mockReturnValueOnce(true) // mint
        .mockReturnValueOnce(false); // transfer
      (mint as MockedFunction<any>).mockRejectedValue(new Error("Mint failed"));

      await expect(executeAutomaticOperations(mockEthereumClient, mockMintEvent)).rejects.toThrow(
        "Mint failed",
      );
    });
  });
});
