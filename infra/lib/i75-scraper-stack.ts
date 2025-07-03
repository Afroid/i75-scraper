import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";

export class I75ScraperStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Creates the S3 bucket
    const bucket = new Bucket(this, "ScoresBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Creates the DynamoDB Table
    const dailyTable = new Table(this, "DailySnapshots", {
      tableName: "DailySnapshots",
      partitionKey: { name: "leagueId",     type: AttributeType.STRING },
      sortKey:      { name: "snapshotDate", type: AttributeType.STRING },
      billingMode:  BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,    // dev only
    });

    const commonBundling = {
      externalModules: ["aws-sdk"], // Keeps the built-in SDK external
      minify: true,
      sourceMap: true,
    };

    const liveUpdateFn = new NodejsFunction(this, "LiveUpdateFn", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../../src/handler.live.ts"),
      handler: "handler",
      bundling: commonBundling,
      environment: {
        SCORES_BUCKET: bucket.bucketName,
        LEAGUE_ID: "mlb"
      },
    });

    // Grant write permissions
    bucket.grantPut(liveUpdateFn);


    /**
     * EventBridge rule that runs between 16–23 UTC (12PM – 7PM ET) + 00–08 UTC (8PM – 4AM ET)
     * EventBridge rule that runs between 16-8 UTC (12 PM – 4 AM ET)
     * and every five minutes during those times.
     */
    new Rule(this, "LiveUpdateRule", {
      description: "Invoke scraper every 5 min during probable MLB game hours",
      schedule: Schedule.cron({
        minute: "0/5",
        hour:   "16-23,0-8",
        month:  "3-11",
        weekDay:"MON-SUN",
        year:   "*"
      }),
      targets: [ new LambdaFunction(liveUpdateFn) ],
    });

    const dailySnapshotFn = new NodejsFunction(this, "DailySnapshotFn", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../../src/handler.daily.ts"),
      handler: "handler",
      bundling: commonBundling,
      environment: {
        SCORES_BUCKET:  bucket.bucketName,
        DAILY_TABLE:    dailyTable.tableName,
        LEAGUE_ID:      "mlb"
      },
    });

    // Grant write permissions for dailySnapshotFn
    bucket.grantPut(dailySnapshotFn);
    dailyTable.grantWriteData(dailySnapshotFn);

    new Rule(this, "DailySnapshotRule", {
      schedule: Schedule.cron({
        minute: "5",
        hour:   "8",      // 8:05 UTC → 04:05 EDT
        day:    "*",
        month:  "3-11",
        year:   "*",
      }),
      targets: [new LambdaFunction(dailySnapshotFn)],
    });
  }
}
