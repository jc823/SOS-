import "dotenv/config";

export const ENV = {
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "owner",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "change-me-in-production",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3Region: process.env.S3_REGION ?? "us-east-1",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  salesArenaApiUrl: process.env.SALES_ARENA_API_URL ?? "",
  salesArenaApiKey: process.env.SALES_ARENA_API_KEY ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "3001", 10),
};
