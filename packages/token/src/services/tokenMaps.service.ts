import {
  DEFAULT_IMAGE_PATH,
  type Token,
  TokenMap,
  type TokenMapData,
  type TokenPaginationValidationType,
  TokenType,
} from "@intmax2-function/shared";
import { DEFAULT_PAGE_SIZE } from "../constants";
import { TokenPrice } from "../lib/tokenPrice";
import { calculatePaginationIndices, getNextCursor } from "../lib/utils";

export const list = async (
  tokenIndexes: string[] = [],
  paginationOptions: TokenPaginationValidationType = {},
) => {
  const tokenMaps = await fetchTokenMaps(tokenIndexes);

  const tokenPrice = TokenPrice.getInstance();
  const priceMap = await tokenPrice.getTokenPriceMap();

  if (Object.keys(paginationOptions).length === 0) {
    return {
      items: formatTokenMaps(tokenMaps, priceMap),
      nextCursor: null,
      hasMore: false,
      total: tokenMaps.length,
    };
  }

  const perPage = paginationOptions.perPage || DEFAULT_PAGE_SIZE;
  const { startIndex, endIndex } = calculatePaginationIndices(
    tokenMaps,
    paginationOptions.cursor,
    perPage,
  );
  const items = tokenMaps.slice(startIndex, endIndex);
  const nextCursor = getNextCursor(items, tokenMaps.length, startIndex, perPage);
  const hasMore = endIndex < tokenMaps.length;

  return {
    items: formatTokenMaps(items, priceMap),
    nextCursor,
    hasMore,
    total: tokenMaps.length,
  };
};

const fetchTokenMaps = async (tokenIndexes: string[]) => {
  const tokenMap = TokenMap.getInstance();
  const tokenMaps = tokenIndexes.length
    ? await tokenMap.fetchTokenMaps({ tokenIndexes })
    : await tokenMap.fetchAllTokenMaps();

  return tokenMaps;
};

const formatTokenMaps = (tokenMaps: TokenMapData[], priceMap: Map<string, Token>) => {
  return tokenMaps.map(({ createdAt, tokenId, ...map }) => {
    const priceData = priceMap.get(map.contractAddress);
    return {
      ...map,
      ...(map.tokenType === TokenType.ERC721 || map.tokenType === TokenType.ERC1155
        ? { tokenId }
        : {}),
      price: priceData?.price ?? 0,
      image: priceData?.image ?? DEFAULT_IMAGE_PATH,
    };
  });
};
