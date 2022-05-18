import type { Token } from 'codemirror';
import { useEffect, useRef, useState } from 'react';

type ImagePreviewProps = { token: Token };

type ImagePreviewState = {
  width: number | null;
  height: number | null;
  src: string | null;
  mime: string | null;
};

export function ImagePreview(props: ImagePreviewProps) {
  const [state, setState] = useState<ImagePreviewState>({
    width: null,
    height: null,
    src: null,
    mime: null,
  });

  const ref = useRef<HTMLImageElement>(null);

  function updateMetadata() {
    if (!ref.current) {
      return;
    }

    const width = ref.current.naturalWidth;
    const height = ref.current.naturalHeight;
    const src = ref.current.src;

    if (src !== state.src) {
      setState(current => ({ ...current, src }));
      fetch(src, { method: 'HEAD' }).then(response => {
        setState(current => ({
          ...current,
          mime: response.headers.get('Content-Type'),
        }));
      });
    }

    if (width !== state.width || height !== state.height) {
      setState(current => ({ ...current, height, width }));
    }
  }

  useEffect(() => {
    updateMetadata();
  });

  let dims = null;
  if (state.width !== null && state.height !== null) {
    let dimensions = state.width + 'x' + state.height;
    if (state.mime !== null) {
      dimensions += ' ' + state.mime;
    }

    dims = <div>{dimensions}</div>;
  }

  return (
    <div>
      <img
        onLoad={() => {
          updateMetadata();
        }}
        ref={ref}
        src={tokenToURL(props.token)?.href}
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
