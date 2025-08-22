import {
  type ContractCallOptionsEthers,
  type ContractCallParameters,
  calculateGasMultiplier,
  calculateIncreasedGasFees,
  ETHERS_CONFIRMATIONS,
  ETHERS_WAIT_TRANSACTION_TIMEOUT_MESSAGE,
  ethersWaitForTransactionConfirmation,
  executeEthersTransaction,
  getEthersMaxGasMultiplier,
  getEthersTxOptions,
  getNonce,
  getWalletClient,
  LIQUIDITY_CONTRACT_ADDRESS,
  Liquidity__factory,
  LiquidityAbi,
  logger,
  type RetryOptions,
  replacedEthersTransaction,
  TRANSACTION_INCREMENT_RATE,
  TRANSACTION_MAX_RETRIES,
  TRANSACTION_MISSING_REVERT_DATA,
  TRANSACTION_REPLACEMENT_FEE_TOO_LOW,
  TRANSACTION_WAIT_TIMEOUT_ERROR_MESSAGE,
  TRANSACTION_WAIT_TRANSACTION_TIMEOUT,
} from "@intmax2-function/shared";
import { ethers } from "ethers";
import { type Abi, type PublicClient, parseEther, toHex } from "viem";
import { FIXED_DEPOSIT_VALUE } from "../constants";
import type { DepositAnalysisSummary } from "../types";

export const submitRelayDeposits = async (
  l1Client: PublicClient,
  depositSummary: DepositAnalysisSummary,
) => {
  const retryOptions: RetryOptions = {
    maxFeePerGas: null,
    maxPriorityFeePerGas: null,
  };

  for (let attempt = 0; attempt < TRANSACTION_MAX_RETRIES; attempt++) {
    try {
      const multiplier = calculateGasMultiplier(attempt, TRANSACTION_INCREMENT_RATE);

      const { transactionHash } = await submitRelayDepositsWithRetry(
        l1Client,
        depositSummary,
        multiplier,
        retryOptions,
      );

      const receipt = await ethersWaitForTransactionConfirmation(
        l1Client,
        transactionHash,
        "relayDeposits",
        {
          confirms: ETHERS_CONFIRMATIONS,
          timeout: TRANSACTION_WAIT_TRANSACTION_TIMEOUT,
        },
      );

      return receipt;
    } catch (error) {
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

      throw error;
    }
  }

  throw new Error("Unexpected end of transaction");
};

export const submitRelayDepositsWithRetry = async (
  l1Client: PublicClient,
  depositSummary: DepositAnalysisSummary,
  multiplier: number,
  retryOptions: RetryOptions,
) => {
  const walletClientData = getWalletClient("depositAnalyzer", "l1");

  const contractCallParams: ContractCallParameters = {
    contractAddress: LIQUIDITY_CONTRACT_ADDRESS,
    abi: LiquidityAbi as Abi,
    functionName: "relayDeposits",
    account: walletClientData.account,
    args: [depositSummary.upToDepositId, depositSummary.gasLimit],
  };

  const [{ pendingNonce, currentNonce }, gasPriceData] = await Promise.all([
    getNonce(l1Client, walletClientData.account.address),
    getEthersMaxGasMultiplier(l1Client, multiplier),
  ]);
  let { maxFeePerGas, maxPriorityFeePerGas } = gasPriceData;

  if (retryOptions.maxFeePerGas && retryOptions.maxPriorityFeePerGas) {
    const { newMaxFeePerGas, newMaxPriorityFeePerGas } = calculateIncreasedGasFees(
      retryOptions.maxFeePerGas,
      retryOptions.maxPriorityFeePerGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
    );

    maxFeePerGas = newMaxFeePerGas;
    maxPriorityFeePerGas = newMaxPriorityFeePerGas;

    logger.info(
      `Increased gas fees multiplier: ${multiplier} - MaxFee: ${maxFeePerGas}, MaxPriorityFee: ${maxPriorityFeePerGas}`,
    );
  }

  retryOptions.maxFeePerGas = maxFeePerGas;
  retryOptions.maxPriorityFeePerGas = maxPriorityFeePerGas;

  const contractCallOptions: ContractCallOptionsEthers = {
    nonce: currentNonce,
    value: parseEther(FIXED_DEPOSIT_VALUE),
    maxFeePerGas,
    maxPriorityFeePerGas,
  };

  const provider = new ethers.JsonRpcProvider(l1Client.transport.url);
  const signer = new ethers.Wallet(
    toHex(walletClientData.account.getHdKey().privateKey!),
    provider,
  );
  const contract = Liquidity__factory.connect(contractCallParams.contractAddress, signer);
  const ethersTxOptions = getEthersTxOptions(contractCallParams, contractCallOptions ?? {});
  const callArgs = [contractCallParams.args[0], contractCallParams.args[1], ethersTxOptions];

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
