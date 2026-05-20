import { type Mock, describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { formatQuery, HistoryItem } from '../components';
import { HistoryStore } from '../context';
import { Tooltip, GraphiQLProvider, useGraphiQL } from '@graphiql/react';

vi.mock('@graphiql/react', async () => {
  const originalModule = await vi.importActual('@graphiql/react');
  const mockedSetQueryEditor = vi.fn();
  const mockedSetVariableEditor = vi.fn();
  const mockedSetHeaderEditor = vi.fn();
  const mockedSetDiffOverlay = vi.fn();
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
        setDiffOverlay: mockedSetDiffOverlay,
      };
    },
    useGraphiQLActions() {
      return {
        setDiffOverlay: mockedSetDiffOverlay,
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
  const state = useGraphiQL(s => s) as unknown as {
    queryEditor: { setValue: Mock };
    variableEditor: { setValue: Mock };
    headerEditor: { setValue: Mock };
    setDiffOverlay: Mock;
  };
  const { queryEditor, variableEditor, headerEditor } = state;
  const mockedSetQueryEditor = queryEditor.setValue;
  const mockedSetVariableEditor = variableEditor.setValue;
  const mockedSetHeaderEditor = headerEditor.setValue;
  const mockedSetDiffOverlay = state.setDiffOverlay;

  beforeEach(() => {
    mockedSetQueryEditor.mockClear();
    mockedSetVariableEditor.mockClear();
    mockedSetHeaderEditor.mockClear();
    mockedSetDiffOverlay.mockClear();
  });

  it('renders operationName if label is not provided', () => {
    const otherMockProps = { item: { operationName: mockOperationName } };
    const props = getMockProps(otherMockProps);
    const { container } = render(<QueryHistoryItemWithContext {...props} />);
    expect(
      container.querySelector('button.graphiql-history-item-label')!
        .textContent,
    ).toBe(mockOperationName);
  });

  it('renders a string version of the query if label or operation name are not provided', () => {
    const { container } = render(
      <QueryHistoryItemWithContext {...getMockProps()} />,
    );
    expect(
      container.querySelector('button.graphiql-history-item-label')!
        .textContent,
    ).toBe(formatQuery(mockQuery));
  });

  it('selects the item when history label button is clicked', () => {
    const otherMockProps = { item: { operationName: mockOperationName } };
    const mockProps = getMockProps(otherMockProps);
    const { container } = render(
      <QueryHistoryItemWithContext {...mockProps} />,
    );
    fireEvent.click(
      container.querySelector('button.graphiql-history-item-label')!,
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

  it('opens a diff overlay on alt-click and does not load the editors', () => {
    const otherMockProps = { item: { operationName: mockOperationName } };
    const mockProps = getMockProps(otherMockProps);
    const { container } = render(
      <QueryHistoryItemWithContext {...mockProps} />,
    );
    fireEvent.click(
      container.querySelector('button.graphiql-history-item-label')!,
      { altKey: true },
    );
    expect(mockedSetDiffOverlay).toHaveBeenCalledTimes(1);
    const overlay = mockedSetDiffOverlay.mock.calls[0]![0];
    expect(overlay.modifiedQuery).toBe(mockProps.item.query);
    expect(overlay.label).toBe(mockOperationName);
    expect(typeof overlay.onApply).toBe('function');
    expect(mockedSetQueryEditor).not.toHaveBeenCalled();
    expect(mockedSetVariableEditor).not.toHaveBeenCalled();
    expect(mockedSetHeaderEditor).not.toHaveBeenCalled();
  });

  it('the diff overlay onApply loads the row into the editors', () => {
    const otherMockProps = { item: { operationName: mockOperationName } };
    const mockProps = getMockProps(otherMockProps);
    const { container } = render(
      <QueryHistoryItemWithContext {...mockProps} />,
    );
    fireEvent.click(
      container.querySelector('button.graphiql-history-item-label')!,
      { altKey: true },
    );
    const overlay = mockedSetDiffOverlay.mock.calls[0]![0];
    overlay.onApply();
    expect(mockedSetQueryEditor).toHaveBeenCalledWith(mockProps.item.query);
    expect(mockedSetVariableEditor).toHaveBeenCalledWith(
      mockProps.item.variables,
    );
    expect(mockedSetHeaderEditor).toHaveBeenCalledWith(mockProps.item.headers);
  });

  it('plain-click still loads the editors and does not open a diff overlay', () => {
    const otherMockProps = { item: { operationName: mockOperationName } };
    const mockProps = getMockProps(otherMockProps);
    const { container } = render(
      <QueryHistoryItemWithContext {...mockProps} />,
    );
    fireEvent.click(
      container.querySelector('button.graphiql-history-item-label')!,
    );
    expect(mockedSetDiffOverlay).not.toHaveBeenCalled();
    expect(mockedSetQueryEditor).toHaveBeenCalledWith(mockProps.item.query);
  });

  it('renders label input if the edit label button is clicked', () => {
    const { container, getByLabelText } = render(
      <QueryHistoryItemWithContext {...getMockProps()} />,
    );
    fireEvent.click(getByLabelText('Edit label'));
    expect(container.querySelectorAll('li.editable').length).toBe(1);
    expect(container.querySelectorAll('input').length).toBe(1);
    expect(
      container.querySelectorAll('button.graphiql-history-item-label').length,
    ).toBe(0);
  });
});
