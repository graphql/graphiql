import { FC, useEffect, useRef, useState } from 'react';

interface ImagePreviewProps {
  path: string;
}

interface Dimensions {
  width: number | null;
  height: number | null;
}

const ImagePreview_: FC<ImagePreviewProps> = ({ path }) => {
  const [{ width, height }, setDimensions] = useState<Dimensions>({
    width: null,
    height: null,
  });
  const [mime, setMime] = useState<string | null>(null);
  const ref = useRef<HTMLImageElement>(null!);
  const src = pathToURL(path)?.href;

  useEffect(() => {
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

  return (
    <div>
      <img
        alt=""
        onLoad={() => {
          setDimensions({
            width: ref.current.naturalWidth,
            height: ref.current.naturalHeight,
          });
        }}
        ref={ref}
        src={src}
      />
      {width !== null && height !== null && (
        <div>
          {width}x{height}
          {mime && ' ' + mime}
        </div>
      )}
    </div>
  );
};

export const ImagePreview = Object.assign(ImagePreview_, {
  shouldRender(path: string) {
    const url = pathToURL(path);
    return url ? /\.(bmp|gif|jpe?g|png|svg|webp)$/.test(url.pathname) : false;
  },
});

export function pathToURL(path: string) {
  // `path` is the word under the cursor from Monaco's `getWordAtPosition`. For a
  // full URL such as `https://example.com/img.png`, Monaco splits on the `:`, so
  // the word is the protocol-relative `//example.com/img.png`. Resolving that
  // against the current origin keeps the original host. Do not strip the leading
  // character: doing so turns `//host/path` into the host-relative `/host/path`.
  const value = path.trim();
  try {
    return new URL(value, location.protocol + '//' + location.host);
  } catch {}
}
