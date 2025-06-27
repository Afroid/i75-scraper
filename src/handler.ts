/**
 * Entry-point for Lambda: fetch MLB scores and store in S3 + DynamoDB,
 * with in-code gating and error handling
 */
import type { Context } from "aws-lambda";
import { MLBGame, MLBScores, fetchMLBScores, fetchMLBGames } from "./fetchers/mlbFetcher";
import { storeLatest, storeSnapshot } from "./storage/s3Client";
import { putDailySnapshot } from "./storage/dynamoClient";

// Handler only uses Context; event parameter removed since it's unused
export const handler = async (
  context: Context
): Promise<void> => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.debug("Handler: invocation started (triggered by EventBridge)");

  const leagueId = process.env.LEAGUE_ID!;

  // Compute today’s date (YYYY-MM-DD) in EST, e.g. "2025-06-27"
  const today = new Intl.DateTimeFormat(
    "en-CA",
    { timeZone: "America/New_York" }
  ).format(new Date());

  let scores: MLBScores;
  let games: MLBGame[];

  try {
    // Fetch games and scores
    games = await fetchMLBGames();
    scores = await fetchMLBScores();

    console.debug(`Handler: fetched scores for league '${leagueId}'`, scores);
  } catch (err) {
    console.error("Handler: error fetching scores", err);
    throw err;  // retry & DLQ
  }

  // Determine game state
  const anyLive  = games.some(g => g.status.abstractGameState === "Live");
  const allFinal = games.every(g => g.status.abstractGameState === "Final");

  // If all games final, snapshot and stop
  if (allFinal) {
    console.debug(`All games Final — writing snapshot for day ${today}`);
    await storeLatest(leagueId, scores);
    await storeSnapshot(leagueId, today, scores);
    await putDailySnapshot(leagueId, today, scores);
    return;
  }

  // If no games live yet, skip latest.json
  if (!anyLive) {
    console.debug("No games in progress yet. Skipping persist to latest.json");
    return;
  }

  // Otherwise, update latest.json
  console.debug(`Updating latest.json for today ${today}`);
  try {
    // In‐game: update latest.json
    await storeLatest(leagueId, scores);

    console.debug("Handler: latest.json updated successfully");
  } catch (err) {
    console.error("Handler: error storing latest.json", err);
    throw err;
  }
};
