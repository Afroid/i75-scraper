/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // Automatically collect coverage information while running tests
  collectCoverage: true,

  // Where Jest should output its coverage reports
  coverageDirectory: 'coverage',

  // Which files should be included when computing coverage;
  // by default tests and anything in node_modules are ignored
  collectCoverageFrom: ['src/**/*.{ts,js}'],

  /**
   * html → spits out a browsable HTML report in coverage/lcov-report/index.html.
   * text-summary → prints a tiny pass/fail summary in your terminal.
   * lcov → generates an lcov.info file (a standard coverage-data format) which tools like
   * Coveralls, Codecov, SonarCloud, or CI dashboards can consume.
   */
  coverageReporters: ['text-summary', 'lcov', 'html'],
  // If AWS SDK clients are mocked:
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  setupFiles: [
    '<rootDir>/jest.setupEnv.js'
  ],
};
