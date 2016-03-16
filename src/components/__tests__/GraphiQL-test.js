import { expect } from 'chai';
import { describe, it } from 'mocha';

import React from 'react';
import TestUtils from 'react-addons-test-utils';

import { GraphiQL } from '../GraphiQL';

const render = props =>
  () => TestUtils.renderIntoDocument(React.createElement(GraphiQL, props));

const createFetcher = () => () => {};

describe('GraphiQL', () => {
  it('should throw error without fetcher', () => {
    expect(render()).to.throw('GraphiQL requires a fetcher function');
  });

  it('should not throw error if schema missing and query provided', () => {
    const renderFn = render({ fetcher: createFetcher(), query: '{}'});
    expect(renderFn).to.not.throw(Error);
  });

  it('should construct correctly with fetcher', () => {
    expect(render({ fetcher: createFetcher() })).to.not.throw(Error);
  });
});
