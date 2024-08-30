import { FragmentDefinitionNode, GraphQLSchema, ValidationRule } from 'graphql';
import { TabDefinition, TabsState } from './tabs';
import { GraphiQLState, ImmerStateCreator } from './store';
import {
  createGraphiQLFetcher,
  Fetcher,
  CreateFetcherOptions,
} from '../create-fetcher';
import { GetDefaultFieldNamesFn } from '../graphql-helpers';
import { DEFAULT_QUERY } from '../constants';
import { produce } from 'immer';

/**
 * TODO: I like grouping these options and unioning the types,
 * but I think it won't be unified with typedoc
 */

export type IntrospectionOptions = {
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

// you can supply either or neither of these options, never both
export type FetcherOptions =
  | {
      /**
       * The fetcher function that is used to send the request to the server.
       * See the `createGraphiQLFetcher` function for an example of a fetcher
       * TODO: link to fetcher documentation
       */
      fetcher?: Fetcher;
    }
  | {
      /**
       * config to pass to the fetcher. overrides fetcher if provided.
       */
      fetchOptions?: CreateFetcherOptions;
    };

type GeneralUserOptions = {
  /**
   * The current theme of the editor.
   */
  editorTheme: string;
  /**
   * The current key map of the editor.
   */
  keyMap: 'sublime' | 'emacs' | 'vim';
  /**
   * Whether the editor is read-only.
   */
  readOnly: boolean;

  defaultQuery?: string;
  defaultHeaders?: string;
  /**
   * The contents of the headers editor when initially rendering the provider
   * component.
   */
  initialHeaders: string;
  /**
   * The contents of the query editor when initially rendering the provider
   * component.
   */
  initialQuery: string;
  /**
   * The contents of the response editor when initially rendering the provider
   * component.
   */
  initialResponse: string;
  /**
   * The contents of the variables editor when initially rendering the provider
   * component.
   */
  initialVariables: string;

  /**
   * A map of fragment definitions using the fragment name as key which are
   * made available to include in the query.
   */
  externalFragments: Map<string, FragmentDefinitionNode>;
  /**
   * A list of custom validation rules that are run in addition to the rules
   * provided by the GraphQL spec.
   */
  validationRules: ValidationRule[];

  /**
   * If the contents of the headers editor are persisted in storage.
   */
  shouldPersistHeaders: boolean;

  /**
   * This can be used to set the contents of the headers editor. Every
   * time this changes, the contents of the headers editor are replaced.
   * Note that the editor contents can be changed in between these updates by
   * typing in the editor.
   */
  headers?: string;
  /**
   * This can be used to define the default set of tabs, with their
   * queries, variables, and headers. It will be used as default only if
   * there is no tab state persisted in storage.
   */
  defaultTabs?: TabDefinition[];

  /**
   * Optionally provide the schema directly. Disables the schema introspection request.
   */
  schema: GraphQLSchema | null;

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
   * optional custom storage key for the graphiql state - will determine the name of the idb storage
   */

  storageKeyPrefix?: string;
  /**
   * Provide a custom storage API.
   * @default `localStorage`
   * @see {@link https://graphiql-test.netlify.app/typedoc/modules/graphiql_toolkit.html#storage-2|API docs}
   * for details on the required interface.
   */
  storage?: Storage;
  /**
   * A function to determine which field leafs are automatically added when
   * trying to execute a query with missing selection sets. It will be called
   * with the `GraphQLType` for which fields need to be added.
   */
  getDefaultFieldNames?: GetDefaultFieldNamesFn;

  onTabChange?: (tabs: TabsState) => void;
  onSchemaChange?: (schema: GraphQLSchema) => void;

  /**
   * Invoked when the operation name changes. Possible triggers are:
   * - Editing the contents of the query editor
   * - Selecting a operation for execution in a document that contains multiple
   *   operation definitions
   * @param operationName The operation name after it has been changed.
   */
  onEditOperationName?(operationName: string): void;
};

export type OptionsState = GeneralUserOptions &
  FetcherOptions &
  IntrospectionOptions & { fetcher: Fetcher };

export type UserOptions = Partial<GeneralUserOptions> &
  FetcherOptions &
  IntrospectionOptions;

export type OptionsStateActions = {
  /**
   * Configure the options state with the provided options, patching the previous config
   */
  configure(options: UserOptions): void;

  /**
   * Set the options state with the provided options, resetting other options to defaults
   */
  setConfig(options: UserOptions): void;
};

// new fallback default allows no fetcher to be supplied
// and uses the conventional relative /graphql path
const defaultFetcher = createGraphiQLFetcher({ url: '/graphql' });

export type GraphiQLStoreOptions = OptionsState;

export type OptionsSlice = OptionsState &
  // fetcher is always present, just not required
  OptionsStateActions;

const defaultOptionsState = {
  editorTheme: 'graphiql',
  keyMap: 'sublime',
  readOnly: false,
  initialQuery: '',
  initialResponse: '',
  initialVariables: '',
  initialHeaders: '',
  externalFragments: new Map(),
  validationRules: [],
  shouldPersistHeaders: false,
  defaultQuery: DEFAULT_QUERY,
  defaultTabs: [],
  schema: null,
  fetcher: defaultFetcher,
} as OptionsState;

function mapOptionsToState(options: UserOptions) {
  let fetcher: Fetcher;
  if ('fetchOptions' in options && options.fetchOptions) {
    fetcher = createGraphiQLFetcher(options.fetchOptions);
  } else if ('fetcher' in options && options.fetcher) {
    fetcher = options.fetcher;
  } else {
    fetcher = defaultFetcher;
  }

  return {
    ...options,
    fetcher,
  };
}

type SliceWithOptions = (
  options?: UserOptions,
) => ImmerStateCreator<OptionsSlice>;

export const optionsSlice: SliceWithOptions = userOpts => set => ({
  ...defaultOptionsState,
  ...mapOptionsToState(userOpts ? userOpts : {}),
  configure: (options: UserOptions) => {
    set(
      produce((state: GraphiQLState) => {
        Object.assign(state.options, mapOptionsToState(options));
      }),
    );
  },
  setConfig: (options: UserOptions) => {
    set(
      produce((state: GraphiQLState) => {
        state.options = {
          ...Object.assign(defaultOptionsState, mapOptionsToState(options)),
          configure: state.options.configure,
          setConfig: state.options.setConfig,
        };
      }),
    );
  },
});
