import { describe, expect, it } from 'vitest';
import { buildSchema } from 'graphql';
import { LanguageService } from '../src/LanguageService';

const schema = buildSchema('type Query { hello: String }');

describe('LanguageService.getSchemaForFile', () => {
  it('matches document URIs to schemas using fileMatch globs', () => {
    const service = new LanguageService({
      schemas: [
        {
          uri: 'admin-schema.graphql',
          schema,
          fileMatch: ['**/admin/**/*.graphql'],
        },
        {
          uri: 'storefront-schema.graphql',
          schema,
          fileMatch: ['**/storefront/**/*.graphql'],
        },
      ],
    });

    expect(
      service.getSchemaForFile(
        'file:///workspace/packages/admin/operations/query.graphql',
      )?.uri,
    ).toBe('admin-schema.graphql');
    expect(
      service.getSchemaForFile(
        'file:///workspace/packages/storefront/operations/query.graphql',
      )?.uri,
    ).toBe('storefront-schema.graphql');
    expect(service.getSchemaForFile('file:///workspace/query.graphql')).toBe(
      undefined,
    );
  });
});
