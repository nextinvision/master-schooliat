import { uploadToLocal } from "./local.js";
import { uploadToS3 } from "./s3.js";

export async function uploadFile({ buffer, key, contentType }) {
  if (process.env.FILE_STORAGE === "aws-s3") {
    return uploadToS3({ buffer, key, contentType });
  }
  return uploadToLocal({ buffer, key });
}
