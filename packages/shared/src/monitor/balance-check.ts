import type { ContractFunctionParameters, PublicClient } from "viem";
import { multicall } from "viem/actions";
import { MULTICALL_ADDRESS } from "../constants";
import { logger } from "../lib";

export const fetchEthBalances = async (
  ethereumClient: PublicClient,
  addresses: string[],
  maxRetries = 3,
  retryDelay = 1000,
) => {
  const contracts = addresses.map((address) => ({
    address: MULTICALL_ADDRESS,
    abi: [
      {
        inputs: [{ name: "addr", type: "address" }],
        name: "getEthBalance",
        outputs: [{ name: "balance", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "getEthBalance",
    args: [address],
  })) as unknown as ContractFunctionParameters[];

  let results: { status: string; result?: bigint | unknown }[] = [];
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;
    try {
      results = await multicall(ethereumClient, {
        contracts: contracts,
      });

      if (!results.some((result) => !result.status)) {
        break;
      }

      if (attempts < maxRetries) {
        logger.info(
          `Some balance checks failed, retrying in ${retryDelay}ms (attempt ${attempts}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      if (attempts < maxRetries) {
        logger.warn(`Retrying in ${retryDelay}ms (attempt ${attempts}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        throw new Error(
          `Failed to fetch ETH balances after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  const failedCount = results.filter((result) => !result.status).length;
  if (failedCount > 0) {
    logger.warn(
      `${failedCount}/${results.length} balance checks failed after ${maxRetries} attempts. Using available results.`,
    );
  }

  const balanceMap = new Map<string, bigint | null>();
  results.map((result, index) => {
    const address = addresses[index];
    const balance = result.status ? (result.result as bigint) : null;
    balanceMap.set(address, balance);
  });
  return balanceMap;
};
