import {
  type BlockBuilderHeartbeatEvent,
  createNetworkClient,
  FIRESTORE_DOCUMENTS,
  getIndexer,
} from "@intmax2-function/shared";
import { BATCH_SIZE } from "../constants";

export const processIndexer = async (
  ethereumClient: ReturnType<typeof createNetworkClient>,
  events: BlockBuilderHeartbeatEvent[],
) => {
  const lastIndexerEvents = events.reduce((acc, event) => {
    const existing = acc.get(event.args.blockBuilder);
    if (!existing || existing.blockNumber < event.blockNumber) {
      acc.set(event.args.blockBuilder, event);
    }
    return acc;
  }, new Map<string, BlockBuilderHeartbeatEvent>());

  const indexerEvents = Array.from(lastIndexerEvents.values());

  const indexerInfos = [];
  for (let i = 0; i < indexerEvents.length; i += BATCH_SIZE) {
    const batch = indexerEvents.slice(i, i + BATCH_SIZE);
    const indexerPromises = batch.map(async (event) => {
      const block = await ethereumClient.getBlock({
        blockHash: event.blockHash as `0x${string}`,
      })!;
      if (!block) {
        throw new Error(`Block not found: ${event.blockNumber}`);
      }
      return {
        address: event.args.blockBuilder.toLowerCase(),
        lastSyncedTime: new Date(Number(block.timestamp) * 1000),
        url: event.args.url,
        metadata: {},
      };
    });

    const indexerInfo = await Promise.all(indexerPromises);
    indexerInfos.push(...indexerInfo);
  }

  const indexer = getIndexer(FIRESTORE_DOCUMENTS.BUILDERS);
  await indexer.upsertIndexersBatch(indexerInfos);

  return indexerInfos;
};
