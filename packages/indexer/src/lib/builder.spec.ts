import { randomInt } from "node:crypto";
import { type IndexerInfo } from "@intmax2-function/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getRandomBuilders,
  getRandomBuildersWithGuaranteedAllowlist,
  getRandomBuildersWithOnlyAllowlist,
  getRandomBuilderWithAllowlistPriority,
} from "./builder";

vi.mock("node:crypto", () => ({
  randomInt: vi.fn(() => 0),
}));

vi.mock("../constants", () => ({
  BLOCK_BUILDER_ALLOWLIST: ["0xallowed1", "0xallowed2", "0xallowed3"],
  ALLOWLIST_BLOCK_BUILDER_POSSIBILITIES: 0.7,
  BLOCK_BUILDER_INDEXER_COUNT: 3,
  BLOCK_BUILDER_MIN_ALLOWLIST_COUNT: 2,
}));

vi.mock("./array", () => ({
  shuffleArray: vi.fn((array) => [...array]),
}));

describe("Builder Service", () => {
  const mockRandomInt = vi.mocked(randomInt) as any;

  // Helper function to create mock IndexerInfo
  const createMockIndexer = (address: string, url = "https://example.com"): IndexerInfo => ({
    address,
    url,
    active: true,
    lastSyncedTime: new Date(),
    metadata: {},
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRandomBuildersWithOnlyAllowlist", () => {
    it("should return empty array when no allowlisted builders are available", async () => {
      const activeBuilders = [createMockIndexer("0xother1"), createMockIndexer("0xother2")];

      const result = await getRandomBuildersWithOnlyAllowlist(activeBuilders);

      expect(result).toEqual([]);
    });

    it("should return shuffled allowlisted builders when available", async () => {
      const activeBuilders = [
        createMockIndexer("0xallowed1"),
        createMockIndexer("0xother1"),
        createMockIndexer("0xallowed2"),
        createMockIndexer("0xallowed3"),
      ];

      // Mock randomInt for shuffling
      mockRandomInt
        .mockReturnValueOnce(1) // j = 1 for i = 2
        .mockReturnValueOnce(0); // j = 0 for i = 1

      const result = await getRandomBuildersWithOnlyAllowlist(activeBuilders);

      expect(result).toHaveLength(3); // BLOCK_BUILDER_INDEXER_COUNT
      expect(
        result.every((builder) =>
          ["0xallowed1", "0xallowed2", "0xallowed3"].includes(builder.address),
        ),
      ).toBe(true);
    });

    it("should return all allowlisted builders when count is less than BLOCK_BUILDER_INDEXER_COUNT", async () => {
      const activeBuilders = [
        createMockIndexer("0xallowed1"),
        createMockIndexer("0xallowed2"),
        createMockIndexer("0xother1"),
      ];

      mockRandomInt.mockReturnValueOnce(0); // j = 0 for i = 1

      const result = await getRandomBuildersWithOnlyAllowlist(activeBuilders);

      expect(result).toHaveLength(2);
      expect(
        result.every((builder) => ["0xallowed1", "0xallowed2"].includes(builder.address)),
      ).toBe(true);
    });
  });

  describe("getRandomBuilderWithAllowlistPriority", () => {
    it("should return allowlisted builder when random value is below threshold", async () => {
      const activeBuilders = [createMockIndexer("0xallowed1"), createMockIndexer("0xother1")];

      // Mock random value below threshold (0.7)
      mockRandomInt
        .mockReturnValueOnce(600000) // randomValue = 0.6 < 0.7
        .mockReturnValueOnce(0); // index for allowlisted builder

      const result = await getRandomBuilderWithAllowlistPriority(activeBuilders);

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe("0xallowed1");
    });

    it("should return other builder when random value is above threshold and others exist", async () => {
      const activeBuilders = [createMockIndexer("0xallowed1"), createMockIndexer("0xother1")];

      // Mock random value above threshold
      mockRandomInt
        .mockReturnValueOnce(800000) // randomValue = 0.8 > 0.7
        .mockReturnValueOnce(0); // index for other builder

      const result = await getRandomBuilderWithAllowlistPriority(activeBuilders);

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe("0xother1");
    });

    it("should return allowlisted builder when no other builders exist", async () => {
      const activeBuilders = [createMockIndexer("0xallowed1"), createMockIndexer("0xallowed2")];

      mockRandomInt
        .mockReturnValueOnce(800000) // randomValue = 0.8 > 0.7
        .mockReturnValueOnce(0); // index for allowlisted builder

      const result = await getRandomBuilderWithAllowlistPriority(activeBuilders);

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe("0xallowed1");
    });

    it("should handle edge case with only allowlisted builders and random value above threshold", async () => {
      const activeBuilders = [createMockIndexer("0xallowed1")];

      mockRandomInt
        .mockReturnValueOnce(800000) // randomValue = 0.8 > 0.7
        .mockReturnValueOnce(0); // fallback to allowlisted

      const result = await getRandomBuilderWithAllowlistPriority(activeBuilders);

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe("0xallowed1");
    });
  });

  describe("getRandomBuildersWithGuaranteedAllowlist", () => {
    it("should return empty array when no active builders", async () => {
      const result = await getRandomBuildersWithGuaranteedAllowlist([]);

      expect(result).toEqual([]);
    });

    it("should guarantee minimum allowlisted builders when available", async () => {
      const activeBuilders = [
        createMockIndexer("0xallowed1"),
        createMockIndexer("0xallowed2"),
        createMockIndexer("0xallowed3"),
        createMockIndexer("0xother1"),
        createMockIndexer("0xother2"),
      ];

      const result = await getRandomBuildersWithGuaranteedAllowlist(activeBuilders);

      expect(result).toHaveLength(3); // BLOCK_BUILDER_INDEXER_COUNT

      // Should have at least BLOCK_BUILDER_MIN_ALLOWLIST_COUNT (2) allowlisted builders
      const allowlistedCount = result.filter((builder) =>
        ["0xallowed1", "0xallowed2", "0xallowed3"].includes(builder.address),
      ).length;
      expect(allowlistedCount).toBeGreaterThanOrEqual(2);
    });

    it("should handle case with fewer allowlisted builders than minimum required", async () => {
      const activeBuilders = [
        createMockIndexer("0xallowed1"), // Only 1 allowlisted
        createMockIndexer("0xother1"),
        createMockIndexer("0xother2"),
        createMockIndexer("0xother3"),
      ];

      const result = await getRandomBuildersWithGuaranteedAllowlist(activeBuilders);

      expect(result).toHaveLength(3);

      // Should include the 1 available allowlisted builder
      const allowlistedCount = result.filter((builder) => builder.address === "0xallowed1").length;
      expect(allowlistedCount).toBe(1);
    });

    it("should handle case with only allowlisted builders", async () => {
      const activeBuilders = [createMockIndexer("0xallowed1"), createMockIndexer("0xallowed2")];

      const result = await getRandomBuildersWithGuaranteedAllowlist(activeBuilders);

      expect(result).toHaveLength(2);
      expect(
        result.every((builder) => ["0xallowed1", "0xallowed2"].includes(builder.address)),
      ).toBe(true);
    });
  });

  describe("getRandomBuilders", () => {
    it("should return all builders when count is less than or equal to BLOCK_BUILDER_INDEXER_COUNT", async () => {
      const activeBuilders = [createMockIndexer("0xbuilder1"), createMockIndexer("0xbuilder2")];

      mockRandomInt.mockReturnValueOnce(0); // j = 0 for i = 1

      const result = await getRandomBuilders(activeBuilders);

      expect(result).toHaveLength(2);
      expect(
        result.every((builder) => ["0xbuilder1", "0xbuilder2"].includes(builder.address)),
      ).toBe(true);
    });

    it("should return shuffled subset when builder count exceeds BLOCK_BUILDER_INDEXER_COUNT", async () => {
      const activeBuilders = [
        createMockIndexer("0xbuilder1"),
        createMockIndexer("0xbuilder2"),
        createMockIndexer("0xbuilder3"),
        createMockIndexer("0xbuilder4"),
        createMockIndexer("0xbuilder5"),
      ];

      // Mock shuffling randomInt calls
      mockRandomInt
        .mockReturnValueOnce(2) // j = 2 for i = 4
        .mockReturnValueOnce(1) // j = 1 for i = 3
        .mockReturnValueOnce(0) // j = 0 for i = 2
        .mockReturnValueOnce(0); // j = 0 for i = 1

      const result = await getRandomBuilders(activeBuilders);

      expect(result).toHaveLength(3); // BLOCK_BUILDER_INDEXER_COUNT
    });

    it("should handle single builder", async () => {
      const activeBuilders = [createMockIndexer("0xbuilder1")];

      const result = await getRandomBuilders(activeBuilders);

      expect(result).toHaveLength(1);
      expect(result[0].address).toBe("0xbuilder1");
    });

    it("should handle empty array", async () => {
      const result = await getRandomBuilders([]);

      expect(result).toEqual([]);
    });
  });

  describe("Integration tests", () => {
    it("should maintain consistent behavior across multiple calls with same input", async () => {
      const activeBuilders = [
        createMockIndexer("0xallowed1"),
        createMockIndexer("0xallowed2"),
        createMockIndexer("0xother1"),
        createMockIndexer("0xother2"),
      ];

      // Test multiple function with same input
      const onlyAllowlistResult = await getRandomBuildersWithOnlyAllowlist(activeBuilders);
      const guaranteedResult = await getRandomBuildersWithGuaranteedAllowlist(activeBuilders);
      const randomResult = await getRandomBuilders(activeBuilders);

      // All should respect the BLOCK_BUILDER_INDEXER_COUNT limit
      expect(onlyAllowlistResult.length).toBeLessThanOrEqual(3);
      expect(guaranteedResult.length).toBeLessThanOrEqual(3);
      expect(randomResult.length).toBeLessThanOrEqual(3);
    });

    it("should handle edge case with exact BLOCK_BUILDER_INDEXER_COUNT allowlisted builders", async () => {
      const activeBuilders = [
        createMockIndexer("0xallowed1"),
        createMockIndexer("0xallowed2"),
        createMockIndexer("0xallowed3"), // Exactly 3 allowlisted
      ];

      mockRandomInt
        .mockReturnValueOnce(1) // For shuffling
        .mockReturnValueOnce(0);

      const result = await getRandomBuildersWithOnlyAllowlist(activeBuilders);

      expect(result).toHaveLength(3);
      expect(
        result.every((builder) =>
          ["0xallowed1", "0xallowed2", "0xallowed3"].includes(builder.address),
        ),
      ).toBe(true);
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle builders with different metadata", async () => {
      const activeBuilders = [
        {
          ...createMockIndexer("0xallowed1"),
          metadata: { version: "1.0", type: "validator" },
        },
        {
          ...createMockIndexer("0xother1"),
          metadata: { version: "2.0", role: "builder" },
        },
      ];

      const result = await getRandomBuilders(activeBuilders);

      expect(result).toHaveLength(2);
      expect(result[0].metadata).toBeDefined();
      expect(result[1].metadata).toBeDefined();
    });

    it("should preserve all IndexerInfo properties", async () => {
      const activeBuilders = [
        {
          address: "0xallowed1",
          url: "https://builder1.example.com",
          active: true,
          lastSyncedTime: new Date("2024-01-01"),
          metadata: { stake: 1000 },
        },
      ];

      const result = await getRandomBuilders(activeBuilders);

      expect(result[0]).toEqual({
        address: "0xallowed1",
        url: "https://builder1.example.com",
        active: true,
        lastSyncedTime: new Date("2024-01-01"),
        metadata: { stake: 1000 },
      });
    });
  });
});
