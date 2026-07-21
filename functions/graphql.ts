import type {
  Handler as NetlifyHandler,
  HandlerEvent as NetlifyHandlerEvent,
  HandlerResponse as NetlifyHandlerResponse,
} from '@netlify/functions';
import * as graphql from 'graphql';
import {
  getGraphQLParameters,
  processRequest,
  type ProcessRequestResult,
} from 'graphql-helix';
import { createSchema } from '../packages/graphiql/test/schema.js';
import { createExecute } from '../packages/graphiql/test/execute.js';

type HandlerOptions = {
  schema: graphql.GraphQLSchema;
  execute: (...args: any[]) => any;
};

function headersToObject(
  headers: Iterable<{ name: string; value: string }>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { name, value } of headers) {
    result[name] = value;
  }
  return result;
}

/**
 * Buffer an incremental-delivery (`@defer`/`@stream`) result into a single
 * `multipart/mixed` response. Netlify's request/response functions can't stream,
 * so every patch is collected and sent at once using the same wire format the
 * dev server (`graphql-helix`) emits, which the GraphiQL fetcher already parses.
 */
async function bufferMultipartResponse(
  result: Extract<ProcessRequestResult, { type: 'MULTIPART_RESPONSE' }>,
): Promise<NetlifyHandlerResponse> {
  const chunks = ['---'];
  await result.subscribe(patch => {
    const chunk = JSON.stringify(patch);
    const data = [
      '',
      'Content-Type: application/json; charset=utf-8',
      `Content-Length: ${chunk.length}`,
      '',
      chunk,
    ];
    if (patch.hasNext) {
      data.push('---');
    }
    chunks.push(data.join('\r\n'));
  });
  chunks.push('\r\n-----\r\n');
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'multipart/mixed; boundary="-"' },
    body: chunks.join(''),
  };
}

/**
 * Create a GraphQL request handler for netlify functions backed by
 * `graphql-helix`, which supports incremental delivery (`@defer`/`@stream`)
 * against `graphql-js` 17.
 *
 * @category Server/@netlify/functions
 */
export function createHandler(options: HandlerOptions): NetlifyHandler {
  return async function handleRequest(event: NetlifyHandlerEvent) {
    try {
      const rawBody =
        event.body && event.isBase64Encoded
          ? Buffer.from(event.body, 'base64').toString('utf8')
          : event.body;
      const request = {
        body: rawBody ? JSON.parse(rawBody) : undefined,
        headers: event.headers,
        method: event.httpMethod,
        query: event.queryStringParameters ?? {},
      };

      const { operationName, query, variables } = getGraphQLParameters(request);
      const result = await processRequest({
        operationName,
        query,
        variables,
        request,
        schema: options.schema,
        execute: options.execute,
      });

      if (result.type === 'RESPONSE') {
        return {
          statusCode: result.status,
          headers: headersToObject(result.headers),
          body: JSON.stringify(result.payload),
        };
      }
      if (result.type === 'MULTIPART_RESPONSE') {
        return bufferMultipartResponse(result);
      }
      // PUSH results are subscriptions, which need the WebSocket endpoint.
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errors: [
            {
              message:
                'Subscriptions are not supported over HTTP. Use the WebSocket endpoint instead.',
            },
          ],
        }),
      };
    } catch (err) {
      console.error(
        'Internal error occurred during request handling. Please check your implementation.',
        err,
      );
      return {
        statusCode: 500,
        body: JSON.stringify({ errors: [{ message: err.message }] }),
      };
    }
  };
}

export const handler = createHandler({
  schema: createSchema(graphql),
  execute: createExecute(graphql),
});
