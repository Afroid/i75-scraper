import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { storeLatest } from './s3Client';

const s3Mock = mockClient(S3Client);

beforeEach(() => {
  s3Mock.reset();
});

test('storeLatest calls S3 PutObject with correct params', async () => {
  s3Mock.on(PutObjectCommand).resolves({});  // simulate success

  await storeLatest('i75', { 'Team A': 42 });

  expect(s3Mock.calls()).toHaveLength(1);
  expect(s3Mock.calls()[0].args[0].input).toMatchObject({
    Bucket: process.env.SCORES_BUCKET,
    Key: 'leagues/i75/latest.json',
    ContentType: 'application/json',
    Body: JSON.stringify({ 'Team A': 42 }),
  });
});
