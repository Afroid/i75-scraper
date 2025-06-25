// Entry-point for Lambda: fetch MLB scores and store in S3, with error handling and logging
import { MLBScores, fetchMLBScores } from "./fetchers/mlbFetcher";  // or espnScraper.ts later
import { storeLatest } from "./storage/s3Client";

export const handler = async (): Promise<{ statusCode: number; body: string }> => {
  console.debug('Handler: invocation started');
  const leagueId = 'mlb';
  let scores: MLBScores;

  // Fetch the scores with error handling
  try {
    scores = await fetchMLBScores();
    console.debug(`Handler: fetched scores for league '${leagueId}'`, scores);
  } catch (err) {
    console.error('Handler: error fetching scores', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Error fetching scores' }),
    };
  }

  // Persist to S3 with error handling
  try {
    await storeLatest(leagueId, scores);
    console.debug(`Handler: successfully stored latest scores for league '${leagueId}'`);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Handler: error storing scores to S3', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Error storing scores' }),
    };
  }
};
