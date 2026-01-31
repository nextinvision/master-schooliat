import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import config from "../../config.js";

// Configure S3 client with MinIO support for local development
const s3Config = {
  region: config.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
};

// If MinIO endpoint is specified, use it (for local development)
if (config.MINIO_ENDPOINT) {
  s3Config.endpoint = config.MINIO_ENDPOINT;
  s3Config.forcePathStyle = config.MINIO_FORCE_PATH_STYLE !== "false"; // Default to true for MinIO
  s3Config.tls = false; // MinIO local doesn't use TLS
}

const s3 = new S3Client(s3Config);

export async function uploadToS3({ buffer, key, contentType }) {
  await s3.send(
    new PutObjectCommand({
      Bucket: config.AWS_S3_BUCKET,
      Key: `${config.FILE_PATH}/${key}`,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}
