import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { putDailySnapshot } from "./dynamoClient";

describe("putDailySnapshot", () => {
  // mock the *document* client, not the low-level DynamoDBClient
  const ddbMock = mockClient(DynamoDBDocumentClient);

  afterEach(() => {
    ddbMock.reset();
  });

  it("sends a PutCommand with correct parameters", async () => {
    // Arrange — stub a successful call
    ddbMock.on(PutCommand).resolves({});

    const leagueId = "mlb"
    const day      = "2025-06-27"
    const data     = { Braves: 3, Mets: 2 }

    // Act
    await putDailySnapshot(leagueId, day, data);

    // Assert one call went out
    const calls = ddbMock.calls();
    expect(calls).toHaveLength(1);

    // Grab the actual PutCommand instance
    const cmd = calls[0].args[0] as PutCommand;
    expect(cmd).toBeInstanceOf(PutCommand);

    // Assert the two key pieces
    expect(cmd.input.TableName).toBe("DailySnapshots");
    expect(cmd.input.Item).toEqual({
      leagueId,             // partitionKey
      snapshotDate: day,    // sortKey
      payload: data,        // native JS object
      timestamp: expect.any(Number),
    });
  });

  it("propagates errors thrown by the client", async () => {
    // Arrange — stub a failure
    ddbMock.on(PutCommand).rejects(new Error("Dynamo failed"));

    // Act & Assert
    await expect(putDailySnapshot("mlb", "2025-06-27", {}))
      .rejects.toThrow("Dynamo failed");
  });
});
