import { TokenType } from "./blockchain";

export interface TokenMapData {
  tokenIndex: number;
  tokenId: number;
  tokenType: TokenType;
  contractAddress: string;
  symbol: string;
  decimals: number;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface TokenMapInput {
  tokenIndex: number;
  tokenId: bigint;
  tokenType: TokenType;
  contractAddress: string;
  symbol: string;
  decimals: number;
}

export interface TokenMapFilter {
  tokenIndexes?: string[];
}
