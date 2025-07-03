import type { Context } from "aws-lambda";
import { fetchMLBScores, type MLBScores } from "./fetchers/mlbFetcher";
import { storeLatest } from "./storage/s3Client";

export const handler = async (_event: unknown, context: Context): Promise<void> => {
  context.callbackWaitsForEmptyEventLoop = false;
  const leagueId = process.env.LEAGUE_ID!;

  // Try to grab the freshest scores and bails out on error
  const scores: MLBScores = await fetchMLBScores().catch(err => {
    console.error("LiveUpdateFn: error fetching scores", err);
    throw err;
  });

  // Always overwrite/update latest.json
  console.debug("LiveUpdateFn: updating latest.json");

  await storeLatest(leagueId, scores).catch(err => {
    console.error("LiveUpdateFn: error storing latest.json", err);
    throw err;
  });

  console.debug("LiveUpdateFn: latest.json updated");
};
