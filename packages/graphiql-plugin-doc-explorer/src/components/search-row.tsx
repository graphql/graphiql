import { FC, useEffect, useRef, useState } from 'react';
import {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLNamedType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
} from 'graphql';
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from '@headlessui/react';
import {
  formatShortcutForOS,
  MagnifyingGlassIcon,
  KeycapHint,
  debounce,
  KEY_MAP,
} from '@graphiql/react';
import { useDocExplorer, useDocExplorerActions } from '../context';
import { useSearchResults } from './search';
import { renderType } from './utils';
import './search-row.css';

type TypeMatch = { type: GraphQLNamedType };
type FieldMatch = {
  type: GraphQLNamedType;
  field: GraphQLField<unknown, unknown> | GraphQLInputField;
  argument?: GraphQLArgument;
};

export const SearchRow: FC = () => {
  const explorerNavStack = useDocExplorer();
  const { push } = useDocExplorerActions();

  const inputRef = useRef<HTMLInputElement>(null!);
  const getSearchResults = useSearchResults();
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState(() => getSearchResults(searchValue));
  const debouncedGetSearchResults = debounce(200, (search: string) => {
    setResults(getSearchResults(search));
  });
  const [ref] = useState(inputRef);
  const isFocused = ref.current === document.activeElement;

  useEffect(() => {
    debouncedGetSearchResults(searchValue);
  }, [debouncedGetSearchResults, searchValue]);

  const navItem = explorerNavStack.at(-1)!;

  const onSelect = (def: TypeMatch | FieldMatch | null) => {
    if (!def) {
      return;
    }
    push(
      'field' in def
        ? { name: def.field.name, def: def.field }
        : { name: def.type.name, def: def.type },
    );
  };

  const shouldShow =
    explorerNavStack.length === 1 ||
    isObjectType(navItem.def) ||
    isInterfaceType(navItem.def) ||
    isInputObjectType(navItem.def);

  if (!shouldShow) {
    return null;
  }

  const shortcutKeys = formatShortcutForOS(KEY_MAP.searchInDocs.key).split('-');

  return (
    <div className="graphiql-doc-explorer-search-row-wrapper">
      <Combobox
        as="div"
        className="graphiql-doc-explorer-search-row"
        onChange={onSelect}
        aria-label={`Search ${navItem.name}...`}
      >
        <div
          className="graphiql-doc-explorer-search-row-input"
          onClick={() => {
            inputRef.current.focus();
          }}
        >
          <MagnifyingGlassIcon />
          <ComboboxInput
            autoComplete="off"
            onChange={event => setSearchValue(event.target.value)}
            placeholder="Filter fields…"
            ref={inputRef}
            value={searchValue}
            data-cy="doc-explorer-input"
          />
          {!isFocused && !searchValue && (
            <KeycapHint keys={shortcutKeys} ariaLabel="Search docs shortcut" />
          )}
        </div>
        {isFocused && (
          <ComboboxOptions
            className="graphiql-doc-explorer-search-row-listbox"
            data-cy="doc-explorer-list"
          >
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
                  <SearchField
                    field={result.field}
                    argument={result.argument}
                  />
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
                <SearchType type={result.type} />
              </ComboboxOption>
            ))}
            {results.fields.map((result, i) => (
              <ComboboxOption
                key={`field-${i}`}
                value={result}
                data-cy="doc-explorer-option"
              >
                <SearchType type={result.type} />.
                <SearchField
                  field={result.field}
                  argument={result.argument}
                />
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        )}
      </Combobox>
    </div>
  );
};

const SearchType: FC<{ type: GraphQLNamedType }> = ({ type }) => (
  <span className="graphiql-doc-explorer-search-type">{type.name}</span>
);

type SearchFieldProps = {
  field: GraphQLField<unknown, unknown> | GraphQLInputField;
  argument?: GraphQLArgument;
};

const SearchField: FC<SearchFieldProps> = ({ field, argument }) => {
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
            <SearchType type={namedType} />
          ))}
          )
        </>
      ) : null}
    </>
  );
};
