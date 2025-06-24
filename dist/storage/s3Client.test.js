"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_client_mock_1 = require("aws-sdk-client-mock");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3Client_1 = require("./s3Client");
const s3Mock = (0, aws_sdk_client_mock_1.mockClient)(client_s3_1.S3Client);
beforeEach(() => {
    s3Mock.reset();
});
test('storeLatest calls S3 PutObject with correct params', async () => {
    s3Mock.on(client_s3_1.PutObjectCommand).resolves({}); // simulate success
    await (0, s3Client_1.storeLatest)('i75', { 'Team A': 42 });
    expect(s3Mock.calls()).toHaveLength(1);
    expect(s3Mock.calls()[0].args[0].input).toMatchObject({
        Bucket: process.env.SCORES_BUCKET,
        Key: 'leagues/i75/latest.json',
        ContentType: 'application/json',
        Body: JSON.stringify({ 'Team A': 42 }),
    });
});
