"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeLatest = storeLatest;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3 = new client_s3_1.S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.SCORES_BUCKET;
async function storeLatest(leagueId, data) {
    await s3.send(new client_s3_1.PutObjectCommand({
        Bucket: BUCKET,
        Key: `leagues/${leagueId}/latest.json`,
        Body: JSON.stringify(data),
        ContentType: "application/json",
        // ACL: "public-read",
    }));
}
