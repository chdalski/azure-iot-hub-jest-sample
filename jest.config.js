module.exports = {
  preset: "ts-jest",
  testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],
  coverageDirectory: "<rootDir>/coverage",
  testEnvironment: "node",
  testRegex: "\\.spec\\.ts$",
  // watchPathIgnorePatterns: ["\\.integration\\.spec\\.ts$"],
  testTimeout: 15000,
  setupFilesAfterEnv: ["dotenv/config"],
  // collectCoverage: true,
};
