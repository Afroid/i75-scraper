
jest.mock("aws-embedded-metrics", () => ({
  createMetricsLogger: () => ({
    putMetric: () => {},
    flush: async () => {},
  }),
  Unit: { Count: "Count", None: "None" },
}));

import { fetchMLBScores, fetchMLBGames, type MLBGame } from "./mlbFetcher";

describe("fetchMLBScores", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("parses scores from sample schedule (happy path)", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        dates: [{
          games: [
            {
              teams: {
                away: { team: { name: "Braves" }, score: 5 },
                home: { team: { name: "Mets" }, score: 3 },
              }
            }
          ]
        }]
      })
    });

    const scores = await fetchMLBScores();

    // Assertion
    expect(scores).toEqual({ Braves: 5, "Mets": 3 });
  });

  it("returns empty object when fetch rejects (error path)", async () => {
    // Simulates a network error
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));

    const scores = await fetchMLBScores();

    // Assertion
    expect(scores).toEqual({});
  });

  it("returns a flat array of games when response contains dates with games", async () => {
    // Arrange: mock fetch to return nested dates/games
    const mockData = {
      dates: [
        {
          games: [
            {
              status: { abstractGameState: "Preview", detailedState: "Pre-Game" },
              teams: {
                away: { team: { name: "A" }, score: 1 },
                home: { team: { name: "B" }, score: 2 }
              }
            },
            {
              status: { abstractGameState: "Live",    detailedState: "In Progress" },
              teams: {
                away: { team: { name: "C" }, score: 3 },
                home: { team: { name: "D" }, score: 4 }
              }
            },
          ]
        },
        {
          games: [
            {
              status: { abstractGameState: "Final",  detailedState: "Final" },
              teams: {
                away: { team: { name: "E" }, score: 5 },
                home: { team: { name: "F" }, score: 6 }
              }
            }
          ]
        }
      ]
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => mockData
    });

    // Act
    const games: MLBGame[] = await fetchMLBGames();

    // Assert
    expect(games).toHaveLength(3);
    expect(games[0].teams.away.team.name).toBe("A");
    expect(games[1].teams.home.team.name).toBe("D");
    expect(games[2].status.abstractGameState).toBe("Final");
  });

  it("returns an empty array when response dates is undefined", async () => {
    // Set no dates property
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    const noDates = await fetchMLBGames();

    // Assertion
    expect(noDates).toEqual([]);
  });

  it("returns an empty array when fetch fails", async () => {
    // Cause fetch to throw
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    const onError = await fetchMLBGames();

    // Assertion
    expect(onError).toEqual([]);
  });
});
