module.exports = {
  ...require('./jest.config.base.js')(__dirname),
  projects: ['<rootDir>/packages/*/jest.config.js'],
};
