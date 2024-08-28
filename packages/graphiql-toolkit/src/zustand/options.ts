import { FragmentDefinitionNode, GraphQLSchema, ValidationRule } from 'graphql';
import { TabDefinition, TabsState } from './tabs';
import { ImmerStateCreator } from './store';
import {
  createGraphiQLFetcher,
  Fetcher,
  CreateFetcherOptions,
} from '../create-fetcher';
import { GetDefaultFieldNamesFn } from '../graphql-helpers';
import { IntrospectionArgs } from './schema';

type FetcherOptionsState = {
  /**
   * The fetcher function that is used to send the request to the server.
   * See the `createGraphiQLFetcher` function for an example of a fetcher
   * TODO: link to fetcher documentation
   */
  fetcher: Fetcher;

  /**
   * config to pass to the fetcher. overrides fetcher if provided.
   */
  fetchOptions?: CreateFetcherOptions;
};

export type OptionsState = {
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
  schema?: GraphQLSchema | null;

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
   * A function to determine which field leafs are automatically added when
   * trying to execute a query with missing selection sets. It will be called
   * with the `GraphQLType` for which fields need to be added.
   */
  getDefaultFieldNames?: GetDefaultFieldNamesFn;

  onTabChange?: (tabs: TabsState) => void;
  onSchemaChange?: (schema: GraphQLSchema) => void;
} & FetcherOptionsState &
  IntrospectionArgs;

export type GraphiQLStoreOptions = OptionsState;

const DEFAULT_QUERY = `# Welcome to GraphiQL
`;

const defaultOptions = {
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
  fetcher: createGraphiQLFetcher({ url: '/graphql' }),
} as OptionsState;

function mapOptionsToState(options: Partial<OptionsState>): OptionsState;

function mapOptionsToState(
  options: Partial<OptionsState>,
): Partial<OptionsState> {
  return {
    ...options,
    fetcher: options?.fetchOptions
      ? createGraphiQLFetcher(options.fetchOptions)
      : options?.fetcher ?? createGraphiQLFetcher({ url: '/graphql' }),
  };
}

export const optionsSlice: ImmerStateCreator<OptionsState> = set => ({
  ...defaultOptions,
  configure: (options: Partial<OptionsState>) => {
    set(state => {
      Object.assign(state, mapOptionsToState(options));
    });
  },
  reset: () => {
    set(state => {
      state.options = defaultOptions;
    });
  },
});
