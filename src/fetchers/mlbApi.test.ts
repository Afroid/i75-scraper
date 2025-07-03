// Stub out the embedded-metrics logger so we don't send real metrics
jest.mock("aws-embedded-metrics", () => ({
  createMetricsLogger: () => ({
    putMetric: () => {},
    flush: async () => {},
  }),
  Unit: { Count: "Count", None: "None" }
}));

import { jest } from "@jest/globals"
import { fetchSchedule, fetchLineScore, fetchStandings, MLBScheduleResponse } from "./mlbApi"

describe("mlbApi helpers", () => {
  afterEach(() => {
    jest.resetAllMocks();
  })

  describe("fetchSchedule", () => {
    it("returns parsed JSON on successful fetch", async () => {
      const yesterday = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/New_York"
      }).format(new Date(Date.now() - 86_400_000));

      const fakeResponse: MLBScheduleResponse = { dates: [{ games: [] }] };

      // Mock global.fetch
      jest.spyOn(global, "fetch").mockResolvedValue(
        ({ ok: true, status: 200, statusText: "OK", json: async () => fakeResponse } as Response)
      );

      const result = await fetchSchedule(yesterday);

      // Assert
      expect(result).toEqual(fakeResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("returns empty object on fetch failure", async () => {
      // Arrange
      const yesterday = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/New_York"
      }).format(new Date(Date.now() - 86_400_000));

      jest.spyOn(global, "fetch").mockRejectedValue(new Error("network error"));

      jest.spyOn(global, "fetch").mockResolvedValue(
        ({ ok: false, status: 404, statusText: "Not Found", json: async () => ({}) } as Response)
      );

      jest.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: false, status: 500, statusText: "Error",
          json: async () => ({})
        } as Response);

      // Act
      const result = await fetchSchedule(yesterday);

      // Assert
      expect(result).toEqual({});
      // expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    it("returns empty object on non-OK status", async () => {
      // Arrange
      jest.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: false, status: 500, statusText: "Error",
          json: async () => ({})
        } as Response);

      // Act
      const result = await fetchSchedule();

      // Assert
      expect(result).toEqual({});
    });

    it("uses estNow→toISO and returns JSON", async () => {
      // Arrange
      const FAKE = { dates: [{ games: [] }] };

      // Stub fetch once
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => FAKE,
      } as Response);

      // Freeze time at July 3rd, 2025 12:00:00 UTC
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2025-07-03T12:00:00Z"));
      // Stub Date to a known timestamp, e.g. 2025-07-03T12:00:00Z
      // jest
      //   .spyOn(Date, "now")
      //   .mockReturnValue(new Date("2025-07-03T12:00:00Z").getTime());

      // Act
      const result = await fetchSchedule();

      // noon UTC → 7:00 AM EST → today
      expect(result).toEqual(FAKE);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=2025-07-03"
      );
    });
  })

  describe("fetchLineScore", () => {
    const sampleLinescore = {
      teams: {
        away: { runs: 1, hits: 2, errors: 0 },
        home: { runs: 3, hits: 4, errors: 1 } },
        status: { abstractGameState: "Live", detailedState: "In Progress"
      }
    }

    it("returns JSON on successful fetch", async () => {
      // Arrange
      jest.spyOn(global, "fetch").mockResolvedValue(
        ({ ok: true, status: 200, statusText: "OK", json: async () => sampleLinescore } as Response)
      );

      // Act
      const result = await fetchLineScore(123);

      // Assert
      expect(result).toEqual(sampleLinescore);
    })

    it("throws on non-OK status", async () => {
      // Arange
      jest.spyOn(global, "fetch").mockResolvedValue(
        ({ ok: false, status: 404, statusText: "Not Found", json: async () => ({}) } as Response)
      );

      // Act & Assert
      await expect(fetchLineScore(456)).rejects.toThrow("Linescore fetch failed: 404");
    })
  })

  describe("fetchStandings", () => {
    const fakeStandingsResponse = {
      records: [
        { teamRecords: [ { team: { name: "A" }, wins: 10, losses: 5 } ] },
        { teamRecords: [ { team: { name: "B" }, wins: 8,  losses: 7 } ] }
      ]
    }

    it("aggregates records from both leagues", async () => {
      // Arrange
      // First call: league 103
      jest.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: "OK",
          json: async () => fakeStandingsResponse
        } as Response)
        // Second call: league 104
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: "OK",
          json: async () => fakeStandingsResponse
        } as Response)

      // Act
      const result = await fetchStandings()

      // Assert
      expect(result).toEqual({ "A": "10-5", "B": "8-7" })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it("throws if any league fetch fails", async () => {
      // Arrange
      jest.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: false, status: 500, statusText: "Error",
          json: async () => ({})
        } as Response);

      // Act & Assert
      await expect(fetchStandings()).rejects.toThrow("Standings fetch failed for league 103: 500");
    });
  })
})
