import { mockClient } from "aws-sdk-client-mock";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { storeLatest, storeSnapshot, s3Client } from "./s3Client";

const s3Mock = mockClient(S3Client);


describe("env-guard in s3Client", () => {
  const ORIGINAL_BUCKET = process.env.SCORES_BUCKET;

  beforeEach(() => {
    s3Mock.reset();
    jest.resetModules();
  });

  afterAll(() => {
    // close any open sockets so Jest can exit cleanly
    s3Client.destroy();
    process.env.SCORES_BUCKET = ORIGINAL_BUCKET;
    jest.resetAllMocks();
  });

  it("storeLatest calls S3 PutObject with correct params", async () => {
    // Simulate success by resolving it
    s3Mock.on(PutObjectCommand).resolves({});

    // Act
    await storeLatest("i75", { "Team A": 42 });

    // Assertions
    expect(s3Mock.calls()).toHaveLength(1);
    expect(s3Mock.calls()[0].args[0].input).toMatchObject({
      Bucket: process.env.SCORES_BUCKET,
      Key: "leagues/i75/latest.json",
      ContentType: "application/json",
      Body: JSON.stringify({ "Team A": 42 }),
    });
  });

  it("storeSnapshot calls S3 PutObject with correct params", async () => {
    // Arrange
    s3Mock.on(PutObjectCommand).resolves({});
    const payload = { "Team B": 7 };
    const snapshotDay = "2025-06-27";

    // Act
    await storeSnapshot("i75", snapshotDay, payload);

    // Assertions
    expect(s3Mock.calls()).toHaveLength(1);
    expect(s3Mock.calls()[0].args[0].input).toMatchObject({
      Bucket: ORIGINAL_BUCKET,
      Key: `leagues/i75/${snapshotDay}.json`,
      ContentType: "application/json",
      Body: JSON.stringify(payload),
      ACL: "private"
    });
  });

  it("throws when SCORES_BUCKET is not defined", async () => {
    delete process.env.SCORES_BUCKET;

    await expect(import("./s3Client"))
      .rejects
      .toThrow("SCORES_BUCKET env var is required");
  });
});
