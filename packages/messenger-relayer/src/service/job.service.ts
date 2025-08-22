import { createNetworkClient, logger } from "@intmax2-function/shared";
import { getMessengerType } from "../lib/utils";
import { generateCalldata } from "./decode.service";
import { fetchAllClaimableScrollMessengerResults } from "./messenger.service";
import { relayMessageWithProof } from "./submit.service";

export const performJob = async (): Promise<void> => {
  const messengerType = getMessengerType();

  const claimableRequests = await fetchAllClaimableScrollMessengerResults(messengerType);
  if (claimableRequests.length === 0) {
    logger.info("No claimable requests found");
    return;
  }

  logger.info(`Found ${claimableRequests.length} claimable requests`);

  const l1Client = createNetworkClient("l1");

  for (const claimableRequest of claimableRequests) {
    const calldataBatch = await generateCalldata(claimableRequest);
    for (const calldata of calldataBatch) {
      await relayMessageWithProof(l1Client, {
        ...claimableRequest,
        claim_info: {
          ...claimableRequest.claim_info,
          message: calldata.encodedCalldata,
        },
      });
    }
  }
};
