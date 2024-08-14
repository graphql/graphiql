/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import {
  GraphQLField,
  GraphQLType,
  isListType,
  isObjectType,
  isInputObjectType,
  getNamedType,
  isAbstractType,
} from 'graphql';
import { CompletionItemBase } from '../types';
import { ContextTokenUnion } from '../parser';

export function objectValues<T>(object: Record<string, T>): Array<T> {
  const keys = Object.keys(object);
  const len = keys.length;
  const values = new Array(len);
  for (let i = 0; i < len; ++i) {
    values[i] = object[keys[i]];
  }
  return values;
}

// Create the expected hint response given a possible list and a token
export function hintList<T extends CompletionItemBase>(
  token: ContextTokenUnion,
  list: Array<T>,
): Array<T> {
  return filterAndSortList(list, normalizeText(token.string));
}

// Given a list of hint entries and currently typed text, sort and filter to
// provide a concise list.
function filterAndSortList<T extends CompletionItemBase>(
  list: Array<T>,
  text: string,
): Array<T> {
  if (
    !text ||
    text.trim() === '' ||
    text.trim() === ':' ||
    text.trim() === '{'
  ) {
    return filterNonEmpty<T>(list, entry => !entry.isDeprecated);
  }

  const byProximity = list.map(entry => ({
    proximity: getProximity(normalizeText(entry.label), text),
    entry,
  }));

  return filterNonEmpty(
    filterNonEmpty(byProximity, pair => pair.proximity <= 2),
    pair => !pair.entry.isDeprecated,
  )
    .sort(
      (a, b) =>
        (a.entry.isDeprecated ? 1 : 0) - (b.entry.isDeprecated ? 1 : 0) ||
        a.proximity - b.proximity ||
        a.entry.label.length - b.entry.label.length,
    )
    .map(pair => pair.entry);
}

// Filters the array by the predicate, unless it results in an empty array,
// in which case return the original array.
function filterNonEmpty<T>(
  array: Array<T>,
  predicate: (entry: T) => boolean,
): Array<T> {
  const filtered = array.filter(predicate);
  return filtered.length === 0 ? array : filtered;
}

function normalizeText(text: string): string {
  return text.toLowerCase().replaceAll(/\W/g, '');
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

const insertSuffix = (n?: number) => ` {\n   $${n ?? 1}\n}`;

export const getInsertText = (
  prefix: string,
  type?: GraphQLType,
  fallback?: string,
): string => {
  if (!type) {
    return fallback ?? prefix;
  }

  const namedType = getNamedType(type);
  if (
    isObjectType(namedType) ||
    isInputObjectType(namedType) ||
    isListType(namedType) ||
    isAbstractType(namedType)
  ) {
    return prefix + insertSuffix();
  }

  return fallback ?? prefix;
};

export const getInputInsertText = (
  prefix: string,
  type: GraphQLType,
  fallback?: string,
): string => {
  // if (isScalarType(type) && type.name === GraphQLString.name) {
  //   return prefix + '"$1"';
  // }
  if (isListType(type)) {
    const baseType = getNamedType(type.ofType);
    return prefix + `[${getInsertText('', baseType, '$1')}]`;
  }
  return getInsertText(prefix, type, fallback);
};

/**
 * generates a TextSnippet for a field with possible required arguments
 * that dynamically adjusts to the number of required arguments
 * @param field
 * @returns
 */
export const getFieldInsertText = (field: GraphQLField<null, null>) => {
  const requiredArgs = field.args.filter(arg =>
    arg.type.toString().endsWith('!'),
  );
  if (!requiredArgs.length) {
    return;
  }
  return (
    field.name +
    `(${requiredArgs.map(
      (arg, i) => `${arg.name}: $${i + 1}`,
    )}) ${getInsertText('', field.type, '\n')}`
  );
};
