// Set required env vars before module import
process.env.WEEKLY_TABLE = "WeeklyScoreboards";
process.env.AWS_REGION    = "us-east-1";

import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { putDailySnapshot } from "./dynamoClient";

describe("putDailySnapshot", () => {
  const ddbMock = mockClient(DynamoDBClient);
  const originalEnv = process.env;

  beforeAll(() => {
    process.env.WEEKLY_TABLE = "WeeklyScoreboards";
    process.env.AWS_REGION    = "us-east-1";
  });

  afterEach(() => {
    ddbMock.reset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("sends a PutItemCommand with correct parameters", async () => {
    // Arrange: stub a successful response
    ddbMock.on(PutItemCommand).resolves({});

    // Act
    const leagueId = "mlb";
    const day      = "2025-06-27";
    const data     = { Braves: 3, Mets: 2 };
    await putDailySnapshot(leagueId, day, data);

    // Asserting that one command was sent
    const calls = ddbMock.calls();
    expect(calls).toHaveLength(1);

    const command = calls[0].args[0] as PutItemCommand;

    // Assertions for the command instance and its input
    expect(command).toBeInstanceOf(PutItemCommand);
    expect(command.input).toEqual({
      TableName: "WeeklyScoreboards",
      Item: {
        leagueId:     { S: leagueId },
        snapshotDay:  { S: day },
        payload:      { S: JSON.stringify(data) },
        timestamp:    { N: expect.any(String) }
      }
    });
  });

  it("propagates errors thrown by the client", async () => {
    // Arrange: stub a failure
    const error = new Error("Dynamo failed");
    ddbMock.on(PutItemCommand).rejects(error);

    // Act & Assert
    await expect(putDailySnapshot("mlb", "2025-06-27", {})).rejects.toThrow("Dynamo failed");
  });
});
