import * as cdk from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

export class I75ScraperStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Creates the S3 bucket
    const bucket = new Bucket(this, 'ScoresBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // for dev
      autoDeleteObjects: true,
    });

    // Creates the Lambda function
    const fn = new Function(this, 'ScraperFn', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('../dist'),
      handler: 'handler.handler',
      environment: {
        SCORES_BUCKET: bucket.bucketName
      },
    });

    // Grant write permissions
    bucket.grantPut(fn);

    // Schedules it every 5 minutes
    new Rule(this, 'ScrapeSchedule', {
      schedule: Schedule.rate(cdk.Duration.minutes(5)),
      targets: [new LambdaFunction(fn)],
    });
  }
}
