/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */
// These functions help build matching rules for ParseRules.

// An optional rule.
export function opt(ofRule) {
  return { ofRule };
}

// A list of another rule.
export function list(ofRule, separator) {
  return { ofRule, isList: true, separator };
}

// An constraint described as `but not` in the GraphQL spec.
export function butNot(rule, exclusions) {
  const ruleMatch = rule.match;
  rule.match =
    token => ruleMatch(token) &&
    exclusions.every(exclusion => !exclusion.match(token));
  return rule;
}

// Token of a kind
export function t(kind, style) {
  return { style, match: token => token.kind === kind };
}

// Punctuator
export function p(value, style) {
  return {
    style: style || 'punctuation',
    match: token => token.kind === 'Punctuation' && token.value === value
  };
}
