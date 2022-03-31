/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import type * as CM from 'codemirror';

import {
  GraphQLNonNull,
  GraphQLList,
  GraphQLType,
  GraphQLField,
} from 'graphql';
import escapeHTML from 'escape-html';
import MD from 'markdown-it';

const md = new MD();

/**
 * Render a custom UI for CodeMirror's hint which includes additional info
 * about the type and description for the selected context.
 */
export default function onHasCompletion(
  _cm: CM.Editor,
  data: CM.EditorChange | undefined,
  onHintInformationRender: (el: HTMLDivElement) => void,
) {
  import('codemirror').then(({ default: CodeMirror }) => {
    let information: HTMLDivElement | null;
    let deprecation: HTMLDivElement | null;
    CodeMirror.on(
      data,
      'select',
      // @ts-expect-error
      (ctx: GraphQLField<{}, {}, {}>, el: HTMLDivElement) => {
        // Only the first time (usually when the hint UI is first displayed)
        // do we create the information nodes.
        if (!information) {
          const hintsUl = el.parentNode as Node & ParentNode;

          // This "information" node will contain the additional info about the
          // highlighted typeahead option.
          information = document.createElement('div');
          information.className = 'CodeMirror-hint-information';
          hintsUl.appendChild(information);

          // This "deprecation" node will contain info about deprecated usage.
          deprecation = document.createElement('div');
          deprecation.className = 'CodeMirror-hint-deprecation';
          hintsUl.appendChild(deprecation);

          // When CodeMirror attempts to remove the hint UI, we detect that it was
          // removed and in turn remove the information nodes.
          let onRemoveFn: EventListener | null;
          hintsUl.addEventListener(
            'DOMNodeRemoved',
            (onRemoveFn = (event: Event) => {
              if (event.target === hintsUl) {
                hintsUl.removeEventListener('DOMNodeRemoved', onRemoveFn);
                information = null;
                deprecation = null;
                onRemoveFn = null;
              }
            }),
          );
        }

        // Now that the UI has been set up, add info to information.
        const description = ctx.description
          ? md.render(ctx.description)
          : 'Self descriptive.';
        const type = ctx.type
          ? '<span class="infoType">' + renderType(ctx.type) + '</span>'
          : '';

        information.innerHTML =
          '<div class="content">' +
          (description.slice(0, 3) === '<p>'
            ? '<p>' + type + description.slice(3)
            : type + description) +
          '</div>';

        if (ctx && deprecation && ctx.deprecationReason) {
          const reason = ctx.deprecationReason
            ? md.render(ctx.deprecationReason)
            : '';
          deprecation.innerHTML =
            '<span class="deprecation-label">Deprecated</span>' + reason;
          deprecation.style.display = 'block';
        } else if (deprecation) {
          deprecation.style.display = 'none';
        }

        // Additional rendering?
        if (onHintInformationRender) {
          onHintInformationRender(information);
        }
      },
    );
  });
}

function renderType(type: GraphQLType): string {
  if (type instanceof GraphQLNonNull) {
    return `${renderType(type.ofType)}!`;
  }
  if (type instanceof GraphQLList) {
    return `[${renderType(type.ofType)}]`;
  }
  return `<a class="typeName">${escapeHTML(type.name)}</a>`;
}
