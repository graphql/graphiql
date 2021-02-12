/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { jsx } from 'theme-ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ResizeHandlerData, ResizeHandlerProps } from './types';

export const ResizeHandler: React.FC<ResizeHandlerProps> = props => {
  const { dir, onStart, onEnd, onUpdate, className, style, children } = props;

  const [isDragging, setIsDragging] = useState(false);
  const listenersRef = useRef<ResizeHandlerData['listenersRef']>(null);

  const handleMouseMove = useCallback(
    e => {
      onUpdate(e);
    },
    [onUpdate],
  );

  const cleanMouseListeners = useCallback(() => {
    const oldRef = listenersRef.current;
    if (oldRef) {
      window.removeEventListener('mousemove', oldRef.handleMouseMove);
      window.removeEventListener('touchmove', oldRef.handleMouseMove);
      window.removeEventListener('mouseup', oldRef.handleMouseUp);
      window.removeEventListener('touchend', oldRef.handleMouseUp);
    }
  }, []);

  const handleMouseUp = useCallback(
    e => {
      setIsDragging(false);
      cleanMouseListeners();
      onEnd(e);
    },
    [cleanMouseListeners, onEnd],
  );

  const handleMouseDown = useCallback(
    e => {
      setIsDragging(true);
      cleanMouseListeners();

      listenersRef.current = {
        handleMouseMove,
        handleMouseUp,
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);

      onStart(e);
    },
    [cleanMouseListeners, handleMouseMove, handleMouseUp, onStart],
  );

  useEffect(() => {
    return () => {
      cleanMouseListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      className={className}
      style={{
        cursor: `${dir}-resize`,
        ...style,
      }}>
      {isDragging && (
        <style>{`
        * {
          cursor: ${dir}-resize !important;
          -webkit-user-select: none !important;
        }
        `}</style>
      )}
      {children}
    </div>
  );
};
