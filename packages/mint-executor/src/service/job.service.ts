import {
  createNetworkClient,
  Event,
  type EventData,
  FIRESTORE_DOCUMENT_EVENTS,
  getStartBlockNumber,
  logger,
  MINTER_CONTRACT_DEPLOYED_BLOCK,
  MintEvent,
  validateBlockRange,
} from "@intmax2-function/shared";
import { executeAutomaticOperations, processEvents } from "./process.service";

export const performJob = async (): Promise<void> => {
  const l1Client = createNetworkClient("l1");
  const event = new Event(FIRESTORE_DOCUMENT_EVENTS.MINTER);

  const [currentBlockNumber, lastProcessedEvent] = await Promise.all([
    await l1Client.getBlockNumber(),
    await event.getEvent<EventData>(),
  ]);

  await processMinter(l1Client, currentBlockNumber, event, lastProcessedEvent);
};

const processMinter = async (
  l1Client: ReturnType<typeof createNetworkClient>,
  currentBlockNumber: bigint,
  event: Event,
  lastProcessedEvent: EventData | null,
) => {
  const startBlockNumber = getStartBlockNumber(lastProcessedEvent, MINTER_CONTRACT_DEPLOYED_BLOCK);
  if (!validateBlockRange("mintEvent", startBlockNumber, currentBlockNumber)) {
    logger.info("Skipping minter process due to invalid block range");
    return;
  }

  const mintEvent = MintEvent.getInstance();
  await processEvents(l1Client, mintEvent, startBlockNumber, currentBlockNumber);

  await executeAutomaticOperations(l1Client, mintEvent);

  await updateEventState(event, currentBlockNumber);
};

const updateEventState = async (event: Event, currentBlockNumber: bigint) => {
  const eventData = {
    lastBlockNumber: Number(currentBlockNumber),
  };
  await event.addOrUpdateEvent(eventData);
};
