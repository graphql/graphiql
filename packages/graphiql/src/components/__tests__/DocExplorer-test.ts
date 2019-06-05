import * as React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import { DocExplorer } from '../DocExplorer';

describe('DocExplorer', () => {
  it('renders spinner when no schema prop is present', () => {
    const W = mount(<DocExplorer />);
    const spinner = W.find('.spinner-container')
    expect(spinner.length).to.equal(1);
  });
  it('renders with null schema', () => {
    const W = mount(<DocExplorer schema={null} />);
    const error = W.find('.error-container');
    expect(error.length).to.equal(1);
    expect(error.text()).to.equal('No Schema Available');
  });
});


