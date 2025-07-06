import {
  BLOCK_RANGE_MINIMUM,
  type ContractCallOptionsEthers,
  type ContractCallParameters,
  createNetworkClient,
  ETHERS_CONFIRMATIONS,
  ethersWaitForTransactionConfirmation,
  executeEthersTransaction,
  fetchEvents,
  getEthersTxOptions,
  getNonce,
  getWalletClient,
  IL1ScrollMessenger__factory,
  L1ScrollMessengerAbi,
  l1SentMessageEvent,
  type SentMessageEvent,
  TRANSACTION_WAIT_TRANSACTION_TIMEOUT,
  validateBlockRange,
} from "@intmax2-function/shared";
import { ethers, parseEther } from "ethers";
import { type Abi, type PublicClient, toHex } from "viem";

const RELAY_CONFIG = {
  startBlockNumber: 0n,
  endBlockNumber: 0n,
  numDepositsToRelay: 0,
  targetTransactionHash: "0x0",
  liquidityContractAddress: "0x",
  l1ScrollMessengerContractAddress: "0x" as `0x${string}`,
};

const GAS_CONFIG = {
  baseGas: 220000,
  perDepositGas: 20000,
  bufferGas: 100000,
} as const;

const FIXED_DEPOSIT_VALUE = "0.1";

const fetchSentMessages = async (ethereumClient: PublicClient) => {
  const l1SentMessageEvents = await fetchEvents<SentMessageEvent>(ethereumClient, {
    startBlockNumber: RELAY_CONFIG.startBlockNumber,
    endBlockNumber: RELAY_CONFIG.endBlockNumber,
    blockRange: BLOCK_RANGE_MINIMUM,
    contractAddress: RELAY_CONFIG.l1ScrollMessengerContractAddress,
    eventInterface: l1SentMessageEvent,
    args: {
      sender: RELAY_CONFIG.liquidityContractAddress,
    },
  });

  return l1SentMessageEvents;
};

const submitTx = async (
  ethereumClient: PublicClient,
  sentMessageEvent: SentMessageEvent,
  newGasLimit: number,
) => {
  const walletClientData = getWalletClient("depositAnalyzer", "ethereum");
  const refundAddress = walletClientData.account.address;

  const contractCallParams: ContractCallParameters = {
    contractAddress: RELAY_CONFIG.l1ScrollMessengerContractAddress,
    abi: L1ScrollMessengerAbi as Abi,
    functionName: "replayMessage",
    account: walletClientData.account,
    args: [
      sentMessageEvent.args.sender,
      sentMessageEvent.args.target,
      sentMessageEvent.args.value,
      sentMessageEvent.args.messageNonce,
      sentMessageEvent.args.message,
      BigInt(newGasLimit),
      refundAddress,
    ],
  };

  const { currentNonce } = await getNonce(ethereumClient, walletClientData.account.address);

  const provider = new ethers.JsonRpcProvider(ethereumClient.transport.url);
  const signer = new ethers.Wallet(
    toHex(walletClientData.account.getHdKey().privateKey!),
    provider,
  );

  const contractCallOptions: ContractCallOptionsEthers = {
    nonce: currentNonce,
    value: parseEther(FIXED_DEPOSIT_VALUE),
  };

  const contract = IL1ScrollMessenger__factory.connect(contractCallParams.contractAddress, signer);
  const ethersTxOptions = getEthersTxOptions(contractCallParams, contractCallOptions ?? {});
  const callArgs = [
    contractCallParams.args[0],
    contractCallParams.args[1],
    contractCallParams.args[2],
    contractCallParams.args[3],
    contractCallParams.args[4],
    contractCallParams.args[5],
    contractCallParams.args[6],
    ethersTxOptions,
  ];

  console.log("callArgs", callArgs);

  const { transactionHash } = await executeEthersTransaction({
    functionName: contractCallParams.functionName,
    contract,
    callArgs,
  });

  const receipt = await ethersWaitForTransactionConfirmation(
    ethereumClient,
    transactionHash,
    "replayMessage",
    {
      confirms: ETHERS_CONFIRMATIONS,
      timeout: TRANSACTION_WAIT_TRANSACTION_TIMEOUT,
    },
  );
  console.log("Transaction Receipt:", receipt);
};

const calculateAnalyzeAndRelayGasLimit = (numDepositsToRelay: number) => {
  const { baseGas, perDepositGas, bufferGas } = GAS_CONFIG;

  return BigInt(baseGas + perDepositGas * numDepositsToRelay + bufferGas);
};

const main = async () => {
  console.log("debug: RELAY_CONFIG", RELAY_CONFIG);

  const ethereumClient = createNetworkClient("ethereum");
  const isValid = validateBlockRange(
    "fetchSentMessages",
    RELAY_CONFIG.startBlockNumber,
    RELAY_CONFIG.endBlockNumber,
  );
  if (!isValid) {
    console.log("Invalid block range for fetching sent messages.");
    return;
  }

  const events = await fetchSentMessages(ethereumClient);
  console.log("Fetched Sent Messages:", events);

  const targetEvent = events.find(
    (event) => event.transactionHash === RELAY_CONFIG.targetTransactionHash,
  );
  if (!targetEvent) {
    console.error("Target transaction not found in the fetched events.");
    return;
  }

  const newGasLimit = calculateAnalyzeAndRelayGasLimit(RELAY_CONFIG.numDepositsToRelay);
  console.log("New Gas Limit:", newGasLimit.toString());

  await submitTx(ethereumClient, targetEvent, Number(newGasLimit));
};
main().catch((error) => {
  console.error("Error fetching sent messages:", error);
});
