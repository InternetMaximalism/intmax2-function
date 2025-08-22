import {
  config,
  createNetworkClient,
  Discord,
  getMockWalletClient,
  getWalletClient,
} from "@intmax2-function/shared";
import { mockWalletTypes, type WalletClient, walletTypes } from "../type";
import { getBalance } from "./observer.service";

export const performJob = async () => {
  const walletClients: WalletClient[] = walletTypes
    .map((type) => {
      return type.types.map((networkType) => ({
        type: type.name,
        publicClient: createNetworkClient(networkType),
        walletClientData: getWalletClient(type.name, networkType),
        min: type.min,
      }));
    })
    .flat();

  const mockWalletClients = config.USE_MOCK_WALLET_OBSERVER
    ? mockWalletTypes
        .map((type) => {
          return type.types.map((networkType) => ({
            type: type.name,
            publicClient: createNetworkClient(networkType),
            walletClientData: getMockWalletClient(type.name, networkType),
            min: type.min,
          }));
        })
        .flat()
    : [];

  const messages = await Promise.all([...walletClients, ...mockWalletClients].map(getBalance));

  if (messages.some((message) => message.includes("No"))) {
    const discord = Discord.getInstance();
    await discord.sendMessageWitForReady("INFO", messages.join("").replaceAll(",", ""));
  }
};
