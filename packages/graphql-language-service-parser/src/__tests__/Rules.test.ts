import { isIgnored } from '../Rules';

describe('testing the ignored characters', () => {
  it('should ignore the white space', () => {
    expect(isIgnored(' ')).toBe(true);
  });
  it('should ignore the tab character', () => {
    expect(isIgnored('\t')).toBe(true);
  });
  it('should ignore the comma', () => {
    expect(isIgnored(',')).toBe(true);
  });
  it('should ignore the newline character', () => {
    expect(isIgnored('\n')).toBe(true);
  });
  it('should ignore carriage return', () => {
    expect(isIgnored('\r')).toBe(true);
  });

  it('should ignore \\uFEFF', () => {
    expect(isIgnored('\uFEFF')).toBe(true);
  });
  it('should ignore \\u00A0', () => {
    expect(isIgnored('\u00A0')).toBe(true);
  });
});
