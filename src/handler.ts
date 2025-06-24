import { fetchScores } from "./fetchers/mlbFetcher";  // or espnScraper.ts later
import { storeLatest }  from "./storage/s3Client";

export const handler = async () => {
  const scores = await fetchScores();
  await storeLatest("i75", scores);
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
