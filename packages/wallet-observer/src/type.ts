import { getMockWalletClient, getWalletClient } from "@intmax2-function/shared";
import type { PublicClient } from "viem";

export const walletTypes: WalletType[] = [
  {
    name: "builder",
    types: ["l2"],
    min: false,
  },
  {
    name: "depositAnalyzer",
    types: ["l1"],
    min: false,
  },
  {
    name: "withdrawal",
    types: ["l2"],
    min: false,
  },
  {
    name: "blockBuilderReward",
    types: ["l2"],
    min: true,
  },
  {
    name: "tokenManager",
    types: ["l1"],
    min: true,
  },
];

export const mockWalletTypes = [
  {
    name: "mockMessenger" as const,
    types: ["l1", "l2"] as const,
    min: false,
  },
];

export type WalletType = {
  name: "builder" | "depositAnalyzer" | "withdrawal" | "blockBuilderReward" | "tokenManager";
  types: ("l1" | "l2")[];
  min: boolean;
};

export type WalletClient = {
  publicClient: PublicClient;
  type: string;
  walletClientData: ReturnType<typeof getWalletClient> | ReturnType<typeof getMockWalletClient>;
  min: boolean;
};
