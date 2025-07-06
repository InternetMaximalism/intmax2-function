import { logger, MINT_AVAILABLE_FROM, type MintEventData } from "@intmax2-function/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shouldExecuteAction } from "./interval.service";

vi.mock("@intmax2-function/shared", () => ({
  MINT_AVAILABLE_FROM: "2024-01-01T00:00:00Z",
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Interval Service", () => {
  const mockLogger = vi.mocked(logger);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("shouldExecuteAction", () => {
    describe("when no mintEvent is provided", () => {
      it("should return true if current time is after MINT_AVAILABLE_FROM", () => {
        const now = new Date("2024-06-01T12:00:00Z").getTime();
        vi.setSystemTime(now);

        const result = shouldExecuteAction({
          now,
          mintEvent: null,
          intervalWeeks: 4,
          actionName: "mint",
        });

        expect(result).toBe(true);
        expect(mockLogger.info).toHaveBeenCalledWith(
          "No last mint time found, should execute mint check: true",
        );
      });

      it("should return false if current time is before MINT_AVAILABLE_FROM", () => {
        const now = new Date("2023-12-01T12:00:00Z").getTime();
        vi.setSystemTime(now);

        const result = shouldExecuteAction({
          now,
          mintEvent: null,
          intervalWeeks: 4,
          actionName: "mint",
        });

        expect(result).toBe(false);
        expect(mockLogger.info).toHaveBeenCalledWith(
          "No last mint time found, should execute mint check: false",
        );
      });

      it("should work for transfer actions", () => {
        const now = new Date("2024-06-01T12:00:00Z").getTime();
        vi.setSystemTime(now);

        const result = shouldExecuteAction({
          now,
          mintEvent: null,
          intervalWeeks: 1,
          actionName: "transfer",
        });

        expect(result).toBe(true);
        expect(mockLogger.info).toHaveBeenCalledWith(
          "No last transfer time found, should execute transfer check: true",
        );
      });
    });

    describe("when mintEvent is provided", () => {
      const createMockMintEvent = (dateString: string): MintEventData => ({
        id: "test-id",
        type: "mint",
        blockNumber: 1000,
        blockTimestamp: Date.now(),
        transactionHash: "0xtest",
        createdAt: {
          toDate: () => new Date(dateString),
        } as any,
        updatedAt: {
          toDate: () => new Date(dateString),
        } as any,
      });

      it("should return true when enough time has passed (4 weeks for mint)", () => {
        const lastMintDate = "2024-01-01T00:00:00Z";
        const currentDate = "2024-02-01T00:00:00Z"; // 31 days later (more than 4 weeks)
        const now = new Date(currentDate).getTime();

        const mockMintEvent = createMockMintEvent(lastMintDate);

        const result = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 4,
          actionName: "mint",
        });

        expect(result).toBe(true);
      });

      it("should return false when not enough time has passed (4 weeks for mint)", () => {
        const lastMintDate = "2024-01-01T00:00:00Z";
        const currentDate = "2024-01-15T00:00:00Z"; // 14 days later (less than 4 weeks)
        const now = new Date(currentDate).getTime();

        const mockMintEvent = createMockMintEvent(lastMintDate);

        const result = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 4,
          actionName: "mint",
        });

        expect(result).toBe(false);
      });

      it("should return true when enough time has passed (1 week for transfer)", () => {
        const lastTransferDate = "2024-01-01T00:00:00Z";
        const currentDate = "2024-01-08T00:00:00Z"; // 7 days later (exactly 1 week)
        const now = new Date(currentDate).getTime();

        const mockMintEvent = createMockMintEvent(lastTransferDate);

        const result = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 1,
          actionName: "transfer",
        });

        expect(result).toBe(true);
      });

      it("should return false when not enough time has passed (1 week for transfer)", () => {
        const lastTransferDate = "2024-01-01T00:00:00Z";
        const currentDate = "2024-01-05T00:00:00Z"; // 4 days later (less than 1 week)
        const now = new Date(currentDate).getTime();

        const mockMintEvent = createMockMintEvent(lastTransferDate);

        const result = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 1,
          actionName: "transfer",
        });

        expect(result).toBe(false);
      });

      it("should normalize dates to midnight for comparison", () => {
        const lastMintDate = "2024-01-01T15:30:45Z"; // 3:30:45 PM
        const currentDate = "2024-01-29T08:15:30Z"; // 8:15:30 AM, 28 days later (exactly 4 weeks)
        const now = new Date(currentDate).getTime();

        const mockMintEvent = createMockMintEvent(lastMintDate);

        const result = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 4,
          actionName: "mint",
        });

        expect(result).toBe(true);
      });

      it("should handle edge case of exactly at the interval boundary", () => {
        const lastMintDate = "2024-01-01T00:00:00Z";
        const currentDate = "2024-01-29T00:00:00Z"; // Exactly 28 days later (4 weeks)
        const now = new Date(currentDate).getTime();

        const mockMintEvent = createMockMintEvent(lastMintDate);

        const result = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 4,
          actionName: "mint",
        });

        expect(result).toBe(true);
      });

      it("should handle leap year calculations correctly", () => {
        const lastMintDate = "2024-02-01T00:00:00Z"; // 2024 is a leap year
        const currentDate = "2024-02-29T00:00:00Z"; // 28 days later (exactly 4 weeks)
        const now = new Date(currentDate).getTime();

        const mockMintEvent = createMockMintEvent(lastMintDate);

        const result = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 4,
          actionName: "mint",
        });

        expect(result).toBe(true);
      });

      it("should handle different interval weeks correctly", () => {
        const lastActionDate = "2024-01-01T00:00:00Z";
        const currentDate = "2024-01-15T00:00:00Z"; // 14 days later
        const now = new Date(currentDate).getTime();

        const mockMintEvent = createMockMintEvent(lastActionDate);

        // Should return true for 2-week interval (14 days >= 14 days)
        const result2Weeks = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 2,
          actionName: "mint",
        });

        // Should return false for 3-week interval (14 days < 21 days)
        const result3Weeks = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 3,
          actionName: "mint",
        });

        expect(result2Weeks).toBe(true);
        expect(result3Weeks).toBe(false);
      });

      it("should handle DST transitions correctly", () => {
        // Test during DST transition (spring forward)
        const lastMintDate = "2024-03-01T00:00:00Z";
        const currentDate = "2024-03-29T00:00:00Z"; // 28 days later, across DST transition
        const now = new Date(currentDate).getTime();

        const mockMintEvent = createMockMintEvent(lastMintDate);

        const result = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 4,
          actionName: "mint",
        });

        expect(result).toBe(true);
      });

      it("should handle year boundaries correctly", () => {
        const lastMintDate = "2023-12-01T00:00:00Z";
        const currentDate = "2024-01-01T00:00:00Z"; // 31 days later, across year boundary
        const now = new Date(currentDate).getTime();

        const mockMintEvent = createMockMintEvent(lastMintDate);

        const result = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 4,
          actionName: "mint",
        });

        expect(result).toBe(true);
      });
    });

    describe("edge cases", () => {
      it("should handle very large interval weeks", () => {
        const lastMintDate = "2024-01-01T00:00:00Z";
        const currentDate = "2024-06-01T00:00:00Z"; // ~5 months later
        const now = new Date(currentDate).getTime();

        const mockMintEvent: MintEventData = {
          id: "test-id",
          type: "mint",
          blockNumber: 1000,
          blockTimestamp: Date.now(),
          transactionHash: "0xtest",
          createdAt: {
            toDate: () => new Date(lastMintDate),
          } as any,
          updatedAt: {
            toDate: () => new Date(lastMintDate),
          } as any,
        };

        const result = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 52, // 1 year
          actionName: "mint",
        });

        expect(result).toBe(false);
      });

      it("should handle zero interval weeks", () => {
        const lastMintDate = "2024-01-01T00:00:00Z";
        const currentDate = "2024-01-01T00:00:01Z"; // 1 second later
        const now = new Date(currentDate).getTime();

        const mockMintEvent: MintEventData = {
          id: "test-id",
          type: "mint",
          blockNumber: 1000,
          blockTimestamp: Date.now(),
          transactionHash: "0xtest",
          createdAt: {
            toDate: () => new Date(lastMintDate),
          } as any,
          updatedAt: {
            toDate: () => new Date(lastMintDate),
          } as any,
        };

        const result = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 0,
          actionName: "mint",
        });

        expect(result).toBe(true);
      });

      it("should handle same day but different times", () => {
        const lastMintDate = "2024-01-01T23:59:59Z";
        const currentDate = "2024-01-28T00:00:01Z";
        const now = new Date(currentDate).getTime();
        const mockMintEvent: MintEventData = {
          id: "test-id",
          type: "mint",
          blockNumber: 1000,
          blockTimestamp: Date.now(),
          transactionHash: "0xtest",
          createdAt: {
            toDate: () => new Date(lastMintDate),
          } as any,
          updatedAt: {
            toDate: () => new Date(lastMintDate),
          } as any,
        };
        const result = shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 4,
          actionName: "mint",
        });
        // Should be false because it's only 27 days (less than 28)
        expect(result).toBe(false);
      });
    });

    describe("logging behavior", () => {
      it("should not log when mintEvent is provided", () => {
        const lastMintDate = "2024-01-01T00:00:00Z";
        const currentDate = "2024-02-01T00:00:00Z";
        const now = new Date(currentDate).getTime();

        const mockMintEvent: MintEventData = {
          id: "test-id",
          type: "mint",
          blockNumber: 1000,
          blockTimestamp: Date.now(),
          transactionHash: "0xtest",
          createdAt: {
            toDate: () => new Date(lastMintDate),
          } as any,
          updatedAt: {
            toDate: () => new Date(lastMintDate),
          } as any,
        };

        shouldExecuteAction({
          now,
          mintEvent: mockMintEvent,
          intervalWeeks: 4,
          actionName: "mint",
        });

        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it("should log with correct action name for different actions", () => {
        const now = new Date("2024-06-01T12:00:00Z").getTime();

        shouldExecuteAction({
          now,
          mintEvent: null,
          intervalWeeks: 4,
          actionName: "mint",
        });

        shouldExecuteAction({
          now,
          mintEvent: null,
          intervalWeeks: 1,
          actionName: "transfer",
        });

        expect(mockLogger.info).toHaveBeenCalledWith(
          "No last mint time found, should execute mint check: true",
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          "No last transfer time found, should execute transfer check: true",
        );
      });
    });
  });
});
