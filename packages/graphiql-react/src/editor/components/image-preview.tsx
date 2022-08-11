import type { Token } from 'codemirror';
import { useEffect, useRef, useState } from 'react';

type ImagePreviewProps = { token: Token };

type Dimensions = {
  width: number | null;
  height: number | null;
};

export function ImagePreview(props: ImagePreviewProps) {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: null,
    height: null,
  });
  const [mime, setMime] = useState<string | null>(null);

  const ref = useRef<HTMLImageElement>(null);

  const src = tokenToURL(props.token)?.href;

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    if (!src) {
      setDimensions({ width: null, height: null });
      setMime(null);
      return;
    }

    fetch(src, { method: 'HEAD' })
      .then(response => {
        setMime(response.headers.get('Content-Type'));
      })
      .catch(() => {
        setMime(null);
      });
  }, [src]);

  const dims =
    dimensions.width !== null && dimensions.height !== null ? (
      <div>
        {dimensions.width}x{dimensions.height}
        {mime !== null ? ' ' + mime : null}
      </div>
    ) : null;

  return (
    <div>
      <img
        onLoad={() => {
          setDimensions({
            width: ref.current?.naturalWidth ?? null,
            height: ref.current?.naturalHeight ?? null,
          });
        }}
        ref={ref}
        src={src}
      />
      {dims}
    </div>
  );
}

ImagePreview.shouldRender = function shouldRender(token: Token) {
  const url = tokenToURL(token);
  return url ? isImageURL(url) : false;
};

function tokenToURL(token: Token) {
  if (token.type !== 'string') {
    return;
  }

  const value = token.string.slice(1).slice(0, -1).trim();

  try {
    const location = window.location;
    return new URL(value, location.protocol + '//' + location.host);
  } catch (err) {
    return;
  }
}

function isImageURL(url: URL) {
  return /(bmp|gif|jpeg|jpg|png|svg)$/.test(url.pathname);
}
