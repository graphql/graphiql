// @ts-nocheck

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import { ToolbarButton } from '@graphiql/react';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { GraphiQL, Fetcher } from '../GraphiQL';
import {
  mockQuery1,
  mockVariables1,
  mockOperationName1,
  mockBadQuery,
  mockQuery2,
  mockVariables2,
  mockHeaders1,
  mockHeaders2,
} from './fixtures';

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

const sleep = (delay = 600) => new Promise(res => setTimeout(res, delay));

beforeEach(() => {
  window.localStorage.clear();
});

describe('GraphiQL', () => {
  const noOpFetcher: Fetcher = () => {};

  it('should throw error without fetcher', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<GraphiQL />)).toThrowError(
      'The `GraphiQL` component requires a `fetcher` function to be passed as prop.',
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

  it('defaults to the built-in default query', async () => {
    const { container } = render(<GraphiQL fetcher={noOpFetcher} />);
    await wait();
    expect(
      container.querySelector('[data-testid="query-editor"] .mockCodeMirror')
        .value,
    ).toContain('# Welcome to GraphiQL');
  });

  it('accepts a custom default query', async () => {
    const { container } = render(
      <GraphiQL fetcher={noOpFetcher} defaultQuery="GraphQL Party!!" />,
    );
    await wait();
    expect(
      container.querySelector('[data-testid="query-editor"] .mockCodeMirror'),
    ).toHaveValue('GraphQL Party!!');
  });
  it('accepts a docExplorerOpen prop', () => {
    const { container } = render(
      <GraphiQL fetcher={noOpFetcher} docExplorerOpen />,
    );
    expect(container.querySelector('.graphiql-plugin')).toBeInTheDocument();
  });
  it('defaults to closed docExplorer', () => {
    const { container } = render(<GraphiQL fetcher={noOpFetcher} />);
    expect(container.querySelector('.graphiql-plugin')).not.toBeVisible();
  });

  it('can control the default editor tools visibility', () => {
    const { container: container1 } = render(
      <GraphiQL fetcher={noOpFetcher} />,
    );
    const queryVariables = container1.querySelector('.graphiql-editor-tool');

    expect(queryVariables).not.toBeVisible();

    const secondaryEditorTitle = container1.querySelector(
      '.graphiql-editor-tools',
    );
    fireEvent.mouseDown(secondaryEditorTitle);
    fireEvent.mouseMove(secondaryEditorTitle, { buttons: 1, clientY: 50 });
    expect(queryVariables).toBeVisible();

    const { container: container2 } = render(
      <GraphiQL
        fetcher={noOpFetcher}
        defaultEditorToolsVisibility="variables"
      />,
    );
    expect(container2.querySelector('[aria-label="Variables"]')).toBeVisible();

    const { container: container3 } = render(
      <GraphiQL fetcher={noOpFetcher} defaultEditorToolsVisibility="headers" />,
    );
    expect(container3.querySelector('[aria-label="Headers"]')).toBeVisible();

    const { container: container4 } = render(
      <GraphiQL
        fetcher={noOpFetcher}
        variables="{test: 'value'}"
        defaultEditorToolsVisibility={false}
      />,
    );
    const queryVariables3 = container4.querySelector('.graphiql-editor-tool');
    expect(queryVariables3).not.toBeVisible();
  });

  it('defaults to closed history panel', () => {
    const { container } = render(<GraphiQL fetcher={noOpFetcher} />);
    expect(
      container.querySelector('.graphiql-history'),
    ).not.toBeInTheDocument();
  });

  it('will save history item even when history panel is closed', () => {
    const { getByLabelText, container } = render(
      <GraphiQL
        query={mockQuery1}
        variables={mockVariables1}
        headers={mockHeaders1}
        operationName={mockOperationName1}
        fetcher={noOpFetcher}
      />,
    );
    fireEvent.click(getByLabelText('Execute query (Ctrl-Enter)'));
    fireEvent.click(getByLabelText('Show History'));
    expect(
      container.querySelectorAll('.graphiql-history-items li'),
    ).toHaveLength(1);
  });

  it('adds a history item when the execute query function button is clicked', () => {
    const { getByLabelText, container } = render(
      <GraphiQL
        query={mockQuery1}
        variables={mockVariables1}
        headers={mockHeaders1}
        operationName={mockOperationName1}
        fetcher={noOpFetcher}
      />,
    );
    fireEvent.click(getByLabelText('Show History'));
    fireEvent.click(getByLabelText('Execute query (Ctrl-Enter)'));
    expect(
      container.querySelectorAll('.graphiql-history-items li'),
    ).toHaveLength(1);
  });

  it('will not save invalid queries', () => {
    const { getByLabelText, container } = render(
      <GraphiQL query={mockBadQuery} fetcher={noOpFetcher} />,
    );
    fireEvent.click(getByLabelText('Show History'));
    fireEvent.click(getByLabelText('Execute query (Ctrl-Enter)'));
    expect(
      container.querySelectorAll('.graphiql-history-items li'),
    ).toHaveLength(0);
  });

  it('will save if there was not a previously saved query', () => {
    const { getByLabelText, container } = render(
      <GraphiQL
        fetcher={noOpFetcher}
        operationName={mockOperationName1}
        query={mockQuery1}
        variables={mockVariables1}
        headers={mockHeaders1}
      />,
    );
    fireEvent.click(getByLabelText('Show History'));
    fireEvent.click(getByLabelText('Execute query (Ctrl-Enter)'));
    expect(
      container.querySelectorAll('.graphiql-history-items li'),
    ).toHaveLength(1);
  });

  it('will not save a query if the query is the same as previous query', async () => {
    const { getByLabelText, findByLabelText, container } = render(
      <GraphiQL
        fetcher={noOpFetcher}
        operationName={mockOperationName1}
        query={mockQuery1}
        variables={mockVariables1}
        headers={mockHeaders1}
      />,
    );
    fireEvent.click(getByLabelText('Show History'));
    fireEvent.click(getByLabelText('Execute query (Ctrl-Enter)'));
    expect(
      container.querySelectorAll('.graphiql-history-items li'),
    ).toHaveLength(1);
    fireEvent.click(await findByLabelText('Execute query (Ctrl-Enter)'));
    expect(
      container.querySelectorAll('.graphiql-history-items li'),
    ).toHaveLength(1);
  });

  it('will save if new query is different than previous query', async () => {
    const { getByLabelText, container } = render(
      <GraphiQL
        fetcher={noOpFetcher}
        operationName={mockOperationName1}
        query={mockQuery1}
        variables={mockVariables1}
        headers={mockHeaders1}
      />,
    );
    await wait();
    fireEvent.click(getByLabelText('Show History'));
    const executeQueryButton = getByLabelText('Execute query (Ctrl-Enter)');
    fireEvent.click(executeQueryButton);
    expect(container.querySelectorAll('.graphiql-history-item')).toHaveLength(
      1,
    );

    fireEvent.change(
      container.querySelector('[data-testid="query-editor"] .mockCodeMirror'),
      {
        target: { value: mockQuery2 },
      },
    );

    // wait for onChange debounce
    await sleep(150);

    fireEvent.click(executeQueryButton);
    expect(container.querySelectorAll('.graphiql-history-item')).toHaveLength(
      2,
    );
  });

  it('will save query if variables are different', async () => {
    const { getByLabelText, container } = render(
      <GraphiQL
        fetcher={noOpFetcher}
        operationName={mockOperationName1}
        query={mockQuery1}
        variables={mockVariables1}
        headers={mockHeaders1}
      />,
    );
    await wait();
    fireEvent.click(getByLabelText('Show History'));
    const executeQueryButton = getByLabelText('Execute query (Ctrl-Enter)');
    fireEvent.click(executeQueryButton);
    expect(container.querySelectorAll('.graphiql-history-item')).toHaveLength(
      1,
    );
    await wait();

    fireEvent.change(
      container.querySelector('[aria-label="Variables"] .mockCodeMirror'),
      {
        target: { value: mockVariables2 },
      },
    );

    fireEvent.click(executeQueryButton);
    expect(container.querySelectorAll('.graphiql-history-item')).toHaveLength(
      2,
    );
  });

  it('will save query if headers are different', async () => {
    const { getByLabelText, getByText, container } = render(
      <GraphiQL
        fetcher={noOpFetcher}
        operationName={mockOperationName1}
        query={mockQuery1}
        variables={mockVariables1}
        headers={mockHeaders1}
        headerEditorEnabled
      />,
    );
    await wait();

    fireEvent.click(getByLabelText('Show History'));
    const executeQueryButton = getByLabelText('Execute query (Ctrl-Enter)');
    fireEvent.click(executeQueryButton);
    expect(container.querySelectorAll('.graphiql-history-item')).toHaveLength(
      1,
    );
    await wait();

    fireEvent.click(getByText('Headers'));

    fireEvent.change(
      container.querySelector('[aria-label="Headers"] .mockCodeMirror'),
      {
        target: { value: mockHeaders2 },
      },
    );

    fireEvent.click(executeQueryButton);
    expect(container.querySelectorAll('.graphiql-history-item')).toHaveLength(
      2,
    );
  });

  describe('children overrides', () => {
    const MyFunctionalComponent = () => {
      return null;
    };
    const wrap = component => () =>
      <div className="test-wrapper">{component}</div>;

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
            <GraphiQL.Logo>My Great Logo</GraphiQL.Logo>
          </GraphiQL>,
        );

        expect(
          container.querySelector('.graphiql-container'),
        ).toBeInTheDocument();
      });

      it('can be overridden using a named component', () => {
        const WrappedLogo = wrap(<GraphiQL.Logo>My Great Logo</GraphiQL.Logo>);
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
              <ToolbarButton />
            </GraphiQL.Toolbar>
          </GraphiQL>,
        );

        expect(
          container.querySelectorAll(
            '[role="toolbar"] .graphiql-toolbar-button',
          ),
        ).toHaveLength(1);
      });

      it('can be overridden using a named component', () => {
        const WrappedToolbar = wrap(
          <GraphiQL.Toolbar>
            <ToolbarButton />
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
          container.querySelectorAll(
            '[role="toolbar"] .graphiql-toolbar-button',
          ),
        ).toHaveLength(1);
      });
    });

    describe('GraphiQL.Footer', () => {
      it('can be overridden using the exported type', () => {
        const { container } = render(
          <GraphiQL fetcher={noOpFetcher}>
            <GraphiQL.Footer>
              <ToolbarButton />
            </GraphiQL.Footer>
          </GraphiQL>,
        );

        expect(
          container.querySelectorAll('.graphiql-footer button'),
        ).toHaveLength(1);
      });

      it('can be overridden using a named component', () => {
        const WrappedFooter = wrap(
          <GraphiQL.Footer data-test-selector="override-footer">
            <ToolbarButton />
          </GraphiQL.Footer>,
        );
        WrappedFooter.displayName = 'GraphiQLFooter';

        const { container } = render(
          <GraphiQL fetcher={noOpFetcher}>
            <WrappedFooter />
          </GraphiQL>,
        );

        expect(container.querySelector('.test-wrapper')).toBeInTheDocument();
        expect(
          container.querySelectorAll('.graphiql-footer button'),
        ).toHaveLength(1);
      });
    });
  });

  it('readjusts the query wrapper flex style field when the result panel is resized', async () => {
    // Mock the drag bar width
    const clientWidthSpy = jest
      .spyOn(Element.prototype, 'clientWidth', 'get')
      .mockReturnValue(0);
    // Mock the container width
    const boundingClientRectSpy = jest
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockReturnValue({ left: 0, right: 900 });

    const { container } = render(<GraphiQL fetcher={noOpFetcher} />);

    await wait();

    const dragBar = container.querySelector('.graphiql-horizontal-drag-bar');
    const editors = container.querySelector('.graphiql-editors');

    fireEvent.mouseDown(dragBar, {
      button: 0,
      ctrlKey: false,
    });

    fireEvent.mouseMove(dragBar, {
      buttons: 1,
      clientX: 700,
    });

    fireEvent.mouseUp(dragBar);

    // 700 / (900 - 700) = 3.5
    expect(editors.parentElement.style.flex).toEqual('3.5');

    clientWidthSpy.mockRestore();
    boundingClientRectSpy.mockRestore();
  });

  it('allows for resizing the doc explorer correctly', () => {
    // Mock the drag bar width
    const clientWidthSpy = jest
      .spyOn(Element.prototype, 'clientWidth', 'get')
      .mockReturnValue(0);
    // Mock the container width
    const boundingClientRectSpy = jest
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockReturnValue({ left: 0, right: 1200 });

    const { container } = render(<GraphiQL fetcher={noOpFetcher} />);

    fireEvent.click(
      container.querySelector('[aria-label="Show Documentation Explorer"]'),
    );
    const dragBar = container.querySelectorAll(
      '.graphiql-horizontal-drag-bar',
    )[0];

    fireEvent.mouseDown(dragBar, {
      clientX: 3,
    });

    fireEvent.mouseMove(dragBar, {
      buttons: 1,
      clientX: 800,
    });

    fireEvent.mouseUp(dragBar);

    // 797 / (1200 - 797) = 1.977667493796526
    expect(
      container.querySelector('.graphiql-plugin').parentElement.style.flex,
    ).toBe('1.977667493796526');

    clientWidthSpy.mockRestore();
    boundingClientRectSpy.mockRestore();
  });

  describe('Tabs', () => {
    it('show tabs if there are more than one', () => {
      const { container } = render(<GraphiQL fetcher={noOpFetcher} />);

      expect(
        container.querySelectorAll('.graphiql-tabs .graphiql-tab'),
      ).toHaveLength(0);

      fireEvent.click(container.querySelector('.graphiql-tab-add'));
      expect(
        container.querySelectorAll('.graphiql-tabs .graphiql-tab'),
      ).toHaveLength(2);

      fireEvent.click(container.querySelector('.graphiql-tab-add'));
      expect(
        container.querySelectorAll('.graphiql-tabs .graphiql-tab'),
      ).toHaveLength(3);
    });
    it('each tab has a close button when multiple tabs are open', () => {
      const { container } = render(<GraphiQL fetcher={noOpFetcher} />);

      expect(
        container.querySelectorAll('.graphiql-tab .graphiql-tab-close'),
      ).toHaveLength(0);

      fireEvent.click(container.querySelector('.graphiql-tab-add'));
      expect(
        container.querySelectorAll('.graphiql-tab .graphiql-tab-close'),
      ).toHaveLength(2);

      fireEvent.click(container.querySelector('.graphiql-tab-add'));
      expect(
        container.querySelectorAll('.graphiql-tab .graphiql-tab-close'),
      ).toHaveLength(3);
    });
    it('close button removes a tab', () => {
      const { container } = render(<GraphiQL fetcher={noOpFetcher} />);

      fireEvent.click(container.querySelector('.graphiql-tab-add'));

      expect(
        container.querySelectorAll('.graphiql-tab .graphiql-tab-close'),
      ).toHaveLength(2);

      fireEvent.click(
        container.querySelector('.graphiql-tab .graphiql-tab-close'),
      );
      expect(
        container.querySelectorAll('.graphiql-tabs .graphiql-tab'),
      ).toHaveLength(0);
      expect(
        container.querySelectorAll('.graphiql-tab .graphiql-tab-close'),
      ).toHaveLength(0);
    });
  });
});
