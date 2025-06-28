import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class I75ScraperStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Creates the S3 bucket
    const bucket = new Bucket(this, "ScoresBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Creates the Lambda function
    const fn = new NodejsFunction(this, "ScraperFn", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../../src/handler.ts"),
      handler: "handler",
      bundling: {
        // Keeps the Lambda runtime’s AWS SDK external, but also minify & source-map
        externalModules: ["aws-sdk"],
        minify: true,
        sourceMap: true,
      },
      environment: {
        SCORES_BUCKET: bucket.bucketName,
      },
    });

    // Grant write permissions
    bucket.grantPut(fn);

    /**
     * EventBridge rule that runs between 17–23 UTC (1 PM–7 PM ET) + 00–04 UTC (8 PM–midnight ET)
     * and every five minutes during those times.
     */
    new Rule(this, "GamePollingRule", {
      description: "Invoke scraper every 5 min during probable MLB game hours",
      schedule: Schedule.cron({
        minute: "0/5",
        hour:   "17-23,0-4",
        month:  "3-11",
        weekDay:"MON-SUN",
        year:   "*"
      }),
      targets: [ new LambdaFunction(fn) ],
    });
  }
}
