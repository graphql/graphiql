/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
const babelJest = require('babel-jest');

// thanks to @bobbybobby!
// https://github.com/facebook/jest/issues/7359#issuecomment-471509996

module.exports = babelJest.createTransformer({
  rootMode: 'upward',
});
