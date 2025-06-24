/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.{ts,js}'],
  coverageReporters: ['text-summary', 'lcov', 'html'],
  // If AWS SDK clients are mocked:
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
