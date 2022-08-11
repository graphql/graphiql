/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

export type MEvent = MouseEvent | TouchEvent;

export type RdsMEvent =
  | MouseEvent
  | (TouchEvent & {
      clientX: number;
      clientY: number;
    });

export interface ResizeHandlerProps {
  dir: 'ew' | 'ns';
  onStart: (e: MEvent) => void;
  onEnd: (e: MEvent) => void;
  onUpdate: (e: MEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface ResizeHandlerData {
  listenersRef: {
    handleMouseMove: (e: MEvent) => void;
    handleMouseUp: (e: MEvent) => void;
  } | null;
}

export interface ResizeProps {
  border: 'top' | 'bottom' | 'left' | 'right';
  onStart?: ResizeHandlerProps['onStart'];
  onEnd?: ResizeHandlerProps['onEnd'];
  onUpdate?: ResizeHandlerProps['onUpdate'];
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  handlerClassName?: string;
  handlerStyle?: React.CSSProperties;
  handlerWidth?: number;
  handlerOffset?: number;
  handlerZIndex?: number;
}

export interface ResizingData {
  diffCoord: number;
  oldCoord: number | null;
  oldSize: number | null;
}
