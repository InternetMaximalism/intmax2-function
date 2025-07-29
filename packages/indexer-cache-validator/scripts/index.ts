import {
  BlockBuilderRegistryAbi,
  BUILDER_REGISTRY_CONTRACT_ADDRESS,
  config,
  createNetworkClient,
  getEthersMaxGasMultiplier,
  getNonce,
  networkConfig,
} from "@intmax2-function/shared";
import { createWalletClient as createWalletViemClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const PRIVATE_KEY = `0x`;
const BLOCK_BUILDER_URL = "https://xxx.com";

const createWalletClient = (network: "mainnet" | "scroll") => {
  const account = privateKeyToAccount(PRIVATE_KEY);
  const { chain, rpcUrl } = networkConfig[network][config.NETWORK_ENVIRONMENT];

  const client = createWalletViemClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  return {
    account,
    walletClient: client,
  };
};

const emitHeartbeat = async () => {
  const ethereumClient = createNetworkClient("scroll");
  const walletClient = createWalletClient("scroll");

  const [{ currentNonce }, _] = await Promise.all([
    getNonce(ethereumClient, walletClient.account.address),
    getEthersMaxGasMultiplier(ethereumClient, 3),
  ]);

  console.log(
    `Balance: ${await ethereumClient.getBalance({ address: walletClient.account.address })}`,
  );

  const { request } = await ethereumClient.simulateContract({
    address: BUILDER_REGISTRY_CONTRACT_ADDRESS,
    abi: BlockBuilderRegistryAbi,
    functionName: "emitHeartbeat",
    account: walletClient.account,
    args: [BLOCK_BUILDER_URL],
    nonce: currentNonce,
  });
  const transactionHash = await walletClient.walletClient.writeContract(request);
  console.log(`Transaction hash: ${transactionHash}`);
};

const main = async () => {
  await emitHeartbeat();
};
main();
