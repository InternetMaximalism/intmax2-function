import {
  createNetworkClient,
  type DepositsRelayedEventData,
  Event,
  FIRESTORE_DOCUMENT_EVENTS,
  logger,
} from "@intmax2-function/shared";
import type { PublicClient } from "viem";
import { fetchUnprocessedDepositTokenEntries } from "./event.service";
import { saveTokenIndexMaps } from "./map.service";

export const performJob = async (): Promise<void> => {
  const l1Client = createNetworkClient("l1");
  const event = new Event(FIRESTORE_DOCUMENT_EVENTS.DEPOSITS_RELAYED_TOKEN_MAPS);
  const [currentBlockNumber, lastProcessedEvent] = await Promise.all([
    await l1Client.getBlockNumber(),
    event.getEvent<DepositsRelayedEventData>(),
  ]);

  const eventData = await processTokenMap(l1Client, currentBlockNumber, lastProcessedEvent);
  await updateEventData(event, eventData);
};

const processTokenMap = async (
  l1Client: PublicClient,
  currentBlockNumber: bigint,
  lastProcessedEvent: DepositsRelayedEventData | null,
) => {
  const { depositIds, tokenInfoMap } = await fetchUnprocessedDepositTokenEntries(
    l1Client,
    currentBlockNumber,
    lastProcessedEvent,
  );

  if (depositIds.length === 0) {
    logger.info("No new deposits found.");
    return {
      lastBlockNumber: Number(currentBlockNumber),
    };
  }

  const results = await saveTokenIndexMaps(l1Client, tokenInfoMap);
  logger.info(`Added ${results.length} new token maps.`);

  return {
    lastBlockNumber: Number(currentBlockNumber),
    lastUpToDepositId: Math.max(...depositIds.map(Number)),
  };
};

const updateEventData = async (
  event: Event,
  eventData: { lastBlockNumber: number; lastUpToDepositId?: number },
) => {
  await event.addOrUpdateEvent(eventData);
};
