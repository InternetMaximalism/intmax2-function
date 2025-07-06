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
  const ethereumClient = createNetworkClient("ethereum");
  const event = new Event(FIRESTORE_DOCUMENT_EVENTS.DEPOSITED);

  const [currentBlockNumber, lastProcessedEvent] = await Promise.all([
    await ethereumClient.getBlockNumber(),
    await event.getEvent<EventData>(),
  ]);

  await processAnalyzer(ethereumClient, currentBlockNumber, event, lastProcessedEvent);
};

const processAnalyzer = async (
  ethereumClient: ReturnType<typeof createNetworkClient>,
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
    ethereumClient,
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
    ethereumClient,
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
      await submitRelayDeposits(ethereumClient, batch);
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
