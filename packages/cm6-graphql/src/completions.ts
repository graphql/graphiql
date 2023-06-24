import { Completion, CompletionContext } from '@codemirror/autocomplete';
import { getAutocompleteSuggestions } from 'graphql-language-service';
import { getOpts, getSchema } from './state';
import { offsetToPos } from './helpers';
import { graphqlLanguage } from './language';

const AUTOCOMPLETE_CHARS = /^[a-zA-Z0-9_@(]$/;

export const completion = graphqlLanguage.data.of({
  autocomplete(ctx: CompletionContext) {
    const schema = getSchema(ctx.state);
    const opts = getOpts(ctx.state);
    if (!schema) {
      return null;
    }

    const word = ctx.matchBefore(/\w*/);

    if (!word) {
      return null;
    }

    const lastWordChar = word.text.split('').pop()!;
    if (!AUTOCOMPLETE_CHARS.test(lastWordChar) && !ctx.explicit) {
      return null;
    }
    const val = ctx.state.doc.toString();
    const pos = offsetToPos(ctx.state.doc, ctx.pos);
    const results = getAutocompleteSuggestions(schema, val, pos);

    if (results.length === 0) {
      return null;
    }

    return {
      from: word.from,
      options: results.map(item => {
        return {
          label: item.label,
          detail: item.detail || '',
          info(completionData: Completion) {
            if (opts?.onCompletionInfoRender) {
              return opts.onCompletionInfoRender(item, ctx, completionData);
            }
            if (
              item.documentation ||
              (item.isDeprecated && item.deprecationReason)
            ) {
              const el = document.createElement('div');
              el.textContent =
                item.documentation || item.deprecationReason || '';
              return el;
            }
          },
        };
      }),
    };
  },
});
