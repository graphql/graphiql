import type {
  Handler as NetlifyHandler,
  HandlerEvent as NetlifyHandlerEvent,
} from '@netlify/functions';

import { testSchema } from '../packages/graphiql/test/schema.js';
import { customExecute } from '../packages/graphiql/test/execute.js';

import {
  getGraphQLParameters,
  processRequest,
  sendResult,
  Request as HelixRequest,
} from 'graphql-helix';

/**
 * Create a GraphQL over HTTP spec compliant request handler for netlify functions
 *
 * @category Server/@netlify/functions
 */
/**
 * Netlify-compatible GraphQL handler using graphql-helix
 */
export const handler: NetlifyHandler = async (event, context) => {
  try {
    const request = toHelixRequest(event);
    const { operationName, query, variables } = getGraphQLParameters(request);

    const result = await processRequest({
      operationName,
      query,
      variables,
      request,
      schema: testSchema,
      execute: customExecute,
      contextFactory: () => ({ netlifyContext: context }),
    });

    const chunks: unknown[] = [];
    const res = {
      status: 200,
      setHeader: (_name: string, _value: string) => {},
      end: chunk => chunks.push(chunk),
      write: chunk => chunks.push(chunk),
    };

    await sendResult(result, res);

    return {
      statusCode: 200,
      body: chunks.join(''),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (err) {
    // The handler shouldn't throw errors.
    // If you wish to handle them differently, consider implementing your own request handler.
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

/**
 * Convert a Netlify request to a GraphQL Helix compatible request
 */
function toHelixRequest(req: NetlifyHandlerEvent): HelixRequest {
  const url = new URL(
    req.rawUrl ?? '',
    `https://${req.headers.host ?? 'localhost'}`,
  );
  return {
    method: req.httpMethod,
    headers: req.headers,
    body: req.body ? JSON.parse(req.body) : undefined,
    query: Object.fromEntries(url.searchParams.entries()),
  };
}
