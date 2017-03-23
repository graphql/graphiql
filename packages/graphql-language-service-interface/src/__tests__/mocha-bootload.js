/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

process.on('unhandledRejection', error => {
  /* eslint-disable no-console */
  console.error('Unhandled Promise Rejection:');
  console.error((error && error.stack) || error);
  /* eslint-enable no-console */
});
