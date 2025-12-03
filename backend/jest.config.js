module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/scripts/**',
        '!src/database/**'
    ],
    testMatch: [
        '**/__tests__/**/*.test.js'
    ],
    verbose: true,
    testTimeout: 10000
};
