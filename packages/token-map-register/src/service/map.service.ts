import { TokenMap, TokenMapData, TokenType } from "@intmax2-function/shared";
import { erc20Abi, type PublicClient } from "viem";
import { MULTICALL_SIZE } from "../constants";
import type { TokenInfo } from "../types";

type MulticallResult = {
  status: "success" | "failure";
  result?: string | number;
  error?: Error;
};

export const saveTokenIndexMaps = async (
  ethereumClient: PublicClient,
  tokenInfoMap: Map<number, TokenInfo>,
) => {
  const erc20TokenMap = filterERC20Tokens(tokenInfoMap);
  if (erc20TokenMap.size === 0) {
    return [];
  }

  const newERC20TokenMap = await filterNewERC20Tokens(erc20TokenMap);
  if (newERC20TokenMap.size === 0) {
    return [];
  }

  const tokenValues = Array.from(newERC20TokenMap.values());
  const metadata = await fetchTokenMetadata(ethereumClient, tokenValues);
  const enrichedTokens = enrichTokensWithMetadata(newERC20TokenMap, metadata);
  await saveTokenMaps(enrichedTokens);

  return enrichedTokens;
};

const filterERC20Tokens = (tokenInfoMap: Map<number, TokenInfo>) => {
  const erc20TokenMap = new Map<number, TokenInfo>();

  tokenInfoMap.forEach((tokenInfo, tokenIndex) => {
    if (tokenInfo.tokenType === TokenType.ERC20) {
      erc20TokenMap.set(tokenIndex, tokenInfo);
    }
  });

  return erc20TokenMap;
};

const filterNewERC20Tokens = async (erc20TokenMap: Map<number, TokenInfo>) => {
  const tokenIndexes = Array.from(erc20TokenMap.keys()).map(String);
  const existingMaps = await TokenMap.getInstance().fetchTokenMaps({
    tokenIndexes,
  });
  const existingIndexSet = new Set(existingMaps.map((map) => String(map.tokenIndex)));

  return new Map(
    Array.from(erc20TokenMap.entries()).filter(([index]) => !existingIndexSet.has(String(index))),
  );
};

const fetchTokenMetadata = async (ethereumClient: PublicClient, tokens: TokenInfo[]) => {
  const createConfig = (functionName: "decimals" | "symbol") => ({
    contracts: tokens.map(({ tokenAddress }) => ({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName,
      args: [],
    })),
    batchSize: MULTICALL_SIZE,
  });

  const [decimalsResults, symbolsResults] = await Promise.all([
    ethereumClient.multicall(createConfig("decimals")),
    ethereumClient.multicall(createConfig("symbol")),
  ]);

  return { decimals: decimalsResults, symbols: symbolsResults };
};

const enrichTokensWithMetadata = (
  tokenInfoMap: Map<number, TokenInfo>,
  metadata: {
    decimals: MulticallResult[];
    symbols: MulticallResult[];
  },
) => {
  const tokenEntries = Array.from(tokenInfoMap.entries());
  return tokenEntries.map(([tokenIndex, token], index) => {
    const decimalsResult = metadata.decimals[index];
    const symbolResult = metadata.symbols[index];

    if (decimalsResult.status !== "success" || symbolResult.status !== "success") {
      throw new Error(
        `Failed to fetch metadata for token ${token.tokenAddress}. ` +
          `Decimals: ${decimalsResult.error?.message}, Symbol: ${symbolResult.error?.message}`,
      );
    }

    return {
      tokenIndex,
      tokenId: token.tokenId,
      tokenType: TokenType.ERC20,
      decimals: decimalsResult.result as number,
      symbol: symbolResult.result as string,
      contractAddress: token.tokenAddress.toLowerCase(),
    };
  });
};

const saveTokenMaps = async (enrichedTokens: TokenMapData[]) => {
  const tokenMap = TokenMap.getInstance();
  await tokenMap.saveTokenMapsBatch(enrichedTokens);
};
