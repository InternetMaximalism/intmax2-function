export enum MessageStatus {
  INFLIGHT = "INFLIGHT",
  CONFIRMING = "CONFIRMING",
  VERIFIED = "VERIFIED",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  PAYLOAD_STORED = "PAYLOAD_STORED",
  BLOCKED = "BLOCKED",
}

export const LAYER_ZERO_SCAN_API = {
  ["l1"]: "https://scan.layerzero-api.com/v1",
  ["l2"]: "https://scan-testnet.layerzero-api.com/v1",
} as const;
