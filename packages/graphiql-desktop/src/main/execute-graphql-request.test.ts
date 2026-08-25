import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import {
  executeGraphQLRequest,
  isValidGraphQLRequestPayload,
} from './execute-graphql-request';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

function listen(handler: Handler): Promise<{ server: Server; url: string }> {
  return new Promise((resolve, reject) => {
    const server = createServer(handler);
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address === null || typeof address === 'string') {
        reject(new Error('Expected a bound TCP address'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => (raw += chunk));
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close(error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

describe('executeGraphQLRequest', () => {
  let activeServer: Server | undefined;

  afterEach(async () => {
    if (activeServer) {
      await closeServer(activeServer);
      activeServer = undefined;
    }
  });

  it('forwards the body verbatim and returns the upstream JSON response', async () => {
    const { server, url } = await listen(async (req, res) => {
      const body = await readBody(req);
      expect(body).toBe('{"query":"{ __typename }"}');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: { __typename: 'Query' } }));
    });
    activeServer = server;

    const result = await executeGraphQLRequest({
      url,
      body: '{"query":"{ __typename }"}',
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.contentType).toBe('application/json');
    expect(result.text).toBe(JSON.stringify({ data: { __typename: 'Query' } }));
  });

  it('passes through upstream 400/500 GraphQL error responses without treating them as transport failures', async () => {
    const { server, url } = await listen((_req, res) => {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ errors: [{ message: 'bad query' }] }));
    });
    activeServer = server;

    const result = await executeGraphQLRequest({ url, body: '{}' });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.errorMessage).toBeUndefined();
    expect(JSON.parse(result.text!)).toEqual({
      errors: [{ message: 'bad query' }],
    });
  });

  it('passes through upstream 500 responses too', async () => {
    const { server, url } = await listen((_req, res) => {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ errors: [{ message: 'internal error' }] }));
    });
    activeServer = server;

    const result = await executeGraphQLRequest({ url, body: '{}' });

    expect(result.status).toBe(500);
    expect(result.text).toContain('internal error');
  });

  it('forwards custom headers and applies defaults when absent', async () => {
    const { server, url } = await listen((req, res) => {
      expect(req.headers.authorization).toBe('Bearer secret');
      expect(req.headers.accept).toBe('application/json');
      expect(req.headers['content-type']).toBe('application/json');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{}');
    });
    activeServer = server;

    const result = await executeGraphQLRequest({
      url,
      headers: { authorization: 'Bearer secret' },
      body: '{}',
    });

    expect(result.ok).toBe(true);
  });

  it('lets a user-supplied content-type override the default', async () => {
    const { server, url } = await listen((req, res) => {
      expect(req.headers['content-type']).toBe(
        'application/graphql-response+json',
      );
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{}');
    });
    activeServer = server;

    await executeGraphQLRequest({
      url,
      headers: { 'content-type': 'application/graphql-response+json' },
      body: '{}',
    });
  });

  it('returns a structured error for a connection refused, without throwing', async () => {
    const { server, url } = await listen((_req, res) => res.end());
    await closeServer(server);

    const result = await executeGraphQLRequest({ url, body: '{}' });

    expect(result.ok).toBe(false);
    expect(result.status).toBeUndefined();
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain(url);
  });

  it('returns a structured timeout error when the upstream never responds', async () => {
    const { server, url } = await listen(() => {
      // Never call res.end(): simulates a hung upstream.
    });
    activeServer = server;

    const result = await executeGraphQLRequest(
      { url, body: '{}' },
      { timeoutMs: 50 },
    );

    expect(result.ok).toBe(false);
    expect(result.errorMessage).toMatch(/timed out/i);
  });

  it('rejects non-http(s) schemes without making any request', async () => {
    const fileResult = await executeGraphQLRequest({
      url: 'file:///etc/passwd',
      body: '{}',
    });
    expect(fileResult.ok).toBe(false);
    expect(fileResult.errorMessage).toMatch(/http/i);

    const ftpResult = await executeGraphQLRequest({
      url: 'ftp://example.com/',
      body: '{}',
    });
    expect(ftpResult.ok).toBe(false);
    expect(ftpResult.errorMessage).toMatch(/http/i);
  });
});

describe('isValidGraphQLRequestPayload', () => {
  it('accepts a well-formed payload', () => {
    expect(
      isValidGraphQLRequestPayload({
        url: 'https://example.com/graphql',
        headers: { authorization: 'Bearer x' },
        body: '{"query":"{ __typename }"}',
      }),
    ).toBe(true);
  });

  it('accepts a payload without headers', () => {
    expect(
      isValidGraphQLRequestPayload({
        url: 'https://example.com/graphql',
        body: '{}',
      }),
    ).toBe(true);
  });

  it.each([
    ['non-object', 'nope'],
    ['null', null],
    ['array', []],
    ['missing url', { body: '{}' }],
    ['non-string url', { url: 42, body: '{}' }],
    ['non-string body', { url: 'https://example.com', body: {} }],
    ['missing body', { url: 'https://example.com' }],
    [
      'nested headers object',
      {
        url: 'https://example.com',
        body: '{}',
        headers: { a: { b: 'c' } },
      },
    ],
    [
      'headers as array',
      { url: 'https://example.com', body: '{}', headers: [] },
    ],
    [
      'unexpected extra key',
      { url: 'https://example.com', body: '{}', evil: true },
    ],
  ])('rejects %s', (_label, value) => {
    expect(isValidGraphQLRequestPayload(value)).toBe(false);
  });

  it('rejects prototype-pollution-ish input', () => {
    // JSON.parse creates a plain own property named "__proto__" here (it
    // doesn't mutate the prototype), but it's still not an allowed key.
    const polluted = JSON.parse(
      '{"url":"https://example.com","body":"{}","__proto__":{"polluted":true}}',
    );
    expect(isValidGraphQLRequestPayload(polluted)).toBe(false);

    const nonPlainObject = Object.create({ polluted: true });
    nonPlainObject.url = 'https://example.com';
    nonPlainObject.body = '{}';
    expect(isValidGraphQLRequestPayload(nonPlainObject)).toBe(false);
  });
});
