import { logger, TxMap } from "@intmax2-function/shared";

export const performJob = async () => {
  const deletedCount = await TxMap.getInstance().deleteExpiredTxMaps();

  if (deletedCount === 0) {
    logger.info("No expired transaction maps to delete.");
    return;
  }

  logger.info(`Deleted ${deletedCount} expired transaction maps.`);
};
