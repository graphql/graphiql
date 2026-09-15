# @graphiql/plugin-query-builder

## 1.0.0-beta.2

### Major Changes

- [#4478](https://github.com/graphql/graphiql/pull/4478) [`066528a`](https://github.com/graphql/graphiql/commit/066528a6bb7706d685536888d7b5549d6fd5a109) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - GraphQL.js 15 and 16.0–16.10 are no longer supported peer dependencies. The supported range is `^16.11.0 || ^17.0.0`. GraphQL.js 16.11 fixes OneOf input validation for nullable variables and tightens input-object coercion to reject arrays, giving GraphiQL 6 a correct baseline for OneOf inputs. Upgrade `graphql` before upgrading these packages.

### Patch Changes

- Updated dependencies [[`066528a`](https://github.com/graphql/graphiql/commit/066528a6bb7706d685536888d7b5549d6fd5a109)]:
  - @graphiql/react@1.0.0-beta.2

## 1.0.0-beta.1

### Patch Changes

- Updated dependencies [[`cb2ac2a`](https://github.com/graphql/graphiql/commit/cb2ac2a70fc6cd434cf58af44e20c8f9475153c2)]:
  - @graphiql/react@1.0.0-beta.1

## 1.0.0-beta.0

### Major Changes

- [#4352](https://github.com/graphql/graphiql/pull/4352) [`f8a9445`](https://github.com/graphql/graphiql/commit/f8a944505a0fbb9245b4ea1a3ca67bd50d4b7991) Thanks [@trevor-scheer](https://github.com/trevor-scheer)! - Add `@graphiql/plugin-query-builder`, a first-party visual query builder. It renders the schema's root types as a collapsible tree; checking a field adds it to the current operation and unchecking removes it, with the document parsed, mutated, and reprinted through the `graphql` package's AST utilities. Fields expose argument inputs (scalars, enums, lists, and input objects, including lists of input objects), scalar arguments can be promoted to variables, named fragments can be extracted from a field's selection and edited in place, and union/interface fields offer inline-fragment type-condition selectors.

  The query builder is default-installed in the `graphiql` meta-package, so it is available with no extra setup. It takes over from `@graphiql/plugin-explorer`.

### Patch Changes

- Updated dependencies [[`0f96193`](https://github.com/graphql/graphiql/commit/0f9619393e65a406fad09b3c1260b8a58c4e74c3), [`1919f6a`](https://github.com/graphql/graphiql/commit/1919f6a85f697a251cad98a082ac397aca99e44a), [`b6f8dc6`](https://github.com/graphql/graphiql/commit/b6f8dc6f247b63c19fe2b7962866508c5d0fb219), [`d4f0268`](https://github.com/graphql/graphiql/commit/d4f026853b89b9755f28d8f4059fcba419aa6d5a), [`c25bfd5`](https://github.com/graphql/graphiql/commit/c25bfd5b51ad98f36cbdb81a7486380f8dd1ab6a), [`f8a9445`](https://github.com/graphql/graphiql/commit/f8a944505a0fbb9245b4ea1a3ca67bd50d4b7991), [`1ce71e4`](https://github.com/graphql/graphiql/commit/1ce71e407dd3b457d6fecc9e7ad0b3ad246c693b), [`f45e26b`](https://github.com/graphql/graphiql/commit/f45e26b6eff736c2faddbafd82550ddfc3efa860), [`827da62`](https://github.com/graphql/graphiql/commit/827da6263685aa6e2f4df98ab7aaf032d2783605), [`b6f8dc6`](https://github.com/graphql/graphiql/commit/b6f8dc6f247b63c19fe2b7962866508c5d0fb219), [`a0fe11a`](https://github.com/graphql/graphiql/commit/a0fe11aeb40861b586b4cfa5678b8ebe1bea4a19), [`b6f8dc6`](https://github.com/graphql/graphiql/commit/b6f8dc6f247b63c19fe2b7962866508c5d0fb219), [`093cb10`](https://github.com/graphql/graphiql/commit/093cb100a4524b1005b82c1c064bb897416bfc82), [`b6f8dc6`](https://github.com/graphql/graphiql/commit/b6f8dc6f247b63c19fe2b7962866508c5d0fb219)]:
  - @graphiql/react@1.0.0-beta.0
