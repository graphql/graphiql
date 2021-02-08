import CodeMirror from 'codemirror';

declare module 'codemirror' {
  var Init: any;

  interface Editor {
    doc: CodeMirror.Doc;
    getHelper(pos: { line: number; ch: number }, type: string): any;
    getHelpers(pos: { line: number; ch: number }, type: string): any[];
  }

  interface ShowHintOptions {
    // @ts-ignore
    hint?: ShowHintOptions['hint'];
  }

  interface CodeMirrorHintMap {}

  const hint: CodeMirrorHintMap;
}

export default CodeMirror;
