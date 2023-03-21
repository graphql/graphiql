import { EditorView } from '@codemirror/view';
import { getTokenAtPosition, getTypeInfo } from 'graphql-language-service';
import { isMetaKeyPressed, offsetToPos } from './helpers';
import { getOpts, getSchema } from './state';

export const jump = EditorView.domEventHandlers({
  click(evt, view) {
    const schema = getSchema(view.state);
    if (!schema) {
      return;
    }
    // TODO: Set class on cm-editor when mod key is pressed, to style cursor and tokens
    const currentPosition = view.state.selection.main.head;
    const pos = offsetToPos(view.state.doc, currentPosition);
    const token = getTokenAtPosition(view.state.doc.toString(), pos);
    const tInfo = getTypeInfo(schema, token.state);

    const opts = getOpts(view.state);

    if (opts?.onShowInDocs && isMetaKeyPressed(evt)) {
      opts.onShowInDocs(
        tInfo.fieldDef?.name,
        tInfo.type?.toString(),
        tInfo.parentType?.toString(),
      );
    }
  },
});
