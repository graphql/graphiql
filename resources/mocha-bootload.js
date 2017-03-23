/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */
/* eslint-disable no-console, object-shorthand */

process.on('unhandledRejection', function(error) {
  console.error('Unhandled Promise Rejection:');
  console.error((error && error.stack) || error);
});
