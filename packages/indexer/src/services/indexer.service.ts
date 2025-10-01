import { FIRESTORE_DOCUMENTS, getIndexer } from "@intmax2-function/shared";
import { BUILDER_SELECTION_MODE } from "../constants";
import { getBuildersByMode } from "../lib/builder";

export const listBlockBuilderNodes = async () => {
  const indexerInstance = getIndexer(FIRESTORE_DOCUMENTS.BUILDERS);
  const activeBuilders = await indexerInstance.listIndexers();

  return getBuildersByMode(activeBuilders, BUILDER_SELECTION_MODE);
};

export const getBlockBuilderMeta = async () => {
  const indexerInstance = getIndexer(FIRESTORE_DOCUMENTS.BUILDERS);
  const activeBuilders = await indexerInstance.listIndexers();

  return {
    total: activeBuilders.length,
  };
};

export const checkIndexerRegistration = async (address: string) => {
  const indexerInstance = getIndexer(FIRESTORE_DOCUMENTS.BUILDERS);
  const indexers = await indexerInstance.fetchIndexers({ addresses: [address] });

  return {
    registered: indexers.length > 0,
    ready: indexers.some((indexer) => indexer.active),
  };
};
