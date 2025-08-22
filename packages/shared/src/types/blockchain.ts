export enum TokenType {
  NATIVE,
  ERC20,
  ERC721,
  ERC1155,
}

export interface BaseEvent {
  name: string;
  address: string;
  blockNumber: bigint;
  blockTimestamp: string;
  blockHash: string;
  transactionHash: string;
}

export interface DepositEvent extends BaseEvent {
  args: DepositEventLog;
}

export interface DepositEventLog {
  depositId: bigint;
  sender: string;
  recipientSaltHash: string;
  tokenIndex: number;
  amount: bigint;
  depositedAt: bigint;
}

export interface DepositsRelayedEvent extends BaseEvent {
  args: DepositsRelayedEventLog;
}

export interface DepositsRelayedEventLog {
  upToDepositId: bigint;
  gasLimit: bigint;
  message: string;
}

export interface BlockBuilderHeartbeatEvent extends BaseEvent {
  args: BlockBuilderHeartbeatEventLog;
}

export interface BlockBuilderHeartbeatEventLog {
  blockBuilder: string;
  url: string;
}

export interface SentMessageEventLog {
  sender: string;
  target: string;
  value: bigint;
  messageNonce: bigint;
  gasLimit: bigint;
  message: string;
}

export interface SentMessageEvent extends BaseEvent {
  args: SentMessageEventLog;
}

export interface WithdrawalClaimableEvent extends BaseEvent {
  args: WithdrawalClaimableEventLog;
}

export interface WithdrawalClaimableEventLog {
  withdrawalHash: string;
}

export interface BatchedCalldata {
  encodedCalldata: string;
}

export interface MintedEvent extends BaseEvent {
  args: MintedEventLog;
}

export interface MintedEventLog {
  amount: bigint;
}

export interface TransferredToLiquidityEvent extends BaseEvent {
  args: TransferredToLiquidityEventLog;
}

export interface TransferredToLiquidityEventLog {
  amount: bigint;
}

export type NetworkLayer = "l1" | "l2";
