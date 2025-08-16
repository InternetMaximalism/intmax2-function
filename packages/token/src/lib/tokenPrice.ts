import { fetchTokenList, logger, sleep, type Token } from "@intmax2-function/shared";

export class TokenPrice {
  private static instance: TokenPrice | null = null;
  private interval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private readonly FETCH_INTERVAL = 1000 * 60 * 5; // 5 minutes
  private readonly RETRY_INTERVAL = 1000 * 5; // 5 seconds
  private tokenPriceList: Token[] = [];
  private tokenPriceMap: Map<string, Token> = new Map();
  private initialized: boolean = false;

  public static getInstance() {
    if (!TokenPrice.instance) {
      TokenPrice.instance = new TokenPrice();
    }
    return TokenPrice.instance;
  }

  async initialize() {
    await this.fetchAndCacheTokenList();

    this.initialized = true;
    this.startScheduler();
  }

  private async fetchAndCacheTokenList() {
    try {
      const tokenList = await fetchTokenList();

      if (!tokenList || tokenList.length === 0) {
        logger.warn(
          `Fetched token list is empty, will retry in ${this.RETRY_INTERVAL / 1000} seconds`,
        );
        this.scheduleRetry();
        return;
      }

      this.tokenPriceList = tokenList;
      this.tokenPriceMap = new Map(tokenList.map((token) => [token.id, token]));
      logger.info(`Successfully fetched ${tokenList.length} tokens`);

      this.clearRetryTimeout();
    } catch (error) {
      logger.error(
        `Error fetching token list: ${(error as Error).message}, will retry in ${this.RETRY_INTERVAL / 1000} seconds`,
      );
      this.scheduleRetry();
    }
  }

  private scheduleRetry() {
    this.clearRetryTimeout();

    this.retryTimeout = setTimeout(async () => {
      logger.info("Retrying to fetch token list...");
      await this.fetchAndCacheTokenList();
    }, this.RETRY_INTERVAL);
  }

  private clearRetryTimeout() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  async getTokenPriceList() {
    while (!this.initialized) {
      logger.info("TokenPrice not initialized, waiting...");
      await sleep(100);
    }

    if (!this.tokenPriceList.length) {
      logger.info("Token price list is empty, fetching data...");
      await this.fetchAndCacheTokenList();
    }

    return this.tokenPriceList;
  }

  async getTokenPriceMap() {
    while (!this.initialized) {
      logger.info("TokenPrice not initialized, waiting...");
      await sleep(100);
    }
    if (!this.tokenPriceMap.size) {
      logger.info("Token price map is empty, fetching data...");
      await this.fetchAndCacheTokenList();
    }
    return this.tokenPriceMap;
  }

  async getTokenByAddress(contractAddress: string) {
    const tokenMap = await this.getTokenPriceMap();
    return tokenMap.get(contractAddress);
  }

  cleanup() {
    this.stopScheduler();
    this.tokenPriceList = [];
    this.tokenPriceMap.clear();
  }

  private startScheduler() {
    if (this.interval) {
      return;
    }

    this.interval = setInterval(async () => {
      await this.fetchAndCacheTokenList();
    }, this.FETCH_INTERVAL);
  }

  private stopScheduler() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
