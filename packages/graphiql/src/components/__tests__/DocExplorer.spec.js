import React from 'react';
import { mount } from 'enzyme';
import { DocExplorer } from '../DocExplorer';

describe('DocExplorer', () => {
  it('renders spinner when no schema prop is present', () => {
    const W = mount(<DocExplorer />);
    const spinner = W.find('.spinner-container');
    expect(spinner.length).toEqual(1);
  });
  it('renders with null schema', () => {
    const W = mount(<DocExplorer schema={null} />);
    const error = W.find('.error-container');
    expect(error.length).toEqual(1);
    expect(error.text()).toEqual('No Schema Available');
  });
});
