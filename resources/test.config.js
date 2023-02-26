/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
require('@testing-library/jest-dom/extend-expect');

import { enableFetchMocks } from 'jest-fetch-mock';
enableFetchMocks();

global.document.createRange = function () {
  return {
    setEnd() {},
    setStart() {},
    getClientRects() {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    },
    getBoundingClientRect() {
      return { right: 0 };
    },
  };
};

process.on('unhandledRejection', error => {
  console.error('Unhandled Promise Rejection:');
  console.error(error?.stack);
});
