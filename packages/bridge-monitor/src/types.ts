export interface BridgeGuidTransactionResponse {
  data: BridgeGuidTransaction[];
}

export interface BridgeGuidTransaction {
  pathway: Pathway;
  source: Source;
  destination: Destination;
  verification: Verification;
  guid: string;
  config: Config;
  status: Status;
  created: string;
  updated: string;
}

interface Pathway {
  srcEid: number;
  dstEid: number;
  sender: PathwayEndpoint;
  receiver: PathwayEndpoint;
  id: string;
  nonce: number;
}

interface PathwayEndpoint {
  address: string;
  id: string;
  name: string;
  chain: string;
}

interface Source {
  status: string;
  tx: SourceTransaction;
  failedTx: string[];
}

interface SourceTransaction {
  txHash: string;
  blockHash: string;
  blockNumber: string;
  blockTimestamp: number;
  from: string;
  blockConfirmations: number;
  payload: string;
  value: string;
  readinessTimestamp: number;
  resolvedPayload: string;
  adapterParams: AdapterParams;
  options: TransactionOptions;
}

interface AdapterParams {
  version: string;
  dstGasLimit: string;
  dstNativeGasTransferAmount: string;
  dstNativeGasTransferAddress: string;
}

interface TransactionOptions {
  lzReceive: GasValue;
  nativeDrop: NativeDrop[];
  compose: Compose[];
  ordered: boolean;
}

interface GasValue {
  gas: string;
  value: string;
}

interface NativeDrop {
  amount: string;
  receiver: string;
}

interface Compose {
  index: number;
  gas: string;
  value: string;
}

interface Destination {
  status: string;
  tx: DestinationTransaction;
  payloadStoredTx: string;
  failedTx: string[];
}

interface DestinationTransaction {
  txHash: string;
  blockHash: string;
  blockNumber: number;
  blockTimestamp: number;
}

interface Verification {
  dvn: DVNVerification;
  sealer: SealerVerification;
}

interface DVNVerification {
  dvns: Record<string, any>;
  status: string;
}

interface SealerVerification {
  tx: DestinationTransaction;
  failedTx: FailedTransaction[];
  status: string;
}

interface FailedTransaction {
  txHash: string;
  txError: string;
}

interface Config {
  error: boolean;
  errorMessage: string;
  dvnConfigError: boolean;
  receiveLibrary: string;
  sendLibrary: string;
  inboundConfig: ChainConfig;
  outboundConfig: ChainConfig;
  ulnSendVersion: string;
  ulnReceiveVersion: string;
}

interface ChainConfig {
  confirmations: number;
  requiredDVNCount: number;
  optionalDVNCount: number;
  optionalDVNThreshold: number;
  requiredDVNs: string[];
  requiredDVNNames: string[];
  optionalDVNs: string[];
  optionalDVNNames: string[];
  executor: string;
}

export interface Status {
  name: string;
  message: string;
}
