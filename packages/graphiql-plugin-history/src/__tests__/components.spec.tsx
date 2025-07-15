import type { Mock } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { formatQuery, HistoryItem } from '../components';
import { HistoryStore } from '../context';
import { Tooltip, GraphiQLProvider, useGraphiQL } from '@graphiql/react';

vi.mock('@graphiql/react', async () => {
  const originalModule = await vi.importActual('@graphiql/react');
  const mockedSetQueryEditor = vi.fn();
  const mockedSetVariableEditor = vi.fn();
  const mockedSetHeaderEditor = vi.fn();
  return {
    ...originalModule,
    useGraphiQL() {
      return {
        queryEditor: { setValue: mockedSetQueryEditor },
        variableEditor: { setValue: mockedSetVariableEditor },
        headerEditor: { setValue: mockedSetHeaderEditor },
        tabs: [],
        storage: {
          get() {},
        },
      };
    },
  };
});

const mockQuery = /* GraphQL */ `
  query Test($string: String) {
    test {
      hasArgs(string: $string)
    }
  }
`;

const mockVariables = JSON.stringify({ string: 'string' });

const mockHeaders = JSON.stringify({ foo: 'bar' });

const mockOperationName = 'Test';

type QueryHistoryItemProps = ComponentProps<typeof HistoryItem>;

const QueryHistoryItemWithContext: typeof HistoryItem = props => {
  return (
    <Tooltip.Provider>
      <GraphiQLProvider fetcher={vi.fn()}>
        <HistoryStore>
          <HistoryItem {...props} />
        </HistoryStore>
      </GraphiQLProvider>
    </Tooltip.Provider>
  );
};

const baseMockProps: QueryHistoryItemProps = {
  item: {
    query: mockQuery,
    variables: mockVariables,
    headers: mockHeaders,
    favorite: false,
  },
};

function getMockProps(
  customProps?: Partial<QueryHistoryItemProps>,
): QueryHistoryItemProps {
  return {
    ...baseMockProps,
    ...customProps,
    item: { ...baseMockProps.item, ...customProps?.item },
  };
}

describe('QueryHistoryItem', () => {
  const { queryEditor, variableEditor, headerEditor } = useGraphiQL(
    state => state,
  );
  const mockedSetQueryEditor = queryEditor!.setValue as Mock;
  const mockedSetVariableEditor = variableEditor!.setValue as Mock;
  const mockedSetHeaderEditor = headerEditor!.setValue as Mock;
  const timeout = 2_000;

  beforeEach(() => {
    mockedSetQueryEditor.mockClear();
    mockedSetVariableEditor.mockClear();
    mockedSetHeaderEditor.mockClear();
  });

  it('renders operationName if label is not provided', async () => {
    const otherMockProps = { item: { operationName: mockOperationName } };
    const props = getMockProps(otherMockProps);
    const { container } = render(<QueryHistoryItemWithContext {...props} />);
    await waitFor(
      () => {
        const el = container.querySelector<HTMLButtonElement>(
          'button.graphiql-history-item-label',
        );
        expect(el?.textContent).toBe(mockOperationName);
      },
      { timeout },
    );
  });

  it('renders a string version of the query if label or operation name are not provided', async () => {
    const { container } = render(
      <QueryHistoryItemWithContext {...getMockProps()} />,
    );
    await waitFor(
      () => {
        const el = container.querySelector<HTMLButtonElement>(
          'button.graphiql-history-item-label',
        );
        expect(el?.textContent).toBe(formatQuery(mockQuery));
      },
      { timeout },
    );
  });

  it('selects the item when history label button is clicked', async () => {
    const otherMockProps = { item: { operationName: mockOperationName } };
    const mockProps = getMockProps(otherMockProps);
    const { container } = render(
      <QueryHistoryItemWithContext {...mockProps} />,
    );
    await waitFor(
      () => {
        const el = container.querySelector<HTMLButtonElement>(
          'button.graphiql-history-item-label',
        );
        expect(el).toBeTruthy();
        fireEvent.click(el!);
      },
      { timeout },
    );
    expect(mockedSetQueryEditor).toHaveBeenCalledTimes(1);
    expect(mockedSetQueryEditor).toHaveBeenCalledWith(mockProps.item.query);
    expect(mockedSetVariableEditor).toHaveBeenCalledTimes(1);
    expect(mockedSetVariableEditor).toHaveBeenCalledWith(
      mockProps.item.variables,
    );
    expect(mockedSetHeaderEditor).toHaveBeenCalledTimes(1);
    expect(mockedSetHeaderEditor).toHaveBeenCalledWith(mockProps.item.headers);
  });

  it('renders label input if the edit label button is clicked', async () => {
    const { container, getByLabelText } = render(
      <QueryHistoryItemWithContext {...getMockProps()} />,
    );
    await waitFor(
      () => {
        fireEvent.click(getByLabelText('Edit label'));
      },
      { timeout },
    );
    expect(container.querySelectorAll('li.editable').length).toBe(1);
    expect(container.querySelectorAll('input').length).toBe(1);
    expect(
      container.querySelectorAll('button.graphiql-history-item-label').length,
    ).toBe(0);
  });
});
