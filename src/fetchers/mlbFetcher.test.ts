
jest.mock('aws-embedded-metrics', () => ({
  createMetricsLogger: () => ({
    putMetric: () => {},
    flush: async () => {},
  }),
  Unit: { Count: 'Count', None: 'None' },
}));

import { fetchMLBScores } from './mlbFetcher';

describe('fetchMLBScores', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('parses scores from sample schedule (happy path)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        dates: [{
          games: [
            {
              teams: {
                away: { team: { name: 'Braves' }, score: 5 },
                home: { team: { name: 'Mets' }, score: 3 },
              }
            }
          ]
        }]
      })
    });

    const scores = await fetchMLBScores();

    // Assertion
    expect(scores).toEqual({ Braves: 5, 'Mets': 3 });
  });

  it('returns empty object when fetch rejects (error path)', async () => {
    // Simulates a network error
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const scores = await fetchMLBScores();

    // Assertion
    expect(scores).toEqual({});
  });
});
