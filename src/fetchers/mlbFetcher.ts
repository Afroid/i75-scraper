import { createMetricsLogger, Unit } from "aws-embedded-metrics";

/**
 * MLBScores is a map from team name (string) to their score (number).
 * e.g. { "Braves": 5, "Mets": 3 }
 */
export interface MLBScores {
  [teamName: string]: number;
}

/**
 * Represents one MLB game with status and team scores.
 */
export interface MLBGame {
  status: {
    abstractGameState: "Preview" | "Live" | "Final";
    detailedState: string;
  };
  teams: {
    away: { team: { name: string }; score: number | null };
    home: { team: { name: string }; score: number | null };
  };
}

interface MLBScheduleResponse {
  dates?: Array<{ games?: MLBGame[] }>;
}

const logger = createMetricsLogger();

/**
 * Helper to fetch the raw schedule response from the MLB API.
 */
async function fetchSchedule(): Promise<MLBScheduleResponse> {
  const date = new Intl.DateTimeFormat(
    "en-CA",
    { timeZone: "America/New_York" }
  ).format(new Date());

  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`;

  console.debug("Fetching MLB schedule for date and from:", date, url);
  logger.putMetric("FetchStart", 1, Unit.Count);

  try {
    const res = await fetch(url);
    logger.putMetric("FetchHTTPStatusCode", res.status, Unit.None);
    if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${res.statusText}`);
    const json = (await res.json()) as MLBScheduleResponse;
    console.debug("Raw schedule data:", JSON.stringify(json));
    return json;
  } catch (err) {
    logger.putMetric("FetchErrors", 1, Unit.Count);
    console.error("Error fetching schedule", err);
    await logger.flush();
    return {};
  }
}

/**
 * Returns a mapping of team names to their scores for all completed or in-progress games.
 */
export async function fetchMLBScores(): Promise<MLBScores> {
  const data = await fetchSchedule();
  const scores: MLBScores = {};

  for (const dateEntry of data.dates || []) {
    for (const game of dateEntry.games || []) {
      const { away, home } = game.teams;
      if (away.score != null && home.score != null) {
        scores[away.team.name] = away.score;
        scores[home.team.name] = home.score;
      }
    }
  }

  logger.putMetric("GamesParsed", Object.keys(scores).length / 2, Unit.Count);
  console.debug("Parsed scores:", scores);
  await logger.flush();
  return scores;
}

/**
 * Returns the full list of games (with status) for use in snapshot logic.
 */
export async function fetchMLBGames(): Promise<MLBGame[]> {
  const data = await fetchSchedule();
  // Flatten all games into a single array
  return (data.dates || []).flatMap(d => d.games || []);
}
