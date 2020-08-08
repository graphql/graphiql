/* eslint-disable no-console, object-shorthand */
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */
require('@babel/register', {
  rootMode: 'upward',
});

require('@babel/polyfill', {
  rootMode: 'upward',
});

const JSDOM = require('jsdom').JSDOM;

// setup the simplest document possible
const doc = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
});

// get the window object out of the document
const win = doc.window;

// set globals for mocha that make access to document and window feel
// natural in the test environment
global.document = win.document;
global.window = win;

global.document.createRange = function () {
  return {
    setEnd: function () {},
    setStart: function () {},
    getClientRects: function () {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    },
    getBoundingClientRect: function () {
      return { right: 0 };
    },
  };
};

// take all properties of the window object and also attach it to the
// mocha global object
propagateToGlobal(win);

// from mocha-jsdom
// https://github.com/rstacruz/mocha-jsdom/blob/main/index.js#L80
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

process.on('unhandledRejection', error => {
  console.error('Unhandled Promise Rejection:');
  console.error((error && error.stack) || error);
});
