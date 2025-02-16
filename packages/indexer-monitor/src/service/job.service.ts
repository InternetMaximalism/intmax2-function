import {
  Event,
  type EventData,
  FIRESTORE_DOCUMENT_EVENTS,
  createNetworkClient,
  logger,
} from "@intmax2-functions/shared";
import { getHeartBeatEvents } from "./event.service";
import { processIndexer } from "./indexer.service";

export const performJob = async (): Promise<void> => {
  const ethereumClient = createNetworkClient("scroll");
  const event = new Event(FIRESTORE_DOCUMENT_EVENTS.BLOCK_BUILDER_HEART_BEAT);

  const [currentBlockNumber, lastProcessedEvent] = await Promise.all([
    ethereumClient.getBlockNumber(),
    event.getEvent<EventData>(),
  ]);

  await processHeartBeatEvents(ethereumClient, currentBlockNumber, lastProcessedEvent);
  await updateEventState(event, currentBlockNumber);
};

const processHeartBeatEvents = async (
  ethereumClient: ReturnType<typeof createNetworkClient>,
  currentBlockNumber: bigint,
  lastProcessedEvent: EventData | null,
) => {
  const events = await getHeartBeatEvents(ethereumClient, currentBlockNumber, lastProcessedEvent);
  if (events.length === 0) {
    logger.info("No new heart beat events found.");
    return;
  }

  const indexerInfos = await processIndexer(events);
  logger.info(`Processed ${indexerInfos.length} events.`);
};

const updateEventState = async (event: Event, currentBlockNumber: bigint) => {
  const eventData = {
    lastBlockNumber: Number(currentBlockNumber),
  };
  await event.addOrUpdateEvent(eventData);
};
