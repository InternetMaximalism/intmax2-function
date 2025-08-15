import {
  createNetworkClient,
  Event,
  type EventData,
  getStartBlockNumber,
  logger,
  MOCK_L1_SCROLL_MESSENGER_CONTRACT_DEPLOYED_BLOCK,
  validateBlockRange,
} from "@intmax2-function/shared";
import { relayerDBName } from "../constants";
import { generateDepositsCalldata } from "./decode.service";
import { fetchSentMessages } from "./event.service";
import { submitRelayMessagesToL2MockMessenger } from "./submit.service";

export const performJob = async (): Promise<void> => {
  const ethereumClient = createNetworkClient("ethereum");
  const scrollClient = createNetworkClient("scroll");
  const event = new Event(relayerDBName);

  const [currentBlockNumber, lastProcessedEvent] = await Promise.all([
    ethereumClient.getBlockNumber(),
    event.getEvent<EventData>(),
  ]);

  const startBlockNumber = getStartBlockNumber(
    lastProcessedEvent,
    MOCK_L1_SCROLL_MESSENGER_CONTRACT_DEPLOYED_BLOCK,
  );
  const isValid = validateBlockRange("SentMessage", startBlockNumber, currentBlockNumber);
  if (!isValid) {
    logger.info("Skipping process mock L1 to L2 relayer due to invalid block range.");
    return;
  }

  const l1SentMessageEvents = await fetchSentMessages(
    ethereumClient,
    startBlockNumber,
    currentBlockNumber,
  );

  logger.info(`Fetched ${l1SentMessageEvents.length} sent messages from L1 to L2`);

  for (const l1SentMessageEvent of l1SentMessageEvents) {
    const calldataBatch = await generateDepositsCalldata(ethereumClient, l1SentMessageEvent);

    for (const calldata of calldataBatch) {
      await submitRelayMessagesToL2MockMessenger(scrollClient, {
        ...l1SentMessageEvent.args,
        message: calldata.encodedCalldata,
      });
    }
  }

  await event.addOrUpdateEvent({
    lastBlockNumber: Number(currentBlockNumber),
  });
};
