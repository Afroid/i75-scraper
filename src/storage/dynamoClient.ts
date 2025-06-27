import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const TABLE_NAME = process.env.WEEKLY_TABLE!;
const client    = new DynamoDBClient({
  logger: console, // Sends SDK logs to console.
  region: process.env.AWS_REGION
});

export async function putDailySnapshot(
  leagueId: string,
  day: string,
  data: unknown
) {
  const item = {
    leagueId:    { S: leagueId },
    snapshotDay: { S: day },
    payload:     { S: JSON.stringify(data) },
    timestamp:   { N: Date.now().toString() }
  };

  await client.send(
    new PutItemCommand({ TableName: TABLE_NAME, Item: item })
  );
}
