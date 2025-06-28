import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { I75ScraperStack } from "./i75-scraper-stack";

test("Stack defines S3 bucket, Lambda, and EventBridge rule", () => {
  const app = new App();
  const stack = new I75ScraperStack(app, "TestStack");
  const template = Template.fromStack(stack);

  // S3 bucket
  template.hasResourceProperties("AWS::S3::Bucket", {});

  // Lambda function
  template.hasResourceProperties("AWS::Lambda::Function", {
    Runtime: "nodejs20.x",
    Environment: {
      Variables: {
        SCORES_BUCKET: {}
      }
    }
  });

  // Exactly one EventBridge rule in the stack
  template.resourceCountIs("AWS::Events::Rule", 1);

  // EventBridge rule
  template.hasResourceProperties("AWS::Events::Rule", {
    ScheduleExpression: "cron(0/5 17-23,0-4 ? 3-11 MON-SUN *)"
  });

});
