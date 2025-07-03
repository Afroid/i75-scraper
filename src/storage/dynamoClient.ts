import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand
} from "@aws-sdk/lib-dynamodb";

const raw = new DynamoDBClient({
  region: process.env.AWS_REGION,
  logger: console
});

// Create a “document” client that auto-converts JS values ↔ Dynamo types
const ddb = DynamoDBDocumentClient.from(raw);

const TABLE = process.env.DAILY_TABLE!;

export async function putDailySnapshot(
  leagueId: string,
  snapshotDate: string,    // must match your table’s sortKey name
  payload: unknown
) {
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        leagueId,              // partitionKey
        snapshotDate,          // sortKey
        payload,               // scores object, stored as native Map/List
        timestamp: Date.now()  // optional if you still want it
      },
    })
  );
}
