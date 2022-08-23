import { createGraphiQLFetcher } from '@graphiql/toolkit';
import {
  GraphiQLPlugin,
  useEditorContext,
  useExecutionContext,
  useSchemaContext,
} from '@graphiql/react';
import { GraphiQL } from 'graphiql';
import GraphiQLExplorer from 'graphiql-explorer';

import 'graphiql/graphiql.css';
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';
import { getDefaultScalarArgValue, makeDefaultArg } from './customArgs';

const DEFAULT_QUERY = `# shift-option/alt-click on a query below to jump to it in the explorer
# option/alt-click on a field in the explorer to select all subfields
query npmPackage {
  npm {
    package(name: "onegraph-apollo-client") {
      name
      homepage
      downloads {
        lastMonth {
          count
        }
      }
    }
  }
}

query graphQLPackage {
  npm {
    package(name: "graphql") {
      name
      homepage
      downloads {
        lastMonth {
          count
        }
      }
    }
  }
}

fragment bundlephobiaInfo on BundlephobiaDependencyInfo {
  name
  size
  version
  history {
    dependencyCount
    size
    gzip
  }
}`;

const fetcher = createGraphiQLFetcher({
  url: 'https://serve.onegraph.com/dynamic?app_id=c333eb5b-04b2-4709-9246-31e18db397e1',
});

const explorerPlugin: GraphiQLPlugin = {
  title: 'GraphiQL Explorer',
  icon: () => (
    <svg height="1em" strokeWidth="1.5" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 6H20M22 6H20M20 6V4M20 6V8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.4 20H2.6C2.26863 20 2 19.7314 2 19.4V11H21.4C21.7314 11 22 11.2686 22 11.6V19.4C22 19.7314 21.7314 20 21.4 20Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 11V4.6C2 4.26863 2.26863 4 2.6 4H8.77805C8.92127 4 9.05977 4.05124 9.16852 4.14445L12.3315 6.85555C12.4402 6.94876 12.5787 7 12.722 7H14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  content: () => <ExplorerPlugin />,
};

type QueryContextType = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
};

const QueryContext = createContext<QueryContextType>({
  query: '',
  setQuery: () => {},
});

function ExplorerPlugin() {
  const { setOperationName } = useEditorContext({ nonNull: true });
  const { schema } = useSchemaContext({ nonNull: true });
  const { run } = useExecutionContext({ nonNull: true });

  const { query, setQuery } = useContext(QueryContext);

  return (
    <GraphiQLExplorer
      schema={schema}
      query={query}
      onEdit={(newQuery: string) => setQuery(newQuery)}
      onRunOperation={(operationName: string | undefined) => {
        if (operationName) {
          setOperationName(operationName);
        }
        run();
      }}
      explorerIsOpen
      getDefaultScalarArgValue={getDefaultScalarArgValue}
      makeDefaultArg={makeDefaultArg}
      colors={{
        keyword: 'hsl(var(--color-primary))',
        def: 'hsl(var(--color-tertiary))',
        property: 'hsl(var(--color-info))',
        qualifier: 'hsl(var(--color-secondary))',
        attribute: 'hsl(var(--color-info))',
        number: 'hsl(var(--color-success))',
        string: 'hsl(var(--color-warning))',
        builtin: 'hsl(var(--color-success))',
        string2: 'hsl(var(--color-secondary))',
        variable: 'hsl(var(--color-secondary))',
        atom: 'hsl(var(--color-tertiary))',
        meta: 'hsl(var(--color-tertiary))',
      }}
      arrowOpen={
        <svg
          viewBox="0 -4 13 15"
          style={{
            color: 'hsla(var(--color-neutral), 0.4)',
            marginRight: 'var(--px-4)',
            height: 'var(--px-16)',
            width: 'var(--px-16)',
          }}
        >
          <path
            d="M3.35355 6.85355L6.14645 9.64645C6.34171 9.84171 6.65829 9.84171 6.85355 9.64645L9.64645 6.85355C9.96143 6.53857 9.73835 6 9.29289 6L3.70711 6C3.26165 6 3.03857 6.53857 3.35355 6.85355Z"
            fill="currentColor"
          />
        </svg>
      }
      arrowClosed={
        <svg
          viewBox="0 -2 13 15"
          style={{
            color: 'hsla(var(--color-neutral), 0.4)',
            marginRight: 'var(--px-4)',
            height: 'var(--px-16)',
            width: 'var(--px-16)',
          }}
        >
          <path
            d="M6.35355 11.1464L9.14645 8.35355C9.34171 8.15829 9.34171 7.84171 9.14645 7.64645L6.35355 4.85355C6.03857 4.53857 5.5 4.76165 5.5 5.20711V10.7929C5.5 11.2383 6.03857 11.4614 6.35355 11.1464Z"
            fill="currentColor"
          />
        </svg>
      }
      checkboxUnchecked={
        <svg
          viewBox="0 0 15 15"
          style={{
            color: 'hsla(var(--color-neutral), 0.4)',
            marginRight: 'var(--px-4)',
            height: 'var(--px-16)',
            width: 'var(--px-16)',
          }}
        >
          <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" fill="none" />
        </svg>
      }
      checkboxChecked={
        <svg
          viewBox="0 0 15 15"
          style={{
            color: 'hsl(var(--color-info))',
            marginRight: 'var(--px-4)',
            height: 'var(--px-16)',
            width: 'var(--px-16)',
          }}
        >
          <circle cx="7.5" cy="7.5" r="7.5" fill="currentColor" />
          <path
            d="M4.64641 7.00106L6.8801 9.23256L10.5017 5.61325"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
      }
      styles={{
        buttonStyle: {
          backgroundColor: 'transparent',
          border: 'none',
          color: 'hsla(var(--color-neutral), 0.6)',
          cursor: 'pointer',
          fontSize: '1em',
        },
        explorerActionsStyle: {
          padding: 'var(--px-8) var(--px-4)',
        },
        actionButtonStyle: {
          backgroundColor: 'transparent',
          border: 'none',
          color: 'hsla(var(--color-neutral), 0.6)',
          cursor: 'pointer',
          fontSize: '1em',
        },
      }}
    />
  );
}

function App() {
  const [query, setQuery] = useState<string>(DEFAULT_QUERY);
  return (
    <QueryContext.Provider
      value={useMemo(() => ({ query, setQuery }), [query])}
    >
      <GraphiQL
        fetcher={fetcher}
        query={query}
        onEditQuery={newQuery => setQuery(newQuery)}
        plugins={[explorerPlugin]}
      />
    </QueryContext.Provider>
  );
}

export default App;
