/**
 *  Copyright (c) 2020 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
require('@testing-library/jest-dom/extend-expect');

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
  console.error((error && error.stack) || error);
});
