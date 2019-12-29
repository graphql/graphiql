import { GraphQLOperationParameters, GraphiQLProps } from 'graphiql';

export type GraphiQLFetcherOptions = {
  uri: string;
  headers?: { [key: string]: string };
  method?: string;
  parseResult?: (res: Response) => Promise<any>;
  modifyOperation?: (
    operation: GraphQLOperationParameters,
  ) => GraphQLOperationParameters;
};

export type RenderGraphiQLOptions = {
  containerId?: string;
} & GraphiQLFetcherOptions &
  GraphiQLProps;
