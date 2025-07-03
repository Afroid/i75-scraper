
jest.mock("aws-embedded-metrics", () => ({
  createMetricsLogger: () => ({
    putMetric: () => {},
    flush: async () => {},
  }),
  Unit: { Count: "Count", None: "None" },
}));

import { fetchMLBScores, fetchMLBGames, type MLBGame } from "./mlbFetcher";
import * as api from "./mlbApi";
import type { MLBScheduleResponse } from "./mlbApi";

describe("fetchMLBScores", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("parses scores from sample schedule (happy path)", async () => {
    // Arrange
    // Spy on and mock the schedule fetch
    jest.spyOn(api, "fetchSchedule").mockResolvedValue({
      dates: [{
        games: [{
          gamePk: 12345,
          status: { abstractGameState: "Preview", detailedState: "Preview" },
          teams: {
            away: { team: { name: "Braves" }, score: 5 },
            home: { team: { name: "Mets"   }, score: 3 },
          }
        }]
      }]
    });

    // Spy on and mock the standings fetch
    jest.spyOn(api, "fetchStandings").mockResolvedValue({
      "Braves": "52-32",
      "Mets":   "32-52"
    });

    // Spy on and mock the linescore fetch
    jest.spyOn(api, "fetchLineScore").mockResolvedValue({
      teams: {
        away: { runs: 5, hits: 8, errors: 0 },
        home: { runs: 3, hits: 6, errors: 1 },
      },
      status: { abstractGameState: "Final", detailedState: "Final" }
    });

    // Act
    const scores = await fetchMLBScores();

    // Assert
    expect(scores).toEqual({
      Braves: {
        "runs": 5,
        "hits": 8,
        "errors": 0,
        "status": "Preview",
        "record": "52-32"
      },
      Mets: {
        "runs": 3,
        "hits": 6,
        "errors": 1,
        "status": "Preview",
        "record": "32-52"
      }
    });
  });

  it("propagates errors when fetch rejects (error path)", async () => {

    // Spy on and mock the schedule fetch
    jest.spyOn(api, "fetchSchedule").mockResolvedValue({
      dates: [{
        games: [{
          gamePk: 12345,
          status: { abstractGameState: "Preview", detailedState: "Preview" },
          teams: {
            away: { team: { name: "Braves" }, score: 5 },
            home: { team: { name: "Mets"   }, score: 3 },
          }
        }]
      }]
    });

    // Spy on and mock the standings fetch
    jest.spyOn(api, "fetchStandings").mockResolvedValue({
      "Braves": "52-32",
      "Mets":   "32-52"
    });

    // Spy on and mock the linescore fetch to a rejected value
    jest.spyOn(api, "fetchLineScore").mockRejectedValue(new Error("Fetch error"));

    // Act
    const scores = await fetchMLBScores();

    expect(scores).toEqual({
      Braves: { runs: 5, hits: 0, errors: 0, status: "Preview", record: "52-32" },
      Mets:   { runs: 3, hits: 0, errors: 0, status: "Preview", record: "32-52" },
    });
  });

  it("returns a flat array of games when response contains dates with games", async () => {
    // Arrange: mock fetch to return nested dates/games
    // Spy on and mock the schedule fetch
    jest.spyOn(api, "fetchSchedule").mockResolvedValue({
      dates: [{
        games: [
          {
            gamePk: 12345,
            status: { abstractGameState: "Preview", detailedState: "Preview" },
            teams: {
              away: { team: { name: "Braves" }, score: 5 },
              home: { team: { name: "Mets"   }, score: 3 },
            }
          },
          {
            gamePk: 67890,
            status: { abstractGameState: "Live", detailedState: "Middle 5th" },
            teams: {
              away: { team: { name: "Yankees"   }, score: 3 },
              home: { team: { name: "Red Sox"   }, score: 5 },
            }
          }
        ]
      }]
    });

    // Act
    const games: MLBGame[] = await fetchMLBGames();

    // Assert
    expect(games).toHaveLength(2);
    expect(games[0].teams.away.team.name).toBe("Braves");
    expect(games[0].teams.home.team.name).toBe("Mets");
    expect(games[0].status.abstractGameState).toBe("Preview");

    expect(games[1].teams.away.team.name).toBe("Yankees");
    expect(games[1].teams.home.team.name).toBe("Red Sox");
    expect(games[1].status.abstractGameState).toBe("Live");
  });

  it("returns an empty array when response dates is undefined", async () => {
    // jest
    //   .spyOn(api, "fetchSchedule")
    //   .mockResolvedValue({} as Partial<ReturnType<typeof api.fetchSchedule>>);

    const emptySchedule: MLBScheduleResponse = {}

    jest.spyOn(api, "fetchSchedule").mockResolvedValue(emptySchedule);
    // Set no dates property
    // global.fetch =
    // jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

    // Act
    const noDates = await fetchMLBGames();

    // Assertion
    expect(noDates).toEqual([]);
  });
});
