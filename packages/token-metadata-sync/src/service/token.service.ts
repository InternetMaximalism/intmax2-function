import {
  config,
  createNetworkClient,
  FILE_PATHS,
  fetchTokenList,
  logger,
  type Token,
  uploadData,
} from "@intmax2-function/shared";
import { CoinGeckoClient, CoinListResponseItem } from "coingecko-api-v3";
import { erc20Abi } from "viem";
import { DEFAULT_DECIMALS, ETHEREUM_TOKEN, MULTICALL_SIZE } from "../constants";
import type { TokenData } from "../types";

export const getInitialTokenList = async (): Promise<{
  tokenList: Token[];
  isUploadImage: boolean;
}> => {
  try {
    const tokenList = await fetchTokenList();
    return {
      tokenList,
      isUploadImage: tokenList.length === 0,
    };
  } catch (error) {
    logger.error(
      `Error fetching token list: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return {
      tokenList: [],
      isUploadImage: true,
    };
  }
};

export const fetchCoinGeckoList = async (client: CoinGeckoClient) => {
  const list = await client.coinList({
    include_platform: true,
  });
  const filterTokenList = list.filter((coin) => coin.platforms?.ethereum);
  return [...filterTokenList, ETHEREUM_TOKEN];
};

export const mergeTokenLists = (tokenList: Token[], coinGeckoList: CoinListResponseItem[]) => {
  return coinGeckoList.map(({ id, symbol, name, platforms }) => {
    const tokenData = tokenList.find((t) => t.id === id);
    return {
      ...tokenData,
      id,
      symbol,
      name,
      platforms,
    };
  });
};

export const fetchContractDecimals = async (tokenBatches: TokenData[]) => {
  const ethereumClient = createNetworkClient("ethereum");

  const results: {
    id: string;
    symbol: string;
    contractAddress?: string;
    decimals: number;
  }[] = [];

  const ethereumContractsToCall = tokenBatches
    .filter((token) => token.id !== "ethereum" && token.platforms.ethereum)
    .map((batch) => ({
      address: batch.platforms.ethereum as `0x${string}`,
      abi: erc20Abi,
      functionName: "decimals",
      args: [],
    }));

  const [ethereumRes] = await Promise.all([
    ethereumClient.multicall({
      contracts: ethereumContractsToCall,
      batchSize: MULTICALL_SIZE,
    }),
  ]);

  let ethereumResIndex = 0;

  tokenBatches.forEach((token) => {
    let decimals = DEFAULT_DECIMALS;

    if (token.id === "ethereum") {
      results.push(ETHEREUM_TOKEN);
      return;
    }

    if (token.platforms.ethereum) {
      const { result, status } = ethereumRes[ethereumResIndex];
      if (status === "success") {
        decimals = Number(String(result).replace(/n/g, ""));
      } else {
        logger.warn(`Token ${token.id} has no Ethereum contract address`);
      }
      ethereumResIndex++;
    }

    results.push({
      id: token.id,
      symbol: token.symbol,
      contractAddress: token.platforms.ethereum,
      decimals,
    });
  });

  return results;
};

export const uploadResults = async (results: Token[]): Promise<void> => {
  if (results.length > 0) {
    const resultBuffer = Buffer.from(JSON.stringify(results));
    await uploadData({
      bucketName: config.GOOGLE_STORE_BUCKET,
      fileName: FILE_PATHS.tokenPrices,
      buffer: resultBuffer,
      makePublic: false,
    });
  }

  logger.info(`Uploaded token prices length: ${results.length}`);
};
