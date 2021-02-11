import * as CM from 'codemirror';
import 'codemirror/addon/hint/show-hint';

declare module 'codemirror' {
  var Init: any;

  interface Editor {
    doc: CodeMirror.Doc;
    getHelper(pos: { line: number; ch: number }, type: string): any;
    getHelpers(pos: { line: number; ch: number }, type: string): any[];
  }

  interface ShowHintOptions {
    hint?: ShowHintOptions['hint'];
  }

  interface CodeMirrorHintMap {}

  const hint: CodeMirrorHintMap;
}
