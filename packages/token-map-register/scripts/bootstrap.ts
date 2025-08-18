import { logger, TokenMap, type TokenMapInput, TokenType } from "@intmax2-function/shared";

const data: TokenMapInput[] = [
  {
    tokenIndex: 0,
    tokenId: 0n,
    tokenType: TokenType.NATIVE,
    contractAddress: "0x0000000000000000000000000000000000000000",
    symbol: "ETH",
    decimals: 18,
  },
];

const bootstrap = async () => {
  const tokenMap = new TokenMap();
  await tokenMap.saveTokenMapsBatch(data);
  logger.info(`Token maps saved: ${JSON.stringify(data)}`);
};
bootstrap();
