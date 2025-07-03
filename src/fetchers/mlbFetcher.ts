import { createMetricsLogger, Unit } from "aws-embedded-metrics";
import { fetchSchedule, fetchStandings, fetchLineScore } from './mlbApi';

/** Detailed box score and record for one team */
export interface ScoreDetail {
  runs:     number;
  hits:     number;
  errors:   number;
  record?:  string; // Season W-L record, e.g. "45-32"
  status:   "Preview" | "Live" | "Final";
};

/** The output shape: map from team name → ScoreDetail */
export type MLBScores = Record<string, ScoreDetail>;

/**
 * Represents one MLB game with game primary key (gamePk), status and team scores.
 */
export interface MLBGame {
  gamePk: number;
  status: {
    abstractGameState: "Preview" | "Live" | "Final";
    detailedState: string;
  };
  teams: {
    away: {
      team:   { name: string };
      score:  number | null;
    };
    home: {
      team:   { name: string };
      score:  number | null;
    };
  };
};

const logger = createMetricsLogger();

/**
 * Returns a mapping of team names to their scores for all completed or in-progress games.
 */
export async function fetchMLBScores(date?: string): Promise<MLBScores> {
  const schedule = await fetchSchedule(date);
  const standings = await fetchStandings();

  // Flattens all games into a single array
  const games = schedule.dates?.flatMap(d => d.games ?? []) ?? [];

  // This is the accumulator for the results
  const scores: MLBScores = {};

  for (const game of games) {
    // const { abstractGameState } = game.status;
    const awayName  = game.teams.away.team.name;
    const homeName  = game.teams.home.team.name;
    const gameState = game.status.abstractGameState;

    try {
      console.debug(`fetchMLBScores: gamePk: ${game.gamePk}`);
      // In  case this 404s, it'll be caught here and fall back to schedule scores
      const lines = await fetchLineScore(game.gamePk);

      scores[awayName] = {
        runs:   lines.teams.away.runs,
        hits:   lines.teams.away.hits,
        errors: lines.teams.away.errors,
        status: gameState,
        record: standings[awayName] || '0-0',
      };
      scores[homeName] = {
        runs:   lines.teams.home.runs,
        hits:   lines.teams.home.hits,
        errors: lines.teams.home.errors,
        status: gameState,
        record: standings[homeName] || "0-0",
      };


      // Metrics & Logging
      const gameCount = Object.keys(scores).length / 2
      logger.putMetric("GamesParsed", gameCount, Unit.Count);
      console.debug("Parsed scores:", scores);
      await logger.flush();

    } catch (err) {
      console.error('fetchMLBScores error:', err);

      // Only fall back if schedule actually has scores
      const awayScore = game.teams.away.score;
      const homeScore = game.teams.home.score;
      if (awayScore != null && homeScore != null) {
        scores[awayName] = {
          runs:   awayScore,
          hits:   0,
          errors: 0,
          status: gameState,
          record: standings[awayName] || '',
        };
        scores[homeName] = {
          runs:   homeScore,
          hits:   0,
          errors: 0,
          status: gameState,
          record: standings[homeName] || '',
        };
      }
    }
  }
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
