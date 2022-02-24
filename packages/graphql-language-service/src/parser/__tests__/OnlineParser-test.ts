/* eslint-disable jest/expect-expect */
import OnlineParser from '../onlineParser';
import {
  getUtils,
  performForEachType,
  expectVarsDef,
  expectArgs,
  expectDirective,
} from './OnlineParserUtils';

describe('onlineParser', () => {
  describe('.startState', () => {
    it('initializes state correctly', () => {
      const parser = OnlineParser();

      expect(parser.startState()).toEqual({
        level: 0,
        step: 0,
        name: null,
        kind: 'Document',
        type: null,
        rule: [
          {
            isList: true,
            ofRule: 'Definition',
            separator: undefined,
          },
        ],
        needsSeperator: false,
        prevState: {
          level: 0,
          step: 0,
          name: null,
          kind: null,
          type: null,
          rule: null,
          needsSeperator: false,
          prevState: null,
        },
      });
    });
  });

  describe('.token', () => {
    it('detects invalid char', () => {
      const { token } = getUtils(`^`);

      expect(token()).toEqual('invalidchar');
    });

    it('parses schema def', () => {
      const { t } = getUtils(`
        schema {
          query: SomeType
        }
      `);

      t.keyword('schema', { kind: 'SchemaDef' });
      t.punctuation('{');

      t.keyword('query', { kind: 'OperationTypeDef' });
      t.punctuation(':');
      t.name('SomeType');

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it('parses short query', () => {
      const { t } = getUtils(`
        {
          someField
        }
      `);

      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someField', { kind: 'Field' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it('parses query', () => {
      const { t } = getUtils(`
        query SomeQuery {
          someField
        }
      `);

      t.keyword('query', { kind: 'Query' });
      t.def('SomeQuery');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someField', { kind: 'Field' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it('parses query with variables', () => {
      const { t, stream } = getUtils(`
        query SomeQuery ($someVariable: SomeInputType) {
          someField(someArg: $someVariable)
        }
      `);

      t.keyword('query', { kind: 'Query' });
      t.def('SomeQuery');
      expectVarsDef(
        { t, stream },
        {
          onKind: 'Query',
          vars: [{ name: 'someVariable', type: 'SomeInputType' }],
        },
      );
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someField', { kind: 'Field' });
      expectArgs(
        { t, stream },
        {
          onKind: 'Field',
          args: [{ name: 'someArg', isVariable: true, value: 'someVariable' }],
        },
      );

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    performForEachType(
      `
        query SomeQuery {
          someField(someArg: __VALUE__)
        }
      `,
      ({ t, stream }, fill) => {
        it(`parses query field having argument of type ${fill.type}`, () => {
          t.keyword('query', { kind: 'Query' });
          t.def('SomeQuery');
          t.punctuation('{', { kind: 'SelectionSet' });

          t.property('someField', { kind: 'Field' });
          expectArgs(
            { t, stream },
            { onKind: 'Field', args: [{ name: 'someArg', ...fill }] },
          );

          t.punctuation('}', { kind: 'Document' });

          t.eol();
        });
      },
    );

    performForEachType(
      `
        query SomeQuery {
          someField(someArg: [__VALUE__])
        }
      `,
      ({ t, stream }, fill) => {
        it(`parses query field having argument as list of type ${fill.type}`, () => {
          t.keyword('query', { kind: 'Query' });
          t.def('SomeQuery');
          t.punctuation('{', { kind: 'SelectionSet' });

          t.property('someField', { kind: 'Field' });
          expectArgs(
            { t, stream },
            {
              onKind: 'Field',
              args: [{ name: 'someArg', isList: true, ...fill }],
            },
          );

          t.punctuation('}', { kind: 'Document' });

          t.eol();
        });
      },
    );

    it('parses query field having argument of type object', () => {
      const { t } = getUtils(`
        query SomeQuery {
          someField(someArg: { anotherField: $someVariable })
        }
      `);
      t.keyword('query', { kind: 'Query' });
      t.def('SomeQuery');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someField', { kind: 'Field' });
      t.punctuation(/\(/, { kind: 'Arguments' });
      t.attribute('someArg', { kind: 'Argument' });
      t.punctuation(':');
      t.punctuation('{', { kind: 'ObjectValue' });
      t.attribute('anotherField', { kind: 'ObjectField' });
      t.punctuation(':');
      t.variable('$', { kind: 'Variable' });
      t.variable('someVariable');
      t.punctuation('}', { kind: 'Arguments' });
      t.punctuation(/\)/, { kind: 'Field' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    performForEachType(
      `
        query SomeQuery {
          someField @someDirective(anotherArg: __VALUE__)
        }
      `,
      ({ t, stream }, fill) => {
        it(`parses query field with directive having argument of type ${fill.type}`, () => {
          t.keyword('query', { kind: 'Query' });
          t.def('SomeQuery');
          t.punctuation('{', { kind: 'SelectionSet' });

          t.property('someField', { kind: 'Field' });
          expectDirective(
            { t, stream },
            {
              name: 'someDirective',
              onKind: 'Field',
              args: [{ name: 'anotherArg', ...fill }],
            },
          );

          t.punctuation('}', { kind: 'Document' });

          t.eol();
        });
      },
    );

    it(`parses query field with a directive and selection set`, () => {
      const { t } = getUtils(`
        query SomeQuery {
          someField @someDirective {
            anotherField
          }
        }
      `);
      t.keyword('query', { kind: 'Query' });
      t.def('SomeQuery');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someField', { kind: 'Field' });
      expectDirective({ t }, { name: 'someDirective' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('anotherField', { kind: 'Field' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it(`parses query field with an alias`, () => {
      const { t } = getUtils(`
        query SomeQuery {
          someAlias : someField @someDirective {
            anotherField
          }
        }
      `);
      t.keyword('query', { kind: 'Query' });
      t.def('SomeQuery');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someAlias', { kind: 'AliasedField' });
      t.punctuation(':');
      t.qualifier('someField');
      expectDirective({ t }, { name: 'someDirective' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('anotherField', { kind: 'Field' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it(`parses invalid query`, () => {
      const { t, token } = getUtils(`
        {}garbage
      `);

      t.punctuation('{', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'Document' });

      expect(token()).toEqual('invalidchar');

      t.eol();
    });

    it(`parses a fragment defination`, () => {
      const { t } = getUtils(`
        fragment SomeFragment on SomeType {
          someField
        }
      `);

      t.keyword('fragment', { kind: 'FragmentDefinition' });
      t.def('SomeFragment');
      t.keyword('on', { kind: 'TypeCondition' });
      t.name('SomeType', { kind: 'NamedType' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someField', { kind: 'Field' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it(`parses a fragment defination with a directive`, () => {
      const { t } = getUtils(`
        fragment SomeFragment on SomeType @someDirective {
          someField
        }
      `);

      t.keyword('fragment', { kind: 'FragmentDefinition' });
      t.def('SomeFragment');
      t.keyword('on', { kind: 'TypeCondition' });
      t.name('SomeType', { kind: 'NamedType' });
      expectDirective({ t }, { name: 'someDirective' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someField', { kind: 'Field' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it('parses query with inline fragment', () => {
      const { t } = getUtils(`
        query SomeQuery {
          someField {
            ... on SomeType {
              anotherField
            }
          }
        }
      `);

      t.keyword('query', { kind: 'Query' });
      t.def('SomeQuery');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someField', { kind: 'Field' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.punctuation('...', { kind: 'InlineFragment' });
      t.keyword('on', { kind: 'TypeCondition' });
      t.name('SomeType', { kind: 'NamedType' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('anotherField', { kind: 'Field' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it('parses query with fragment spread', () => {
      const { t } = getUtils(`
        query SomeQuery {
          someField {
            ...SomeFragment @someDirective
          }
        }
      `);

      t.keyword('query', { kind: 'Query' });
      t.def('SomeQuery');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someField', { kind: 'Field' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.punctuation('...', { kind: 'FragmentSpread' });
      t.def('SomeFragment');
      expectDirective({ t }, { name: 'someDirective' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it('parses mutation', () => {
      const { t } = getUtils(`
        mutation SomeMutation {
          someMutation
        }
      `);

      t.keyword('mutation', { kind: 'Mutation' });
      t.def('SomeMutation');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someMutation', { kind: 'Field' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it('parses mutation with variables', () => {
      const { t, stream } = getUtils(`
        mutation SomeMutation ($someVariable: SomeInputType) {
          someMutation(someArg: $someVariable)
        }
      `);

      t.keyword('mutation', { kind: 'Mutation' });
      t.def('SomeMutation');
      expectVarsDef(
        { t, stream },
        {
          onKind: 'Mutation',
          vars: [{ name: 'someVariable', type: 'SomeInputType' }],
        },
      );
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someMutation', { kind: 'Field' });
      expectArgs(
        { t, stream },
        {
          onKind: 'Field',
          args: [{ name: 'someArg', isVariable: true, value: 'someVariable' }],
        },
      );

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    performForEachType(
      `
        mutation SomeMutation {
          someMutation(someArg: __VALUE__)
        }
      `,
      ({ t, stream }, fill) => {
        it(`parses mutation field having argument of type ${fill.type}`, () => {
          t.keyword('mutation', { kind: 'Mutation' });
          t.def('SomeMutation');
          t.punctuation('{', { kind: 'SelectionSet' });

          t.property('someMutation', { kind: 'Field' });
          expectArgs(
            { t, stream },
            { onKind: 'Field', args: [{ name: 'someArg', ...fill }] },
          );

          t.punctuation('}', { kind: 'Document' });

          t.eol();
        });
      },
    );

    it('parses mutation field having argument of type object', () => {
      const { t } = getUtils(`
        mutation SomeMutation {
          someMutation(someArg: { anotherField: $someVariable })
        }
      `);
      t.keyword('mutation', { kind: 'Mutation' });
      t.def('SomeMutation');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someMutation', { kind: 'Field' });
      t.punctuation(/\(/, { kind: 'Arguments' });
      t.attribute('someArg', { kind: 'Argument' });
      t.punctuation(':');
      t.punctuation('{', { kind: 'ObjectValue' });
      t.attribute('anotherField', { kind: 'ObjectField' });
      t.punctuation(':');
      t.variable('$', { kind: 'Variable' });
      t.variable('someVariable');
      t.punctuation('}', { kind: 'Arguments' });
      t.punctuation(/\)/, { kind: 'Field' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    performForEachType(
      `
        mutation SomeMutation {
          someMutation @someDirective(anotherArg: __VALUE__)
        }
      `,
      ({ t, stream }, fill) => {
        it(`parses mutation field with directive having argument of type ${fill.type}`, () => {
          t.keyword('mutation', { kind: 'Mutation' });
          t.def('SomeMutation');
          t.punctuation('{', { kind: 'SelectionSet' });

          t.property('someMutation', { kind: 'Field' });
          expectDirective(
            { t, stream },
            {
              name: 'someDirective',
              onKind: 'Field',
              args: [{ name: 'anotherArg', ...fill }],
            },
          );

          t.punctuation('}', { kind: 'Document' });

          t.eol();
        });
      },
    );

    it(`parses mutation field with a directive and selection set`, () => {
      const { t } = getUtils(`
        mutation SomeMutation {
          someMutation @someDirective {
            anotherField
          }
        }
      `);
      t.keyword('mutation', { kind: 'Mutation' });
      t.def('SomeMutation');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someMutation', { kind: 'Field' });
      expectDirective({ t }, { name: 'someDirective' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('anotherField', { kind: 'Field' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it(`parses mutation field with an alias`, () => {
      const { t } = getUtils(`
        mutation SomeMutation {
          someAlias : someMutation @someDirective {
            anotherField
          }
        }
      `);
      t.keyword('mutation', { kind: 'Mutation' });
      t.def('SomeMutation');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someAlias', { kind: 'AliasedField' });
      t.punctuation(':');
      t.qualifier('someMutation');
      expectDirective({ t }, { name: 'someDirective' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('anotherField', { kind: 'Field' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it('parses mutation with inline fragment', () => {
      const { t } = getUtils(`
        mutation SomeMutation {
          someMutation {
            ... on SomeType {
              anotherField
            }
          }
        }
      `);

      t.keyword('mutation', { kind: 'Mutation' });
      t.def('SomeMutation');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someMutation', { kind: 'Field' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.punctuation('...', { kind: 'InlineFragment' });
      t.keyword('on', { kind: 'TypeCondition' });
      t.name('SomeType', { kind: 'NamedType' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('anotherField', { kind: 'Field' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it('parses mutation with fragment spread', () => {
      const { t } = getUtils(`
        mutation SomeMutation {
          someMutation {
            ...SomeFragment @someDirective
          }
        }
      `);

      t.keyword('mutation', { kind: 'Mutation' });
      t.def('SomeMutation');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someMutation', { kind: 'Field' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.punctuation('...', { kind: 'FragmentSpread' });
      t.def('SomeFragment');
      expectDirective({ t }, { name: 'someDirective' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it('parses subscription', () => {
      const { t } = getUtils(`
        subscription SomeSubscription {
          someSubscription
        }
      `);

      t.keyword('subscription', { kind: 'Subscription' });
      t.def('SomeSubscription');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someSubscription', { kind: 'Field' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it('parses subscription with variables', () => {
      const { t, stream } = getUtils(`
        subscription SomeSubscription ($someVariable: SomeInputType) {
          someSubscription(someArg: $someVariable)
        }
      `);

      t.keyword('subscription', { kind: 'Subscription' });
      t.def('SomeSubscription');
      expectVarsDef(
        { t, stream },
        {
          onKind: 'Subscription',
          vars: [{ name: 'someVariable', type: 'SomeInputType' }],
        },
      );
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someSubscription', { kind: 'Field' });
      expectArgs(
        { t, stream },
        {
          onKind: 'Field',
          args: [{ name: 'someArg', isVariable: true, value: 'someVariable' }],
        },
      );

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    performForEachType(
      `
        subscription SomeSubscription {
          someSubscription(someArg: __VALUE__)
        }
      `,
      ({ t, stream }, fill) => {
        it(`parses subscription field having argument of type ${fill.type}`, () => {
          t.keyword('subscription', { kind: 'Subscription' });
          t.def('SomeSubscription');
          t.punctuation('{', { kind: 'SelectionSet' });

          t.property('someSubscription', { kind: 'Field' });
          expectArgs(
            { t, stream },
            { onKind: 'Field', args: [{ name: 'someArg', ...fill }] },
          );

          t.punctuation('}', { kind: 'Document' });

          t.eol();
        });
      },
    );

    it('parses subscription field having argument of type object', () => {
      const { t } = getUtils(`
        subscription SomeSubscription {
          someSubscription(someArg: { anotherField: $someVariable })
        }
      `);
      t.keyword('subscription', { kind: 'Subscription' });
      t.def('SomeSubscription');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someSubscription', { kind: 'Field' });
      t.punctuation(/\(/, { kind: 'Arguments' });
      t.attribute('someArg', { kind: 'Argument' });
      t.punctuation(':');
      t.punctuation('{', { kind: 'ObjectValue' });
      t.attribute('anotherField', { kind: 'ObjectField' });
      t.punctuation(':');
      t.variable('$', { kind: 'Variable' });
      t.variable('someVariable');
      t.punctuation('}', { kind: 'Arguments' });
      t.punctuation(/\)/, { kind: 'Field' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    performForEachType(
      `
        subscription SomeSubscription {
          someSubscription @someDirective(anotherArg: __VALUE__)
        }
      `,
      ({ t, stream }, fill) => {
        it(`parses subscription field with directive having argument of type ${fill.type}`, () => {
          t.keyword('subscription', { kind: 'Subscription' });
          t.def('SomeSubscription');
          t.punctuation('{', { kind: 'SelectionSet' });

          t.property('someSubscription', { kind: 'Field' });
          expectDirective(
            { t, stream },
            {
              name: 'someDirective',
              onKind: 'Field',
              args: [{ name: 'anotherArg', ...fill }],
            },
          );

          t.punctuation('}', { kind: 'Document' });

          t.eol();
        });
      },
    );

    it(`parses subscription field with a directive and selection set`, () => {
      const { t } = getUtils(`
        subscription SomeSubscription {
          someSubscription @someDirective {
            anotherField
          }
        }
      `);
      t.keyword('subscription', { kind: 'Subscription' });
      t.def('SomeSubscription');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someSubscription', { kind: 'Field' });
      expectDirective({ t }, { name: 'someDirective' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('anotherField', { kind: 'Field' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it(`parses subscription field with an alias`, () => {
      const { t } = getUtils(`
        subscription SomeSubscription {
          someAlias : someSubscription @someDirective {
            anotherField
          }
        }
      `);
      t.keyword('subscription', { kind: 'Subscription' });
      t.def('SomeSubscription');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someAlias', { kind: 'AliasedField' });
      t.punctuation(':');
      t.qualifier('someSubscription');
      expectDirective({ t }, { name: 'someDirective' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('anotherField', { kind: 'Field' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it('parses subscription with inline fragment', () => {
      const { t, stream } = getUtils(`
        subscription SomeSubscription {
          someSubscription {
            ... on SomeType {
              anotherField
            }
          }
        }
      `);

      t.keyword('subscription', { kind: 'Subscription' });
      t.def('SomeSubscription');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someSubscription', { kind: 'Field' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.punctuation('...', { kind: 'InlineFragment' });
      t.keyword('on', { kind: 'TypeCondition' });
      t.name('SomeType', { kind: 'NamedType' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('anotherField', { kind: 'Field' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    it('parses subscription with fragment spread', () => {
      const { t, stream } = getUtils(`
        subscription SomeSubscription {
          someSubscription {
            ...SomeFragment @someDirective
          }
        }
      `);

      t.keyword('subscription', { kind: 'Subscription' });
      t.def('SomeSubscription');
      t.punctuation('{', { kind: 'SelectionSet' });

      t.property('someSubscription', { kind: 'Field' });
      t.punctuation('{', { kind: 'SelectionSet' });

      t.punctuation('...', { kind: 'FragmentSpread' });
      t.def('SomeFragment');
      expectDirective({ t }, { name: 'someDirective' });

      t.punctuation('}', { kind: 'SelectionSet' });

      t.punctuation('}', { kind: 'Document' });

      t.eol();
    });

    describe('parses object type def', () => {
      it(`correctly`, () => {
        const { t } = getUtils(`
          type SomeType {
            someField: AnotherType!
          }
        `);
        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('SomeType');
        t.punctuation('{');

        t.property('someField', { kind: 'FieldDef' });
        t.punctuation(':');
        t.name('AnotherType', { kind: 'NamedType' });
        t.punctuation('!', { kind: 'FieldDef' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      it('with an object implementing an interface', () => {
        const { t } = getUtils(`type SomeType implements SomeInterface`);

        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('SomeType');
        t.keyword('implements', { kind: 'Implements' });
        t.name('SomeInterface', { kind: 'NamedType' });

        t.eol();
      });

      it('with an object type implementing multiple interfaces', () => {
        const { t } = getUtils(
          `type SomeType implements SomeInterface & AnotherInterface & YetAnotherInterface`,
        );

        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('SomeType');
        t.keyword('implements', { kind: 'Implements' });
        t.name('SomeInterface', { kind: 'NamedType' });
        t.punctuation('&', { kind: 'Implements' });
        t.name('AnotherInterface', { kind: 'NamedType' });
        t.punctuation('&', { kind: 'Implements' });
        t.name('YetAnotherInterface', { kind: 'NamedType' });
        t.eol();
      });

      it('with a directive', () => {
        const { t } = getUtils(`type SomeType @someDirective`);

        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('SomeType');
        expectDirective({ t }, { name: 'someDirective' });

        t.eol();
      });

      performForEachType(
        `type SomeType @someDirective(someArg: __VALUE__)`,
        ({ t, stream }, fill) => {
          it(`with a directive having argument of type ${fill.type}`, () => {
            t.keyword('type', { kind: 'ObjectTypeDef' });
            t.name('SomeType');
            expectDirective(
              { t, stream },
              {
                name: 'someDirective',
                onKind: 'ObjectTypeDef',
                args: [{ name: 'someArg', ...fill }],
              },
            );

            t.eol();
          });
        },
      );
    });

    describe('parses interface def', () => {
      it('correctly', () => {
        const { t } = getUtils(`
          interface SomeInterface {
            someField: SomeType!
          }
        `);
        t.keyword('interface', { kind: 'InterfaceDef' });
        t.name('SomeInterface');
        t.punctuation('{');

        t.property('someField', { kind: 'FieldDef' });
        t.punctuation(':');
        t.name('SomeType', { kind: 'NamedType' });
        t.punctuation('!', { kind: 'FieldDef' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      it('with a directive', () => {
        const { t } = getUtils(`interface SomeInterface @someDirective`);

        t.keyword('interface', { kind: 'InterfaceDef' });
        t.name('SomeInterface');
        expectDirective({ t }, { name: 'someDirective' });

        t.eol();
      });

      it('implementing multiple interfaces', () => {
        const { t } = getUtils(
          `interface AnInterface implements SomeInterface & AnotherInterface & YetAnotherInterface`,
        );

        t.keyword('interface', { kind: 'InterfaceDef' });
        t.name('AnInterface');
        t.keyword('implements', { kind: 'Implements' });
        t.name('SomeInterface', { kind: 'NamedType' });
        t.punctuation('&', { kind: 'Implements' });
        t.name('AnotherInterface', { kind: 'NamedType' });
        t.punctuation('&', { kind: 'Implements' });
        t.name('YetAnotherInterface', { kind: 'NamedType' });
        t.eol();
      });

      performForEachType(
        `interface SomeInterface @someDirective(someArg: __VALUE__)`,
        ({ t, stream }, fill) => {
          it(`with a directive having argument of type ${fill.type}`, () => {
            t.keyword('interface', { kind: 'InterfaceDef' });
            t.name('SomeInterface');
            expectDirective(
              { t, stream },
              {
                name: 'someDirective',
                onKind: 'InterfaceDef',
                args: [{ name: 'someArg', ...fill }],
              },
            );

            t.eol();
          });
        },
      );
    });

    describe('parses field defs', () => {
      it('correctly', () => {
        const { t } = getUtils(`
          type SomeType {
            someField: AnotherType!
          }
        `);
        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('SomeType');
        t.punctuation('{');

        t.property('someField', { kind: 'FieldDef' });
        t.punctuation(':');
        t.name('AnotherType', { kind: 'NamedType' });
        t.punctuation('!', { kind: 'FieldDef' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      it('with an argument', () => {
        const { t } = getUtils(`
          type SomeType {
            someField(someArg: AnotherType): [SomeAnotherType!]!
          }
        `);
        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('SomeType');
        t.punctuation('{');

        t.property('someField', { kind: 'FieldDef' });
        t.punctuation(/\(/, { kind: 'ArgumentsDef' });
        t.attribute('someArg', { kind: 'InputValueDef' });
        t.punctuation(':');
        t.name('AnotherType', { kind: 'NamedType' });
        t.punctuation(/\)/, { kind: 'FieldDef' });
        t.punctuation(':');
        t.punctuation(/\[/, { kind: 'ListType' });
        t.name('SomeAnotherType', { kind: 'NamedType' });
        t.punctuation('!', { kind: 'ListType' });
        t.punctuation(/\]/);
        t.punctuation('!', { kind: 'FieldDef' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      it('with a directive', () => {
        const { t } = getUtils(`
          type SomeType {
            someField: AnotherType @someDirective
          }
        `);

        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('SomeType');
        t.punctuation('{');

        t.property('someField', { kind: 'FieldDef' });
        t.punctuation(':');
        t.name('AnotherType', { kind: 'NamedType' });
        expectDirective({ t }, { name: 'someDirective' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      it('with multiple directives', () => {
        const { t } = getUtils(`
          type SomeType {
            someField: AnotherType @someDirective @anotherDirective
          }
        `);

        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('SomeType');
        t.punctuation('{');

        t.property('someField', { kind: 'FieldDef' });
        t.punctuation(':');
        t.name('AnotherType', { kind: 'NamedType' });
        expectDirective({ t }, { name: 'someDirective' });
        expectDirective({ t }, { name: 'anotherDirective' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      performForEachType(
        `
          type SomeType {
            someField: AnotherType @someDirective(someArg: __VALUE__)
          }
        `,
        ({ t, stream }, fill) => {
          it(`with a directive having arguments of type ${fill.type}`, () => {
            t.keyword('type', { kind: 'ObjectTypeDef' });
            t.name('SomeType');
            t.punctuation('{');

            t.property('someField', { kind: 'FieldDef' });
            t.punctuation(':');
            t.name('AnotherType', { kind: 'NamedType' });
            expectDirective(
              { t, stream },
              {
                name: 'someDirective',
                onKind: 'FieldDef',
                args: [{ name: 'someArg', ...fill }],
              },
            );

            t.punctuation('}', { kind: 'Document' });

            t.eol();
          });
        },
      );
    });

    describe('parses extend type def', () => {
      it('correctly', () => {
        const { t } = getUtils(`
          extend type SomeType {
            someField: AnotherType
          }
        `);

        t.keyword('extend', { kind: 'ExtendDef' });
        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('SomeType');
        t.punctuation('{');

        t.property('someField', { kind: 'FieldDef' });
        t.punctuation(':');
        t.name('AnotherType', { kind: 'NamedType' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      it('with multiple directives', () => {
        const { t } = getUtils(`
          extend type SomeType {
            someField: AnotherType @someDirective @anotherDirective
          }
        `);

        t.keyword('extend', { kind: 'ExtendDef' });
        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('SomeType');
        t.punctuation('{');

        t.property('someField', { kind: 'FieldDef' });
        t.punctuation(':');
        t.name('AnotherType', { kind: 'NamedType' });
        expectDirective({ t }, { name: 'someDirective' });
        expectDirective({ t }, { name: 'anotherDirective' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });
    });

    describe('parses input type def', () => {
      it('correctly', () => {
        const { t } = getUtils(`
          input SomeInputType {
            someField: AnotherType
          }
        `);

        t.keyword('input', { kind: 'InputDef' });
        t.name('SomeInputType');
        t.punctuation('{');

        t.attribute('someField', { kind: 'InputValueDef' });
        t.punctuation(':');
        t.name('AnotherType', { kind: 'NamedType' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      it('with multiple directives', () => {
        const { t } = getUtils(`
          input SomeInputType {
            someField: AnotherType @someDirective @anotherDirective
          }
        `);

        t.keyword('input', { kind: 'InputDef' });
        t.name('SomeInputType');
        t.punctuation('{');

        t.attribute('someField', { kind: 'InputValueDef' });
        t.punctuation(':');
        t.name('AnotherType', { kind: 'NamedType' });
        expectDirective({ t }, { name: 'someDirective' });
        expectDirective({ t }, { name: 'anotherDirective' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });
    });

    describe('parses enum type def', () => {
      it('correctly', () => {
        const { t } = getUtils(`
          enum SomeEnum {
            SOME_ENUM_VALUE
            ANOTHER_ENUM_VALUE
          }
        `);

        t.keyword('enum', { kind: 'EnumDef' });
        t.name('SomeEnum');
        t.punctuation('{');

        t.value('Enum', 'SOME_ENUM_VALUE', { kind: 'EnumValueDef' });
        t.value('Enum', 'ANOTHER_ENUM_VALUE', { kind: 'EnumValueDef' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      it('with a directive', () => {
        const { t } = getUtils(`
          enum SomeEnum @someDirective {
            SOME_ENUM_VALUE
            ANOTHER_ENUM_VALUE
          }
        `);

        t.keyword('enum', { kind: 'EnumDef' });
        t.name('SomeEnum');
        expectDirective({ t }, { name: 'someDirective' });
        t.punctuation('{', { kind: 'EnumDef' });

        t.value('Enum', 'SOME_ENUM_VALUE', { kind: 'EnumValueDef' });
        t.value('Enum', 'ANOTHER_ENUM_VALUE', { kind: 'EnumValueDef' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });
    });

    describe('parses scalar type def', () => {
      it('correctly', () => {
        const { t } = getUtils(`scalar SomeScalar`);

        t.keyword('scalar', { kind: 'ScalarDef' });
        t.name('SomeScalar');

        t.eol();
      });

      it('with a directive', () => {
        const { t } = getUtils(`scalar SomeScalar @someDirective`);

        t.keyword('scalar', { kind: 'ScalarDef' });
        t.name('SomeScalar');
        expectDirective({ t }, { name: 'someDirective' });

        t.eol();
      });
    });

    describe('parses union type def', () => {
      it('correctly', () => {
        const { t } = getUtils(`union SomeUnionType = SomeType | AnotherType`);

        t.keyword('union', { kind: 'UnionDef' });
        t.name('SomeUnionType');
        t.punctuation('=');
        t.name('SomeType', { kind: 'NamedType' });
        t.punctuation('|', { kind: 'UnionDef' });
        t.name('AnotherType', { kind: 'NamedType' });

        t.eol();
      });

      it('with a directive', () => {
        const { t } = getUtils(
          `union SomeUnionType @someDirective = SomeType | AnotherType`,
        );

        t.keyword('union', { kind: 'UnionDef' });
        t.name('SomeUnionType');
        expectDirective({ t }, { name: 'someDirective' });
        t.punctuation('=', { kind: 'UnionDef' });
        t.name('SomeType', { kind: 'NamedType' });
        t.punctuation('|', { kind: 'UnionDef' });
        t.name('AnotherType', { kind: 'NamedType' });

        t.eol();
      });
    });

    describe('parses directive type def', () => {
      it('with multiple locations', () => {
        const { t } = getUtils(
          `directive @someDirective on FIELD_DEFINITION | ENUM_VALUE `,
        );

        t.keyword('directive', { kind: 'DirectiveDef' });
        t.meta('@');
        t.meta('someDirective');
        t.keyword('on');
        t.value('Enum', 'FIELD_DEFINITION', { kind: 'DirectiveLocation' });
        t.punctuation('|', { kind: 'DirectiveDef' });
        t.value('Enum', 'ENUM_VALUE', { kind: 'DirectiveLocation' });

        t.eol();
      });
    });
  });
});
