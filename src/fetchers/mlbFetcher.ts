import { createMetricsLogger , Unit } from 'aws-embedded-metrics';

export interface MLBScores {
  [teamName: string]: number;
}

interface MLBGame {
  teams: {
    away: { team: { name: string }; score: number | null };
    home: { team: { name: string }; score: number | null };
  };
}

interface MLBScheduleResponse {
  dates?: Array<{
    games?: MLBGame[];
  }>;
}

// Initializes a createMetricsLogger  instance
const logger = createMetricsLogger();

// Fetches today's MLB game scores from the MLB Stats API
export async function fetchMLBScores(): Promise<MLBScores> {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York'
  }).format(new Date());

  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`;
  console.debug("Fetching MLB schedule for date and from:", date, url);

  logger.putMetric('FetchStart', 1, Unit.Count);


  let data: MLBScheduleResponse;

  try {
    const res = await fetch(url);
    logger.putMetric('FetchHTTPStatusCode', res.status, Unit.None);
    if (!res.ok) {
      throw new Error(`Fetch failed with status ${res.status}: ${res.statusText}`);
    }
    data = (await res.json()) as MLBScheduleResponse;
    console.debug('data:', JSON.stringify(data));
  } catch (err) {
    logger.putMetric('FetchErrors', 1, Unit.Count);
    console.error('Error fetching schedule', err);
    await logger.flush();
    // Return empty scores to avoid breaking the pipeline
    return {};
  }

  const scores: MLBScores = {};

  for (const dateEntry of data.dates || []) {
    for (const game of dateEntry.games || []) {
      const away = game.teams.away;
      const home = game.teams.home;
      // Only include completed or in-progress games
      if (away.score != null && home.score != null) {
        scores[away.team.name] = away.score;
        scores[home.team.name] = home.score;
      }
    }
  }

  logger.putMetric('GamesParsed', Object.keys(scores).length / 2, Unit.Count);
  console.debug('Parsed scores:', scores);
  await logger.flush();

  return scores;
}
