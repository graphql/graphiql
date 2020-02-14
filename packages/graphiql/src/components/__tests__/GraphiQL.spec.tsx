/**
 *  Copyright (c) 2019 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { GraphiQL } from '../GraphiQL';
import { getMockStorage } from './helpers/storage';
import { codeMirrorModules } from './helpers/codeMirror';
import {
  mockQuery1,
  mockVariables1,
  mockOperationName1,
  mockBadQuery,
  mockQuery2,
  mockVariables2,
} from './fixtures';

codeMirrorModules.forEach(m => jest.mock(m, () => {}));

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

const waitTime = (timeout: number) =>
  new Promise(resolve => setTimeout(resolve, timeout));

Object.defineProperty(window, 'localStorage', {
  value: getMockStorage(),
});

beforeEach(() => {
  window.localStorage.clear();
});

describe('GraphiQL', () => {
  const noOpFetcher = () => {};

  it('should throw error without fetcher', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<GraphiQL />)).toThrowError(
      'GraphiQL requires a fetcher function',
    );
    spy.mockRestore();
  });

  it('should construct correctly with fetcher', () => {
    expect(() => render(<GraphiQL fetcher={noOpFetcher} />)).not.toThrow();
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
    const { rerender } = render(<GraphiQL fetcher={firstFetcher} />);
    expect(firstCalled).toEqual(true);

    await wait();

    // Re-render does not call fetcher again
    firstCalled = false;
    rerender(<GraphiQL fetcher={firstFetcher} />);
    expect(firstCalled).toEqual(false);

    await wait();

    // Re-render with new fetcher is called.
    rerender(<GraphiQL fetcher={secondFetcher} />);
    expect(secondCalled).toEqual(true);
  });

  it('should not throw error if schema missing and query provided', () => {
    expect(() =>
      render(<GraphiQL fetcher={noOpFetcher} query="{}" />),
    ).not.toThrow();
  });

  it('defaults to the built-in default query', () => {
    const { container } = render(<GraphiQL fetcher={noOpFetcher} />);
    expect(
      container.querySelector('.query-editor .mockCodeMirror').value,
    ).toContain('# Welcome to GraphiQL');
  });

  it('accepts a custom default query', () => {
    const { container } = render(
      <GraphiQL fetcher={noOpFetcher} defaultQuery="GraphQL Party!!" />,
    );
    expect(
      container.querySelector('.query-editor .mockCodeMirror'),
    ).toHaveValue('GraphQL Party!!');
  });
  it('accepts a docExplorerOpen prop', () => {
    const { container } = render(
      <GraphiQL fetcher={noOpFetcher} docExplorerOpen />,
    );
    expect(container.querySelector('.docExplorerWrap')).toBeInTheDocument();
  });
  it('defaults to closed docExplorer', () => {
    const { container } = render(<GraphiQL fetcher={noOpFetcher} />);
    expect(container.querySelector('.docExplorerWrap')).not.toBeInTheDocument();
  });

  it('accepts a defaultVariableEditorOpen param', () => {
    const { container: container1 } = render(
      <GraphiQL fetcher={noOpFetcher} />,
    );
    const queryVariables = container1.querySelector(
      '[aria-label="Query Variables"]',
    );

    expect(queryVariables.style.height).toEqual('');

    const variableEditorTitle = container1.querySelector(
      '#variable-editor-title',
    );
    fireEvent.mouseDown(variableEditorTitle);
    fireEvent.mouseMove(variableEditorTitle);
    expect(queryVariables.style.height).toEqual('200px');

    const { container: container2 } = render(
      <GraphiQL fetcher={noOpFetcher} defaultVariableEditorOpen />,
    );
    expect(
      container2.querySelector('[aria-label="Query Variables"]').style.height,
    ).toEqual('200px');

    const { container: container3 } = render(
      <GraphiQL
        fetcher={noOpFetcher}
        variables="{test: 'value'}"
        defaultVariableEditorOpen={false}
      />,
    );
    const queryVariables3 = container3.querySelector(
      '[aria-label="Query Variables"]',
    );
    expect(queryVariables3.style.height).toEqual('');
  });

  it('adds a history item when the execute query function button is clicked', () => {
    const { getByTitle, container } = render(
      <GraphiQL
        query={mockQuery1}
        variables={mockVariables1}
        operationName={mockOperationName1}
        fetcher={noOpFetcher}
      />,
    );
    fireEvent.click(getByTitle('Execute Query (Ctrl-Enter)'));
    expect(container.querySelectorAll('.history-contents li')).toHaveLength(1);
  });

  it('will not save invalid queries', () => {
    const { getByTitle, container } = render(
      <GraphiQL query={mockBadQuery} fetcher={noOpFetcher} />,
    );
    fireEvent.click(getByTitle('Execute Query (Ctrl-Enter)'));
    expect(container.querySelectorAll('.history-contents li')).toHaveLength(0);
  });

  it('will save if there was not a previously saved query', () => {
    const { getByTitle, container } = render(
      <GraphiQL
        fetcher={noOpFetcher}
        operationName={mockOperationName1}
        query={mockQuery1}
        variables={mockVariables1}
      />,
    );
    fireEvent.click(getByTitle('Execute Query (Ctrl-Enter)'));
    expect(container.querySelectorAll('.history-contents li')).toHaveLength(1);
  });

  it('will not save a query if the query is the same as previous query', () => {
    const { getByTitle, container } = render(
      <GraphiQL
        fetcher={noOpFetcher}
        operationName={mockOperationName1}
        query={mockQuery1}
        variables={mockVariables1}
      />,
    );
    fireEvent.click(getByTitle('Execute Query (Ctrl-Enter)'));
    expect(container.querySelectorAll('.history-contents li')).toHaveLength(1);
    fireEvent.click(getByTitle('Execute Query (Ctrl-Enter)'));
    expect(container.querySelectorAll('.history-contents li')).toHaveLength(1);
  });

  it('will save if new query is different than previous query', async () => {
    const { getByTitle, container } = render(
      <GraphiQL
        fetcher={noOpFetcher}
        operationName={mockOperationName1}
        query={mockQuery1}
        variables={mockVariables1}
      />,
    );
    const executeQueryButton = getByTitle('Execute Query (Ctrl-Enter)');
    fireEvent.click(executeQueryButton);
    expect(container.querySelectorAll('.history-contents li')).toHaveLength(1);

    fireEvent.change(
      container.querySelector('[aria-label="Query Editor"] .mockCodeMirror'),
      {
        target: { value: mockQuery2 },
      },
    );

    // wait for onChange debounce
    await waitTime(150);

    fireEvent.click(executeQueryButton);
    expect(container.querySelectorAll('.history-label')).toHaveLength(2);
  });

  it('will save query if variables are different ', () => {
    const { getByTitle, container } = render(
      <GraphiQL
        fetcher={noOpFetcher}
        operationName={mockOperationName1}
        query={mockQuery1}
        variables={mockVariables1}
      />,
    );
    const executeQueryButton = getByTitle('Execute Query (Ctrl-Enter)');
    fireEvent.click(executeQueryButton);
    expect(container.querySelectorAll('.history-label')).toHaveLength(1);

    fireEvent.change(
      container.querySelector('[aria-label="Query Variables"] .mockCodeMirror'),
      {
        target: { value: mockVariables2 },
      },
    );

    fireEvent.click(executeQueryButton);
    expect(container.querySelectorAll('.history-label')).toHaveLength(2);
  });

  describe('children overrides', () => {
    const MyFunctionalComponent = () => {
      return null;
    };
    const wrap = component => () => (
      <div className="test-wrapper">{component}</div>
    );

    it('properly ignores fragments', () => {
      const myFragment = (
        <React.Fragment>
          <MyFunctionalComponent />
          <MyFunctionalComponent />
        </React.Fragment>
      );

      const { container, getByRole } = render(
        <GraphiQL fetcher={noOpFetcher}>{myFragment}</GraphiQL>,
      );

      expect(
        container.querySelector('.graphiql-container'),
      ).toBeInTheDocument();
      expect(container.querySelector('.title')).toBeInTheDocument();
      expect(getByRole('toolbar')).toBeInTheDocument();
    });

    it('properly ignores non-override children components', () => {
      const { container, getByRole } = render(
        <GraphiQL fetcher={noOpFetcher}>
          <MyFunctionalComponent />
        </GraphiQL>,
      );

      expect(
        container.querySelector('.graphiql-container'),
      ).toBeInTheDocument();
      expect(container.querySelector('.title')).toBeInTheDocument();
      expect(getByRole('toolbar')).toBeInTheDocument();
    });

    it('properly ignores non-override class components', () => {
      class MyClassComponent {
        render() {
          return null;
        }
      }

      const { container, getByRole } = render(
        <GraphiQL fetcher={noOpFetcher}>
          <MyClassComponent />
        </GraphiQL>,
      );

      expect(
        container.querySelector('.graphiql-container'),
      ).toBeInTheDocument();
      expect(container.querySelector('.title')).toBeInTheDocument();
      expect(getByRole('toolbar')).toBeInTheDocument();
    });

    describe('GraphiQL.Logo', () => {
      it('can be overridden using the exported type', () => {
        const { container } = render(
          <GraphiQL fetcher={noOpFetcher}>
            <GraphiQL.Logo>{'My Great Logo'}</GraphiQL.Logo>
          </GraphiQL>,
        );

        expect(
          container.querySelector('.graphiql-container'),
        ).toBeInTheDocument();
      });

      it('can be overridden using a named component', () => {
        const WrappedLogo = wrap(
          <GraphiQL.Logo>{'My Great Logo'}</GraphiQL.Logo>,
        );
        WrappedLogo.displayName = 'GraphiQLLogo';

        const { getByText } = render(
          <GraphiQL fetcher={noOpFetcher}>
            <WrappedLogo />
          </GraphiQL>,
        );

        expect(getByText('My Great Logo')).toBeInTheDocument();
      });
    });

    describe('GraphiQL.Toolbar', () => {
      it('can be overridden using the exported type', () => {
        const { container } = render(
          <GraphiQL fetcher={noOpFetcher}>
            <GraphiQL.Toolbar>
              <GraphiQL.Button />
            </GraphiQL.Toolbar>
          </GraphiQL>,
        );

        expect(
          container.querySelectorAll('[role="toolbar"] .toolbar-button'),
        ).toHaveLength(1);
      });

      it('can be overridden using a named component', () => {
        const WrappedToolbar = wrap(
          <GraphiQL.Toolbar>
            <GraphiQL.Button />
          </GraphiQL.Toolbar>,
        );
        WrappedToolbar.displayName = 'GraphiQLToolbar';

        const { container } = render(
          <GraphiQL fetcher={noOpFetcher}>
            <WrappedToolbar />
          </GraphiQL>,
        );

        expect(container.querySelector('.test-wrapper')).toBeInTheDocument();
        expect(
          container.querySelectorAll('[role="toolbar"] button'),
        ).toHaveLength(1);
      });
    });

    describe('GraphiQL.Footer', () => {
      it('can be overridden using the exported type', () => {
        const { container } = render(
          <GraphiQL fetcher={noOpFetcher}>
            <GraphiQL.Footer>
              <GraphiQL.Button />
            </GraphiQL.Footer>
          </GraphiQL>,
        );

        expect(container.querySelectorAll('.footer button')).toHaveLength(1);
      });

      it('can be overridden using a named component', () => {
        const WrappedFooter = wrap(
          <GraphiQL.Footer data-test-selector="override-footer">
            <GraphiQL.Button />
          </GraphiQL.Footer>,
        );
        WrappedFooter.displayName = 'GraphiQLFooter';

        const { container } = render(
          <GraphiQL fetcher={noOpFetcher}>
            <WrappedFooter />
          </GraphiQL>,
        );

        expect(container.querySelector('.test-wrapper')).toBeInTheDocument();
        expect(container.querySelectorAll('.footer button')).toHaveLength(1);
      });
    });
  });

  it('readjusts the query wrapper flex style field when the result panel is resized', () => {
    const spy = jest
      .spyOn(Element.prototype, 'clientWidth', 'get')
      .mockReturnValue(900);

    const { container } = render(<GraphiQL fetcher={noOpFetcher} />);

    const codeMirrorGutter = container.querySelector(
      '.result-window .CodeMirror-gutter',
    );
    const queryWrap = container.querySelector('.queryWrap');

    fireEvent.mouseDown(codeMirrorGutter, {
      button: 0,
      ctrlKey: false,
    });

    fireEvent.mouseMove(codeMirrorGutter, {
      buttons: 1,
      clientX: 700,
    });

    fireEvent.mouseUp(codeMirrorGutter);

    expect(queryWrap.style.flex).toEqual('3.5');

    spy.mockRestore();
  });

  it('allows for resizing the doc explorer correctly', () => {
    const spy = jest
      .spyOn(Element.prototype, 'clientWidth', 'get')
      .mockReturnValue(1200);

    const { container, getByLabelText } = render(
      <GraphiQL fetcher={noOpFetcher} />,
    );

    fireEvent.click(getByLabelText(/Open Documentation Explorer/i));
    const docExplorerResizer = container.querySelector('.docExplorerResizer');

    fireEvent.mouseDown(docExplorerResizer, {
      clientX: 3,
    });

    fireEvent.mouseMove(docExplorerResizer, {
      buttons: 1,
      clientX: 800,
    });

    fireEvent.mouseUp(docExplorerResizer);

    expect(container.querySelector('.docExplorerWrap').style.width).toBe(
      '403px',
    );

    spy.mockRestore();
  });
});
