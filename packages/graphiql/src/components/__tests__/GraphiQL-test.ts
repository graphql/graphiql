/**
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { expect } from 'chai';
import * as React from 'react';
import { mount } from 'enzyme';

import { GraphiQL } from '../GraphiQL';

const mockStorage = (function() {
  let store = {};
  return {
    getItem(key: string) {
      return store.hasOwnProperty(key) ? store[key] : null;
    },
    setItem(key: string, value: any) {
      store[key] = value.toString();
    },
    clear() {
      store = {};
    },
  };
})();

// The smallest possible introspection result that builds a schema.
const simpleIntrospection = {
  data: {
    __schema: {
      queryType: { name: 'Q' },
      types: [
        {
          kind: 'OBJECT',
          name: 'Q',
          interfaces: [],
          fields: [{ name: 'q', args: [], type: { name: 'Q' } }],
        },
      ],
    },
  },
};

// Spins the promise loop a few times before continuing.
const wait = () =>
  Promise.resolve()
    .then(() => Promise.resolve())
    .then(() => Promise.resolve())
    .then(() => Promise.resolve());

Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
});

describe('GraphiQL', () => {
  const noOpFetcher = () => {};

  it('should throw error without fetcher', () => {
    expect(() => mount(<GraphiQL />).simulateError(
      Error('GraphiQL requires a fetcher function'),
    ));
  })

  it('should construct correctly with fetcher', () => {
    expect(() => mount(<GraphiQL fetcher={noOpFetcher} />)).to.not.throw();
  });

  it('should refetch schema with new fetcher', async () => {
    let firstCalled = false;
    function firstFetcher() {
      firstCalled = true;
      return Promise.resolve(simpleIntrospection);
    }

    let secondCalled = false;
    function secondFetcher() {
      secondCalled = true;
      return Promise.resolve(simpleIntrospection);
    }

    // Initial render calls fetcher
    const instance = mount(<GraphiQL fetcher={firstFetcher} />);
    expect(firstCalled).to.equal(true);

    await wait();

    // Re-render does not call fetcher again
    firstCalled = false;
    instance.setProps({ fetcher: firstFetcher });
    expect(firstCalled).to.equal(false);

    await wait();

    // Re-render with new fetcher is called.
    instance.setProps({ fetcher: secondFetcher });
    expect(secondCalled).to.equal(true);
  });

  it('should not throw error if schema missing and query provided', () => {
    expect(() =>
      mount(<GraphiQL fetcher={noOpFetcher} query="{}" />),
    ).to.not.throw();
  });

  it('defaults to the built-in default query', () => {
    const graphiQL = mount(<GraphiQL fetcher={noOpFetcher} />);
    expect(graphiQL.state().query).to.include('# Welcome to GraphiQL');
  });

  it('accepts a custom default query', () => {
    const graphiQL = mount(
      <GraphiQL fetcher={noOpFetcher} defaultQuery="GraphQL Party!!" />,
    );
    expect(graphiQL.state().query).to.equal('GraphQL Party!!');
  });
});
