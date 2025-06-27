#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { I75ScraperStack } from "../lib/i75-scraper-stack"

const app = new cdk.App();
new I75ScraperStack(app, "I75ScraperStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
});
