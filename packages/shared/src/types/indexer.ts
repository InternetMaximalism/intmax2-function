import type { Address } from "./utils";

export type IndexerInfo = {
  address: Address;
  url: string;
  active?: boolean;
  lastSyncedTime: Date;
  metadata: Record<string, unknown>;
};

export type IndexerInfoData = Omit<IndexerInfo, "address">;

export interface IndexerFilter {
  addresses?: Address[];
  lastSyncedTime?: Date;
}

export interface TokenFee {
  token_index: number;
  amount: string;
}

export interface BuilderFeeInfoResponse {
  version: string;
  blockBuilderAddress: string;
  beneficiary: string;
  registrationFee: TokenFee[];
  nonRegistrationFee: TokenFee[];
  registrationCollateralFee: TokenFee[] | null;
  nonRegistrationCollateralFee: TokenFee[] | null;
}

export interface IndexerStatus {
  active: boolean;
  address: string;
}
