import 'codemirror/addon/hint/show-hint';

declare module 'codemirror' {
  let Init: any;

  interface Editor {
    doc: CodeMirror.Doc;
    getHelper(pos: { line: number; ch: number }, type: string): any;
    getHelpers(pos: { line: number; ch: number }, type: string): any[];
  }

  interface ShowHintOptions {
    hint?: ShowHintOptions['hint'];
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface CodeMirrorHintMap {}

  const hint: CodeMirrorHintMap;
}
