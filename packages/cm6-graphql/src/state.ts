import { EditorState, StateField, StateEffect } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { GraphQLSchema } from 'graphql';
import { GqlExtensionsOptions } from './interfaces';

const schemaEffect = StateEffect.define<GraphQLSchema | undefined>();
export const schemaStateField = StateField.define<GraphQLSchema | void>({
  create() {},
  update(schema, tr) {
    for (const e of tr.effects) {
      if (e.is(schemaEffect)) {
        return e.value;
      }
    }

    return schema;
  },
});

const optionsEffect = StateEffect.define<GqlExtensionsOptions | undefined>();
export const optionsStateField = StateField.define<GqlExtensionsOptions | void>(
  {
    create() {},
    update(opts, tr) {
      for (const e of tr.effects) {
        if (e.is(optionsEffect)) {
          return e.value;
        }
      }

      return opts;
    },
  },
);
export const updateSchema = (view: EditorView, schema?: GraphQLSchema) => {
  view.dispatch({
    effects: schemaEffect.of(schema),
  });
};
export const updateOpts = (view: EditorView, opts?: GqlExtensionsOptions) => {
  view.dispatch({
    effects: optionsEffect.of(opts),
  });
};
export const getSchema = (state: EditorState) => {
  return state.field(schemaStateField);
};
export const getOpts = (state: EditorState) => {
  return state.field(optionsStateField);
};

const defaultOpts: GqlExtensionsOptions = {
  showErrorOnInvalidSchema: true,
};

export const stateExtensions = (
  schema?: GraphQLSchema,
  opts?: GqlExtensionsOptions,
) => [
  schemaStateField.init(() => schema),
  optionsStateField.init(() => ({ ...defaultOpts, ...opts })),
];
