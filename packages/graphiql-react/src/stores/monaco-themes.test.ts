'use no memo';

import { describe, it, expect } from 'vitest';
import { MONACO_THEME_DATA, MONACO_THEME_NAME } from '../constants';

describe('MONACO_THEME_NAME', () => {
  it('exports stable theme name constants', () => {
    expect(MONACO_THEME_NAME.dark).toBe('graphiql-DARK');
    expect(MONACO_THEME_NAME.light).toBe('graphiql-LIGHT');
  });
});

describe('MONACO_THEME_DATA dark', () => {
  const { dark } = MONACO_THEME_DATA;

  it('uses vs-dark as base', () => {
    expect(dark.base).toBe('vs-dark');
    expect(dark.inherit).toBe(true);
  });

  it('has a transparent editor background', () => {
    expect(dark.colors?.['editor.background']).toBe('#ffffff00');
  });

  it('colors keyword tokens with accent-pink', () => {
    const rule = dark.rules.find(r => r.token === 'keyword.gql');
    expect(rule?.foreground).toBe('FF7B72');
  });

  it('colors type identifiers with accent-orange', () => {
    const rule = dark.rules.find(r => r.token === 'type.identifier.gql');
    expect(rule?.foreground).toBe('FFA657');
  });

  it('colors variable arguments with accent-blue', () => {
    const rule = dark.rules.find(r => r.token === 'argument.identifier.gql');
    expect(rule?.foreground).toBe('79C0FF');
  });

  it('colors annotations with accent-purple', () => {
    const rule = dark.rules.find(r => r.token === 'annotation.gql');
    expect(rule?.foreground).toBe('D2A8FF');
  });

  it('italicizes comments', () => {
    const rule = dark.rules.find(r => r.token === 'comment.gql');
    expect(rule?.fontStyle).toBe('italic');
  });
});

describe('MONACO_THEME_DATA light', () => {
  const { light } = MONACO_THEME_DATA;

  it('uses vs as base', () => {
    expect(light.base).toBe('vs');
    expect(light.inherit).toBe(true);
  });

  it('has a transparent editor background', () => {
    expect(light.colors?.['editor.background']).toBe('#ffffff00');
  });

  it('colors keyword tokens with accent-pink light variant', () => {
    const rule = light.rules.find(r => r.token === 'keyword.gql');
    expect(rule?.foreground).toBe('CF222E');
  });

  it('colors type identifiers with accent-orange light variant', () => {
    const rule = light.rules.find(r => r.token === 'type.identifier.gql');
    expect(rule?.foreground).toBe('BC4C00');
  });

  it('colors variable arguments with accent-blue light variant', () => {
    const rule = light.rules.find(r => r.token === 'argument.identifier.gql');
    expect(rule?.foreground).toBe('0969DA');
  });

  it('italicizes comments', () => {
    const rule = light.rules.find(r => r.token === 'comment.gql');
    expect(rule?.fontStyle).toBe('italic');
  });
});

describe('MONACO_THEME_DATA symmetry', () => {
  it('dark and light themes cover the same token types', () => {
    const darkTokens = MONACO_THEME_DATA.dark.rules.map(r => r.token).sort();
    const lightTokens = MONACO_THEME_DATA.light.rules.map(r => r.token).sort();
    expect(darkTokens).toEqual(lightTokens);
  });
});
