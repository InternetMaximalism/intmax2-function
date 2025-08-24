export interface BridgeTransactionData {
  guid: string;
  status: BridgeTransactionStatus;
  nonce: number;
  amount: string;
  verifiedAt?: FirebaseFirestore.Timestamp;
  alertSent?: boolean;
  lastAlertAt?: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface BridgeTransactionInput {
  guid: string;
  amount: string;
  recipient: string;
  transactionHash: string;
}

export interface BridgeTransactionUpdateInput {
  status: BridgeTransactionStatus;
  clearedAt?: Date;
  clearMessageTxHash?: string;
  alertSent?: boolean;
  lastAlertAt?: Date;
  manualRetryAt?: Date;
  manualRetryTxHash?: string;
  verifiedAt?: Date;
}

export interface BridgeTransactionFilter {
  statuses?: BridgeTransactionStatus[];
  alertSent?: boolean;
}

export enum BridgeTransactionStatus {
  // original
  QUEUED = "QUEUED",
  // definition
  INFLIGHT = "INFLIGHT",
  CONFIRMING = "CONFIRMING",
  VERIFIED = "VERIFIED",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  PAYLOAD_STORED = "PAYLOAD_STORED",
  BLOCKED = "BLOCKED",
  // original
  NOT_FOUND = "NOT_FOUND",
}
