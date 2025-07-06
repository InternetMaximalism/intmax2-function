import { config, DEFAULT_IMAGE_NAME, FILE_PATHS, uploadData } from "@intmax2-function/shared";
import fs from "fs/promises";
import path from "path";

const bootstrap = async () => {
  const buffer = await fs.readFile(path.join(__dirname, DEFAULT_IMAGE_NAME));
  const imagePath = `${FILE_PATHS.images}/${DEFAULT_IMAGE_NAME}`;
  await uploadData({
    bucketName: config.GOOGLE_STORE_BUCKET,
    fileName: imagePath,
    buffer,
    makePublic: true,
  });
};
bootstrap();
