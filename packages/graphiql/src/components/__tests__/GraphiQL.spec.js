/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { mount } from 'enzyme';

import { GraphiQL } from '../GraphiQL';

const mockStorage = (function() {
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
    expect(() =>
      mount(<GraphiQL />).simulateError(
        Error('GraphiQL requires a fetcher function')
      )
    );
  });

  it('should construct correctly with fetcher', () => {
    expect(() => mount(<GraphiQL fetcher={noOpFetcher} />)).not.toThrow();
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
    expect(firstCalled).toEqual(true);

    await wait();

    // Re-render does not call fetcher again
    firstCalled = false;
    instance.setProps({ fetcher: firstFetcher });
    expect(firstCalled).toEqual(false);

    await wait();

    // Re-render with new fetcher is called.
    instance.setProps({ fetcher: secondFetcher });
    expect(secondCalled).toEqual(true);
  });

  it('should not throw error if schema missing and query provided', () => {
    expect(() =>
      mount(<GraphiQL fetcher={noOpFetcher} query="{}" />)
    ).not.toThrow();
  });

  it('defaults to the built-in default query', () => {
    const graphiQL = mount(<GraphiQL fetcher={noOpFetcher} />);
    expect(graphiQL.state().query).toContain('# Welcome to GraphiQL');
  });

  it('accepts a custom default query', () => {
    const graphiQL = mount(
      <GraphiQL fetcher={noOpFetcher} defaultQuery="GraphQL Party!!" />
    );
    expect(graphiQL.state().query).toEqual('GraphQL Party!!');
  });
  it('accepts a docExplorerOpen prop', () => {
    const graphiQL = mount(<GraphiQL fetcher={noOpFetcher} docExplorerOpen />);
    expect(graphiQL.state().docExplorerOpen).toEqual(true);
  });
  it('defaults to closed docExplorer', () => {
    const graphiQL = mount(<GraphiQL fetcher={noOpFetcher} />);
    expect(graphiQL.state().docExplorerOpen).toEqual(false);
  });

  it('accepts a defaultVariableEditorOpen param', () => {
    let graphiQL = mount(<GraphiQL fetcher={noOpFetcher} />);
    expect(graphiQL.state().variableEditorOpen).toEqual(false);
    expect(graphiQL.state().defaultVariableEditorOpen).toEqual(undefined);

    graphiQL = mount(
      <GraphiQL fetcher={noOpFetcher} defaultVariableEditorOpen />
    );
    expect(graphiQL.state().variableEditorOpen).toEqual(true);

    graphiQL = mount(
      <GraphiQL
        fetcher={noOpFetcher}
        variables="{test: 'value'}"
        defaultVariableEditorOpen={false}
      />
    );
    expect(graphiQL.state().variableEditorOpen).toEqual(false);
  });

  describe('children overrides', () => {
    const MyFunctionalComponent = () => { return null; }
    const wrap = (component) => () => <div>{component}</div>;

    it('properly ignores fragments', () => {
      const myFragment = (
        <React.Fragment>
          <MyFunctionalComponent />
          <MyFunctionalComponent />
        </React.Fragment>
      );

      const graphiQL = mount(
        <GraphiQL fetcher={noOpFetcher}>
          {myFragment}
        </GraphiQL>
      );

      expect(graphiQL.exists()).toEqual(true);
      expect(graphiQL.find(GraphiQL.Logo).exists()).toEqual(true);
      expect(graphiQL.find(GraphiQL.Toolbar).exists()).toEqual(true);
    });

    it('properly ignores non-override children components', () => {
      const graphiQL = mount(
        <GraphiQL fetcher={noOpFetcher}>
          <MyFunctionalComponent />
        </GraphiQL>
      );

      expect(graphiQL.exists()).toEqual(true);
      expect(graphiQL.find(GraphiQL.Logo).exists()).toEqual(true);
      expect(graphiQL.find(GraphiQL.Toolbar).exists()).toEqual(true);
    });

    it('properly ignores non-override class components', () => {
      class MyClassComponent {
        render() { return null };
      }

      const graphiQL = mount(
        <GraphiQL fetcher={noOpFetcher}>
          <MyClassComponent />
        </GraphiQL>
      );

      expect(graphiQL.exists()).toEqual(true);
      expect(graphiQL.find(GraphiQL.Logo).exists()).toEqual(true);
      expect(graphiQL.find(GraphiQL.Toolbar).exists()).toEqual(true);
    });

    describe('GraphiQL.Logo', () => {
      it('can be overridden using the exported type', () => {
        const graphiQL = mount(
          <GraphiQL fetcher={noOpFetcher} data-test-selector="override-logo">
            <GraphiQL.Logo>{'My Great Logo'}</GraphiQL.Logo>
          </GraphiQL>
        );

        expect(graphiQL.find({ 'data-test-selector': 'override-logo' }).exists()).toEqual(true);
      });

      it('can be overridden using a named component', () => {
        const WrappedLogo = wrap(<GraphiQL.Logo data-test-selector="override-logo">{'My Great Logo'}</GraphiQL.Logo>);
        WrappedLogo.displayName = 'GraphiQLLogo';

        const graphiQL = mount(
          <GraphiQL fetcher={noOpFetcher}>
            <WrappedLogo />
          </GraphiQL>
        );

        expect(graphiQL.find(WrappedLogo).exists()).toEqual(true);
        expect(graphiQL.find({ 'data-test-selector': 'override-logo' }).exists()).toEqual(true);
      });
    });

    describe('GraphiQL.Toolbar', () => {
      it('can be overridden using the exported type', () => {
        const graphiQL = mount(
          <GraphiQL fetcher={noOpFetcher}>
            <GraphiQL.Toolbar data-test-selector="override-toolbar">
              <GraphiQL.Button />
            </GraphiQL.Toolbar>
          </GraphiQL>
        );

        expect(graphiQL.find({ 'data-test-selector': 'override-toolbar' }).exists()).toEqual(true);
      });

      it('can be overridden using a named component', () => {
        const WrappedToolbar = wrap(
          <GraphiQL.Toolbar data-test-selector="override-toolbar">
            <GraphiQL.Button />
          </GraphiQL.Toolbar>
        );
        WrappedToolbar.displayName = 'GraphiQLToolbar';

        const graphiQL = mount(
          <GraphiQL fetcher={noOpFetcher}>
            <WrappedToolbar />
          </GraphiQL>
        );

        expect(graphiQL.find(WrappedToolbar).exists()).toEqual(true);
        expect(graphiQL.find({ 'data-test-selector': 'override-toolbar' }).exists()).toEqual(true);
      });
    });

    describe('GraphiQL.Footer', () => {
      it('can be overridden using the exported type', () => {
        const graphiQL = mount(
          <GraphiQL fetcher={noOpFetcher}>
            <GraphiQL.Footer data-test-selector="override-footer">
              <GraphiQL.Button />
            </GraphiQL.Footer>
          </GraphiQL>
        );

        expect(graphiQL.find({ 'data-test-selector': 'override-footer' }).exists()).toEqual(true);
      });

      it('can be overridden using a named component', () => {
        const WrappedFooter = wrap(
          <GraphiQL.Footer data-test-selector="override-footer">
            <GraphiQL.Button />
          </GraphiQL.Footer>
        );
        WrappedFooter.displayName = 'GraphiQLFooter';

        const graphiQL = mount(
          <GraphiQL fetcher={noOpFetcher}>
            <WrappedFooter />
          </GraphiQL>
        );

        expect(graphiQL.find(WrappedFooter).exists()).toEqual(true);
        expect(graphiQL.find({ 'data-test-selector': 'override-footer' }).exists()).toEqual(true);
      });
    });
  });
});
