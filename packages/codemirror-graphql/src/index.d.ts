import 'codemirror/addon/hint/show-hint';

declare module 'codemirror' {
  let Init: any;

  // CodeMirror forwards DOM events to listeners; its base overload omits the event.
  export function on<T extends keyof GlobalEventHandlersEventMap>(
    element: GlobalEventHandlers,
    eventName: T,
    handler: (event: GlobalEventHandlersEventMap[T]) => void,
  ): void;

  export function off<T extends keyof GlobalEventHandlersEventMap>(
    element: GlobalEventHandlers,
    eventName: T,
    handler: (event: GlobalEventHandlersEventMap[T]) => void,
  ): void;

  interface Editor {
    doc: CodeMirror.Doc;
    getHelper(pos: { line: number; ch: number }, type: string): any;
    getHelpers(pos: { line: number; ch: number }, type: string): any[];
  }

  interface ShowHintOptions {
    hint?: ShowHintOptions['hint'];
  }

  const hint: object;
}
