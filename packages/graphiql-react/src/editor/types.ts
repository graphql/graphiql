import type { Editor } from 'codemirror';

export type CodeMirrorType = typeof import('codemirror');

export type CodeMirrorEditor = Editor & { options?: any };
