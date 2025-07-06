import { config, createNetworkClient, IndexerInfo, logger } from "@intmax2-function/shared";
import { type PublicClient, parseEther } from "viem";
import { BLOCK_BUILDER_ALLOWLIST, INDEXER_BATCH_SIZE } from "../constants";
import { fetchEthBalances } from "../lib/balance-check";
import { requestFeeInfoCheck } from "../lib/fee-info-check";
import { validateIndexerInfo } from "../lib/validation";

export const processMonitor = async (indexers: IndexerInfo[]) => {
  const ethereumClient = createNetworkClient("scroll");

  const activeIndexers = [];
  for (let i = 0; i < indexers.length; i += INDEXER_BATCH_SIZE) {
    const batch = indexers.slice(i, i + INDEXER_BATCH_SIZE);
    try {
      const availableIndexers = await checkIndexerAvailability(ethereumClient, batch);
      activeIndexers.push(...availableIndexers);
    } catch (error) {
      logger.error(`Error checking indexer availability: ${error}`);
    }
  }

  return activeIndexers;
};

const checkIndexerAvailability = async (ethereumClient: PublicClient, indexers: IndexerInfo[]) => {
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
  const balanceMap = await fetchEthBalances(ethereumClient, addresses);

  const availableIndexers = healthCheckPromises.filter((indexer) => {
    if (indexer.status === "available") {
      const ethBalance = balanceMap.get(indexer.address);
      return ethBalance && ethBalance > parseEther(config.BLOCK_BUILDER_MIN_ETH_BALANCE);
    }
    return false;
  });

  return availableIndexers;
};
