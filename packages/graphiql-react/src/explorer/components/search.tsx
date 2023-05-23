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
import { Command } from 'cmdk';
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
      if (event.metaKey && event.key === 'k') {
        inputRef.current?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItem = explorerNavStack.at(-1)!;

  const onSelect = useCallback(
    (value: string) => {
      const def = JSON.parse(value) as TypeMatch | FieldMatch;
      push(
        'field' in def
          ? { name: def.field.name, def: def.field }
          : { name: def.type.name, def: def.type },
      );
    },
    [push],
  );
  const [isFocused, setIsFocused] = useState(false);
  const handleFocus = useCallback(e => {
    setIsFocused(e.type === 'focus');
  }, []);

  const shouldSearchBoxAppear =
    explorerNavStack.length === 1 ||
    isObjectType(navItem.def) ||
    isInterfaceType(navItem.def) ||
    isInputObjectType(navItem.def);
  if (!shouldSearchBoxAppear) {
    return null;
  }
  return (
    <Command
      label={`Search ${navItem.name}...`}
      data-state={isFocused ? undefined : 'idle'}
    >
      <div
        className="graphiql-doc-explorer-search-input"
        onClick={() => {
          inputRef.current?.focus();
        }}
      >
        <MagnifyingGlassIcon />
        <Command.Input
          autoComplete="off"
          onFocus={handleFocus}
          onBlur={handleFocus}
          onValueChange={setSearchValue}
          placeholder="&#x2318; K"
          ref={inputRef}
          value={searchValue}
        />
      </div>

      {isFocused && (
        <Command.List>
          <Command.Empty className="graphiql-doc-explorer-search-empty">
            No results found
          </Command.Empty>

          <Command.Group>
            {results.within.map((result, i) => (
              <Command.Item
                key={`within-${i}`}
                value={JSON.stringify(result)}
                onSelect={onSelect}
              >
                <Field field={result.field} argument={result.argument} />
              </Command.Item>
            ))}
            {results.within.length > 0 &&
            results.types.length + results.fields.length > 0 ? (
              <div className="graphiql-doc-explorer-search-divider">
                Other results
              </div>
            ) : null}
            {results.types.map((result, i) => (
              <Command.Item
                key={`type-${i}`}
                value={JSON.stringify(result)}
                onSelect={onSelect}
              >
                <Type type={result.type} />
              </Command.Item>
            ))}
            {results.fields.map((result, i) => (
              <Command.Item
                key={`field-${i}`}
                value={JSON.stringify(result)}
                onSelect={onSelect}
              >
                <Type type={result.type} />.
                <Field field={result.field} argument={result.argument} />
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      )}
    </Command>
  );
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

  const navItem = explorerNavStack.at(-1)!;

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

function isMatch(sourceText: string, searchValue: string): boolean {
  try {
    const escaped = searchValue.replaceAll(/[^_0-9A-Za-z]/g, ch => '\\' + ch);
    return sourceText.search(new RegExp(escaped, 'i')) !== -1;
  } catch {
    return sourceText.toLowerCase().includes(searchValue.toLowerCase());
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

function Field({ field, argument }: FieldProps) {
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
}
