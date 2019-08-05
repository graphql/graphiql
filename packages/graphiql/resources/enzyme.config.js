/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

require('@babel/polyfill', {
  rootMode: 'upward',
});

import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';

configure({ adapter: new Adapter() });

document.createRange = () => ({
  setEnd() {},
  setStart() {},
  getBoundingClientRect() {
    return { right: 0 };
  },
  getClientRects() {
    return { right: 0 };
  },
});
