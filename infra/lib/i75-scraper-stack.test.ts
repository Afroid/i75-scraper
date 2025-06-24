import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { I75ScraperStack } from './i75-scraper-stack';

test('Stack defines S3 bucket, Lambda, and EventBridge rule', () => {
  const app = new App();
  const stack = new I75ScraperStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  // S3 bucket
  template.hasResourceProperties('AWS::S3::Bucket', { });

  // Lambda function
  template.hasResourceProperties('AWS::Lambda::Function', {
    Handler: 'handler.handler',
    Runtime: 'nodejs20.x'
  });

  // EventBridge rule
  template.hasResourceProperties('AWS::Events::Rule', {
    ScheduleExpression: 'rate(5 minutes)'
  });
});
