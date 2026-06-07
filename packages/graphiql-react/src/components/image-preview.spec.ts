import { describe, it, expect } from 'vitest';
import { ImagePreview, pathToURL } from './image-preview';

describe('pathToURL', () => {
  it('keeps the original host for full URLs', () => {
    // Monaco splits the word on `:`, so a full `https://example.com/img.png`
    // arrives here as the protocol-relative `//example.com/img.png`.
    const url = pathToURL('//example.com/img.png');
    expect(url?.host).toBe('example.com');
    expect(url?.pathname).toBe('/img.png');
  });

  it('resolves relative paths against the current origin', () => {
    const url = pathToURL('/images/foo.png');
    expect(url?.host).toBe(location.host);
    expect(url?.pathname).toBe('/images/foo.png');
  });
});

describe('ImagePreview.shouldRender', () => {
  it('renders for image URLs on another host', () => {
    expect(ImagePreview.shouldRender('//example.com/img.png')).toBe(true);
  });

  it('renders for relative image paths', () => {
    expect(ImagePreview.shouldRender('/images/foo.png')).toBe(true);
  });

  it('does not render for non-image URLs', () => {
    expect(ImagePreview.shouldRender('//example.com/data.json')).toBe(false);
  });
});
