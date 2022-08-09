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
  isSchema,
  validateSchema,
} from 'graphql';
import {
  ReactNode,
  useCallback,
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
 *   `introspect` function).
 * - When `schema` is `undefined` GraphiQL will attempt to fetch the schema
 *   when calling `introspect`.
 */
type MaybeGraphQLSchema = GraphQLSchema | null | undefined;

export type SchemaContextType = {
  fetchError: string | null;
  introspect(): void;
  isFetching: boolean;
  schema: MaybeGraphQLSchema;
  validationErrors: readonly GraphQLError[];
};

export const SchemaContext =
  createNullableContext<SchemaContextType>('SchemaContext');

type SchemaContextProviderProps = {
  children: ReactNode;
  dangerouslyAssumeSchemaIsValid?: boolean;
  fetcher: Fetcher;
  onSchemaChange?(schema: GraphQLSchema): void;
  schema?: GraphQLSchema | IntrospectionQuery | null;
} & IntrospectionArgs;

export function SchemaContextProvider(props: SchemaContextProviderProps) {
  const { initialHeaders, headerEditor } = useEditorContext({
    nonNull: true,
    caller: SchemaContextProvider,
  });
  const [schema, setSchema] = useState<MaybeGraphQLSchema>();
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  /**
   * A counter that is incremented each time introspection is triggered or the
   * schema state is updated.
   */
  const counterRef = useRef(0);

  /**
   * Synchronize prop changes with state
   */
  useEffect(() => {
    setSchema(
      isSchema(props.schema) ||
        props.schema === null ||
        props.schema === undefined
        ? props.schema
        : undefined,
    );

    /**
     * Increment the counter so that in-flight introspection requests don't
     * override this change.
     */
    counterRef.current++;
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
  const introspect = useCallback(() => {
    /**
     * Only introspect if there is no schema provided via props. If the
     * prop is passed an introspection result, we do continue but skip the
     * introspection request.
     */
    if (isSchema(props.schema) || props.schema === null) {
      return;
    }

    const counter = ++counterRef.current;

    setSchema(undefined);

    const maybeIntrospectionData = props.schema;
    async function fetchIntrospectionData() {
      if (maybeIntrospectionData) {
        // No need to introspect if we already have the data
        return maybeIntrospectionData;
      }

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

      let result = await fetch;

      if (
        typeof result !== 'object' ||
        result === null ||
        !('data' in result)
      ) {
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
        result = await fetch2;
      }

      setIsFetching(false);

      if (result?.data && '__schema' in result.data) {
        return result.data as IntrospectionQuery;
      }

      // handle as if it were an error if the fetcher response is not a string or response.data is not present
      const responseString =
        typeof result === 'string' ? result : formatResult(result);
      setFetchError(responseString);
    }

    fetchIntrospectionData()
      .then(introspectionData => {
        /**
         * Don't continue if another introspection request has been started in
         * the meantime or if there is no introspection data.
         */
        if (counter !== counterRef.current || !introspectionData) {
          return;
        }

        try {
          const newSchema = buildClientSchema(introspectionData);
          setSchema(newSchema);
          onSchemaChange?.(newSchema);
        } catch (error) {
          setFetchError(formatError(error));
        }
      })
      .catch(error => {
        /**
         * Don't continue if another introspection request has been started in
         * the meantime.
         */
        if (counter !== counterRef.current) {
          return;
        }

        setFetchError(formatError(error));
        setIsFetching(false);
      });
  }, [
    fetcher,
    introspectionQueryName,
    introspectionQuery,
    introspectionQuerySansSubscriptions,
    onSchemaChange,
    props.schema,
  ]);

  /**
   * Trigger introspection automatically
   */
  useEffect(() => {
    introspect();
  }, [introspect]);

  /**
   * Trigger introspection manually via short key
   */
  useEffect(() => {
    function triggerIntrospection(event: KeyboardEvent) {
      if (event.keyCode === 82 && event.shiftKey && event.ctrlKey) {
        introspect();
      }
    }
    window.addEventListener('keydown', triggerIntrospection);
    return () => window.removeEventListener('keydown', triggerIntrospection);
  });

  /**
   * Derive validation errors from the schema
   */
  const validationErrors = useMemo(() => {
    if (!schema || props.dangerouslyAssumeSchemaIsValid) {
      return [];
    }
    return validateSchema(schema);
  }, [schema, props.dangerouslyAssumeSchemaIsValid]);

  /**
   * Memoize context value
   */
  const value = useMemo(
    () => ({
      fetchError,
      introspect,
      isFetching,
      schema,
      validationErrors,
    }),
    [fetchError, introspect, isFetching, schema, validationErrors],
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
