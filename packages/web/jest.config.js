/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

const nextJest = require("next/jest.js");

const createJestConfig = nextJest({
  dir: "./",
});

const config = {
  clearMocks: true,
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  coverageReporters: ["text", "lcov", "html", "json"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/app/$1",
    "^@server/(.*)$": "<rootDir>/../server/src/$1",
    "^@shared/(.*)$": "<rootDir>/../shared/src/$1",
  },
  moduleDirectories: ["node_modules", "<rootDir>/../../node_modules"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/?(*.)+(spec|test).[jt]s?(x)"],
};

module.exports = createJestConfig(config);
