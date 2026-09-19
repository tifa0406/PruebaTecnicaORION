module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 10000,
  collectCoverageFrom: [
    'src/services/**/*.js',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
  ],
};