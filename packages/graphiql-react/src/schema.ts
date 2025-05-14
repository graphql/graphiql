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
import { Dispatch, FC, ReactElement, ReactNode, useEffect } from 'react';
import { createStore } from 'zustand';
import { useEditorStore } from './editor';
import type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';
import { createBoundedUseStore } from './utility';
import { executionStore } from './execution';

type MaybeGraphQLSchema = GraphQLSchema | null | undefined;

type SchemaStore = SchemaContextType &
  Pick<
    SchemaContextProviderProps,
    | 'inputValueDeprecation'
    | 'introspectionQueryName'
    | 'schemaDescription'
    | 'fetcher'
    | 'onSchemaChange'
  >;

export const schemaStore = createStore<SchemaStore>((set, get) => ({
  inputValueDeprecation: null!,
  introspectionQueryName: null!,
  schemaDescription: null!,
  fetcher: null!, // Explicitly set to null, as it's safe since we have TypeError thrown
  onSchemaChange: undefined,

  fetchError: null,
  isFetching: false,
  schema: null,
  /**
   * Derive validation errors from the schema
   */
  validationErrors: [],
  schemaReference: null,
  setSchemaReference(schemaReference) {
    set({ schemaReference });
  },
  requestCounter: 0,
  currentHeaders: '',
  /**
   * Fetch the schema
   */
  introspect() {
    const { schema, requestCounter, currentHeaders, onSchemaChange, ...rest } =
      get();
    const { fetcher } = executionStore.getState()

    /**
     * Only introspect if there is no schema provided via props. If the
     * prop is passed an introspection result, we do continue but skip the
     * introspection request.
     */
    if (isSchema(schema) || schema === null) {
      return;
    }
    const counter = requestCounter + 1;
    set({ requestCounter: counter });

    const maybeIntrospectionData = schema;

    async function fetchIntrospectionData() {
      if (maybeIntrospectionData) {
        // No need to introspect if we already have the data
        return maybeIntrospectionData;
      }

      const parsedHeaders = parseHeaderString(currentHeaders);
      if (!parsedHeaders.isValidJSON) {
        set({ fetchError: 'Introspection failed as headers are invalid.' });
        return;
      }

      const fetcherOpts: FetcherOpts = parsedHeaders.headers
        ? { headers: parsedHeaders.headers }
        : {};

      /**
       * Get an introspection query for settings given via props
       */
      const {
        introspectionQuery,
        introspectionQueryName,
        introspectionQuerySansSubscriptions,
      } = generateIntrospectionQuery(rest);

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
        set({
          fetchError: 'Fetcher did not return a Promise for introspection.',
        });
        return;
      }
      set({ isFetching: true, fetchError: null });
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

      set({ isFetching: false });

      if (result?.data && '__schema' in result.data) {
        return result.data as IntrospectionQuery;
      }

      // handle as if it were an error if the fetcher response is not a string or response.data is not present
      const responseString =
        typeof result === 'string' ? result : formatResult(result);
      set({ fetchError: responseString });
    }

    fetchIntrospectionData()
      .then(introspectionData => {
        /**
         * Don't continue if another introspection request has been started in
         * the meantime or if there is no introspection data.
         */
        if (counter !== get().requestCounter || !introspectionData) {
          return;
        }

        try {
          const newSchema = buildClientSchema(introspectionData);
          set({ schema: newSchema });
          onSchemaChange?.(newSchema);
        } catch (error) {
          set({ fetchError: formatError(error) });
        }
      })
      .catch(error => {
        /**
         * Don't continue if another introspection request has been started in
         * the meantime.
         */
        if (counter !== get().requestCounter) {
          return;
        }
        set({
          fetchError: formatError(error),
          isFetching: false,
        });
      });
  },
}));

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
  /**
   * The last type selected by the user.
   */
  schemaReference: SchemaReference | null;
  /**
   * Set the current selected type.
   */
  setSchemaReference: Dispatch<SchemaReference>;
  /**
   * A counter that is incremented each time introspection is triggered or the
   * schema state is updated.
   */
  requestCounter: number;
  /**
   * Keep a ref to the current headers.
   * @default ''
   */
  currentHeaders: string;
};

type SchemaContextProviderProps = {
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

export const SchemaContextProvider: FC<SchemaContextProviderProps> = ({
  onSchemaChange,
  dangerouslyAssumeSchemaIsValid = false,
  children,
  schema,
  inputValueDeprecation = false,
  introspectionQueryName = 'IntrospectionQuery',
  schemaDescription = false,
}) => {
  const headerEditor = useEditorStore(store => store.headerEditor);

  /**
   * Synchronize prop changes with state
   */
  useEffect(() => {
    const newSchema = isSchema(schema) || schema == null ? schema : undefined;

    const validationErrors =
      !newSchema || dangerouslyAssumeSchemaIsValid
        ? []
        : validateSchema(newSchema);

    schemaStore.setState(({ requestCounter }) => ({
      onSchemaChange,
      schema: newSchema,
      inputValueDeprecation,
      introspectionQueryName,
      schemaDescription,
      validationErrors,
      /**
       * Increment the counter so that in-flight introspection requests don't
       * override this change.
       */
      requestCounter: requestCounter + 1,
      currentHeaders: headerEditor?.getValue(),
    }));

    // Trigger introspection
    schemaStore.getState().introspect();
  }, [
    schema,
    dangerouslyAssumeSchemaIsValid,
    onSchemaChange,
    inputValueDeprecation,
    introspectionQueryName,
    schemaDescription,
    headerEditor,
  ]);

  /**
   * Trigger introspection manually via a short key
   */
  useEffect(() => {
    function triggerIntrospection(event: KeyboardEvent) {
      if (event.ctrlKey && event.key === 'R') {
        schemaStore.getState().introspect();
      }
    }

    window.addEventListener('keydown', triggerIntrospection);
    return () => {
      window.removeEventListener('keydown', triggerIntrospection);
    };
  }, []);

  return children as ReactElement;
};

export const useSchemaStore = createBoundedUseStore(schemaStore);

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
   * @default 'IntrospectionQuery'
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

function generateIntrospectionQuery({
  inputValueDeprecation,
  introspectionQueryName,
  schemaDescription,
}: IntrospectionArgs) {
  const query = getIntrospectionQuery({
    inputValueDeprecation,
    schemaDescription,
  });
  const introspectionQuery =
    introspectionQueryName === 'IntrospectionQuery'
      ? query
      : query.replace(
          'query IntrospectionQuery',
          `query ${introspectionQueryName}`,
        );
  const introspectionQuerySansSubscriptions = query.replace(
    'subscriptionType { name }',
    '',
  );

  return {
    introspectionQueryName,
    introspectionQuery,
    introspectionQuerySansSubscriptions,
  };
}

function parseHeaderString(headersString?: string) {
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
