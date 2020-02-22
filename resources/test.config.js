/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
require('@testing-library/jest-dom/extend-expect');

// global.window = jsdom.window;
// global.document = jsdom.window.document;

global.document.createRange = function() {
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

// take all properties of the window object and also attach it to the
// mocha global object
propagateToGlobal(document.window);

// from mocha-jsdom
// https://github.com/rstacruz/mocha-jsdom/blob/master/index.js#L80
function propagateToGlobal(window) {
  for (const key in window) {
    if (!window.hasOwnProperty(key)) {
      continue;
    }
    if (key in global) {
      continue;
    }
    global[key] = window[key];
  }
}

process.on('unhandledRejection', error => {
  console.error('Unhandled Promise Rejection:');
  console.error((error && error.stack) || error);
});
