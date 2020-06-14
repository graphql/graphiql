/* eslint-disable jest/expect-expect */
import { getUtils, performForEachType } from './OnlineParserUtils';

describe('onlineParser', () => {
  describe('.token', () => {
    describe('parses object type def', () => {
      performForEachType(
        `
          type User {
            my_field: __TYPE__!
          }
        `,
        ({ t }, fill) => {
          it(`with a field of type ${fill.type}`, () => {
            t.keyword('type', { kind: 'ObjectTypeDef' });
            t.name('User');
            t.punctuation('{');

            t.property('my_field', { kind: 'FieldDef' });
            t.punctuation(':');
            t.name(fill.type, { kind: 'NamedType' });
            t.punctuation('!', { kind: 'FieldDef' });

            t.punctuation('}', { kind: 'Document' });

            t.eol();
          });
        },
      );

      it('with implementing an interface', () => {
        const { t } = getUtils(`type User implements Person`);

        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('User');
        t.keyword('implements', { kind: 'Implements' });
        t.name('Person', { kind: 'NamedType' });

        t.eol();
      });

      it('with a directive', () => {
        const { t } = getUtils(`type User @protected`);

        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('User');
        t.meta('@', { kind: 'Directive' });
        t.meta('protected');

        t.eol();
      });

      performForEachType(
        `type User @protected(my_arg: __VALUE__)`,
        ({ t }, fill) => {
          it(`with a directive having argument of type ${fill.type}`, () => {
            t.keyword('type', { kind: 'ObjectTypeDef' });
            t.name('User');
            t.meta('@', { kind: 'Directive' });
            t.meta('protected');
            t.punctuation(/\(/, { kind: 'Arguments' });
            t.attribute('my_arg', { kind: 'Argument' });
            t.punctuation(':');
            t.value(fill.valueType, fill.value, { kind: fill.kind });
            t.punctuation(/\)/, { kind: 'ObjectTypeDef' });

            t.eol();
          });
        },
      );
    });

    describe('parses interface def', () => {
      performForEachType(
        `
          interface Person {
            my_field: __TYPE__!
          }
        `,
        ({ t }, fill) => {
          it(`with a field of type ${fill.type}`, () => {
            t.keyword('interface', { kind: 'InterfaceDef' });
            t.name('Person');
            t.punctuation('{');

            t.property('my_field', { kind: 'FieldDef' });
            t.punctuation(':');
            t.name(fill.type, { kind: 'NamedType' });
            t.punctuation('!', { kind: 'FieldDef' });

            t.punctuation('}', { kind: 'Document' });

            t.eol();
          });
        },
      );

      it('with a directive', () => {
        const { t } = getUtils(`interface Person @protected`);

        t.keyword('interface', { kind: 'InterfaceDef' });
        t.name('Person');
        t.meta('@', { kind: 'Directive' });
        t.meta('protected');

        t.eol();
      });

      performForEachType(
        `interface Person @protected(role: __VALUE__)`,
        ({ t }, fill) => {
          it(`with a directive having argument of type ${fill.type}`, () => {
            t.keyword('interface', { kind: 'InterfaceDef' });
            t.name('Person');
            t.meta('@', { kind: 'Directive' });
            t.meta('protected');
            t.punctuation(/\(/, { kind: 'Arguments' });
            t.attribute('role', { kind: 'Argument' });
            t.punctuation(':');
            t.value(fill.valueType, fill.value, { kind: fill.kind });
            t.punctuation(/\)/, { kind: 'InterfaceDef' });

            t.eol();
          });
        },
      );
    });

    describe('parses field defs', () => {
      performForEachType(
        `
          type User {
            my_field: __TYPE__!
          }
        `,
        ({ t }, fill) => {
          it(`of type ${fill.type}`, () => {
            t.keyword('type', { kind: 'ObjectTypeDef' });
            t.name('User');
            t.punctuation('{');

            t.property('my_field', { kind: 'FieldDef' });
            t.punctuation(':');
            t.name(fill.type, { kind: 'NamedType' });
            t.punctuation('!', { kind: 'FieldDef' });

            t.punctuation('}', { kind: 'Document' });

            t.eol();
          });
        },
      );

      performForEachType(
        `
          type User {
            events(order: __TYPE__): [String!]!
          }
        `,
        ({ t }, fill) => {
          it(`with an argument of type ${fill.type}`, () => {
            t.keyword('type', { kind: 'ObjectTypeDef' });
            t.name('User');
            t.punctuation('{');

            t.property('events', { kind: 'FieldDef' });
            t.punctuation(/\(/, { kind: 'ArgumentsDef' });
            t.attribute('order', { kind: 'InputValueDef' });
            t.punctuation(':');
            t.name(fill.type, { kind: 'NamedType' });
            t.punctuation(/\)/, { kind: 'FieldDef' });
            t.punctuation(':');
            t.punctuation(/\[/, { kind: 'ListType' });
            t.name('String', { kind: 'NamedType' });
            t.punctuation('!', { kind: 'ListType' });
            t.punctuation(/\]/);
            t.punctuation('!', { kind: 'FieldDef' });

            t.punctuation('}', { kind: 'Document' });

            t.eol();
          });
        },
      );

      performForEachType(
        `
          type User {
            events: [__TYPE__!]!
          }
        `,
        ({ t }, fill) => {
          it(`with returning list of type ${fill.type}`, () => {
            t.keyword('type', { kind: 'ObjectTypeDef' });
            t.name('User');
            t.punctuation('{');

            t.property('events', { kind: 'FieldDef' });
            t.punctuation(':');
            t.punctuation(/\[/, { kind: 'ListType' });
            t.name(fill.type, { kind: 'NamedType' });
            t.punctuation('!', { kind: 'ListType' });
            t.punctuation(/\]/);
            t.punctuation('!', { kind: 'FieldDef' });

            t.punctuation('}', { kind: 'Document' });

            t.eol();
          });
        },
      );

      it('with a directive', () => {
        const { t } = getUtils(`
          type User {
            email: String @protected
          }
        `);

        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('User');
        t.punctuation('{');

        t.property('email', { kind: 'FieldDef' });
        t.punctuation(':');
        t.name('String', { kind: 'NamedType' });
        t.meta('@', { kind: 'Directive' });
        t.meta('protected');

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      it('with multiple directives', () => {
        const { t } = getUtils(`
          type User {
            email: String @protected @email
          }
        `);

        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('User');
        t.punctuation('{');

        t.property('email', { kind: 'FieldDef' });
        t.punctuation(':');
        t.name('String', { kind: 'NamedType' });
        t.meta('@', { kind: 'Directive' });
        t.meta('protected');
        t.meta('@', { kind: 'Directive' });
        t.meta('email');

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      performForEachType(
        `
          type User {
            email: String @protected(role: __VALUE__)
          }
        `,
        ({ t }, fill) => {
          it(`with a directive having arguments of type ${fill.type}`, () => {
            t.keyword('type', { kind: 'ObjectTypeDef' });
            t.name('User');
            t.punctuation('{');

            t.property('email', { kind: 'FieldDef' });
            t.punctuation(':');
            t.name('String', { kind: 'NamedType' });
            t.meta('@', { kind: 'Directive' });
            t.meta('protected');
            t.punctuation(/\(/, { kind: 'Arguments' });
            t.attribute('role', { kind: 'Argument' });
            t.punctuation(':');
            t.value(fill.valueType, fill.value, { kind: fill.kind });
            t.punctuation(/\)/, { kind: 'FieldDef' });

            t.punctuation('}', { kind: 'Document' });

            t.eol();
          });
        },
      );
    });

    describe('parses extend type def', () => {
      it('correctly', () => {
        const { t } = getUtils(`
          extend type Person {
            name: String
          }
        `);

        t.keyword('extend', { kind: 'ExtendDef' });
        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('Person');
        t.punctuation('{');

        t.property('name', { kind: 'FieldDef' });
        t.punctuation(':');
        t.name('String', { kind: 'NamedType' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      it('with multiple directives', () => {
        const { t } = getUtils(`
          extend type Person {
            email: String @protected @email
          }
        `);

        t.keyword('extend', { kind: 'ExtendDef' });
        t.keyword('type', { kind: 'ObjectTypeDef' });
        t.name('Person');
        t.punctuation('{');

        t.property('email', { kind: 'FieldDef' });
        t.punctuation(':');
        t.name('String', { kind: 'NamedType' });
        t.meta('@', { kind: 'Directive' });
        t.meta('protected');
        t.meta('@', { kind: 'Directive' });
        t.meta('email');

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });
    });

    describe('parses input type def', () => {
      it('correctly', () => {
        const { t } = getUtils(`
          input UserUpdateInput {
            name: String
          }
        `);

        t.keyword('input', { kind: 'InputDef' });
        t.name('UserUpdateInput');
        t.punctuation('{');

        t.attribute('name', { kind: 'InputValueDef' });
        t.punctuation(':');
        t.name('String', { kind: 'NamedType' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      it('with multiple directives', () => {
        const { t } = getUtils(`
          input UserUpdateInput {
            email: String @protected @email
          }
        `);

        t.keyword('input', { kind: 'InputDef' });
        t.name('UserUpdateInput');
        t.punctuation('{');

        t.attribute('email', { kind: 'InputValueDef' });
        t.punctuation(':');
        t.name('String', { kind: 'NamedType' });
        t.meta('@', { kind: 'Directive' });
        t.meta('protected');
        t.meta('@', { kind: 'Directive' });
        t.meta('email');

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });
    });

    describe('parses enum type def', () => {
      it('correctly', () => {
        const { t } = getUtils(`
          enum Role {
            ADMIN
            MEMBER
            USER
          }
        `);

        t.keyword('enum', { kind: 'EnumDef' });
        t.name('Role');
        t.punctuation('{');

        t.value('Enum', 'ADMIN', { kind: 'EnumValueDef' });
        t.value('Enum', 'MEMBER', { kind: 'EnumValueDef' });
        t.value('Enum', 'USER', { kind: 'EnumValueDef' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });

      it('with a directive', () => {
        const { t } = getUtils(`
          enum Role @protected {
            ADMIN
            MEMBER
            USER
          }
        `);

        t.keyword('enum', { kind: 'EnumDef' });
        t.name('Role');
        t.meta('@', { kind: 'Directive' });
        t.meta('protected');
        t.punctuation('{', { kind: 'EnumDef' });

        t.value('Enum', 'ADMIN', { kind: 'EnumValueDef' });
        t.value('Enum', 'MEMBER', { kind: 'EnumValueDef' });
        t.value('Enum', 'USER', { kind: 'EnumValueDef' });

        t.punctuation('}', { kind: 'Document' });

        t.eol();
      });
    });

    describe('parses scalar type def', () => {
      it('correctly', () => {
        const { t } = getUtils(`scalar DateTime`);

        t.keyword('scalar', { kind: 'ScalarDef' });
        t.name('DateTime');

        t.eol();
      });

      it('with a directive', () => {
        const { t } = getUtils(`scalar DateTime @protected`);

        t.keyword('scalar', { kind: 'ScalarDef' });
        t.name('DateTime');
        t.meta('@', { kind: 'Directive' });
        t.meta('protected');

        t.eol();
      });
    });

    describe('parses union type def', () => {
      it('correctly', () => {
        const { t } = getUtils(`union User = Student | Teacher`);

        t.keyword('union', { kind: 'UnionDef' });
        t.name('User');
        t.punctuation('=');
        t.name('Student', { kind: 'NamedType' });
        t.punctuation('|', { kind: 'UnionDef' });
        t.name('Teacher', { kind: 'NamedType' });

        t.eol();
      });

      it('with a directive', () => {
        const { t } = getUtils(`union User @protected = Student | Teacher`);

        t.keyword('union', { kind: 'UnionDef' });
        t.name('User');
        t.meta('@', { kind: 'Directive' });
        t.meta('protected');
        t.punctuation('=', { kind: 'UnionDef' });
        t.name('Student', { kind: 'NamedType' });
        t.punctuation('|', { kind: 'UnionDef' });
        t.name('Teacher', { kind: 'NamedType' });

        t.eol();
      });
    });

    describe('parses directive type def', () => {
      it('with multiple locations', () => {
        const { t } = getUtils(
          `directive @protected on FIELD_DEFINITION | ENUM_VALUE `,
        );

        t.keyword('directive', { kind: 'DirectiveDef' });
        t.meta('@');
        t.meta('protected');
        t.keyword('on');
        t.value('Enum', 'FIELD_DEFINITION', { kind: 'DirectiveLocation' });
        t.punctuation('|', { kind: 'DirectiveDef' });
        t.value('Enum', 'ENUM_VALUE', { kind: 'DirectiveLocation' });

        t.eol();
      });

      performForEachType(
        `directive @protected( my_arg: __TYPE__ ) on FIELD_DEFINITION | ENUM_VALUE `,
        ({ t }, fill) => {
          it(`with argument of type ${fill.type}`, () => {
            t.keyword('directive', { kind: 'DirectiveDef' });
            t.meta('@');
            t.meta('protected');
            t.punctuation(/\(/, { kind: 'ArgumentsDef' });
            t.attribute('my_arg', { kind: 'InputValueDef' });
            t.punctuation(':');
            t.name(fill.type, { kind: 'NamedType' });
            t.punctuation(/\)/, { kind: 'DirectiveDef' });
            t.keyword('on');
            t.value('Enum', 'FIELD_DEFINITION', { kind: 'DirectiveLocation' });
            t.punctuation('|', { kind: 'DirectiveDef' });
            t.value('Enum', 'ENUM_VALUE', { kind: 'DirectiveLocation' });

            t.eol();
          });
        },
      );
    });
  });
});
