import { AbiEvent, parseAbiItem } from "abitype";
import type { PublicClient } from "viem";

export const depositedEvent = parseAbiItem(
  "event Deposited(uint256 indexed depositId, address indexed sender, bytes32 indexed recipientSaltHash, uint32 tokenIndex, uint256 amount, bool isEligible, uint256 requestedAt)",
);

export const depositsRelayedEvent = parseAbiItem(
  "event DepositsRelayed(uint256 indexed upToDepositId, uint256 gasLimit, bytes message)",
);

export const withdrawalClaimableEvent = parseAbiItem(
  "event WithdrawalClaimable(bytes32 indexed withdrawalHash)",
);

export const l1SentMessageEvent = parseAbiItem(
  "event SentMessage(address indexed sender, address indexed target, uint256 value, uint256 messageNonce, uint256 gasLimit, bytes message)",
);

export const l2MockSentMessageEvent = parseAbiItem(
  "event SentMessage(address indexed sender, address indexed target, uint256 value, uint256 messageNonce, uint256 gasLimit, bytes message)",
);

export const blockBuilderHeartbeatEvent = parseAbiItem(
  "event BlockBuilderHeartbeat(address indexed blockBuilder, string url)",
);

export const mintedEvent = parseAbiItem("event Minted(uint256 amount)");

export const transferredToLiquidityEvent = parseAbiItem(
  "event TransferredToLiquidity(uint256 amount)",
);

export const bridgeRequestedEvent = parseAbiItem(
  "event BridgeRequested(address indexed recipient, uint256 amount, address indexed user, tuple(bytes32 guid, uint64 nonce, tuple(uint256 nativeFee, uint256 lzTokenFee) fee) receipt)",
);

export const getEventLogs = async (
  client: PublicClient,
  address: `0x${string}`,
  event: AbiEvent,
  fromBlock: bigint,
  toBlock: bigint,
  args?: Record<string, unknown>,
) => {
  const logs = await client.getLogs({
    address,
    event,
    args,
    fromBlock,
    toBlock,
  });
  return logs;
};
