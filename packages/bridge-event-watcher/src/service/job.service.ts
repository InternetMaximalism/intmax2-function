import type { FirestoreDocumentKey } from "@intmax2-function/shared";
import {
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
  SENDER_BRIDGE_O_APP_CHAIN_TYPE,
  SENDER_BRIDGE_O_APP_CONTRACT_ADDRESS,
  SENDER_BRIDGE_O_APP_CONTRACT_DEPLOYED_BLOCK,
  validateBlockRange,
} from "@intmax2-function/shared";

export const performJob = async () => {
  const networkClient = createNetworkClient(SENDER_BRIDGE_O_APP_CHAIN_TYPE);
  const eventDocName =
    `${FIRESTORE_DOCUMENT_EVENTS.BRIDGE_REQUESTED}-${SENDER_BRIDGE_O_APP_CHAIN_TYPE}` as FirestoreDocumentKey;
  const event = new Event(eventDocName);

  const [currentBlockNumber, lastProcessedEvent] = await Promise.all([
    await networkClient.getBlockNumber(),
    await event.getEvent<EventData>(),
  ]);

  await processBridgeMonitor(networkClient, currentBlockNumber, event, lastProcessedEvent);
};

const processBridgeMonitor = async (
  networkClient: ReturnType<typeof createNetworkClient>,
  currentBlockNumber: bigint,
  event: Event,
  lastProcessedEvent: EventData | null,
) => {
  const startBlockNumber = getStartBlockNumber(
    lastProcessedEvent,
    SENDER_BRIDGE_O_APP_CONTRACT_DEPLOYED_BLOCK,
  );
  const isValid = validateBlockRange("BridgeRequested", startBlockNumber, currentBlockNumber);
  if (!isValid) {
    logger.info("Skipping process BridgeRequested due to invalid block range.");
    return;
  }

  const bridgeRequestedEvents = await fetchEvents<BridgeRequestedEvent>(networkClient, {
    startBlockNumber,
    endBlockNumber: currentBlockNumber,
    blockRange: BLOCK_RANGE_TINY,
    contractAddress: SENDER_BRIDGE_O_APP_CONTRACT_ADDRESS,
    eventInterface: bridgeRequestedEvent,
  });

  const bridgeRequestedInputs = bridgeRequestedEvents.map((event) => ({
    guid: event.args.receipt.guid,
    nonce: Number(event.args.receipt.nonce),
    recipient: event.args.recipient,
    amount: event.args.amount.toString(),
    transactionHash: event.transactionHash,
    chainType: SENDER_BRIDGE_O_APP_CHAIN_TYPE,
  }));

  logger.info(`BridgeRequested events fetched: ${bridgeRequestedInputs.length}`);

  await BridgeTransaction.getInstance().saveBridgeTransactionsBatch(bridgeRequestedInputs);

  await updateEventState(event, currentBlockNumber);
};

const updateEventState = async (event: Event, currentBlockNumber: bigint) => {
  const eventData = {
    lastBlockNumber: Number(currentBlockNumber),
  };
  await event.addOrUpdateEvent(eventData);
};
