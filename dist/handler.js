"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const mlbFetcher_1 = require("./fetchers/mlbFetcher"); // or espnScraper.ts later
const s3Client_1 = require("./storage/s3Client");
const handler = async () => {
    const scores = await (0, mlbFetcher_1.fetchScores)();
    await (0, s3Client_1.storeLatest)("i75", scores);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
exports.handler = handler;
