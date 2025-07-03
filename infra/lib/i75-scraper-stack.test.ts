import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { I75ScraperStack } from "./i75-scraper-stack";

test("Stack defines S3 bucket, two Lambdas, and two EventBridge rules", () => {
  const app = new App();
  const stack = new I75ScraperStack(app, "TestStack");
  const template = Template.fromStack(stack);

  // S3 bucket
  template.hasResourceProperties("AWS::S3::Bucket", {});

  // Three Lambda functions
  template.resourceCountIs("AWS::Lambda::Function", 3);

  // -- exactly two of our Lambdas export SCORES_BUCKET env var --
  const funcsWithBucket = template.findResources("AWS::Lambda::Function", {
    Properties: {
      Environment: {
        Variables: {
          SCORES_BUCKET: Match.anyValue(),      // must exist, but we don’t care about the exact Ref
        },
      },
    },
  });
  expect(Object.keys(funcsWithBucket)).toHaveLength(2);

  // Exactly two EventBridge rules now
  template.resourceCountIs("AWS::Events::Rule", 2);

  // One rule for the daily snapshot rule
  template.hasResourceProperties("AWS::Events::Rule", {
    ScheduleExpression: "cron(5 8 * 3-11 ? *)"
  });

  // One rule for live‐updates
  template.hasResourceProperties("AWS::Events::Rule", {
    ScheduleExpression: "cron(0/5 16-23,0-8 ? 3-11 MON-SUN *)"
  });

});
