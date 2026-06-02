import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "./_core/env";

const s3 = new S3Client({
  region: ENV.s3Region,
  credentials: ENV.awsAccessKeyId
    ? { accessKeyId: ENV.awsAccessKeyId, secretAccessKey: ENV.awsSecretAccessKey }
    : undefined,
});

export async function storagePut(
  key: string,
  data: Buffer | Uint8Array,
  contentType = "application/octet-stream",
): Promise<string> {
  if (!ENV.s3Bucket) {
    throw new Error("S3_BUCKET env var is not set. Configure S3 to enable file uploads.");
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
      ACL: "public-read",
    }),
  );

  return `https://${ENV.s3Bucket}.s3.${ENV.s3Region}.amazonaws.com/${key}`;
}
