/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { mount } from 'enzyme';

import { QueryEditor } from '../QueryEditor';

describe('QueryEditor', () => {
  it('should renders with no props', () => {
    expect(() => mount(<QueryEditor />)).not.toThrow();
  });

  it('should update codemirror after changing keyMap prop', () => {
    const wrapper = mount(<QueryEditor />);
    expect(wrapper.instance().editor.options.keyMap).toEqual('sublime');

    wrapper.setProps({ keyMap: 'vim' });

    expect(wrapper.instance().editor.options.keyMap).toEqual('vim');
  });
});

