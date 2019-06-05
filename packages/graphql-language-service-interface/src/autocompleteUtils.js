/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @flow
 */

import type {GraphQLField, GraphQLSchema, GraphQLType} from 'graphql';
import {isCompositeType} from 'graphql';
import {
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
} from 'graphql/type/introspection';
import type {
  CompletionItem,
  ContextToken,
  State,
  TypeInfo,
} from 'graphql-language-service-types';

// Utility for returning the state representing the Definition this token state
// is within, if any.
export function getDefinitionState(tokenState: State): ?State {
  let definitionState;

  forEachState(tokenState, state => {
    switch (state.kind) {
      case 'Query':
      case 'ShortQuery':
      case 'Mutation':
      case 'Subscription':
      case 'FragmentDefinition':
        definitionState = state;
        break;
    }
  });

  return definitionState;
}

// Gets the field definition given a type and field name
export function getFieldDef(
  schema: GraphQLSchema,
  type: GraphQLType,
  fieldName: string,
): ?GraphQLField<*, *> {
  if (fieldName === SchemaMetaFieldDef.name && schema.getQueryType() === type) {
    return SchemaMetaFieldDef;
  }
  if (fieldName === TypeMetaFieldDef.name && schema.getQueryType() === type) {
    return TypeMetaFieldDef;
  }
  if (fieldName === TypeNameMetaFieldDef.name && isCompositeType(type)) {
    return TypeNameMetaFieldDef;
  }
  if (type.getFields && typeof type.getFields === 'function') {
    return (type.getFields()[fieldName]: any);
  }

  return null;
}

// Utility for iterating through a CodeMirror parse state stack bottom-up.
export function forEachState(
  stack: State,
  fn: (state: State) => ?TypeInfo,
): void {
  const reverseStateStack = [];
  let state = stack;
  while (state && state.kind) {
    reverseStateStack.push(state);
    state = state.prevState;
  }
  for (let i = reverseStateStack.length - 1; i >= 0; i--) {
    fn(reverseStateStack[i]);
  }
}

export function objectValues(object: Object): Array<any> {
  const keys = Object.keys(object);
  const len = keys.length;
  const values = new Array(len);
  for (let i = 0; i < len; ++i) {
    values[i] = object[keys[i]];
  }
  return values;
}

// Create the expected hint response given a possible list and a token
export function hintList(
  token: ContextToken,
  list: Array<CompletionItem>,
): Array<CompletionItem> {
  return filterAndSortList(list, normalizeText(token.string));
}

// Given a list of hint entries and currently typed text, sort and filter to
// provide a concise list.
function filterAndSortList(
  list: Array<CompletionItem>,
  text: string,
): Array<CompletionItem> {
  if (!text) {
    return filterNonEmpty(list, entry => !entry.isDeprecated);
  }

  const byProximity = list.map(entry => ({
    proximity: getProximity(normalizeText(entry.label), text),
    entry,
  }));

  const conciseMatches = filterNonEmpty(
    filterNonEmpty(byProximity, pair => pair.proximity <= 2),
    pair => !pair.entry.isDeprecated,
  );

  const sortedMatches = conciseMatches.sort(
    (a, b) =>
      (a.entry.isDeprecated ? 1 : 0) - (b.entry.isDeprecated ? 1 : 0) ||
      a.proximity - b.proximity ||
      a.entry.label.length - b.entry.label.length,
  );

  return sortedMatches.map(pair => pair.entry);
}

// Filters the array by the predicate, unless it results in an empty array,
// in which case return the original array.
function filterNonEmpty(
  array: Array<Object>,
  predicate: (entry: Object) => boolean,
): Array<Object> {
  const filtered = array.filter(predicate);
  return filtered.length === 0 ? array : filtered;
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\W/g, '');
}

// Determine a numeric proximity for a suggestion based on current text.
function getProximity(suggestion: string, text: string): number {
  // start with lexical distance
  let proximity = lexicalDistance(text, suggestion);
  if (suggestion.length > text.length) {
    // do not penalize long suggestions.
    proximity -= suggestion.length - text.length - 1;
    // penalize suggestions not starting with this phrase
    proximity += suggestion.indexOf(text) === 0 ? 0 : 0.5;
  }
  return proximity;
}

/**
 * Computes the lexical distance between strings A and B.
 *
 * The "distance" between two strings is given by counting the minimum number
 * of edits needed to transform string A into string B. An edit can be an
 * insertion, deletion, or substitution of a single character, or a swap of two
 * adjacent characters.
 *
 * This distance can be useful for detecting typos in input or sorting
 *
 * @param {string} a
 * @param {string} b
 * @return {int} distance in number of edits
 */
function lexicalDistance(a: string, b: string): number {
  let i;
  let j;
  const d = [];
  const aLength = a.length;
  const bLength = b.length;

  for (i = 0; i <= aLength; i++) {
    d[i] = [i];
  }

  for (j = 1; j <= bLength; j++) {
    d[0][j] = j;
  }

  for (i = 1; i <= aLength; i++) {
    for (j = 1; j <= bLength; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }

  return d[aLength][bLength];
}
