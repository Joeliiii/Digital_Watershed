export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/'
  ],
  testMatch: [
    '**/server/__tests__/**/*.test.js'
  ],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/__tests__/**',
    '!server/test-models.js',
    '!server/seed-user.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
