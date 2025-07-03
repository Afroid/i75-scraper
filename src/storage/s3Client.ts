import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// If env variable isn't set, an error message is presented
const BUCKET = process.env.SCORES_BUCKET;
if (!BUCKET) {
  throw new Error("SCORES_BUCKET env var is required");
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

/**
 * Stores the latest scoreboard JSON at leagues/{leagueId}/latest.json
 * Updates this file on every run for fast, up-to-date reads.
 */
export async function storeLatest<T extends Record<string, unknown>>(
  leagueId: string,
  data: T
): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `leagues/${leagueId}/latest.json`,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    })
  );
}

/**
 * Stores a historical snapshot JSON at leagues/{leagueId}/{day}.json
 * Keeps a day-to-day archive of scores.
 */
export async function storeSnapshot<T extends Record<string, unknown>>(
  leagueId: string,
  day: string,
  data: T
): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `leagues/${leagueId}/${day}.json`,
      Body: JSON.stringify(data),
      ContentType: "application/json",
      ACL: "private",
    })
  );
}
