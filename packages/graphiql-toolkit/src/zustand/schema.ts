import {
  Fetcher,
  FetcherOpts,
  fetcherReturnToPromise,
  formatError,
  formatResult,
  isPromise,
} from '../';
import {
  buildClientSchema,
  getIntrospectionQuery,
  GraphQLError,
  GraphQLSchema,
  IntrospectionQuery,
  isSchema,
  validateSchema,
} from 'graphql';

import { GraphiQLState, ImmerStateCreator } from './store';
import { IntrospectionOptions } from './options';
import { produce } from 'immer';

type MaybeGraphQLSchema = GraphQLSchema | null | undefined;

export type SchemaState = {
  /**
   * Stores an error raised during introspecting or building the GraphQL schema
   * from the introspection result.
   */
  fetchError: string | null;

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

  requestCounter: number;
};

export type SchemaStateActions = {
  /**
   * Trigger introspection and schema building.
   * This should be called on your framework's mount event,
   * such as in a useEffect with empty dependencies in react
   */
  didMount(): void;
  /**
   * Trigger building the GraphQL schema. This might trigger an introspection
   * request if no schema is passed via props and if using a schema is not
   * explicitly disabled by passing `null` as value for the `schema` prop. If
   * there is a schema (either fetched using introspection or passed via props)
   * it will be validated, unless this is explicitly skipped using the
   * `dangerouslyAssumeSchemaIsValid` prop.
   */
  introspect(): void;
};

export type SchemaSlice = SchemaState & SchemaStateActions;

export const defaultSchemaState: SchemaState = {
  isFetching: false,
  fetchError: null,
  schema: null,
  validationErrors: [],
  requestCounter: 0,
};

export const schemaSlice: ImmerStateCreator<
  SchemaState & SchemaStateActions
> = (set, get) => ({
  ...defaultSchemaState,

  didMount: () => {
    set(
      produce((state: GraphiQLState) => {
        state.schema.isFetching = true;
        state.schema.introspect();
      }),
    );
  },
  introspect: () => {
    const options = get().options;
    if (isSchema(options.schema) || options.schema === null) {
      return;
    }

    /**
     * Only introspect if there is no schema provided via props. If the
     * prop is passed an introspection result, we do continue but skip the
     * introspection request.
     */
    set(
      produce((state: GraphiQLState) => {
        state.schema.requestCounter++;
      }),
    );

    const counter = get().schema.requestCounter;

    const maybeIntrospectionData = options.schema;

    const {
      introspectionQuery,
      introspectionQueryName,
      introspectionQuerySansSubscriptions,
    } = loadIntrospectionQuery({
      introspectionQueryName: options.introspectionQueryName,
    });

    async function fetchIntrospectionData() {
      if (maybeIntrospectionData) {
        // No need to introspect if we already have the data
        return maybeIntrospectionData;
      }

      const parsedHeaders = parseHeaderString(options.initialHeaders);
      if (!parsedHeaders.isValidJSON) {
        set(
          produce((state: GraphiQLState) => {
            state.schema.fetchError =
              'Introspection failed as headers are invalid.';
          }),
        );

        return;
      }

      const fetcherOpts: FetcherOpts = parsedHeaders.headers
        ? { headers: parsedHeaders.headers }
        : {};

      const fetcher = options.fetcher as Fetcher;

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
        set(
          produce((state: GraphiQLState) => {
            state.schema.fetchError =
              'Fetcher did not return a Promise for introspection.';
          }),
        );
        return;
      }

      set(
        produce((state: GraphiQLState) => {
          state.schema.isFetching = true;
          state.schema.fetchError = null;
        }),
      );

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

      set(
        produce((state: GraphiQLState) => {
          state.schema.isFetching = false;
        }),
      );

      if (result?.data && '__schema' in result.data) {
        return result.data as IntrospectionQuery;
      }

      // handle as if it were an error if the fetcher response is not a string or response.data is not present
      const responseString =
        typeof result === 'string' ? result : formatResult(result);

      set(
        produce((state: GraphiQLState) => {
          state.schema.fetchError = `Invalid introspection result: ${responseString}`;
        }),
      );
    }

    fetchIntrospectionData()
      .then(introspectionData => {
        /**
         * Don't continue if another introspection request has been started in
         * the meantime or if there is no introspection data.
         */
        if (counter !== get().schema.requestCounter || !introspectionData) {
          return;
        }

        try {
          const newSchema = (
            '__schema' in introspectionData
              ? buildClientSchema(introspectionData)
              : introspectionData
          ) as GraphQLSchema;

          set(
            produce((state: GraphiQLState) => {
              state.schema.schema = newSchema;
              state.schema.validationErrors = validateSchema(newSchema);
            }),
          );

          options.onSchemaChange?.(newSchema);
        } catch (error) {
          set(
            produce((state: GraphiQLState) => {
              state.schema.fetchError = formatError(error);
              state.schema.isFetching = false;
            }),
          );
        }
      })
      .catch(error => {
        /**
         * Don't continue if another introspection request has been started in
         * the meantime.
         */
        if (counter !== get().schema.requestCounter) {
          return;
        }

        set(
          produce((state: GraphiQLState) => {
            state.schema.fetchError = formatError(error);
            state.schema.isFetching = false;
          }),
        );
      });
  },
});

function loadIntrospectionQuery({
  inputValueDeprecation,
  introspectionQueryName,
  schemaDescription,
}: IntrospectionOptions) {
  const queryName = introspectionQueryName || 'IntrospectionQuery';

  let query = getIntrospectionQuery({
    inputValueDeprecation,
    schemaDescription,
  });
  if (introspectionQueryName) {
    query = query.replace('query IntrospectionQuery', `query ${queryName}`);
  }

  const querySansSubscriptions = query.replace('subscriptionType { name }', '');

  return {
    introspectionQueryName: queryName,
    introspectionQuery: query,
    introspectionQuerySansSubscriptions: querySansSubscriptions,
  };
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
