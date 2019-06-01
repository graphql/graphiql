/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {expect} from 'chai';
import {describe, it} from 'mocha';
import CodeMirror from 'codemirror';
import 'codemirror/addon/runmode/runmode';
import '../mode';
import {readFileSync} from 'fs';
import {join} from 'path';

describe('graphql-mode', () => {
  it('provides correct tokens and styles after parsing', () => {
    const queryStr = 'query name { }';
    const tokens = [];
    const styles = [];

    CodeMirror.runMode(queryStr, 'graphql', (token, style) => {
      if (style && style !== 'ws') {
        tokens.push(token);
        styles.push(style);
      }
    });

    expect(tokens).to.deep.equal(['query', 'name', '{', '}']);
    expect(styles).to.deep.equal([
      'keyword',
      'def',
      'punctuation',
      'punctuation',
    ]);
  });

  it('parses Relay-style anonymous FragmentDefinitions', () => {
    CodeMirror.runMode('fragment on Test { id }', 'graphql', (token, style) =>
      expect(style).to.not.equal('invalidchar'),
    );
  });

  it('parses inline fragments with optional syntax correctly', () => {
    CodeMirror.runMode(
      '{ ... on OptionalType { name } }',
      'graphql',
      (token, style) => expect(style).to.not.equal('invalidchar'),
    );

    CodeMirror.runMode('{ ... { name } }', 'graphql', (token, style) =>
      expect(style).to.not.equal('invalidchar'),
    );

    CodeMirror.runMode(
      '{ ... @optionalDirective { name } }',
      'graphql',
      (token, style) => expect(style).to.not.equal('invalidchar'),
    );
  });

  it('returns "invalidchar" message when there is no matching token', () => {
    CodeMirror.runMode('qauery name', 'graphql', (token, style) => {
      if (token.trim()) {
        expect(style).to.equal('invalidchar');
      }
    });

    CodeMirror.runMode('query %', 'graphql', (token, style) => {
      if (token === '%') {
        expect(style).to.equal('invalidchar');
      }
    });
  });

  it('parses kitchen-sink query without invalidchar', () => {
    const kitchenSink = readFileSync(join(__dirname, '/kitchen-sink.graphql'), {
      encoding: 'utf8',
    });

    CodeMirror.runMode(kitchenSink, 'graphql', (token, style) => {
      expect(style).to.not.equal('invalidchar');
    });
  });

  it('parses schema-kitchen-sink query without invalidchar', () => {
    const schemaKitchenSink = readFileSync(
      join(__dirname, '/schema-kitchen-sink.graphql'),
      {encoding: 'utf8'},
    );

    CodeMirror.runMode(schemaKitchenSink, 'graphql', (token, style) => {
      expect(style).to.not.equal('invalidchar');
    });
  });

  it('parses anonymous operations without invalidchar', () => {
    CodeMirror.runMode('{ id }', 'graphql', (token, style) => {
      expect(style).to.not.equal('invalidchar');
    });

    CodeMirror.runMode(
      `
      mutation {
        setString(value: "newString")
      }
    `,
      'graphql',
      (token, style) => {
        expect(style).to.not.equal('invalidchar');
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
      (token, style) => {
        expect(style).to.not.equal('invalidchar');
      },
    );
  });
});
