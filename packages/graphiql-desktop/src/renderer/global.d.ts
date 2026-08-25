import type {
  GraphQLRequestPayload,
  GraphQLRequestResult,
} from '../main/execute-graphql-request';

export {};

declare global {
  interface Window {
    graphiqlDesktop: {
      fetchGraphQL(
        payload: GraphQLRequestPayload,
      ): Promise<GraphQLRequestResult>;
    };
  }
}
