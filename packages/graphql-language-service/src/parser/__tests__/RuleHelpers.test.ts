import { opt, list, butNot, t, p } from '../RuleHelpers';

describe('opt', () => {
  it('returns an optional rule', () => {
    const rule = {};

    const result = opt(rule);

    expect(result).toEqual({ ofRule: rule });
  });
});

describe('list', () => {
  it('returns a list of rule', () => {
    const rule = {};
    const separator = ',';

    const result = list(rule, separator);

    expect(result).toEqual({ ofRule: rule, separator, isList: true });
  });
});

describe('butNot', () => {
  const rule = {
    match: token =>
      token.kind === 'Name' && /^[_A-Za-z][_0-9A-Za-z]*/.test(token.value),
  };

  const exclusionRules = [
    {
      match: token => token.kind === 'Name' && token.value === 'Bar',
    },
  ];

  const token = (value, kind = 'Name') => ({ value, kind });

  it('returns rule which performs correct match', () => {
    const newRule = butNot(rule, exclusionRules);

    expect(newRule.match(token('Foo'))).toEqual(true);
    expect(newRule.match(token('123Foo'))).toEqual(false);
  });

  it('returns rule which skip results from exclusion rule match', () => {
    const newRule = butNot(rule, exclusionRules);

    expect(newRule.match(token('Bar'))).toEqual(false);
  });

  it('returns rule which results in false if no original match present', () => {
    const newRule = butNot({}, exclusionRules);

    expect(newRule.match(token('a'))).toEqual(false);
  });
});

describe('t', () => {
  it('build correct rule for token of a kind', () => {
    const rule = t('Name', 'def');

    expect(rule.style).toEqual('def');
    expect(rule.match({ kind: 'Name' })).toEqual(true);
    expect(rule.match({ kind: 'Punctuation' })).toEqual(false);
  });
});

describe('p', () => {
  it('build correct rule for punctuation token of a value', () => {
    const rule = p('(');

    expect(rule.style).toEqual('punctuation');
    expect(rule.match({ kind: 'Punctuation', value: '(' })).toEqual(true);
    expect(rule.match({ kind: 'Punctuation', value: ')' })).toEqual(false);
  });
});
