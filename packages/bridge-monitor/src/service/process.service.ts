import {
  type BridgeTransactionData,
  Discord,
  MAINNET_BRIDGE_O_APP_CONTRACT_ADDRESS,
  MainnetBridgeOAppAbi,
} from "@intmax2-function/shared";
import { type Abi, encodeAbiParameters } from "viem";
import { l1Client } from "../lib/blockchain";
import type { BridgeParams } from "../types";
import { submitTransaction } from "./submit.service";

export const handleFailedStatus = async (bridgeParams: BridgeParams) => {
  const { srcEid, sender, nonce, guid, message } = buildContractParams(bridgeParams);

  const receipt = await submitTransaction({
    operation: "clearMessage",
    args: [
      {
        srcEid,
        sender,
        nonce,
      },
      guid,
      message,
    ],
  });

  Discord.getInstance().initialize();
  await Discord.getInstance().sendMessageWitForReady(
    "FATAL",
    `FAILED status ${bridgeParams.bridgeGuidTransaction.guid} cleared: ${receipt.hash}`,
  );

  return {
    clearedAt: new Date(),
    clearMessageTxHash: receipt.hash,
  };
};

export const handleInflightOrConfirmingStatus = async (
  bridgeTransaction: BridgeTransactionData,
) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (bridgeTransaction.createdAt.toDate() < twentyFourHoursAgo) {
    Discord.getInstance().initialize();
    await Discord.getInstance().sendMessageWitForReady(
      "FATAL",
      `INFLIGHT/CONFIRMING status persists over 24 hours: ${bridgeTransaction.guid}`,
    );

    return {
      alertSent: true,
      lastAlertAt: new Date(),
    };
  }

  return null;
};

// TODO: manual retry and alertSent cannot get from db
export const handleVerifiedStatus = async (bridgeParams: BridgeParams) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (
    bridgeParams.bridgeTransaction.verifiedAt &&
    bridgeParams.bridgeTransaction.verifiedAt.toDate() < twentyFourHoursAgo
  ) {
    const { sender, message, srcEid, nonce, guid, extraData } = buildContractParams(bridgeParams);
    const receipt = await submitTransaction({
      operation: "manualRetry",
      args: [
        {
          srcEid,
          sender,
          nonce,
        },
        guid,
        message,
        extraData,
      ],
    });

    return {
      alertSent: true,
      lastAlertAt: new Date(),
      manualRetryAt: new Date(),
      manualRetryTxHash: receipt.hash,
    };
  }

  return {
    verifiedAt: new Date(),
  };
};

export const handlePayloadStored = async (bridgeParams: BridgeParams) => {
  const hasStored = await hasStoredPayload(bridgeParams);

  if (hasStored) {
    const { sender, message, srcEid, nonce, guid, extraData } = buildContractParams(bridgeParams);
    const receipt = await submitTransaction({
      operation: "manualRetry",
      args: [
        {
          srcEid,
          sender,
          nonce,
        },
        guid,
        message,
        extraData,
      ],
    });

    return {
      manualRetryAt: new Date(),
      manualRetryTxHash: receipt.hash,
    };
  }

  Discord.getInstance().initialize();
  await Discord.getInstance().sendMessageWitForReady(
    "FATAL",
    `PAYLOAD_STORED but hasStoredPayload is false: ${bridgeParams.bridgeGuidTransaction.guid}`,
  );

  return {
    alertSent: true,
    lastAlertAt: new Date(),
  };
};

const hasStoredPayload = async (bridgeParams: BridgeParams) => {
  const { sender, message, srcEid, nonce, guid } = buildContractParams(bridgeParams);

  const args = [
    {
      srcEid,
      sender,
      nonce,
      guid,
      message,
    },
  ];

  const isStored = await l1Client.readContract({
    address: MAINNET_BRIDGE_O_APP_CONTRACT_ADDRESS,
    abi: MainnetBridgeOAppAbi as Abi,
    functionName: "hasStoredPayload",
    args,
  });

  return isStored as boolean;
};

const buildContractParams = ({ bridgeTransaction, bridgeGuidTransaction }: BridgeParams) => {
  const sender = bridgeGuidTransaction.pathway.sender.address as `0x${string}`;
  const recipient = bridgeGuidTransaction.pathway.receiver.address as `0x${string}`;
  const amount = BigInt(bridgeTransaction.amount);

  const message = encodeAbiParameters(
    [{ type: "address" }, { type: "uint256" }, { type: "address" }],
    [recipient, amount, sender],
  );

  const srcEid = BigInt(bridgeGuidTransaction.pathway.srcEid);
  const nonce = BigInt(bridgeGuidTransaction.pathway.nonce);
  const guid = bridgeGuidTransaction.guid;

  const extraData = "0x" as `0x${string}`;

  return {
    sender,
    recipient,
    amount,
    message,
    srcEid,
    nonce,
    guid,
    extraData,
  };
};
