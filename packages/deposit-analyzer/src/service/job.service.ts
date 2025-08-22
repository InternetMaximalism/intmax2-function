import {
  createNetworkClient,
  Event,
  type EventData,
  FIRESTORE_DOCUMENT_EVENTS,
  getStartBlockNumber,
  LIQUIDITY_CONTRACT_DEPLOYED_BLOCK,
  logger,
  validateBlockRange,
} from "@intmax2-function/shared";
import { getDepositedEvent, getDepositsRelayedEvent } from "./event.service";
import { submitRelayDeposits } from "./submit.service";
import { splitDepositSummary } from "./summarize.service";

export const performJob = async () => {
  const l1Client = createNetworkClient("l1");
  const event = new Event(FIRESTORE_DOCUMENT_EVENTS.DEPOSITED);

  const [currentBlockNumber, lastProcessedEvent] = await Promise.all([
    await l1Client.getBlockNumber(),
    await event.getEvent<EventData>(),
  ]);

  await processAnalyzer(l1Client, currentBlockNumber, event, lastProcessedEvent);
};

const processAnalyzer = async (
  l1Client: ReturnType<typeof createNetworkClient>,
  currentBlockNumber: bigint,
  event: Event,
  lastProcessedEvent: EventData | null,
) => {
  const startBlockNumber = getStartBlockNumber(
    lastProcessedEvent,
    LIQUIDITY_CONTRACT_DEPLOYED_BLOCK,
  );
  const isValid = validateBlockRange("depositedEvent", startBlockNumber, currentBlockNumber);
  if (!isValid) {
    logger.info("Skipping process deposit analyzer due to invalid block range.");
    return;
  }

  const processedDepositEvents = await getDepositedEvent(
    l1Client,
    startBlockNumber,
    currentBlockNumber,
    lastProcessedEvent,
  );

  if (processedDepositEvents.length === 0) {
    logger.info("No new deposits found.");
    await updateEventState(event, currentBlockNumber);
    return;
  }

  logger.info(`New deposit events: ${processedDepositEvents.length}`);

  const processedState = await getDepositsRelayedEvent(
    l1Client,
    startBlockNumber,
    currentBlockNumber,
  );
  const depositSummary = await splitDepositSummary(
    processedDepositEvents,
    processedState,
    currentBlockNumber,
  );

  if (depositSummary.shouldSubmit) {
    for (const batch of depositSummary.batches) {
      await submitRelayDeposits(l1Client, batch);
      await updateEventState(event, batch.blockNumber);
    }
  }
};

const updateEventState = async (event: Event, currentBlockNumber: bigint) => {
  const eventData = {
    lastBlockNumber: Number(currentBlockNumber),
  };
  await event.addOrUpdateEvent(eventData);
};
