import { createWalletClient, fallback } from "viem";
import { mnemonicToAccount, privateKeyToAccount } from "viem/accounts";
import { config } from "../config";
import type { NetworkLayer } from "./../types/blockchain";
import { getClientConfig } from "./client";

type MockWalletType = "mockMessenger";

export const mockWalletConfigs: Record<MockWalletType, `0x${string}`> = {
  mockMessenger: config.MOCK_MESSENGER_PRIVATE_KEY as `0x${string}`,
};

type WalletType =
  | "builder"
  | "depositAnalyzer"
  | "withdrawal"
  | "blockBuilderReward"
  | "tokenManager";

const walletConfigs: Record<WalletType, number> = {
  builder: 0,
  depositAnalyzer: 1,
  withdrawal: 2,
  blockBuilderReward: 3,
  tokenManager: 4,
};

export const getMockWalletClient = (
  type: MockWalletType,
  networkLayer: NetworkLayer,
): {
  account: ReturnType<typeof privateKeyToAccount>;
  walletClient: ReturnType<typeof createWalletClient>;
} => {
  const privateKey = mockWalletConfigs[type];
  const account = privateKeyToAccount(privateKey);

  const { chain, rpcUrls } = getClientConfig(networkLayer);

  const client = createWalletClient({
    account,
    chain,
    transport: fallback(rpcUrls, {
      retryCount: 3,
    }),
  });

  return {
    account,
    walletClient: client,
  };
};

export const getWalletClient = (
  type: WalletType,
  networkLayer: NetworkLayer,
): {
  account: ReturnType<typeof mnemonicToAccount>;
  walletClient: ReturnType<typeof createWalletClient>;
} => {
  const addressIndex = walletConfigs[type];
  if (addressIndex === undefined) {
    throw new Error(`Invalid wallet type: ${type}`);
  }
  const account = mnemonicToAccount(config.INTMAX2_OWNER_MNEMONIC, {
    accountIndex: 0,
    addressIndex,
  });

  const { chain, rpcUrls } = getClientConfig(networkLayer);

  const client = createWalletClient({
    account,
    chain,
    transport: fallback(rpcUrls, {
      retryCount: 3,
    }),
  });

  return {
    account,
    walletClient: client,
  };
};
