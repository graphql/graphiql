import { Extension } from '@codemirror/state';
import { GraphQLSchema } from 'graphql';
import { completion } from './completions';
import { GqlExtensionsOptions } from './interfaces';
import { jump } from './jump';
import { graphqlLanguageSupport } from './language';
import { lint } from './lint';
import { stateExtensions } from './state';

export function graphql(
  schema?: GraphQLSchema,
  opts?: GqlExtensionsOptions,
): Extension[] {
  return [
    graphqlLanguageSupport(),
    completion,
    lint,
    jump,
    stateExtensions(schema, opts),
  ];
}
