import { config } from "@intmax2-function/shared";
import { formatEther, parseEther } from "viem";
import { REQUIRED_ETH, REQUIRED_ETH_MIN } from "../constants";
import type { WalletClient } from "../type";

export const getBalance = async ({ type, publicClient, walletClientData, min }: WalletClient) => {
  const address = walletClientData.account.address;
  const chain = walletClientData.walletClient.chain?.name!;

  const balance = await publicClient.getBalance({
    address,
  });
  const balanceAsEther = formatEther(balance);
  const isSufficient = balance > parseEther(min ? REQUIRED_ETH_MIN : REQUIRED_ETH);

  return `
  Name: ${type}
  NetworkEnvironment: ${config.L1_CHAIN}
  Address:  ${address}
  Chain: ${chain}
  Balance:  ${balanceAsEther} ETH
  Sufficient: ${isSufficient ? "Yes" : "No"}\n`;
};
