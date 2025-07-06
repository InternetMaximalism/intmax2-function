import { fetchTokenList, logger, sleep, type Token } from "@intmax2-function/shared";

export class TokenPrice {
  private static instance: TokenPrice | null = null;
  private interval: NodeJS.Timeout | null = null;
  private readonly FETCH_INTERVAL = 1000 * 60 * 5; // 5 minutes
  private tokenPriceList: Token[] = [];
  private initialized: boolean = false;

  public static getInstance() {
    if (!TokenPrice.instance) {
      TokenPrice.instance = new TokenPrice();
    }
    return TokenPrice.instance;
  }

  async initialize() {
    try {
      await this.fetchAndCacheTokenList();
    } catch (error) {
      logger.error(`Error fetching token list: ${(error as Error).message}`);
    }

    this.initialized = true;
    this.startScheduler();
  }

  private async fetchAndCacheTokenList() {
    this.tokenPriceList = await fetchTokenList();
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

  cleanup() {
    this.stopScheduler();
    this.tokenPriceList = [];
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
