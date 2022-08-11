/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import {
  ResizeHandlerProps,
  ResizingData,
  ResizeProps,
  MEvent,
  RdsMEvent,
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNil = (v: any) => v === null || v === undefined;

export const normalizeMEvent = (e: MEvent): RdsMEvent => {
  if ((e as TouchEvent).touches && (e as TouchEvent).touches[0]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e as any).clientX = Math.round((e as TouchEvent).touches[0].clientX);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e as any).clientY = Math.round((e as TouchEvent).touches[0].clientY);
  }
  return e as RdsMEvent;
};

export const getContainerMeta = ({
  border,
}: {
  border: ResizeProps['border'];
}) => {
  let wh: 'width' | 'height';
  let xy: 'clientX' | 'clientY';
  let sn: 1 | -1;

  if (/^(left|right)$/.test(border)) {
    wh = 'width';
    xy = 'clientX';
    sn = border === 'right' ? 1 : -1;
  } else {
    wh = 'height';
    xy = 'clientY';
    sn = border === 'bottom' ? 1 : -1;
  }
  return { wh, xy, sn };
};

export const getContainerInfo = ({
  style,
  containerMeta,
  diffCoord,
  oldSize,
}: {
  style: ResizeProps['style'];
  containerMeta: ReturnType<typeof getContainerMeta>;
  diffCoord: ResizingData['diffCoord'];
  oldSize: ResizingData['oldSize'];
}) => {
  const { wh, sn } = containerMeta;
  let retStyle: React.CSSProperties = {};

  if (oldSize != null) {
    retStyle[wh] = oldSize + diffCoord * sn;
  }
  retStyle = {
    ...style,
    ...retStyle,
  };
  return { style: retStyle };
};

export const getHandlerInfo = ({
  border,
  handlerWidth,
  handlerOffset,
  handlerStyle,
}: {
  border: ResizeProps['border'];
  handlerWidth: ResizeProps['handlerWidth'];
  handlerOffset: ResizeProps['handlerOffset'];
  handlerStyle: ResizeProps['handlerStyle'];
}) => {
  let dir: ResizeHandlerProps['dir'];
  let style: React.CSSProperties = {};

  if (/^(left|right)$/.test(border)) {
    dir = 'ew';
    style.width = handlerWidth;
    style.top = 0;
    style.bottom = 0;
  } else {
    dir = 'ns';
    style.height = handlerWidth;
    style.left = 0;
    style.right = 0;
  }
  style[border] = handlerOffset;

  style = { ...style, ...handlerStyle };
  return { dir, style };
};
