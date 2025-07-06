import { logger, TokenMap, type TokenMapData } from "@intmax2-function/shared";

const data: TokenMapData[] = [
  {
    tokenIndex: 0,
    symbol: "ETH",
    decimals: 18,
    contractAddress: "0x0000000000000000000000000000000000000000",
  },
];

const bootstrap = async () => {
  const tokenMap = new TokenMap();
  await tokenMap.saveTokenMapsBatch(data);
  logger.info(`Token maps saved: ${JSON.stringify(data)}`);
};
bootstrap();
