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

type MaybeGraphQLSchema = GraphQLSchema | null | undefined;

export type SchemaContextType = {
  /**
   * Stores an error raised during introspecting or building the GraphQL schema
   * from the introspection result.
   */
  fetchError: string | null;
  /**
   * Trigger building the GraphQL schema. This might trigger an introspection
   * request if no schema is passed via props and if using a schema is not
   * explicitly disabled by passing `null` as value for the `schema` prop. If
   * there is a schema (either fetched using introspection or passed via props)
   * it will be validated, unless this is explicitly skipped using the
   * `dangerouslyAssumeSchemaIsValid` prop.
   */
  introspect(): void;
  /**
   * If there currently is an introspection request in-flight.
   */
  isFetching: boolean;
  /**
   * The current GraphQL schema.
   */
  schema: MaybeGraphQLSchema;
  /**
   * A list of errors from validating the current GraphQL schema. The schema is
   * valid if and only if this list is empty.
   */
  validationErrors: readonly GraphQLError[];
};

export const SchemaContext =
  createNullableContext<SchemaContextType>('SchemaContext');

export type SchemaContextProviderProps = {
  children: ReactNode;
  /**
   * This prop can be used to skip validating the GraphQL schema. This applies
   * to both schemas fetched via introspection and schemas explicitly passed
   * via the `schema` prop.
   *
   * IMPORTANT NOTE: Without validating the schema, GraphiQL and its components
   * are vulnerable to numerous exploits and might break. Only use this prop if
   * you have full control over the schema passed to GraphiQL.
   *
   * @default false
   */
  dangerouslyAssumeSchemaIsValid?: boolean;
  /**
   * A function which accepts GraphQL HTTP parameters and returns a `Promise`,
   * `Observable` or `AsyncIterable` that returns the GraphQL response in
   * parsed JSON format.
   *
   * We suggest using the `createGraphiQLFetcher` utility from `@graphiql/toolkit`
   * to create these fetcher functions.
   *
   * @see {@link https://graphiql-test.netlify.app/typedoc/modules/graphiql_toolkit.html#creategraphiqlfetcher-2|`createGraphiQLFetcher`}
   */
  fetcher: Fetcher;
  /**
   * Invoked after a new GraphQL schema was built. This includes both fetching
   * the schema via introspection and passing the schema using the `schema`
   * prop.
   * @param schema The GraphQL schema that is now used for GraphiQL.
   */
  onSchemaChange?(schema: GraphQLSchema): void;
  /**
   * Explicitly provide the GraphiQL schema that shall be used for GraphiQL.
   * If this props is...
   * - ...passed and the value is a GraphQL schema, it will be validated and
   *   then used for GraphiQL if it is valid.
   * - ...passed and the value is the result of an introspection query, a
   *   GraphQL schema will be built from this introspection data, it will be
   *   validated, and then used for GraphiQL if it is valid.
   * - ...set to `null`, no introspection request will be triggered and
   *   GraphiQL will run without a schema.
   * - ...set to `undefined` or not set at all, an introspection request will
   *   be triggered. If this request succeeds, a GraphQL schema will be built
   *   from the returned introspection data, it will be validated, and then
   *   used for GraphiQL if it is valid. If this request fails, GraphiQL will
   *   run without a schema.
   */
  schema?: GraphQLSchema | IntrospectionQuery | null;
} & IntrospectionArgs;

export function SchemaContextProvider(props: SchemaContextProviderProps) {
  if (!props.fetcher) {
    throw new TypeError(
      'The `SchemaContextProvider` component requires a `fetcher` function to be passed as prop.',
    );
  }

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
  const { fetcher, onSchemaChange, dangerouslyAssumeSchemaIsValid, children } =
    props;
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
      setFetchError(null);

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
      if (event.ctrlKey && event.key === 'R') {
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
    if (!schema || dangerouslyAssumeSchemaIsValid) {
      return [];
    }
    return validateSchema(schema);
  }, [schema, dangerouslyAssumeSchemaIsValid]);

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
    <SchemaContext.Provider value={value}>{children}</SchemaContext.Provider>
  );
}

export const useSchemaContext = createContextHook(SchemaContext);

type IntrospectionArgs = {
  /**
   * Can be used to set the equally named option for introspecting a GraphQL
   * server.
   * @default false
   * @see {@link https://github.com/graphql/graphql-js/blob/main/src/utilities/getIntrospectionQuery.ts|Utility for creating the introspection query}
   */
  inputValueDeprecation?: boolean;
  /**
   * Can be used to set a custom operation name for the introspection query.
   */
  introspectionQueryName?: string;
  /**
   * Can be used to set the equally named option for introspecting a GraphQL
   * server.
   * @default false
   * @see {@link https://github.com/graphql/graphql-js/blob/main/src/utilities/getIntrospectionQuery.ts|Utility for creating the introspection query}
   */
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
  } catch {
    isValidJSON = false;
  }
  return { headers, isValidJSON };
}
