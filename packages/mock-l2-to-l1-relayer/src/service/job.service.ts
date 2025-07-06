import {
  createNetworkClient,
  Event,
  type EventData,
  FIRESTORE_DOCUMENT_EVENTS,
  getStartBlockNumber,
  logger,
  MOCK_L2_SCROLL_MESSENGER_CONTRACT_DEPLOYED_BLOCK,
  validateBlockRange,
} from "@intmax2-function/shared";
import { generateCalldata } from "./decode.service";
import { getL2SentMessage } from "./event.service";
import { relayMessageWithProof } from "./submit.service";

export const performJob = async (): Promise<void> => {
  const scrollClient = createNetworkClient("scroll");
  const event = new Event(FIRESTORE_DOCUMENT_EVENTS.MOCK_L2_SENT_MESSAGE);

  const [currentBlockNumber, lastProcessedEvent] = await Promise.all([
    await scrollClient.getBlockNumber(),
    await event.getEvent<EventData>(),
  ]);

  const startBlockNumber = getStartBlockNumber(
    lastProcessedEvent,
    MOCK_L2_SCROLL_MESSENGER_CONTRACT_DEPLOYED_BLOCK,
  );
  const isValid = validateBlockRange("SentMessage", startBlockNumber, currentBlockNumber);
  if (!isValid) {
    logger.info("Skipping process mock L2 to L1 relayer due to invalid block range.");
    return;
  }

  const sentMessages = await getL2SentMessage(scrollClient, startBlockNumber, currentBlockNumber);
  logger.info(`New sentMessages events: ${sentMessages.length}`);
  const ethereumClient = createNetworkClient("ethereum");

  for (const sendMessage of sentMessages) {
    const calldataBatch = await generateCalldata(sendMessage);

    for (const calldata of calldataBatch) {
      await relayMessageWithProof(ethereumClient, {
        ...sendMessage,
        message: calldata.encodedCalldata,
      });
    }
  }

  await event.addOrUpdateEvent({
    lastBlockNumber: Number(currentBlockNumber),
  });
};
