import { handler as dailyHandler }    from "./handler.daily";
import { fetchMLBScores }             from "./fetchers/mlbFetcher";
import { storeLatest, storeSnapshot } from "./storage/s3Client";
import { putDailySnapshot }           from "./storage/dynamoClient";
import type { MLBScores }             from "./fetchers/mlbFetcher";
import type { Context }               from "aws-lambda";

jest.mock("./fetchers/mlbFetcher");
jest.mock("./storage/s3Client");
jest.mock("./storage/dynamoClient");

const mockFetchScores   = fetchMLBScores    as jest.MockedFunction<typeof fetchMLBScores>;
const mockStoreLatest   = storeLatest       as jest.MockedFunction<typeof storeLatest>;
const mockStoreSnapshot = storeSnapshot     as jest.MockedFunction<typeof storeSnapshot>;
const mockPutDaily      = putDailySnapshot  as jest.MockedFunction<typeof putDailySnapshot>;

const DUMMY_EVENT = {};
const DUMMY_CTX = { callbackWaitsForEmptyEventLoop: false } as Context;

// Freezes time so “yesterday” is always 2025-06-27 in tests
beforeAll(() => {
  jest.resetAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2025-06-28T06:00:00Z"));
});

afterAll(() => {
  jest.useRealTimers();
});

describe("DailySnapshotFn", () => {
  it("writes both S3 and Dynamo for yesterday’s scores when fetch succeeds", async () => {
    // Arrange
    const fakeScores: MLBScores =
    { A: { runs: 1, hits: 1, errors: 0, status: "Final", record: "1-0" }};

    mockFetchScores.mockResolvedValue(fakeScores);
    mockStoreLatest.mockResolvedValue(undefined);
    mockStoreSnapshot.mockResolvedValue(undefined);
    mockPutDaily.mockResolvedValue(undefined);

    // Act & Assert
    await expect(dailyHandler(DUMMY_EVENT, DUMMY_CTX)).resolves.toBeUndefined();

    // Assert
    // “yesterday” = 2025-06-27 based on our frozen clock
    expect(mockStoreSnapshot).toHaveBeenCalledWith("mlb", "2025-06-27", fakeScores);
    expect(mockPutDaily).toHaveBeenCalledWith("mlb", "2025-06-27", fakeScores);

    const yesterday = "2025-06-27";  // one day back from the frozen clock
    expect(mockFetchScores).toHaveBeenCalledWith(yesterday);
    expect(mockStoreLatest).toHaveBeenCalledWith("mlb", fakeScores);
    expect(mockStoreSnapshot).toHaveBeenCalledWith("mlb", yesterday, fakeScores);
    expect(mockPutDaily).toHaveBeenCalledWith("mlb", yesterday, fakeScores);
  });

  it("doesn’t call S3 or Dynamo if fetchMLBScores throws", async () => {
    // Arrange
    mockFetchScores.mockRejectedValue(new Error("no data yet"));

    // Act & Assert
    await expect(dailyHandler(DUMMY_EVENT, DUMMY_CTX)).rejects.toThrow("no data yet");
  });
});
