import { existsSync } from 'fs';
// import { danger, fail, markdown, warn } from "danger"
// Show Jest fails in the PR
import jest from 'danger-plugin-jest';
import eslint from 'danger-plugin-eslint';
import yarn from 'danger-plugin-yarn';

import eslintConfig from './.eslintrc.js';

yarn();

// ESLint
if (existsSync('coverage/eslint/errors.json')) {
  eslint(eslintConfig);
}

// Jest Coverage
if (existsSync('coverage/jest/coverage-final.json')) {
  jest({ testResultsJsonPath: 'coverage/jest/coverage-final.json' });
}
