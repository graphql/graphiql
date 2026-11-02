import CodeMirror = require('codemirror');
import 'codemirror-graphql/lint';
import type { GraphQLJumpOptions } from 'codemirror-graphql/jump';

export const annotations: CodeMirror.Annotation[] = [
  {
    from: CodeMirror.Pos(0, 0),
    to: CodeMirror.Pos(0, 5),
    message: 'Unknown field',
    severity: 'warning',
  },
];

export const jumpOptions: GraphQLJumpOptions = { onClick() {} };
