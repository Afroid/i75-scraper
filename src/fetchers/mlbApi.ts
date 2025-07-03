import { createMetricsLogger, Unit } from "aws-embedded-metrics";

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

/** Raw schedule response */
export interface MLBScheduleResponse {
  dates?: Array<{ games?: MLBGame[] }>;
};

/** Standings endpoint shape */
interface StandingsResponse {
  records: Array<{
    teamRecords: Array<{
      team: { name: string }
      wins: number
      losses: number
    }>
  }>
};

/** Linescore endpoint shape */
interface Linescore {
  teams: {
    away: { runs: number; hits: number; errors: number }
    home: { runs: number; hits: number; errors: number }
  }
  status: { abstractGameState: 'Preview' | 'Live' | 'Final'; detailedState: string }
};

/** now in America/New_York, ignoring DST */
function estNow(): Date {
  console.log("Inside estNow");
  const now = new Date();
  const localOffsetMs = now.getTimezoneOffset() * 60_000;      // e.g. +300min → 18:00 UTC
  const utc = now.getTime() + localOffsetMs;                   // normalize to UTC
  const easternOffsetMs = 5 * 60 * 60_000;                     // fixed −5 hours
  return new Date(utc - easternOffsetMs);
}

/** Returns YYYY-MM-DD for a JS Date */
function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
};

const logger = createMetricsLogger();

/**
 * Helper to fetch the raw schedule response from the MLB API.
 */
export async function fetchSchedule(overrideDate?: string): Promise<MLBScheduleResponse> {
  // If caller forced a date, use it
  // Otherwise, if local EST hour is before 5am (your cutoff), use yesterday
  // else use today
  let dateStr = overrideDate;
  if (!dateStr) {
    const nowEST = estNow();
    if (nowEST.getHours() < 5) {
      // before 5 AM EST, still fetch yesterday’s games
      dateStr = toISO(new Date(nowEST.getTime() - 86_400_000));
    } else {
      // normal “today” fetch
      dateStr = toISO(nowEST);
    }
  };

  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}`;

  console.debug("Fetching MLB schedule for date and from:", dateStr, url);
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

/** Fetch detailed linescore for one game */
export async function fetchLineScore(gamePk: number): Promise<Linescore> {
  const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/linescore`;

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Linescore fetch failed: ${res.status}`);

  return (await res.json()) as Linescore;
}

/** Fetch current season standings to get team win-loss records for both leagues */
export async function fetchStandings(): Promise<Record<string, string>> {
  const standingsMap: Record<string, string> = {};

  // Helper to fetch one league’s standings
  async function fetchLeague(leagueId: number) {
    const url = `https://statsapi.mlb.com/api/v1/standings?leagueId=${leagueId}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Standings fetch failed for league ${leagueId}: ${res.status}`);

    const data = (await res.json()) as StandingsResponse;

    data.records.forEach(group => {
      group.teamRecords.forEach(rec => {
        standingsMap[rec.team.name] = `${rec.wins}-${rec.losses}`;
      });
    });
  };

  // Run both in parallel
  await Promise.all([fetchLeague(103), fetchLeague(104)]);

  return standingsMap;
}
