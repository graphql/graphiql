import CodeMirror from 'codemirror';

declare module 'codemirror' {
  var Init: any;

  interface Editor {
    getHelper(pos: { line; ch }, type: string): any;
    getHelpers(pos: { line; ch }, type: string): any[];
  }

  interface ShowHintOptions {
    schema?: GraphQLSchema;
    externalFragments?: string | FragmentDefinitionNode[];
  }
}
