import { config, logger, sleep } from "@intmax2-function/shared";
import axios from "axios";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SLEEP_TIME,
  SCROLL_API_BRIDGE_URL_MAPS,
  SCROLL_API_IO_ERROR_MESSAGE,
  SUCCESS_CODE,
} from "../constants";
import type { MessengerType, ScrollMessengerResponse, ScrollMessengerResult } from "../types";

export const fetchAllClaimableScrollMessengerResults = async (messengerType: MessengerType) => {
  const allResults: ScrollMessengerResult[] = [];
  let currentPage = DEFAULT_PAGE;
  let hasMore = true;

  const contractAddress =
    messengerType === "withdrawal"
      ? config.WITHDRAWAL_CONTRACT_ADDRESS
      : config.CLAIM_CONTRACT_ADDRESS;

  while (hasMore) {
    const res = await axios.get<ScrollMessengerResponse>(
      `${SCROLL_API_BRIDGE_URL_MAPS[config.L1_CHAIN]}?page_size=${DEFAULT_PAGE_SIZE}&page=${currentPage}&address=${contractAddress}`,
    );
    if (res.data.errcode !== SUCCESS_CODE) {
      const message = res.data.errmsg;
      if (message.includes(SCROLL_API_IO_ERROR_MESSAGE)) {
        logger.warn(`Failed to fetch io/timeout error: ${message}. Retry...`);
        await sleep(DEFAULT_SLEEP_TIME);
        continue;
      }

      throw new Error(`Failed to fetch claimable requests: ${res.data.errmsg}`);
    }

    const { results, total } = res.data.data;

    if (total === 0) {
      return [];
    }

    allResults.push(...results);

    const totalPage = Math.ceil(total / DEFAULT_PAGE_SIZE);
    hasMore = currentPage < totalPage;
    currentPage++;

    await sleep(DEFAULT_SLEEP_TIME);
  }

  const messengerResults = allResults.filter(
    (result) => result.claim_info && result.claim_info.claimable,
  );

  return messengerResults;
};
