import { Storage } from "@google-cloud/storage";
import { config } from "../config";
import { logger } from "../lib";

type UploadDataParams = {
  bucketName: string;
  fileName: string;
  buffer: Buffer;
  makePublic: boolean;
};

const storage = new Storage({
  projectId: config.GOOGLE_CLOUD_PROJECT,
});

export const uploadData = ({ bucketName, fileName, buffer, makePublic }: UploadDataParams) => {
  const bucket = storage.bucket(bucketName);

  return new Promise<string>((resolve, reject) => {
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream.on("finish", async () => {
      try {
        if (makePublic) {
          const res = await bucket.file(fileName).makePublic();
          logger.info(`File ${fileName} uploaded and made public.`);
          return resolve((res[0] as File).name);
        }

        resolve(fileName);
      } catch (error) {
        logger.error(`Failed to make file ${fileName} public: ${(error as Error).stack}`);
        reject(error);
      }
    });

    blobStream.on("error", (error) => {
      logger.error(`Faild to upload file ${fileName}: ${error.stack}`);
      reject(error);
    });

    blobStream.end(buffer);
  });
};

export const downloadData = async (bucketName: string, fileName: string) => {
  const [fileContents] = await storage.bucket(bucketName).file(fileName).download();
  return fileContents.toString();
};
