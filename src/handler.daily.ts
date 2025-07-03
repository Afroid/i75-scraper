import type { Context } from "aws-lambda";
import { fetchMLBScores, MLBScores }  from "./fetchers/mlbFetcher";
import { storeLatest, storeSnapshot } from "./storage/s3Client";
import { putDailySnapshot }           from "./storage/dynamoClient";

export const handler = async (_event: unknown, context: Context): Promise<void> => {
  context.callbackWaitsForEmptyEventLoop = false;
  const leagueId = process.env.LEAGUE_ID!;

  // Compute yesterday’s date in EST
  const yesterday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York"
  }).format(new Date(Date.now() - 86_400_000));

  // Try to grab the same scores (end-of-day) and bails out on error
  const scores: MLBScores = await fetchMLBScores(yesterday).catch(err => {
    console.error("DailySnapshotFn: error fetching scores", err);
    throw err;
  });

  // Refresh "yesterday's" latest.json one more time.
  await storeLatest(leagueId, scores).catch(err => {
    console.error("DailySnapshotFn: error storing latest.json", err);
    throw err;
  });
  console.debug("DailySnapshotFn: latest.json updated");

  // Persist both to S3 and DynamoDB
  await storeSnapshot(leagueId, yesterday, scores).catch(err => {
    console.error(`DailySnapshotFn: failed to write S3 snapshot for ${yesterday}`, err);
    throw err;
  });
  console.debug(`DailySnapshotFn: S3 snapshot stored as ${yesterday}.json`);

  await putDailySnapshot(leagueId, yesterday, scores).catch(err => {
    console.error(`DailySnapshotFn: failed to write DynamoDB snapshot for ${yesterday}`, err);
    throw err;
  });
  console.debug(`DailySnapshotFn: DynamoDB snapshot entry created for ${yesterday}`);

  // Final confirmation
  console
    .debug(`DailySnapshotFn: completed daily snapshot for league='${leagueId}' on ${yesterday}`);
};
