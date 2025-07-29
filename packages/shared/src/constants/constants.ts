import { config } from "../config";

// app
export const BASE_PATH = "v1";
export const APP_TIMEOUT = 30000;

// api
export const API_TIMEOUT = 10000;

// logger
export const SLOW_THRESHOLD = 1000;
export const CLIENT_SERVICE = "clientServiceName";

// firestore
export const FIRESTORE_COLLECTIONS = {
  INDEXERS: "indexers",
  EVENTS: "events",
  TX_MAPS: "txMaps",
  TOKEN_MAPS: "tokenMaps",
  MINTER_EVENTS: "minterEvents",
} as const;

export const FIRESTORE_DOCUMENTS = {
  BUILDERS: "builders",
  VALIDITY_PROVERS: "validityProvers",
  WITHDRAWAL_SERVERS: "withdrawalServers",
} as const;

export const FIRESTORE_DOCUMENT_EVENTS = {
  DEPOSITED: "deposited",
  DEPOSITS_RELAYED_TOKEN_MAPS: "depositsRelayedTokenMaps",
  MOCK_MESSENGER_RELAYER: "mockMessengerRelayer",
  MOCK_L2_SENT_MESSAGE: "mockL2SentMessage",
  BLOCK_BUILDER_HEART_BEAT: "blockBuilderHeartBeat",
  MINTER: "minter",
} as const;

export const FIRESTORE_MAX_BATCH_SIZE = 500;
export const FIRESTORE_IN_MAX_BATCH_SIZE = 30;

// gcp
export const FILE_PATHS = {
  images: "images",
  tokenPrices: "tokens/tokenPrices",
};
export const DEFAULT_IMAGE_NAME = "default.png";
export const GCP_STORAGE_URL = "https://storage.googleapis.com";
export const DEFAULT_IMAGE_PATH = `${GCP_STORAGE_URL}/${config.GOOGLE_STORE_BUCKET}/${FILE_PATHS.images}/${DEFAULT_IMAGE_NAME}`;

// etherscan
export const ETHERSCAN_URLS = {
  "ethereum-mainnet": "https://api.etherscan.io/api",
  "ethereum-sepolia": "https://api-sepolia.etherscan.io/api",
  "scroll-mainnet": null,
  "scroll-sepolia": null,
};

// contract
export const BUILDER_REGISTRY_CONTRACT_ADDRESS =
  config.BUILDER_REGISTRY_CONTRACT_ADDRESS as `0x${string}`;
export const BUILDER_REGISTRY_CONTRACT_DEPLOYED_BLOCK =
  config.BUILDER_REGISTRY_CONTRACT_DEPLOYED_BLOCK;
export const LIQUIDITY_CONTRACT_ADDRESS = config.LIQUIDITY_CONTRACT_ADDRESS as `0x${string}`;
export const LIQUIDITY_CONTRACT_DEPLOYED_BLOCK = config.LIQUIDITY_CONTRACT_DEPLOYED_BLOCK;
export const L1_SCROLL_MESSENGER_CONTRACT_ADDRESS =
  config.L1_SCROLL_MESSENGER_CONTRACT_ADDRESS as `0x${string}`;
export const MINTER_CONTRACT_ADDRESS = config.MINTER_CONTRACT_ADDRESS as `0x${string}`;
export const MINTER_CONTRACT_DEPLOYED_BLOCK = config.MINTER_CONTRACT_DEPLOYED_BLOCK;

// mock
export const MOCK_L1_SCROLL_MESSENGER_CONTRACT_ADDRESS =
  config.MOCK_L1_SCROLL_MESSENGER_CONTRACT_ADDRESS as `0x${string}`;
export const MOCK_L1_SCROLL_MESSENGER_CONTRACT_DEPLOYED_BLOCK =
  config.MOCK_L1_SCROLL_MESSENGER_CONTRACT_DEPLOYED_BLOCK;
export const MOCK_L2_SCROLL_MESSENGER_CONTRACT_ADDRESS =
  config.MOCK_L2_SCROLL_MESSENGER_CONTRACT_ADDRESS as `0x${string}`;
export const MOCK_L2_SCROLL_MESSENGER_CONTRACT_DEPLOYED_BLOCK =
  config.MOCK_L2_SCROLL_MESSENGER_CONTRACT_DEPLOYED_BLOCK;

// token
export const ETH_SYMBOL = "ETH";
export const ETH_TOKEN_ID = "ethereum";

// transaction
export const TRANSACTION_MAX_RETRIES = 5;
export const TRANSACTION_WAIT_TRANSACTION_TIMEOUT = config.TRANSACTION_WAIT_TRANSACTION_TIMEOUT;
export const TRANSACTION_INCREMENT_RATE = config.TRANSACTION_INCREMENT_RATE;

// block event
export const BLOCK_RANGE_MINIMUM = 10000n;
export const BLOCK_RANGE_NORMAL = 30000n;
export const BLOCK_RANGE_MAX = 100000n;

// errors
export const TRANSACTION_WAIT_TIMEOUT_ERROR_MESSAGE =
  "Timed out while waiting for transaction with hash";
export const TRANSACTION_REPLACEMENT_FEE_TOO_LOW = "replacement fee too low";
export const TRANSACTION_MISSING_REVERT_DATA = "missing revert data"; // NOTE: because of the ethers gasPrice
export const TRANSACTION_ALREADY_EXECUTED = "Message was already successfully executed";

// ethers
export const ETHERS_WAIT_TRANSACTION_TIMEOUT_MESSAGE = "timeout";
export const ETHERS_CONFIRMATIONS = 1;

// map
export const MAP_KEY_LENGTH = 8;

// app
export const SHUTDOWN_TIMEOUT = 2000;

export const CACHE_TIMEOUTS = {
  LIST: 30, // 30 seconds
  DETAIL: 60, // 60 seconds
  BLOCK_BUILDER_INDEXER_LIST: 120, // 120 seconds
} as const;

export const CACHE_KEYS = {
  BLOCK_BUILDER_INDEXER_LIST: "block_builder_indexer_list",
};

export const CACHE_DEFAULT_STD_TTL = 300; // 5 minutes
export const CACHE_DEFAULT_CLEANUP_INTERVAL = 120; // 2 minutes

// query map
export const MIN_EXPIRES_IN = 300; // 5 minutes
export const DEFAULT_EXPIRES_IN = 86400 * 5; // 1 day * 5

// mint
export const MINT_AVAILABLE_FROM = config.MINT_AVAILABLE_FROM;
export const ITX_AMOUNT_TO_LIQUIDITY = "3910156250000000000000000";
export const MINT_INTERVAL_WEEKS = 4;
export const TRANSFER_INTERVAL_WEEKS = 1;

// redis
export const REDIS_USING_PROCESS_NAMES = ["indexer", "token", "tx-map"];
const isRedisProcessDetected = process.argv.some((commandLineArg) =>
  REDIS_USING_PROCESS_NAMES.some((processName) => commandLineArg.includes(processName)),
);

export const REDIS_ENABLED = config.REDIS_ENABLED && isRedisProcessDetected;

// indexer
export const BATCH_SIZE = 50;
export const INDEXER_BATCH_SIZE = 30;
export const INDEXER_REQUEST_TIMEOUT = 5000; // 5 seconds

// blockchain
export const MULTICALL_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
export const BLOCK_BUILDER_ALLOWLIST = config.BLOCK_BUILDER_ALLOWLIST;
