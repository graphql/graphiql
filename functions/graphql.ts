import {
  createHandler as createRawHandler,
  HandlerOptions as RawHandlerOptions,
  OperationContext,
} from 'graphql-http';

import type {
  Handler as NetlifyHandler,
  HandlerEvent as NetlifyHandlerEvent,
  HandlerContext as NetlifyHandlerContext,
} from '@netlify/functions';

import { schema } from '../packages/graphiql/test/schema.js';

/**
 * Handler options when using the netlify adapter
 *
 * @category Server/@netlify/functions
 */
export type HandlerOptions<Context extends OperationContext = undefined> =
  RawHandlerOptions<NetlifyHandlerEvent, NetlifyHandlerContext, Context>;

/**
 * Create a GraphQL over HTTP spec compliant request handler for netlify functions
 *
 * @category Server/@netlify/functions
 */
export function createHandler<Context extends OperationContext = undefined>(
  options: HandlerOptions<Context>,
): NetlifyHandler {
  const handler = createRawHandler(options);
  return async function handleRequest(req, ctx) {
    try {
      const [body, init] = await handler({
        method: req.httpMethod,
        url: req.rawUrl,
        headers: req.headers,
        body: req.body,
        raw: req,
        context: ctx,
      });
      return {
        // if body is null, return undefined
        body: body ?? undefined,
        statusCode: init.status,
      };
    } catch (err) {
      // The handler shouldn't throw errors.
      // If you wish to handle them differently, consider implementing your own request handler.
      console.error(
        'Internal error occurred during request handling. Please check your implementation.',
        err,
      );
      return { statusCode: 500 };
    }
  };
}

export const handler = createHandler({ schema });
