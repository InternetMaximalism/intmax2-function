import {
  BUILDER_REGISTRY_CONTRACT_DEPLOYED_BLOCK,
  createNetworkClient,
  Event,
  type EventData,
  FIRESTORE_DOCUMENT_EVENTS,
  getStartBlockNumber,
  logger,
  validateBlockRange,
} from "@intmax2-function/shared";
import { getHeartBeatEvents } from "./event.service";
import { processIndexer } from "./indexer.service";

export const performJob = async (): Promise<void> => {
  const ethereumClient = createNetworkClient("scroll");
  const event = new Event(FIRESTORE_DOCUMENT_EVENTS.BLOCK_BUILDER_HEART_BEAT);

  const [currentBlockNumber, lastProcessedEvent] = await Promise.all([
    ethereumClient.getBlockNumber(),
    event.getEvent<EventData>(),
  ]);

  const startBlockNumber = getStartBlockNumber(
    lastProcessedEvent,
    BUILDER_REGISTRY_CONTRACT_DEPLOYED_BLOCK,
  );
  const isValid = validateBlockRange(
    "blockBuilderHeartbeatEvent",
    startBlockNumber,
    currentBlockNumber,
  );
  if (!isValid) {
    logger.info("Skipping block builder heartbeat event due to invalid block range.");
    return;
  }

  await processHeartBeatEvents(ethereumClient, startBlockNumber, currentBlockNumber);
  await updateEventState(event, currentBlockNumber);
};

const processHeartBeatEvents = async (
  ethereumClient: ReturnType<typeof createNetworkClient>,
  startBlockNumber: bigint,
  currentBlockNumber: bigint,
) => {
  const events = await getHeartBeatEvents(ethereumClient, startBlockNumber, currentBlockNumber);
  if (events.length === 0) {
    logger.info("No new heart beat events found.");
    return;
  }

  const indexerInfos = await processIndexer(ethereumClient, events);
  logger.info(`Processed ${indexerInfos.length} events.`);
};

const updateEventState = async (event: Event, currentBlockNumber: bigint) => {
  const eventData = {
    lastBlockNumber: Number(currentBlockNumber),
  };
  await event.addOrUpdateEvent(eventData);
};
