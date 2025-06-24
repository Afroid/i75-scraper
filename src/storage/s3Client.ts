import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.SCORES_BUCKET!;

export async function storeLatest(
  leagueId: string,
  data: Record<string, number>
) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `leagues/${leagueId}/latest.json`,
    Body: JSON.stringify(data),
    ContentType: "application/json",
    // ACL: "public-read",
  }));
}
