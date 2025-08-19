import type { Token, TokenPaginationValidationType } from "@intmax2-function/shared";
import { DEFAULT_PAGE_SIZE } from "../constants";
import { TokenPrice } from "../lib/tokenPrice";
import { calculatePaginationIndices, getNextCursor } from "../lib/utils";

export const list = async (
  contractAddresses: string[] = [],
  paginationOptions: TokenPaginationValidationType = {},
) => {
  const tokenPrice = TokenPrice.getInstance();
  const filteredList = await getFilteredTokens(tokenPrice, contractAddresses);

  if (Object.keys(paginationOptions).length === 0) {
    return {
      items: filteredList,
      nextCursor: null,
      hasMore: false,
      total: filteredList.length,
    };
  }

  const perPage = paginationOptions.perPage || DEFAULT_PAGE_SIZE;
  const { startIndex, endIndex } = calculatePaginationIndices(
    filteredList,
    paginationOptions.cursor,
    perPage,
  );

  const items = filteredList.slice(startIndex, endIndex);
  const nextCursor = getNextCursor(items, filteredList.length, startIndex, perPage);
  const hasMore = endIndex < filteredList.length;

  return {
    items,
    nextCursor,
    hasMore,
    total: filteredList.length,
  };
};

const getFilteredTokens = async (tokenPrice: TokenPrice, contractAddresses: string[]) => {
  if (contractAddresses.length === 0) {
    return await tokenPrice.getTokenPriceList();
  }

  const tokenPriceMap = await tokenPrice.getTokenPriceMap();
  const filteredTokens: Token[] = [];

  for (const address of contractAddresses) {
    const token = tokenPriceMap.get(address);
    if (token) {
      filteredTokens.push(token);
    }
  }

  return filteredTokens;
};
