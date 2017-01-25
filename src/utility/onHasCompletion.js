/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import { GraphQLNonNull, GraphQLList } from 'graphql';
import marked from 'marked';


/**
 * Render a custom UI for CodeMirror's hint which includes additional info
 * about the type and description for the selected context.
 */
export default function onHasCompletion(cm, data, onHintInformationRender) {
  const CodeMirror = require('codemirror');

  let information;
  let deprecation;

  // When a hint result is selected, we augment the UI with information.
  CodeMirror.on(data, 'select', (ctx, el) => {
    // Only the first time (usually when the hint UI is first displayed)
    // do we create the information nodes.
    if (!information) {
      const hintsUl = el.parentNode;

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
      let onRemoveFn;
      hintsUl.addEventListener('DOMNodeRemoved', onRemoveFn = event => {
        if (event.target === hintsUl) {
          hintsUl.removeEventListener('DOMNodeRemoved', onRemoveFn);
          information = null;
          deprecation = null;
          onRemoveFn = null;
        }
      });
    }

    // Now that the UI has been set up, add info to information.
    const description = ctx.description ?
      marked(ctx.description, { sanitize: true }) :
      'Self descriptive.';
    const type = ctx.type ?
      '<span class="infoType">' + renderType(ctx.type) + '</span>' :
      '';

    information.innerHTML = '<div class="content">' +
      (description.slice(0, 3) === '<p>' ?
        '<p>' + type + description.slice(3) :
        type + description) + '</div>';

    if (ctx.isDeprecated) {
      const reason = ctx.deprecationReason ?
        marked(ctx.deprecationReason, { sanitize: true }) :
        '';
      deprecation.innerHTML =
        '<span class="deprecation-label">Deprecated</span>' +
        reason;
      deprecation.style.display = 'block';
    } else {
      deprecation.style.display = 'none';
    }

    // Additional rendering?
    if (onHintInformationRender) {
      onHintInformationRender(information);
    }
  });
}

function renderType(type) {
  if (type instanceof GraphQLNonNull) {
    return `${renderType(type.ofType)}!`;
  }
  if (type instanceof GraphQLList) {
    return `[${renderType(type.ofType)}]`;
  }
  return `<a class="typeName">${type.name}</a>`;
}
