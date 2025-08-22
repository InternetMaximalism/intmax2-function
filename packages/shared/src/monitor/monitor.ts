import { type PublicClient, parseEther } from "viem";
import { createNetworkClient } from "../blockchain";
import { config } from "../config";
import { BLOCK_BUILDER_ALLOWLIST, INDEXER_BATCH_SIZE } from "../constants";
import { BaseIndexer } from "../db";
import { logger } from "../lib";
import type { IndexerInfo } from "../types";
import { fetchEthBalances } from "./balance-check";
import { requestFeeInfoCheck } from "./fee-info-check";
import { validateIndexerInfo } from "./validation";

export const fetchRecentSyncIndexerBuilders = async (indexer: BaseIndexer) => {
  const dayAgoTimestamp = getTimeStampFromLast24Hours();
  const indexers = await indexer.fetchIndexers({ lastSyncedTime: dayAgoTimestamp });
  return indexers;
};

const getTimeStampFromLast24Hours = () => {
  const now = new Date().getTime();
  return new Date(now - 1000 * 60 * 60 * 24);
};

export const processMonitor = async (indexers: IndexerInfo[]) => {
  const l2Client = createNetworkClient("l2");

  const activeIndexers = [];
  for (let i = 0; i < indexers.length; i += INDEXER_BATCH_SIZE) {
    const batch = indexers.slice(i, i + INDEXER_BATCH_SIZE);
    try {
      const availableIndexers = await checkIndexerAvailability(l2Client, batch);
      activeIndexers.push(...availableIndexers);
    } catch (error) {
      logger.error(`Error checking indexer availability: ${error}`);
    }
  }

  return activeIndexers;
};

const checkIndexerAvailability = async (l2Client: PublicClient, indexers: IndexerInfo[]) => {
  const healthCheckPromises = await Promise.all(
    indexers.map(async (indexer) => {
      try {
        if (BLOCK_BUILDER_ALLOWLIST.includes(indexer.address)) {
          return { ...indexer, status: "available" };
        }

        if (!indexer.url.startsWith("https://")) {
          throw new Error("Indexer URL must use HTTPS protocol");
        }

        const feeInfo = await requestFeeInfoCheck(indexer.url);
        validateIndexerInfo(feeInfo);

        return { ...indexer, status: "available" };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logger.warn(`Error checking indexer availability: ${message}`);

        return {
          ...indexer,
          status: "error",
          message,
        };
      }
    }),
  );

  const addresses = indexers.map((indexer) => indexer.address);
  const balanceMap = await fetchEthBalances(l2Client, addresses);

  const availableIndexers = healthCheckPromises.filter((indexer) => {
    if (indexer.status === "available") {
      const ethBalance = balanceMap.get(indexer.address);
      return ethBalance && ethBalance > parseEther(config.BLOCK_BUILDER_MIN_ETH_BALANCE);
    }
    return false;
  });

  return availableIndexers;
};
