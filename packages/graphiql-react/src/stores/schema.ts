import {
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
} from 'graphql';
import type { Dispatch } from 'react';
import type { StateCreator } from 'zustand';
import type { SlicesWithActions, SchemaReference } from '../types';

type MaybeGraphQLSchema = GraphQLSchema | null | undefined;

type CreateSchemaSlice = (
  initial: Pick<
    SchemaSlice,
    | 'inputValueDeprecation'
    | 'introspectionQueryName'
    | 'onSchemaChange'
    | 'schemaDescription'
  >,
) => StateCreator<
  SlicesWithActions,
  [],
  [],
  SchemaSlice & {
    actions: SchemaActions;
  }
>;

export const createSchemaSlice: CreateSchemaSlice = initial => (set, get) => ({
  ...initial,

  fetchError: null,
  isIntrospecting: false,
  schema: null,
  /**
   * Derive validation errors from the schema
   */
  validationErrors: [],
  schemaReference: null,
  requestCounter: 0,
  shouldIntrospect: true,
  actions: {
    setSchemaReference(schemaReference) {
      set({ schemaReference });
    },
    async introspect() {
      const {
        requestCounter,
        shouldIntrospect,
        onSchemaChange,
        headerEditor,
        fetcher,
        ...rest
      } = get();

      /**
       * Only introspect if there is no schema provided via props. If the
       * prop is passed an introspection result, we do continue but skip the
       * introspection request.
       */
      if (!shouldIntrospect) {
        return;
      }
      const counter = requestCounter + 1;
      set({ requestCounter: counter });

      try {
        const currentHeaders = headerEditor?.getValue();
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
        set({ isIntrospecting: true, fetchError: null });
        let result = await fetch;

        if (typeof result !== 'object' || !('data' in result)) {
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

        set({ isIntrospecting: false });
        let introspectionData: IntrospectionQuery | undefined;
        if (result.data && '__schema' in result.data) {
          introspectionData = result.data as IntrospectionQuery;
        } else {
          // handle as if it were an error if the fetcher response is not a string or response.data is not present
          const responseString =
            typeof result === 'string' ? result : formatResult(result);
          set({ fetchError: responseString });
        }
        /**
         * Don't continue if another introspection request has been started in
         * the meantime or if there is no introspection data.
         */
        if (counter !== get().requestCounter || !introspectionData) {
          return;
        }
        const newSchema = buildClientSchema(introspectionData);
        set({ schema: newSchema });
        onSchemaChange?.(newSchema);
      } catch (error) {
        /**
         * Don't continue if another introspection request has been started in
         * the meantime.
         */
        if (counter !== get().requestCounter) {
          return;
        }
        set({
          fetchError: formatError(error),
          isIntrospecting: false,
        });
      }
    },
  },
});

export interface SchemaSlice
  extends Pick<
    SchemaProps,
    | 'inputValueDeprecation'
    | 'introspectionQueryName'
    | 'schemaDescription'
    | 'onSchemaChange'
  > {
  /**
   * Stores an error raised during introspecting or building the GraphQL schema
   * from the introspection result.
   */
  fetchError: string | null;

  /**
   * If there currently is an introspection request in-flight.
   */
  isIntrospecting: boolean;

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
   * A counter that is incremented each time introspection is triggered or the
   * schema state is updated.
   */
  requestCounter: number;

  /**
   * `false` when `schema` is provided via `props` as `GraphQLSchema | null`
   */
  shouldIntrospect: boolean;
}

export interface SchemaActions {
  /**
   * Trigger building the GraphQL schema. This might trigger an introspection
   * request if no schema is passed via props and if using a schema is not
   * explicitly disabled by passing `null` as value for the `schema` prop. If
   * there is a schema (either fetched using introspection or passed via props)
   * it will be validated, unless this is explicitly skipped using the
   * `dangerouslyAssumeSchemaIsValid` prop.
   */
  introspect(): Promise<void>;

  /**
   * Set the current selected type.
   */
  setSchemaReference: Dispatch<SchemaReference>;
}

export interface SchemaProps extends IntrospectionArgs {
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
   * @param schema - The GraphQL schema that is now used for GraphiQL.
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
}

interface IntrospectionArgs {
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
}

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
