import {
  BASE_BRIDGE_O_APP_CONTRACT_ADDRESS,
  BASE_BRIDGE_O_APP_CONTRACT_DEPLOYED_BLOCK,
  BLOCK_RANGE_TINY,
  type BridgeRequestedEvent,
  BridgeTransaction,
  bridgeRequestedEvent,
  createNetworkClient,
  Event,
  type EventData,
  FIRESTORE_DOCUMENT_EVENTS,
  fetchEvents,
  getStartBlockNumber,
  logger,
  validateBlockRange,
} from "@intmax2-function/shared";

export const performJob = async () => {
  const l2Client = createNetworkClient("l2");
  const event = new Event(FIRESTORE_DOCUMENT_EVENTS.BRIDGE_REQUESTED);

  const [currentBlockNumber, lastProcessedEvent] = await Promise.all([
    await l2Client.getBlockNumber(),
    await event.getEvent<EventData>(),
  ]);

  await processBridgeMonitor(l2Client, currentBlockNumber, event, lastProcessedEvent);
};

const processBridgeMonitor = async (
  l2Client: ReturnType<typeof createNetworkClient>,
  currentBlockNumber: bigint,
  event: Event,
  lastProcessedEvent: EventData | null,
) => {
  const startBlockNumber = getStartBlockNumber(
    lastProcessedEvent,
    BASE_BRIDGE_O_APP_CONTRACT_DEPLOYED_BLOCK,
  );
  const isValid = validateBlockRange("BridgeRequested", startBlockNumber, currentBlockNumber);
  if (!isValid) {
    logger.info("Skipping process BridgeRequested due to invalid block range.");
    return;
  }

  const bridgeRequestedEvents = await fetchEvents<BridgeRequestedEvent>(l2Client, {
    startBlockNumber,
    endBlockNumber: currentBlockNumber,
    blockRange: BLOCK_RANGE_TINY,
    contractAddress: BASE_BRIDGE_O_APP_CONTRACT_ADDRESS,
    eventInterface: bridgeRequestedEvent,
  });

  const bridgeRequestedInputs = bridgeRequestedEvents.map((event) => ({
    guid: event.args.receipt.guid,
    nonce: Number(event.args.receipt.nonce),
  }));

  await BridgeTransaction.getInstance().saveBridgeTransactionsBatch(bridgeRequestedInputs);

  await updateEventState(event, currentBlockNumber);
};

const updateEventState = async (event: Event, currentBlockNumber: bigint) => {
  const eventData = {
    lastBlockNumber: Number(currentBlockNumber),
  };
  await event.addOrUpdateEvent(eventData);
};
