export interface BridgeTransactionData {
  guid: string;
  status: BridgeTransactionStatus;
  nonce: number;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface BridgeTransactionInput {
  guid: string;
}

export interface BridgeTransactionFilter {
  tokenIndexes?: string[];
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
