/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "node16",
          moduleResolution: "node16",
          target: "es2022",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          types: ["jest", "node"],
        },
      },
    ],
  },
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
};