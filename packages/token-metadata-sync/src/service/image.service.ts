import {
  config,
  DEFAULT_IMAGE_NAME,
  DEFAULT_IMAGE_PATH,
  downloadData,
  FILE_PATHS,
  GCP_STORAGE_URL,
  logger,
  uploadData,
} from "@intmax2-function/shared";
import axios from "axios";
import type { MarketDataWithDecimals } from "../types";

const uploadTokenImage = async (tokenId: string, imageUrl: string): Promise<string> => {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 5000,
    });

    const buffer = Buffer.from(response.data);
    const imagePath = `${FILE_PATHS.images}/${tokenId}.png`;

    await uploadData({
      bucketName: config.GOOGLE_STORE_BUCKET,
      fileName: imagePath,
      buffer,
      makePublic: true,
    });

    logger.info(`Successfully uploaded token logo for ${tokenId}`);
    return constructImageUrl(imagePath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.warn(`Failed to upload token logo for ${tokenId}: ${errorMessage}`);
    return DEFAULT_IMAGE_PATH;
  }
};

const processMarketImage = async (market: MarketDataWithDecimals) => {
  if (!market.image) {
    logger.info(`No image URL provided for token: ${market.id}`);
    return {
      ...market,
      image: DEFAULT_IMAGE_PATH,
    };
  }

  const imageUrl = await uploadTokenImage(market.id, market.image);
  return {
    ...market,
    image: imageUrl,
  };
};

export const uploadImageFromCoinGecko = async (markets: MarketDataWithDecimals[]) => {
  const processingResults = await Promise.allSettled(markets.map(processMarketImage));

  return processingResults.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    logger.error(
      `Unexpected error processing image for token ${markets[index].id}:`,
      result.reason,
    );

    return {
      ...markets[index],
      image: DEFAULT_IMAGE_PATH,
    };
  });
};

const constructImageUrl = (path: string): string => {
  return `${GCP_STORAGE_URL}/${config.GOOGLE_STORE_BUCKET}/${path}`;
};

export const checkDefaultImage = async () => {
  try {
    await downloadData(config.GOOGLE_STORE_BUCKET, `${FILE_PATHS.images}/${DEFAULT_IMAGE_NAME}`);
  } catch {
    throw new Error(`No image found for ${DEFAULT_IMAGE_NAME}`);
  }
};
