import { handler as liveHandler }     from "./handler.live";
import { fetchMLBScores, MLBScores }  from "./fetchers/mlbFetcher";
import { storeLatest }                from "./storage/s3Client";
import type { Context }               from "aws-lambda";

jest.mock("./fetchers/mlbFetcher");
jest.mock("./storage/s3Client");

const mockFetch = fetchMLBScores  as jest.MockedFunction<typeof fetchMLBScores>;
const mockStore = storeLatest     as jest.MockedFunction<typeof storeLatest>;

const DUMMY_EVENT = {};
const DUMMY_CTX = { callbackWaitsForEmptyEventLoop: false } as Context;

describe("LiveUpdateFn", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("overwrites latest.json with whatever fetchMLBScores returns", async () => {
    const fake: MLBScores = { Foo: { runs: 1, hits: 2, errors: 0, status: "Live", record: "" }};

    mockFetch.mockResolvedValue(fake);
    mockStore.mockResolvedValue(undefined);

    await expect(liveHandler(DUMMY_EVENT, DUMMY_CTX)).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalled();
    expect(mockStore).toHaveBeenCalledWith("mlb", fake);
  });

  it("bubbles up errors from fetchMLBScores", async () => {
    mockFetch.mockRejectedValue(new Error("no go"));
    await expect(liveHandler(DUMMY_EVENT, DUMMY_CTX)).rejects.toThrow("no go");
  });

  it("bubbles up errors from storeLatest", async () => {
    mockFetch.mockResolvedValue({});
    mockStore.mockRejectedValue(new Error("disk full"));

    await expect(liveHandler(DUMMY_EVENT, DUMMY_CTX)).rejects.toThrow("disk full");
  });
});
