// Set environment for handler
process.env.LEAGUE_ID = "mlb";
process.env.CURRENT_DAY = "2025-06-27";

import { handler } from "./handler";
import { fetchMLBScores, fetchMLBGames } from "./fetchers/mlbFetcher";
import { storeLatest, storeSnapshot } from "./storage/s3Client";
import { putDailySnapshot } from "./storage/dynamoClient";
import type { Context } from "aws-lambda";

// Mocks
jest.mock("./fetchers/mlbFetcher");
jest.mock("./storage/s3Client");
jest.mock("./storage/dynamoClient");

const mockFetchGames  = fetchMLBGames     as jest.MockedFunction<typeof fetchMLBGames>;
const mockFetchScores = fetchMLBScores    as jest.MockedFunction<typeof fetchMLBScores>;
const mockStoreLatest = storeLatest       as jest.MockedFunction<typeof storeLatest>;
const mockStoreSnap   = storeSnapshot     as jest.MockedFunction<typeof storeSnapshot>;
const mockPutDaily    = putDailySnapshot  as jest.MockedFunction<typeof putDailySnapshot>;

// Dummy context
const dummyContext = { callbackWaitsForEmptyEventLoop: true } as unknown as Context;

describe("handler", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Default: one Live game to exercise storeLatest path
    mockFetchGames.mockResolvedValue([
      {
        status: { abstractGameState: "Live", detailedState: "In Progress" },
        teams: {
          away: { team: { name: "Braves" }, score: 3 },
          home: { team: { name: "Mets"   }, score: 2 }
        }
      }
    ]);
  });

  it("updates latest.json when games are live", async () => {
    mockFetchScores.mockResolvedValue({ Braves: 3, Mets: 2 });
    mockStoreLatest.mockResolvedValue();
    mockPutDaily.mockResolvedValue();

    // Act
    await expect(handler(dummyContext)).resolves.toBeUndefined();

    // Assert
    expect(mockFetchScores).toHaveBeenCalledTimes(1);
    expect(mockStoreLatest).toHaveBeenCalledWith("mlb", { Braves: 3, Mets: 2 });
    expect(mockStoreSnap).not.toHaveBeenCalled();
    expect(mockPutDaily).not.toHaveBeenCalled();
  });

  it("writes daily snapshot when all games final", async () => {
    // All games final scenario
    mockFetchGames.mockResolvedValue([
      {
        status: { abstractGameState: "Final", detailedState: "Final" },
        teams: {
          away: { team: { name: "Braves" }, score: 3 },
          home: { team: { name: "Mets"   }, score: 2 }
        }
      }
    ]);
    mockFetchScores.mockResolvedValue({ Braves: 3, Mets: 2 });
    mockStoreLatest.mockResolvedValue();
    mockStoreSnap.mockResolvedValue();
    mockPutDaily.mockResolvedValue();

    // Act
    await expect(handler(dummyContext)).resolves.toBeUndefined();

    // Assert: final latest + snapshot
    expect(mockStoreLatest).toHaveBeenCalledWith("mlb", { Braves: 3, Mets: 2 });
    expect(mockStoreSnap).toHaveBeenCalledWith("mlb", "2025-06-27", { Braves: 3, Mets: 2 });
    expect(mockPutDaily).toHaveBeenCalledWith("mlb", "2025-06-27", { Braves: 3, Mets: 2 });
  });

  it("throws when fetchMLBScores rejects", async () => {
    mockFetchGames.mockResolvedValue([]);
    mockFetchScores.mockRejectedValue(new Error("Fetch error"));

    await expect(handler(dummyContext)).rejects.toThrow("Fetch error");
    expect(mockFetchScores).toHaveBeenCalledTimes(1);
    expect(mockStoreLatest).not.toHaveBeenCalled();
    expect(mockPutDaily).not.toHaveBeenCalled();
  });

  it("throws when storeLatest rejects during live games", async () => {
    mockFetchScores.mockResolvedValue({ Braves: 3, Mets: 2 });
    mockStoreLatest.mockRejectedValue(new Error("Store error"));

    await expect(handler(dummyContext)).rejects.toThrow("Store error");
    expect(mockFetchScores).toHaveBeenCalledTimes(1);
    expect(mockStoreLatest).toHaveBeenCalledTimes(1);
    expect(mockPutDaily).not.toHaveBeenCalled();
  });

    it("skips latest.json when no games live yet (all Preview)", async () => {
    // Arrange all games in Preview or Final
    mockFetchGames.mockResolvedValue([
      {
        status: { abstractGameState: "Preview", detailedState: "Pre-Game" },
        teams: {
          away: { team: { name: "Atlanta Braves"  }, score: null },
          home: { team: { name: "New York Mets"   }, score: null }
        }
      },
      {
        status: { abstractGameState: "Final", detailedState: "Final" },
        teams: {
          away: { team: { name: "Boston Red Sox"    }, score: 8 },
          home: { team: { name: "New York Yankees"  }, score: 6 }
        }
      },
      {
        status: { abstractGameState: "Final", detailedState: "Final" },
        teams: {
          away: { team: { name: "Athletics"       }, score: 4 },
          home: { team: { name: "Detroit Tigers"  }, score: 2 }
        }
      }
    ]);
    mockFetchScores.mockResolvedValue(
      {
        "Boston Red Sox": 8, "New York Yankees": 6,
        "Athletics": 4, "Detroit Tigers": 2
      }
    );

    // Act
    await expect(handler(dummyContext)).resolves.toBeUndefined();

    // Assert: no persistence calls
    expect(mockFetchScores).toHaveBeenCalledTimes(1);
    expect(mockStoreLatest).not.toHaveBeenCalled();
    expect(mockStoreSnap).not.toHaveBeenCalled();
    expect(mockPutDaily).not.toHaveBeenCalled();
  });
});
