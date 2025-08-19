import { bool, cleanEnv, json, num, str, url } from "envalid";
import { version } from "../../../../package.json";

export const config = cleanEnv(process.env, {
  // app
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "development",
  }),
  PORT: num({ default: 3000 }),
  LOG_LEVEL: str({
    choices: ["fatal", "error", "warn", "info", "debug", "trace"],
    default: "info",
  }),
  APP_TARGET: str({ default: "dev" }),
  SERVICE_VERSION: str({ default: version }),
  // auth
  ALLOWED_ORIGINS: str({ default: "http://localhost:3000,http://localhost:5173" }),
  AUTH_IP_ALLOW_LIST: str({ devDefault: "127.0.0.1,::1" }),
  RATE_LIMIT_WINDOW_MS: num({
    default: 10 * 60 * 1000, // 10 minutes
  }),
  RATE_LIMIT: num({
    default: 1000,
  }),
  X_API_KEY: str({ default: "dummy" }),
  // gcp
  K_SERVICE: str({ default: process.env.CLOUD_RUN_JOB || "default-service" }),
  K_REVISION: str({ default: process.env.CLOUD_RUN_EXECUTION || "default-revision" }),
  GOOGLE_CLOUD_PROJECT: str({ devDefault: "local-project" }),
  GOOGLE_STORE_BUCKET: str({ devDefault: "local-bucket" }),
  // firestore
  FIRESTORE_DATABASE_ID: str({ devDefault: "(default)" }),
  // redis
  REDIS_ENABLED: bool({ default: false }),
  REDIS_URL: str({ default: "redis://localhost:6379" }),
  // block builder
  BLOCK_BUILDER_URL: url({ devDefault: "http://localhost:3001" }),
  // proxy
  BUILDER_TARGET_NETWORK: str({
    choices: ["devnet", "testnet", "mainnet"],
    default: "testnet",
    desc: "Target network environment for the builder",
  }),
  BLOCK_BUILDER_VERSION: str({ default: "0.0.0" }),
  PROXY_DOMAIN: str({ default: "localhost", desc: "" }),
  PROXY_FRP_TOKEN: str({ default: "dummy", desc: "" }),
  // network
  NETWORK_TYPE: str({
    choices: ["ethereum", "scroll"],
    default: "ethereum",
    desc: "The type of blockchain network to connect to",
  }),
  NETWORK_ENVIRONMENT: str({
    choices: ["mainnet", "sepolia"],
    default: "sepolia",
    desc: "The environment of the blockchain network to connect to",
  }),
  // blockchain
  ALCHEMY_API_KEY: str({ devDefault: "dummy" }),
  TRANSACTION_WAIT_TRANSACTION_TIMEOUT: num({ default: 30_000 }),
  TRANSACTION_INCREMENT_RATE: num({
    default: 0.3,
    desc: "Rate at which the transaction wait time increases on each retry",
  }),
  // mint
  MINT_AVAILABLE_FROM: str({
    devDefault: "2025-06-23T00:00:00Z",
    desc: "The date and time when minting becomes available",
  }),
  // predicate
  PREDICATE_API_URL: url({ devDefault: "http://localhost:3002" }),
  PREDICATE_API_KEY: str({ devDefault: "dummy", desc: "API key for the predicate service" }),
  // contract(must be lowercase for contract addresses)
  BUILDER_REGISTRY_CONTRACT_ADDRESS: str({ devDefault: "0x" }),
  BUILDER_REGISTRY_CONTRACT_DEPLOYED_BLOCK: num({ devDefault: 0 }),
  LIQUIDITY_CONTRACT_ADDRESS: str({ devDefault: "0x" }),
  LIQUIDITY_CONTRACT_DEPLOYED_BLOCK: num({ devDefault: 0 }),
  WITHDRAWAL_CONTRACT_ADDRESS: str({ devDefault: "0x" }),
  CLAIM_CONTRACT_ADDRESS: str({ devDefault: "0x" }),
  ROLLUP_CONTRACT_ADDRESS: str({ devDefault: "0x" }),
  MINTER_CONTRACT_ADDRESS: str({ devDefault: "0x" }),
  MINTER_CONTRACT_DEPLOYED_BLOCK: num({ devDefault: 0 }),
  // messenger contract
  L1_SCROLL_MESSENGER_CONTRACT_ADDRESS: str({ devDefault: "0x" }),
  MOCK_L1_SCROLL_MESSENGER_CONTRACT_ADDRESS: str({ default: "0x" }),
  MOCK_L1_SCROLL_MESSENGER_CONTRACT_DEPLOYED_BLOCK: num({ default: 0 }),
  MOCK_L2_SCROLL_MESSENGER_CONTRACT_ADDRESS: str({ default: "0x" }),
  MOCK_L2_SCROLL_MESSENGER_CONTRACT_DEPLOYED_BLOCK: num({ default: 0 }),
  MOCK_L1_SENDER_CONTRACT_ADDRESS: str({ default: "0x" }),
  MOCK_L1_SENDER_EVENT_DECODE_ENABLED: bool({ default: true }),
  // private key
  INTMAX2_OWNER_MNEMONIC: str({ devDefault: "", desc: "Owner mnemonic for Intmax2" }),
  MOCK_MESSENGER_PRIVATE_KEY: str({
    default: "0x",
    desc: "Private key for the mock messenger contract",
  }),
  // discord
  DISCORD_BOT_TOKEN: str({ default: "dummy" }),
  DISCORD_BOT_INFO_CHANNEL_ID: str({ default: "dummy" }),
  DISCORD_BOT_ERROR_CHANNEL_ID: str({ default: "dummy" }),
  // scroll
  SCROLL_GAS_MULTIPLIER: num({ default: 2 }),
  // indexer
  BLOCK_BUILDER_ALLOWLIST: json({
    default: ["0x"],
    desc: "List of allowed builder addresses. Only these addresses can participate in block building.",
  }),
  BLOCK_BUILDER_MIN_ETH_BALANCE: str({
    default: "0.01",
    desc: "Minimum ETH balance required for a builder to be eligible for participation.",
  }),
  BLOCK_BUILDER_REQUIRED_VERSION: str({
    default: "0.1.0",
    desc: "Required client version for a builder to be considered eligible.",
  }),
  BLOCK_BUILDER_INDEXER_COUNT: num({
    default: 3,
    desc: "Number of indexers used by the builder to fetch and process transactions.",
  }),
  BLOCK_BUILDER_MIN_ALLOWLIST_COUNT: num({
    default: 1,
    desc: "Minimum number of builders that must be in the allowlist for block building to proceed.",
  }),
  ALLOWLIST_BLOCK_BUILDER_POSSIBILITIES: num({
    default: 0.5,
    desc: "Probability threshold (0.0–1.0) used to allow allowlisted builders to be selected.",
  }),
  BLOCK_BUILDER_ALLOWED_TOKEN_INDICES: str({
    default: "0,1,2",
    desc: "Comma-separated indices of tokens that builders are allowed to include in blocks. Options may include 0 for ETH, 1 for ITX, 2 for WBTC and 3 for USDC.",
  }),
  BLOCK_BUILDER_MAX_FEE_AMOUNT: str({
    default: "2500000000000",
    desc: "Maximum fee (in wei) a block builder can charge for including transactions in a block.",
  }),
  BUILDER_SELECTION_MODE: str({
    default: "RANDOM",
    desc: `Strategy for selecting block builders:
- ALLOWLIST_ONLY: Use only allowlisted builders.
- ALLOWLIST_PRIORITY: Prefer allowlisted builders, fall back to others if needed.
- GUARANTEED_ALLOWLIST: Ensure at least one allowlisted builder is selected.
- RANDOM: Select randomly from all active builders, regardless of allowlist.`,
  }),
  // validity prover
  API_VALIDITY_PROVER_BASE_URL: str({
    default: "http://localhost:3003",
    desc: "Base URL for the validity prover API",
  }),
  // wallet observer
  WALLET_REQUIRED_ETH_BALANCE: str({ default: "0.5" }),
  WALLET_REQUIRED_ETH_MIN_BALANCE: str({ default: "0.1" }),
  USE_MOCK_WALLET_OBSERVER: bool({ default: false }),
});

export const isProduction = config.NODE_ENV === "production";
