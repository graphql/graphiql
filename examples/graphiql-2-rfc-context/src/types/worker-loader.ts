/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 * */

declare module 'worker-loader!*' {
  export default class WebpackWorker extends Worker {
    constructor();
  }
}
