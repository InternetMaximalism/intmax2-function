import {
  type ContractCallOptionsEthers,
  type ContractCallParameters,
  calculateEthersIncreasedGasPrice,
  calculateGasMultiplier,
  config,
  ETHERS_CONFIRMATIONS,
  ETHERS_WAIT_TRANSACTION_TIMEOUT_MESSAGE,
  ethersWaitForTransactionConfirmation,
  executeEthersTransaction,
  getEthersScrollMaxGasMultiplier,
  getEthersTxOptions,
  getMockWalletClient,
  getNonce,
  L2ScrollMessengerAbi,
  logger,
  MOCK_L2_SCROLL_MESSENGER_CONTRACT_ADDRESS,
  MockL2ScrollMessenger__factory,
  type RetryOptionsEthers,
  replacedEthersTransaction,
  type SentMessageEventLog,
  TRANSACTION_ALREADY_EXECUTED,
  TRANSACTION_MAX_RETRIES,
  TRANSACTION_MISSING_REVERT_DATA,
  TRANSACTION_REPLACEMENT_FEE_TOO_LOW,
  TRANSACTION_WAIT_TIMEOUT_ERROR_MESSAGE,
  TRANSACTION_WAIT_TRANSACTION_TIMEOUT,
} from "@intmax2-function/shared";
import { ethers } from "ethers";
import type { Abi, PublicClient } from "viem";

export const submitRelayMessagesToL2MockMessenger = async (
  l2Client: PublicClient,
  l1SentMessageEventLog: SentMessageEventLog,
) => {
  if (!validateL1SentMessageEvent(l1SentMessageEventLog)) {
    throw new Error(`Invalid l1SentMessageEvent`);
  }

  const retryOptions: RetryOptionsEthers = {
    gasPrice: null,
  };

  for (let attempt = 0; attempt < TRANSACTION_MAX_RETRIES; attempt++) {
    try {
      const multiplier = calculateGasMultiplier(attempt);

      const { transactionHash } = await submitRelayMessagesToL2MockMessengerWithRetry(
        l2Client,
        l1SentMessageEventLog,
        multiplier,
        retryOptions,
      );

      const receipt = await ethersWaitForTransactionConfirmation(
        l2Client,
        transactionHash,
        "withdraw",
        {
          confirms: ETHERS_CONFIRMATIONS,
          timeout: TRANSACTION_WAIT_TRANSACTION_TIMEOUT,
        },
      );

      return receipt;
    } catch (error) {
      if (error instanceof Error && error.message.includes(TRANSACTION_ALREADY_EXECUTED)) {
        logger.warn("Relay message already executed. Skipping.");
        return;
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      logger.warn(`Error sending transaction: ${message}`);

      if (attempt === TRANSACTION_MAX_RETRIES - 1) {
        throw new Error("Transaction Max retries reached");
      }

      if (
        message.includes(TRANSACTION_WAIT_TIMEOUT_ERROR_MESSAGE) ||
        message.includes(TRANSACTION_REPLACEMENT_FEE_TOO_LOW) ||
        message.includes(TRANSACTION_MISSING_REVERT_DATA) ||
        message.includes(ETHERS_WAIT_TRANSACTION_TIMEOUT_MESSAGE)
      ) {
        logger.warn(`Attempt ${attempt + 1} failed. Retrying with higher gas...`);
        continue;
      }

      // if non decode event, we will skip this revert
      if (!config.MOCK_L1_SENDER_EVENT_DECODE_ENABLED) {
        return;
      }

      throw error;
    }
  }

  throw new Error("Unexpected end of transaction");
};

export const submitRelayMessagesToL2MockMessengerWithRetry = async (
  l2Client: PublicClient,
  l1SentMessageEventLog: SentMessageEventLog,
  multiplier: number,
  retryOptions: RetryOptionsEthers,
) => {
  const walletClientData = getMockWalletClient("mockMessenger", "l2");

  const contractCallParams: ContractCallParameters = {
    contractAddress: MOCK_L2_SCROLL_MESSENGER_CONTRACT_ADDRESS,
    abi: L2ScrollMessengerAbi as Abi,
    functionName: "relayMessage",
    account: walletClientData.account,
    args: [
      l1SentMessageEventLog.sender,
      l1SentMessageEventLog.target,
      l1SentMessageEventLog.value,
      l1SentMessageEventLog.messageNonce,
      l1SentMessageEventLog.message,
    ],
  };

  const [{ pendingNonce, currentNonce }, gasPriceData] = await Promise.all([
    getNonce(l2Client, walletClientData.account.address),
    getEthersScrollMaxGasMultiplier(l2Client, multiplier),
  ]);
  let { gasPrice } = gasPriceData;

  if (retryOptions.gasPrice) {
    const { newGasPrice } = calculateEthersIncreasedGasPrice(retryOptions.gasPrice, gasPrice);

    gasPrice = newGasPrice;

    logger.info(`Increased gas fees multiplier: ${multiplier} - gasPrice: ${gasPrice}`);
  }

  retryOptions.gasPrice = gasPrice;

  const contractCallOptions: ContractCallOptionsEthers = {
    nonce: currentNonce,
    gasPrice,
  };

  const provider = new ethers.JsonRpcProvider(l2Client.transport.url);
  const signer = new ethers.Wallet(config.MOCK_MESSENGER_PRIVATE_KEY, provider);
  const contract = MockL2ScrollMessenger__factory.connect(
    contractCallParams.contractAddress,
    signer,
  );
  const ethersTxOptions = getEthersTxOptions(contractCallParams, contractCallOptions ?? {});
  const callArgs = [
    contractCallParams.args[0],
    contractCallParams.args[1],
    contractCallParams.args[2],
    contractCallParams.args[3],
    contractCallParams.args[4],
    ethersTxOptions,
  ];

  if (pendingNonce > currentNonce) {
    return await replacedEthersTransaction({
      functionName: contractCallParams.functionName,
      contract,
      callArgs,
    });
  }

  const transactionResult = await executeEthersTransaction({
    functionName: contractCallParams.functionName,
    contract,
    callArgs,
  });

  return transactionResult;
};

const validateL1SentMessageEvent = (l1SentMessageEventLog: SentMessageEventLog) => {
  return (
    typeof l1SentMessageEventLog.sender === "string" &&
    typeof l1SentMessageEventLog.target === "string" &&
    typeof l1SentMessageEventLog.value === "bigint" &&
    typeof l1SentMessageEventLog.messageNonce === "bigint" &&
    typeof l1SentMessageEventLog.message === "string"
  );
};
