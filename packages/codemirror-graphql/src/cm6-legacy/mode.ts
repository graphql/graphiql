import type { StreamParser } from '@codemirror/stream-parser';
import graphqlModeFactory from '../utils/mode-factory';

// Types of property 'token' are incompatible.
// Type '((stream: StringStream, state: any) => string | null) | undefined' is not comparable to type '(stream: StringStream, state: any) => string | null'.
export const graphql = (graphqlModeFactory({}) as unknown) as StreamParser<any>;
