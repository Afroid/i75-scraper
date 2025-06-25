import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// If env variable isn't set, an error message is presented
const BUCKET = process.env.SCORES_BUCKET;
if (!BUCKET) {
  throw new Error("SCORES_BUCKET env var is required");
}

/** Exporting the client so the test can destroy it */
export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

export async function storeLatest(
  leagueId: string,
  data: Record<string, number>
) {
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `leagues/${leagueId}/latest.json`,
    Body: JSON.stringify(data),
    ContentType: "application/json",
  }));
}
