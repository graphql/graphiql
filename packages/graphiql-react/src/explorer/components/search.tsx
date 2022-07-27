import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from '@reach/combobox';
import {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLNamedType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
} from 'graphql';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassIcon } from '../../icons';
import { useSchemaContext } from '../../schema';
import debounce from '../../utility/debounce';

import { useExplorerContext } from '../context';

import './search.css';
import { renderType } from './utils';

export function Search() {
  const { explorerNavStack, push } = useExplorerContext({
    nonNull: true,
    caller: Search,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const getSearchResults = useSearchResults();
  const [searchValue, setSearchValue] = useState('');

  const [results, setResults] = useState(getSearchResults(searchValue));
  const debouncedGetSearchResults = useMemo(
    () =>
      debounce(200, (search: string) => {
        setResults(getSearchResults(search));
      }),
    [getSearchResults],
  );
  useEffect(() => {
    debouncedGetSearchResults(searchValue);
  }, [debouncedGetSearchResults, searchValue]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey && event.keyCode === 75 && inputRef.current) {
        inputRef.current.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItem = explorerNavStack[explorerNavStack.length - 1];

  const shouldSearchBoxAppear =
    explorerNavStack.length === 1 ||
    isObjectType(navItem.def) ||
    isInterfaceType(navItem.def) ||
    isInputObjectType(navItem.def);

  return shouldSearchBoxAppear ? (
    <Combobox
      aria-label={`Search ${navItem.name}...`}
      onSelect={value => {
        const def = value as unknown as TypeMatch | FieldMatch;
        push(
          'field' in def
            ? { name: def.field.name, def: def.field }
            : { name: def.type.name, def: def.type },
        );
      }}
    >
      <div
        className="graphiql-doc-explorer-search-input"
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }}
      >
        <MagnifyingGlassIcon />
        <ComboboxInput
          autocomplete={false}
          onChange={event => {
            setSearchValue(event.target.value);
          }}
          onKeyDown={event => {
            if (!event.isDefaultPrevented()) {
              const container = popoverRef.current;
              if (!container) {
                return;
              }

              window.requestAnimationFrame(() => {
                const element = container.querySelector('[aria-selected=true]');
                if (!(element instanceof HTMLElement)) {
                  return;
                }
                const top = element.offsetTop - container.scrollTop;
                const bottom =
                  container.scrollTop +
                  container.clientHeight -
                  (element.offsetTop + element.clientHeight);
                if (bottom < 0) {
                  container.scrollTop -= bottom;
                }
                if (top < 0) {
                  container.scrollTop += top;
                }
              });
            }
          }}
          placeholder="&#x2318; K"
          ref={inputRef}
          value={searchValue}
        />
      </div>
      <ComboboxPopover portal={false} ref={popoverRef}>
        <ComboboxList>
          {/**
           * Setting the `index` prop explicitly on the `ComboboxOption` solves
           * buggy behavior of the internal ordering of the combobox items.
           * (Sometimes this results in weird jumps when using the keyboard to
           * navigate search results.)
           */}
          {results.within.map((result, i) => (
            <ComboboxOption key={`within-${i}`} index={i} value={result as any}>
              <Field field={result.field} argument={result.argument} />
            </ComboboxOption>
          ))}
          {results.within.length > 0 &&
          results.types.length + results.fields.length > 0 ? (
            <div className="graphiql-doc-explorer-search-divider">
              Other results
            </div>
          ) : null}
          {results.types.map((result, i) => (
            <ComboboxOption
              key={`type-${i}`}
              index={results.within.length + i}
              value={result as any}
            >
              <Type type={result.type} />
            </ComboboxOption>
          ))}
          {results.fields.map((result, i) => (
            <ComboboxOption
              key={`field-${i}`}
              index={results.within.length + results.types.length + i}
              value={result as any}
            >
              <Type type={result.type} />.
              <Field field={result.field} argument={result.argument} />
            </ComboboxOption>
          ))}
          {results.within.length +
            results.types.length +
            results.fields.length ===
          0 ? (
            <div className="graphiql-doc-explorer-search-empty">
              No results found
            </div>
          ) : null}
        </ComboboxList>
      </ComboboxPopover>
    </Combobox>
  ) : null;
}

type TypeMatch = { type: GraphQLNamedType };

type FieldMatch = {
  type: GraphQLNamedType;
  field: GraphQLField<unknown, unknown> | GraphQLInputField;
  argument?: GraphQLArgument;
};

export function useSearchResults(caller?: Function) {
  const { explorerNavStack } = useExplorerContext({
    nonNull: true,
    caller: caller || useSearchResults,
  });
  const { schema } = useSchemaContext({
    nonNull: true,
    caller: caller || useSearchResults,
  });

  const navItem = explorerNavStack[explorerNavStack.length - 1];

  return useCallback(
    (searchValue: string) => {
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

      const typeMap = schema.getTypeMap();
      let typeNames = Object.keys(typeMap);

      // Move the within type name to be the first searched.
      if (withinType) {
        typeNames = typeNames.filter(n => n !== withinType.name);
        typeNames.unshift(withinType.name);
      }

      for (const typeName of typeNames) {
        if (
          matches.within.length +
            matches.types.length +
            matches.fields.length >=
          100
        ) {
          break;
        }

        const type = typeMap[typeName];
        if (withinType !== type && isMatch(typeName, searchValue)) {
          matches.types.push({ type });
        }

        if (
          !isObjectType(type) &&
          !isInterfaceType(type) &&
          !isInputObjectType(type)
        ) {
          continue;
        }

        const fields = type.getFields();
        for (const fieldName in fields) {
          const field = fields[fieldName];
          let matchingArgs: GraphQLArgument[] | undefined;

          if (!isMatch(fieldName, searchValue)) {
            if ('args' in field) {
              matchingArgs = field.args.filter(arg =>
                isMatch(arg.name, searchValue),
              );
              if (matchingArgs.length === 0) {
                continue;
              }
            } else {
              continue;
            }
          }

          matches[withinType === type ? 'within' : 'fields'].push(
            ...(matchingArgs
              ? matchingArgs.map(argument => ({ type, field, argument }))
              : [{ type, field }]),
          );
        }
      }

      return matches;
    },
    [navItem.def, schema],
  );
}

function isMatch(sourceText: string, searchValue: string) {
  try {
    const escaped = searchValue.replace(/[^_0-9A-Za-z]/g, ch => '\\' + ch);
    return sourceText.search(new RegExp(escaped, 'i')) !== -1;
  } catch (e) {
    return sourceText.toLowerCase().indexOf(searchValue.toLowerCase()) !== -1;
  }
}

type TypeProps = { type: GraphQLNamedType };

function Type(props: TypeProps) {
  return (
    <span className="graphiql-doc-explorer-search-type">{props.type.name}</span>
  );
}

type FieldProps = {
  field: GraphQLField<unknown, unknown> | GraphQLInputField;
  argument?: GraphQLArgument;
};

function Field(props: FieldProps) {
  return (
    <>
      <span className="graphiql-doc-explorer-search-field">
        {props.field.name}
      </span>
      {props.argument ? (
        <>
          (
          <span className="graphiql-doc-explorer-search-argument">
            {props.argument.name}
          </span>
          :{' '}
          {renderType(props.argument.type, namedType => (
            <Type type={namedType} />
          ))}
          )
        </>
      ) : null}
    </>
  );
}
