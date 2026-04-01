/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/tests/**/*.(test|spec).(ts|tsx|js)'],
  moduleNameMapper: {
    '^@/(.*)$': ['<rootDir>/app/$1', '<rootDir>/src/$1', '<rootDir>/lib/$1', '<rootDir>/$1'],
    '^server-only$': '<rootDir>/tests/__mocks__/server-only.ts',
  },
  setupFilesAfterEnv: [],
  verbose: true,
};
