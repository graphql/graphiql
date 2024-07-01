import * as lambda from 'netlify-lambda';
import renderGraphiql from '../../graphiql-rendergraphiql-middlewares/renderGraphiQL';

type Options = {
  url: string;
  query: string;
  variables: object;
  result?: object;
  fetcher?: (graphQLParams: any) => Promise<any>;
};

export default function lambdaGraphiql(options: Options) {
  return async (
    _event,
    _lambdaContext: lambda.Context,
    callback: lambda.Callback,
  ) => {
    const body = await renderGraphiql(options);
    callback(null, {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body,
    });
  };
}
