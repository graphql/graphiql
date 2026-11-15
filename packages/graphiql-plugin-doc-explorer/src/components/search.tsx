import {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLNamedType,
  isInputObjectType,
  isInterfaceType,
  isNamedType,
  isObjectType,
} from 'graphql';
import { FC, useEffect, useRef, useState } from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from '@headlessui/react';
import {
  formatShortcutForOS,
  useGraphiQL,
  KeycapHint,
  MagnifyingGlassIcon,
  debounce,
  KEY_MAP,
} from '@graphiql/react';
import { useDocExplorer, useDocExplorerActions } from '../context';
import { renderType } from './utils';
import './search.css';

export const Search: FC = () => {
  const explorerNavStack = useDocExplorer();
  const { push } = useDocExplorerActions();

  const inputRef = useRef<HTMLInputElement>(null!);
  const getSearchResults = useSearchResults();
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState(() => getSearchResults(searchValue));
  const [isFocused, setIsFocused] = useState(false);
  const debouncedGetSearchResults = debounce(200, (search: string) => {
    setResults(getSearchResults(search));
  });

  useEffect(() => {
    debouncedGetSearchResults(searchValue);
  }, [debouncedGetSearchResults, searchValue]);

  const navItem = explorerNavStack.at(-1)!;

  const onSelect = (def: TypeMatch | FieldMatch | null) => {
    // `null` when we remove search value
    if (!def) {
      return;
    }
    push(
      'field' in def
        ? { name: def.field.name, def: def.field }
        : { name: def.type.name, def: def.type },
    );
  };
  const shortcutKeys = formatShortcutForOS(KEY_MAP.searchInDocs.key).split('-');

  const shouldSearchBoxAppear =
    explorerNavStack.length === 1 ||
    isObjectType(navItem.def) ||
    isInterfaceType(navItem.def) ||
    isInputObjectType(navItem.def);
  if (!shouldSearchBoxAppear) {
    return null;
  }

  return (
    <Combobox
      as="div"
      className="graphiql-doc-explorer-search"
      onChange={onSelect}
      data-state={isFocused ? undefined : 'idle'}
      aria-label={`Search ${navItem.name}...`}
    >
      <div
        className="graphiql-doc-explorer-search-input"
        onClick={() => {
          inputRef.current.focus();
        }}
      >
        <MagnifyingGlassIcon aria-hidden="true" />
        <ComboboxInput
          autoComplete="off"
          onChange={event => setSearchValue(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search Docs"
          ref={inputRef}
          value={searchValue}
          data-cy="doc-explorer-input"
        />
        <KeycapHint keys={shortcutKeys} ariaLabel="Search docs shortcut" />
      </div>
      {isFocused && (
        <ComboboxOptions data-cy="doc-explorer-list">
          {results.within.length +
            results.types.length +
            results.fields.length ===
          0 ? (
            <div className="graphiql-doc-explorer-search-empty">
              No results found
            </div>
          ) : (
            results.within.map((result, i) => (
              <ComboboxOption
                key={`within-${i}`}
                value={result}
                data-cy="doc-explorer-option"
              >
                <Field field={result.field} argument={result.argument} />
              </ComboboxOption>
            ))
          )}
          {results.within.length > 0 &&
          results.types.length + results.fields.length > 0 ? (
            <div className="graphiql-doc-explorer-search-divider">
              Other results
            </div>
          ) : null}
          {results.types.map((result, i) => (
            <ComboboxOption
              key={`type-${i}`}
              value={result}
              data-cy="doc-explorer-option"
            >
              <Type type={result.type} />
            </ComboboxOption>
          ))}
          {results.fields.map((result, i) => (
            <ComboboxOption
              key={`field-${i}`}
              value={result}
              data-cy="doc-explorer-option"
            >
              <Type type={result.type} />.
              <Field field={result.field} argument={result.argument} />
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      )}
    </Combobox>
  );
};

type TypeMatch = { type: GraphQLNamedType };

type FieldMatch = {
  type: GraphQLNamedType;
  field: GraphQLField<unknown, unknown> | GraphQLInputField;
  argument?: GraphQLArgument;
};

export function useSearchResults() {
  const explorerNavStack = useDocExplorer();
  const schema = useGraphiQL(state => state.schema);

  const navItem = explorerNavStack.at(-1)!;

  return (searchValue: string) => {
    const matches: {
      within: FieldMatch[];
      types: TypeMatch[];
      fields: FieldMatch[];
    } = {
      within: [],
      types: [],
      fields: [],
    };

    if (!schema) {
      return matches;
    }

    const withinType = navItem.def;
    const query = searchValue.toLowerCase();
    const limit = 100;
    const exact: Array<TypeMatch | FieldMatch> = [];
    const prefix: Array<TypeMatch | FieldMatch> = [];
    const substring: Array<TypeMatch | FieldMatch> = [];

    const byRank = [exact, prefix, substring];

    function matchRank(name: string): number {
      const lower = name.toLowerCase();
      if (!query || lower === query) {
        return 0;
      }
      if (lower.startsWith(query)) {
        return 1;
      }
      return lower.includes(query) ? 2 : Infinity;
    }

    function searchFields(type: GraphQLNamedType) {
      if (
        !isObjectType(type) &&
        !isInterfaceType(type) &&
        !isInputObjectType(type)
      ) {
        return;
      }
      for (const field of Object.values(type.getFields())) {
        if (exact.length === limit) {
          break;
        }
        const fieldRank = matchRank(field.name);
        let showField = true;
        if (fieldRank > 0 && 'args' in field) {
          for (const argument of field.args) {
            const rank = matchRank(argument.name);
            if (rank < fieldRank) {
              showField = false;
              const bucket = byRank[rank]!;
              if (bucket.length < limit) {
                bucket.push({ type, field, argument });
              }
            }
          }
        }
        const bucket = byRank[fieldRank];
        if (showField && bucket && bucket.length < limit) {
          bucket.push({ type, field });
        }
      }
    }

    // Break ties in the same order the explorer displays the groups.
    if (isNamedType(withinType)) {
      searchFields(withinType);
    }
    const types = Object.values(schema.getTypeMap());
    for (const type of types) {
      if (exact.length === limit) {
        break;
      }
      const bucket = byRank[matchRank(type.name)];
      if (type !== withinType && bucket && bucket.length < limit) {
        bucket.push({ type });
      }
    }
    for (const type of types) {
      if (exact.length === limit) {
        break;
      }
      if (type !== withinType) {
        searchFields(type);
      }
    }

    for (const match of exact.concat(prefix, substring).slice(0, limit)) {
      if ('field' in match) {
        matches[match.type === withinType ? 'within' : 'fields'].push(match);
      } else {
        matches.types.push(match);
      }
    }
    return matches;
  };
}

const Type: FC<{ type: GraphQLNamedType }> = ({ type }) => {
  return <span className="graphiql-doc-explorer-search-type">{type.name}</span>;
};

type FieldProps = {
  field: GraphQLField<unknown, unknown> | GraphQLInputField;
  argument?: GraphQLArgument;
};

const Field: FC<FieldProps> = ({ field, argument }) => {
  return (
    <>
      <span className="graphiql-doc-explorer-search-field">{field.name}</span>
      {argument ? (
        <>
          (
          <span className="graphiql-doc-explorer-search-argument">
            {argument.name}
          </span>
          :{' '}
          {renderType(argument.type, namedType => (
            <Type type={namedType} />
          ))}
          )
        </>
      ) : null}
    </>
  );
};
