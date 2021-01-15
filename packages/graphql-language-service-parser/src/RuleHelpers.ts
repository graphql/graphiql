/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

// These functions help build matching rules for ParseRules.

import { Rule, Token } from './types';

// An optional rule.
export function opt(ofRule: Rule | string): Rule {
  return { ofRule };
}

// A list of another rule.
export function list(ofRule: Rule | string, separator?: string | Rule): Rule {
  return { ofRule, isList: true, separator };
}

// An constraint described as `but not` in the GraphQL spec.
export function butNot(rule: Rule, exclusions: Array<Rule>) {
  const ruleMatch = rule.match;
  rule.match = token => {
    let check = false;
    if (ruleMatch) {
      check = ruleMatch(token);
    }
    return (
      check &&
      exclusions.every(exclusion => exclusion.match && !exclusion.match(token))
    );
  };
  return rule;
}

// Token of a kind
export function t(kind: string, style: string) {
  return { style, match: (token: Token) => token.kind === kind };
}

// Punctuator
export function p(value: string, style?: string): Rule {
  return {
    style: style || 'punctuation',
    match: (token: Token) =>
      token.kind === 'Punctuation' && token.value === value,
  };
}
