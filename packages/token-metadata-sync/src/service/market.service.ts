import { logger } from "@intmax2-function/shared";
import { CoinGeckoClient, type CoinMarket } from "coingecko-api-v3";
import { DEFAULT_DECIMALS, VS_CURRENCY } from "../constants";
import type { TokenData } from "../types";
import { uploadImageFromCoinGecko } from "./image.service";
import { fetchContractDecimals } from "./token.service";

const separateTokensByDecimals = (tokens: TokenData[]) => [
  tokens.filter((token) => !token.decimals),
  tokens.filter((token) => token.decimals),
];

const mergeMarketData = (tokens: TokenData[], markets: CoinMarket[]) => {
  return tokens.map((token) => {
    const market = markets.find((market) => market.id === token.id);
    return {
      id: token.id,
      symbol: token.symbol,
      price: market?.current_price || 0,
      contractAddress: token.contractAddress?.toLowerCase()!,
      decimals: token?.decimals || DEFAULT_DECIMALS,
      image: (token as unknown as { image: string }).image || market?.image,
    };
  });
};

export const processMarketBatch = async (
  client: CoinGeckoClient,
  batch: TokenData[],
  isUploadImage: boolean,
) => {
  const batchIds = batch.map((item) => item.id).join(",");

  try {
    const pingResponse = await client.ping();
    if (!pingResponse.gecko_says) {
      throw new Error(`CoinGecko API ping failed ${JSON.stringify(pingResponse)}`);
    }

    const markets = await client.coinMarket({
      vs_currency: VS_CURRENCY,
      ids: batchIds,
    });

    const [tokensWithoutDecimals, tokensWithDecimals] = separateTokensByDecimals(batch);
    const tokenDataWithDecimals = (await fetchContractDecimals(
      tokensWithoutDecimals,
    )) as TokenData[];
    const marketData = mergeMarketData([...tokenDataWithDecimals, ...tokensWithDecimals], markets);

    return isUploadImage ? await uploadImageFromCoinGecko(marketData) : marketData;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error processing market batch: ${message}`);
    throw new Error(`Failed to process market batch: ${message}`);
  }
};
