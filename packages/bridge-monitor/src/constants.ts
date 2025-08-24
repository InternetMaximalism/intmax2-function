export const LAYER_ZERO_SCAN_API = {
  ["mainnet"]: "https://scan.layerzero-api.com/v1",
  ["testnet"]: "https://scan-testnet.layerzero-api.com/v1",
} as const;

export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 10000;
