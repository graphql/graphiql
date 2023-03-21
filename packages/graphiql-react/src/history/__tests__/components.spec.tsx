import { fireEvent, render } from '@testing-library/react';
import { ComponentProps } from 'react';
import { formatQuery, HistoryItem } from '../components';
import { HistoryContextProvider } from '../context';
import { useEditorContext } from '../../editor';
import { Tooltip } from '../../ui';

jest.mock('../../editor', () => {
  const mockedSetQueryEditor = jest.fn();
  const mockedSetVariableEditor = jest.fn();
  const mockedSetHeaderEditor = jest.fn();
  return {
    useEditorContext() {
      return {
        queryEditor: { setValue: mockedSetQueryEditor },
        variableEditor: { setValue: mockedSetVariableEditor },
        headerEditor: { setValue: mockedSetHeaderEditor },
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

function QueryHistoryItemWithContext(props: QueryHistoryItemProps) {
  return (
    <Tooltip.Provider>
      <HistoryContextProvider>
        <HistoryItem {...props} />
      </HistoryContextProvider>
    </Tooltip.Provider>
  );
}

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
  const mockedSetQueryEditor = useEditorContext()?.queryEditor
    ?.setValue as jest.Mock;
  const mockedSetVariableEditor = useEditorContext()?.variableEditor
    ?.setValue as jest.Mock;
  const mockedSetHeaderEditor = useEditorContext()?.headerEditor
    ?.setValue as jest.Mock;
  beforeEach(() => {
    mockedSetQueryEditor.mockClear();
    mockedSetVariableEditor.mockClear();
    mockedSetHeaderEditor.mockClear();
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
