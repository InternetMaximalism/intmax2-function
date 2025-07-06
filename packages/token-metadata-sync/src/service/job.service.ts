import { logger, sleep, type Token } from "@intmax2-function/shared";
import { CoinGeckoClient } from "coingecko-api-v3";
import {
  COIN_GECKO_API_TIMEOUT,
  COIN_MARKET_SLEEP_TIME,
  MARKET_PRICE_PER_PAGE,
} from "../constants";
import type { TokenData } from "../types";
import { checkDefaultImage } from "./image.service";
import { processMarketBatch } from "./market.service";
import {
  fetchCoinGeckoList,
  getInitialTokenList,
  mergeTokenLists,
  uploadResults,
} from "./token.service";

export const performJob = async () => {
  const client = new CoinGeckoClient({
    timeout: COIN_GECKO_API_TIMEOUT,
    autoRetry: true,
  });
  const { tokenList, isUploadImage } = await getInitialTokenList();
  await checkDefaultImage();

  const coinGeckoList = await fetchCoinGeckoList(client);
  const mergedTokenList = mergeTokenLists(tokenList, coinGeckoList);

  const batches = [];
  for (let i = 0; i < mergedTokenList.length; i += MARKET_PRICE_PER_PAGE) {
    batches.push(mergedTokenList.slice(i, i + MARKET_PRICE_PER_PAGE));
  }

  const tokens: Token[] = [];
  for (let i = 0; i < batches.length; i++) {
    logger.info(`Processing batch ${i + 1} of ${batches.length}`);

    const batchResults = await processMarketBatch(client, batches[i] as TokenData[], isUploadImage);
    tokens.push(...batchResults);

    await sleep(COIN_MARKET_SLEEP_TIME);
  }

  await uploadResults(tokens);
};
