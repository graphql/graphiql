/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import React, { useCallback, useRef, useState } from 'react';
import { ResizeHandler } from './ResizeHandler';
import { ResizingData, ResizeProps, MEvent } from './types';
import {
  getContainerInfo,
  getContainerMeta,
  getHandlerInfo,
  isNil,
  normalizeMEvent,
} from './util';

export const Resizer: React.FC<ResizeProps> = props => {
  const {
    border,
    onStart,
    onEnd,
    onUpdate,
    id,
    className,
    style,
    handlerClassName,
    handlerStyle: _handlerStyle,
    handlerWidth: _handlerWidth,
    handlerOffset: _handlerOffset,
    handlerZIndex: _handlerZIndex,
    children,
  } = props;

  const handlerWidth = isNil(_handlerWidth) ? 16 : (_handlerWidth as number);
  const handlerOffset = (isNil(_handlerOffset)
    ? -handlerWidth / 2
    : _handlerOffset) as number;
  const handlerZIndex = (isNil(_handlerZIndex) ? 10 : _handlerZIndex) as number;

  const [diffCoord, setDiffCoord] = useState<ResizingData['diffCoord']>(0);
  const [oldSize, setOldSize] = useState<ResizingData['oldSize']>(null);
  const oldCoordRef = useRef<ResizingData['oldCoord']>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const containerMeta = getContainerMeta({ border });

  const { style: containerStyle } = getContainerInfo({
    style,
    containerMeta,
    diffCoord,
    oldSize,
  });

  const { dir, style: handlerStyle } = getHandlerInfo({
    border,
    handlerWidth,
    handlerOffset,
    handlerStyle: _handlerStyle,
  });

  const handleStart = useCallback(
    (_e: MEvent) => {
      const e = normalizeMEvent(_e);

      const { wh, xy } = containerMeta;
      const el = boxRef.current;
      if (!el) {
        return;
      }

      const px = window.getComputedStyle(el)[wh] as string;

      setDiffCoord(0);
      setOldSize(parseInt(px, 10));
      oldCoordRef.current = e[xy];

      if (onStart) {
        onStart(e);
      }
    },
    [containerMeta, onStart],
  );

  const handleEnd = useCallback(
    (_e: MEvent) => {
      const e = normalizeMEvent(_e);
      if (onEnd) {
        onEnd(e);
      }
    },
    [onEnd],
  );

  const handleUpdate = useCallback(
    (_e: MEvent) => {
      const e = normalizeMEvent(_e);

      const { xy } = containerMeta;
      if (oldCoordRef.current === null) {
        return;
      }

      setDiffCoord(e[xy] - oldCoordRef.current);

      if (onUpdate) {
        onUpdate(e);
      }
    },
    [containerMeta, onUpdate],
  );

  return (
    <div
      ref={boxRef}
      id={id}
      className={className}
      style={{
        position: 'relative',
        ...containerStyle,
      }}>
      <ResizeHandler
        dir={dir}
        className={handlerClassName}
        style={{
          position: 'absolute',
          zIndex: handlerZIndex,
          ...handlerStyle,
        }}
        onStart={handleStart}
        onEnd={handleEnd}
        onUpdate={handleUpdate}
      />
      {children}
    </div>
  );
};
