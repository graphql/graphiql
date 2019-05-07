/* eslint-disable no-console, object-shorthand */
/**
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

const JSDOM = require('jsdom').JSDOM;

// setup the simplest document possible
const doc = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

// get the window object out of the document
const win = doc.window;

// set globals for mocha that make access to document and window feel
// natural in the test environment
global.document = win.document;
global.window = win;

global.document.createRange = function() {
  return {
    setEnd: function() {},
    setStart: function() {},
    getBoundingClientRect: function() {
      return { right: 0 };
    },
  };
};

// take all properties of the window object and also attach it to the
// mocha global object
propagateToGlobal(win);

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

const chai = require('chai');

const chaiSubset = require('chai-subset');
chai.use(chaiSubset);

process.on('unhandledRejection', function(error) {
  console.error('Unhandled Promise Rejection:');
  console.error((error && error.stack) || error);
});
