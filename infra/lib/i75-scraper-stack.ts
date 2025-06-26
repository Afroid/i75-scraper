import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class I75ScraperStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Creates the S3 bucket
    const bucket = new Bucket(this, 'ScoresBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Creates the Lambda function
    const fn = new NodejsFunction(this, 'ScraperFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../src/handler.ts'),
      handler: 'handler',
      bundling: {
        // Keeps the Lambda runtime’s AWS SDK external, but also minify & source-map
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: true,
      },
      environment: {
        SCORES_BUCKET: bucket.bucketName,
      },
    });

    // Grant write permissions
    bucket.grantPut(fn);

    // EventBridge rule that schedules it every 5 minutes
    new Rule(this, 'ScrapeSchedule', {
      schedule: Schedule.rate(cdk.Duration.minutes(5)),
      targets: [new LambdaFunction(fn)],
    });
  }
}
