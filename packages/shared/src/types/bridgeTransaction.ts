export interface BridgeTransactionData {
  guid: string;
  status: BridgeTransactionStatus;
  nonce: number;
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
  alertSent?: boolean;
  lastAlertAt?: FirebaseFirestore.Timestamp;
}

export interface BridgeTransactionFilter {
  statuses?: BridgeTransactionStatus[];
  alertSent?: boolean;
}

export enum BridgeTransactionStatus {
  QUEUED = "QUEUED",
  INFLIGHT = "INFLIGHT",
  CONFIRMING = "CONFIRMING",
  VERIFIED = "VERIFIED",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  PAYLOAD_STORED = "PAYLOAD_STORED",
  BLOCKED = "BLOCKED",
}
