import { EditorView } from '@codemirror/view';
import {
  getTokenAtPosition,
  getTypeInfo,
} from 'graphql-language-service-interface';
import { offsetToPos } from './helpers';
import { getOpts, getSchema } from './state';

export const fillAllFieldsCommands = (view: EditorView) => {
  const schema = getSchema(view.state);
  if (!schema) {
    return true;
  }
  const opts = getOpts(view.state);
  const currentPosition = view.state.selection.main.head;
  const pos = offsetToPos(view.state.doc, currentPosition);
  const token = getTokenAtPosition(view.state.doc.toString(), pos);

  if (schema && opts?.onFillAllFields) {
    opts.onFillAllFields(view, schema, view.state.doc.toString(), pos, token);
  }

  return true;
};
export const showInDocsCommand = (view: EditorView) => {
  const schema = getSchema(view.state);
  if (!schema) {
    return true;
  }
  const opts = getOpts(view.state);
  const currentPosition = view.state.selection.main.head;
  const pos = offsetToPos(view.state.doc, currentPosition);
  const token = getTokenAtPosition(view.state.doc.toString(), pos);
  if (schema && opts?.onShowInDocs) {
    const tInfo = getTypeInfo(schema, token.state);
    opts.onShowInDocs(
      tInfo.fieldDef?.name,
      tInfo.type?.toString(),
      tInfo.parentType?.toString(),
    );
  }
  return true;
};
