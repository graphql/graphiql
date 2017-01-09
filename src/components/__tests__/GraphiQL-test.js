/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { GraphiQL } from '../GraphiQL';

document.createRange = () => ({
  setEnd() {},
  setStart() {},
  getBoundingClientRect() {
    return { right: 0 };
  },
  getClientRects() {
    return { right: 0 };
  }
});

const mockStorage = (function () {
  let store = {};
  return {
    getItem(key) {
      return store.hasOwnProperty(key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    }
  };
}());

Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
});

describe('GraphiQL', () => {
  const noOpFetcher = () => {};

  it('should throw error without fetcher', () => {
    expect(() => ReactTestRenderer.create(
      <GraphiQL />
    )).to.throw(
      'GraphiQL requires a fetcher function'
    );
  });

  it('should construct correctly with fetcher', () => {
    expect(() => ReactTestRenderer.create(
      <GraphiQL fetcher={noOpFetcher} />
    )).to.not.throw();
  });

  it('should not throw error if schema missing and query provided', () => {
    expect(() => ReactTestRenderer.create(
      <GraphiQL fetcher={noOpFetcher} query="{}" />
    )).to.not.throw();
  });

  it('defaults to the built-in default query', () => {
    const graphiQL = ReactTestRenderer.create(
      <GraphiQL fetcher={noOpFetcher} />
    );
    expect(graphiQL.getInstance().state.query)
      .to.include('# Welcome to GraphiQL');
  });

  it('accepts a custom default query', () => {
    const graphiQL = ReactTestRenderer.create(
      <GraphiQL
        fetcher={noOpFetcher}
        defaultQuery='GraphQL Party!!'
      />
    );
    expect(graphiQL.getInstance().state.query).to.equal('GraphQL Party!!');
  });
});
