import {
  Fetcher,
  FetcherOpts,
  fetcherReturnToPromise,
  formatError,
  formatResult,
  isPromise,
} from '@graphiql/toolkit';
import {
  buildClientSchema,
  getIntrospectionQuery,
  GraphQLError,
  GraphQLSchema,
  IntrospectionQuery,
  validateSchema,
} from 'graphql';
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useEditorContext } from './editor';
import { createContextHook, createNullableContext } from './utility/context';

/**
 * There's a semantic difference between `null` and `undefined`:
 * - When `null` is passed explicitly as prop, GraphiQL will run schema-less
 *   (i.e. it will never attempt to fetch the schema, even when calling the
 *   `useFetchSchema` hook).
 * - When `schema` is `undefined` GraphiQL will attempt to fetch the schema
 *   when calling `useFetchSchema`.
 */
type MaybeGraphQLSchema = GraphQLSchema | null | undefined;

export type SchemaContextType = {
  fetchError: string | null;
  isFetching: boolean;
  schema: MaybeGraphQLSchema;
  setFetchError: Dispatch<SetStateAction<string | null>>;
  setSchema: Dispatch<SetStateAction<MaybeGraphQLSchema>>;
  validationErrors: readonly GraphQLError[] | null;
};

export const SchemaContext = createNullableContext<SchemaContextType>(
  'SchemaContext',
);

type SchemaContextProviderProps = {
  children: ReactNode;
  dangerouslyAssumeSchemaIsValid?: boolean;
  fetcher: Fetcher;
  onSchemaChange?(schema: GraphQLSchema): void;
  schema?: GraphQLSchema | null;
} & IntrospectionArgs;

export function SchemaContextProvider(props: SchemaContextProviderProps) {
  const { initialHeaders, headerEditor } = useEditorContext({
    nonNull: true,
    caller: SchemaContextProvider,
  });
  const [schema, setSchema] = useState<MaybeGraphQLSchema>(
    props.schema || null,
  );
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  /**
   * Synchronize prop changes with state
   */
  useEffect(() => {
    setSchema(props.schema);
  }, [props.schema]);

  /**
   * Keep a ref to the current headers
   */
  const headersRef = useRef(initialHeaders);
  useEffect(() => {
    if (headerEditor) {
      headersRef.current = headerEditor.getValue();
    }
  });

  /**
   * Get introspection query for settings given via props
   */
  const {
    introspectionQuery,
    introspectionQueryName,
    introspectionQuerySansSubscriptions,
  } = useIntrospectionQuery({
    inputValueDeprecation: props.inputValueDeprecation,
    introspectionQueryName: props.introspectionQueryName,
    schemaDescription: props.schemaDescription,
  });

  /**
   * Fetch the schema
   */
  const { fetcher, onSchemaChange } = props;
  useEffect(() => {
    // Only introspect if there is no schema provided via props
    if (props.schema !== undefined) {
      return;
    }

    let isActive = true;

    const parsedHeaders = parseHeaderString(headersRef.current);
    if (!parsedHeaders.isValidJSON) {
      setFetchError('Introspection failed as headers are invalid.');
      return;
    }

    const fetcherOpts: FetcherOpts = parsedHeaders.headers
      ? { headers: parsedHeaders.headers }
      : {};

    const fetch = fetcherReturnToPromise(
      fetcher(
        {
          query: introspectionQuery,
          operationName: introspectionQueryName,
        },
        fetcherOpts,
      ),
    );

    if (!isPromise(fetch)) {
      setFetchError('Fetcher did not return a Promise for introspection.');
      return;
    }

    setIsFetching(true);

    fetch
      .then(result => {
        if (typeof result === 'object' && result !== null && 'data' in result) {
          return result;
        }

        // Try the stock introspection query first, falling back on the
        // sans-subscriptions query for services which do not yet support it.
        const fetch2 = fetcherReturnToPromise(
          fetcher(
            {
              query: introspectionQuerySansSubscriptions,
              operationName: introspectionQueryName,
            },
            fetcherOpts,
          ),
        );
        if (!isPromise(fetch2)) {
          throw new Error(
            'Fetcher did not return a Promise for introspection.',
          );
        }
        return fetch2;
      })
      .then(result => {
        // Don't continue if the effect has already been cleaned up
        if (!isActive) {
          return;
        }

        if (result?.data && '__schema' in result.data) {
          try {
            const newSchema = buildClientSchema(
              result.data as IntrospectionQuery,
            );
            // Only override the schema in state if it's still `undefined` (the
            // prop and thus the state could have changed while introspecting,
            // so this avoids a race condition by prioritizing the state that
            // was set after the introspection request was initialized)
            setSchema(current => {
              if (current === undefined) {
                onSchemaChange?.(newSchema);
                return newSchema;
              }
              return current;
            });
          } catch (error) {
            setFetchError(formatError(error as Error));
          }
        } else {
          // handle as if it were an error if the fetcher response is not a string or response.data is not present
          const responseString =
            typeof result === 'string' ? result : formatResult(result);
          setFetchError(responseString);
        }

        setIsFetching(false);
      })
      .catch(error => {
        // Don't continue if the effect has already been cleaned up
        if (!isActive) {
          return;
        }

        setFetchError(formatError(error));
        setIsFetching(false);
      });

    return () => {
      isActive = false;
    };
  }, [
    fetcher,
    introspectionQueryName,
    introspectionQuery,
    introspectionQuerySansSubscriptions,
    onSchemaChange,
    props.schema,
  ]);

  /**
   * Derive validation errors from the schema
   */
  const validationErrors = useMemo(() => {
    if (!schema || props.dangerouslyAssumeSchemaIsValid) {
      return null;
    }
    const errors = validateSchema(schema);
    return errors.length > 0 ? errors : null;
  }, [schema, props.dangerouslyAssumeSchemaIsValid]);

  /**
   * Memoize context value
   */
  const value = useMemo(
    () => ({
      fetchError,
      isFetching,
      schema,
      setFetchError,
      setSchema,
      validationErrors,
    }),
    [fetchError, isFetching, schema, validationErrors],
  );

  return (
    <SchemaContext.Provider value={value}>
      {props.children}
    </SchemaContext.Provider>
  );
}

export const useSchemaContext = createContextHook(SchemaContext);

type IntrospectionArgs = {
  inputValueDeprecation?: boolean;
  introspectionQueryName?: string;
  schemaDescription?: boolean;
};

function useIntrospectionQuery({
  inputValueDeprecation,
  introspectionQueryName,
  schemaDescription,
}: IntrospectionArgs) {
  return useMemo(() => {
    const queryName = introspectionQueryName || 'IntrospectionQuery';

    let query = getIntrospectionQuery({
      inputValueDeprecation,
      schemaDescription,
    });
    if (introspectionQueryName) {
      query = query.replace('query IntrospectionQuery', `query ${queryName}`);
    }

    const querySansSubscriptions = query.replace(
      'subscriptionType { name }',
      '',
    );

    return {
      introspectionQueryName: queryName,
      introspectionQuery: query,
      introspectionQuerySansSubscriptions: querySansSubscriptions,
    };
  }, [inputValueDeprecation, introspectionQueryName, schemaDescription]);
}

function parseHeaderString(headersString: string | undefined) {
  let headers: Record<string, unknown> | null = null;
  let isValidJSON = true;

  try {
    if (headersString) {
      headers = JSON.parse(headersString);
    }
  } catch (err) {
    isValidJSON = false;
  }
  return { headers, isValidJSON };
}
