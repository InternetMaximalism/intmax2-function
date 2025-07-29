import {
  CACHE_KEYS,
  CachedResponse,
  cache,
  FIRESTORE_DOCUMENTS,
  getIndexer,
  IndexerInfo,
  logger,
  processMonitor,
} from "@intmax2-function/shared";

export const performJob = async (): Promise<void> => {
  const indexerInstance = getIndexer(FIRESTORE_DOCUMENTS.BUILDERS);
  const cachedIndexer = await cache.get<CachedResponse>(CACHE_KEYS.BLOCK_BUILDER_INDEXER_LIST);

  if (!cachedIndexer) {
    logger.info("No cached indexer found.");
    return;
  }

  const indexerInfo = JSON.parse(cachedIndexer.body) as IndexerInfo[];
  const indexers = await indexerInstance.fetchIndexers({
    addresses: indexerInfo.map(({ address }) => address),
  });
  const activeIndexers = await processMonitor(indexers);
  await indexerInstance.syncIndexerActiveStates(activeIndexers.map((indexer) => indexer.address));

  if (activeIndexers.length === 0) {
    await cache.del(CACHE_KEYS.BLOCK_BUILDER_INDEXER_LIST);
    logger.info("No active indexers found, cache cleared.");
    return;
  }

  if (activeIndexers.length === indexerInfo.length) {
    logger.info("All indexers are active, no cache update needed.");
    return;
  }

  const cachedActiveIndexers = indexerInfo.filter((indexer) =>
    activeIndexers.some((activeIndexer) => activeIndexer.address === indexer.address),
  );

  const ttl = await cache.getTtl(CACHE_KEYS.BLOCK_BUILDER_INDEXER_LIST);

  if (ttl && ttl > 0) {
    await cache.set(
      CACHE_KEYS.BLOCK_BUILDER_INDEXER_LIST,
      {
        ...cachedIndexer,
        body: JSON.stringify(cachedActiveIndexers),
      },
      ttl,
    );
    logger.info(
      `Cache updated with ${cachedActiveIndexers.length} active indexers at TTL: ${ttl} seconds.`,
    );
    return;
  }

  logger.info("Cache TTL is not set or expired, cache will not be updated.");
};
