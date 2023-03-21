/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import 'codemirror/addon/runmode/runmode';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import '../mode';

describe('graphql-mode', () => {
  it('provides correct tokens and styles after parsing', () => {
    const queryStr = 'query name { }';
    const tokens: string[] = [];
    const styles: string[] = [];

    CodeMirror.runMode(queryStr, 'graphql', (token, style) => {
      if (style && style !== 'ws') {
        tokens.push(token);
        styles.push(style);
      }
    });

    expect(tokens).toEqual(['query', 'name', '{', '}']);
    expect(styles).toEqual(['keyword', 'def', 'punctuation', 'punctuation']);
  });

  it('parses Relay-style anonymous FragmentDefinitions', () => {
    CodeMirror.runMode('fragment on Test { id }', 'graphql', (_token, style) =>
      expect(style).not.toBe('invalidchar'),
    );
  });

  it('parses inline fragments with optional syntax correctly', () => {
    CodeMirror.runMode(
      '{ ... on OptionalType { name } }',
      'graphql',
      (_token, style) => expect(style).not.toBe('invalidchar'),
    );

    CodeMirror.runMode('{ ... { name } }', 'graphql', (_token, style) =>
      expect(style).not.toBe('invalidchar'),
    );

    CodeMirror.runMode(
      '{ ... @optionalDirective { name } }',
      'graphql',
      (_token, style) => expect(style).not.toBe('invalidchar'),
    );
  });

  it('returns "invalidchar" message when there is no matching token', () => {
    CodeMirror.runMode('invalidKeyword name', 'graphql', (token, style) => {
      if (token.trim()) {
        expect(style).toBe('invalidchar');
      }
    });

    CodeMirror.runMode('query %', 'graphql', (token, style) => {
      if (token === '%') {
        expect(style).toBe('invalidchar');
      }
    });
  });

  it('parses kitchen-sink query without invalidchar', () => {
    const kitchenSink = readFileSync(
      join(__dirname, '/kitchen-sink.graphql'),
      'utf8',
    );

    CodeMirror.runMode(kitchenSink, 'graphql', (_token, style) => {
      expect(style).not.toBe('invalidchar');
    });
  });

  it('parses schema-kitchen-sink query without invalidchar', () => {
    const schemaKitchenSink = readFileSync(
      join(__dirname, '/schema-kitchen-sink.graphql'),
      'utf8',
    );

    CodeMirror.runMode(schemaKitchenSink, 'graphql', (_token, style) => {
      expect(style).not.toBe('invalidchar');
    });
  });

  it('parses anonymous operations without invalidchar', () => {
    CodeMirror.runMode('{ id }', 'graphql', (_token, style) => {
      expect(style).not.toBe('invalidchar');
    });

    CodeMirror.runMode(
      `
      mutation {
        setString(value: "newString")
      }
    `,
      'graphql',
      (_token, style) => {
        expect(style).not.toBe('invalidchar');
      },
    );

    CodeMirror.runMode(
      `
      subscription {
        subscribeToTest(id: "anId") {
          id
        }
      }
    `,
      'graphql',
      (_token, style) => {
        expect(style).not.toBe('invalidchar');
      },
    );
  });
});
