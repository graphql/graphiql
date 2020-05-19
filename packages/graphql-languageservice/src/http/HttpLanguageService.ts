import { LanguageService, GraphQLLspConfig } from 'LanguageService';
import { createHttpSchemaLoader } from './schema-loader';
import { createHttpQueryExecutor } from './query-executor';

type EndpointConfig = { uri: string; requestOpts?: RequestInit };
type SeparateIntrospectionAndExecutionConfig = {
  introspection: EndpointConfig;
  execution?: EndpointConfig;
};

type UnifiedConfig = EndpointConfig & { disableExecution?: boolean };

export type HttpGraphQLLanguageServiceConfig = Omit<
  GraphQLLspConfig,
  'schemaLoader' | 'queryExecutor'
> &
  (UnifiedConfig | SeparateIntrospectionAndExecutionConfig);

function createSchemaLoaderFromHttpGraphQLLanguageServiceConfig(
  config: HttpGraphQLLanguageServiceConfig,
) {
  let endpointConfig: undefined | EndpointConfig = undefined;
  if ((config as UnifiedConfig).uri) {
    endpointConfig = config as UnifiedConfig;
  } else {
    endpointConfig = (config as SeparateIntrospectionAndExecutionConfig)
      .introspection;
  }
  return createHttpSchemaLoader({
    introspectionOptions: config.introspectionOptions,
    uri: endpointConfig.uri,
    requestOpts: endpointConfig.requestOpts,
  });
}

function createQueryExecutorFromHttpGraphQLLanguageServiceConfig(
  config: HttpGraphQLLanguageServiceConfig,
) {
  let endpointConfig: undefined | EndpointConfig = undefined;
  if ((config as EndpointConfig).uri) {
    const unified = config as UnifiedConfig;
    endpointConfig = unified.disableExecution ? undefined : unified;
  } else {
    endpointConfig = (config as SeparateIntrospectionAndExecutionConfig)
      .execution;
  }
  if (endpointConfig) {
    return createHttpQueryExecutor({
      uri: endpointConfig.uri,
      requestOpts: endpointConfig.requestOpts,
    });
  }
}

export class HttpFetcherLanguageService extends LanguageService {
  constructor(config: HttpGraphQLLanguageServiceConfig) {
    super({
      ...config,
      schemaLoader: createSchemaLoaderFromHttpGraphQLLanguageServiceConfig(
        config,
      ),
      queryExecutor: createQueryExecutorFromHttpGraphQLLanguageServiceConfig(
        config,
      ),
    });
  }
}
