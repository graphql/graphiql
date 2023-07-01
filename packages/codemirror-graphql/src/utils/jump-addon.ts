/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { defineOption, Init, on, off, Editor } from 'codemirror';
import { GraphQLJumpOptions } from '../jump';

defineOption(
  'jump',
  false,
  (cm: Editor, options: GraphQLJumpOptions, old?: GraphQLJumpOptions) => {
    if (old && old !== Init) {
      const oldOnMouseOver = cm.state.jump.onMouseOver;
      off(cm.getWrapperElement(), 'mouseover', oldOnMouseOver);
      const oldOnMouseOut = cm.state.jump.onMouseOut;
      off(cm.getWrapperElement(), 'mouseout', oldOnMouseOut);
      off(document, 'keydown', cm.state.jump.onKeyDown);
      delete cm.state.jump;
    }

    if (options) {
      const state = (cm.state.jump = {
        options,
        onMouseOver: onMouseOver.bind(null, cm),
        onMouseOut: onMouseOut.bind(null, cm),
        onKeyDown: onKeyDown.bind(null, cm),
      });

      on(cm.getWrapperElement(), 'mouseover', state.onMouseOver);
      on(cm.getWrapperElement(), 'mouseout', state.onMouseOut);
      on(document, 'keydown', state.onKeyDown);
    }
  },
);

function onMouseOver(cm: Editor, event: MouseEvent) {
  const target = event.target || event.srcElement;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  if (target?.nodeName !== 'SPAN') {
    return;
  }

  const box = target.getBoundingClientRect();
  const cursor = {
    left: (box.left + box.right) / 2,
    top: (box.top + box.bottom) / 2,
  };

  cm.state.jump.cursor = cursor;

  if (cm.state.jump.isHoldingModifier) {
    enableJumpMode(cm);
  }
}

function onMouseOut(cm: Editor) {
  if (!cm.state.jump.isHoldingModifier && cm.state.jump.cursor) {
    cm.state.jump.cursor = null;
    return;
  }

  if (cm.state.jump.isHoldingModifier && cm.state.jump.marker) {
    disableJumpMode(cm);
  }
}

function onKeyDown(cm: Editor, event: KeyboardEvent) {
  if (cm.state.jump.isHoldingModifier || !isJumpModifier(event.key)) {
    return;
  }

  cm.state.jump.isHoldingModifier = true;

  if (cm.state.jump.cursor) {
    enableJumpMode(cm);
  }

  const onKeyUp = (upEvent: KeyboardEvent) => {
    if (upEvent.code !== event.code) {
      return;
    }

    cm.state.jump.isHoldingModifier = false;

    if (cm.state.jump.marker) {
      disableJumpMode(cm);
    }

    off(document, 'keyup', onKeyUp);
    off(document, 'click', onClick);
    cm.off('mousedown', onMouseDown);
  };

  const onClick = (clickEvent: MouseEvent) => {
    const { destination, options } = cm.state.jump;
    if (destination) {
      options.onClick(destination, clickEvent);
    }
  };

  const onMouseDown = (_: any, downEvent: MouseEvent) => {
    if (cm.state.jump.destination) {
      (downEvent as any).codemirrorIgnore = true;
    }
  };

  on(document, 'keyup', onKeyUp);
  on(document, 'click', onClick);
  cm.on('mousedown', onMouseDown);
}

const isMac =
  typeof navigator !== 'undefined' &&
  navigator &&
  navigator.appVersion.includes('Mac');

function isJumpModifier(key: string) {
  return key === (isMac ? 'Meta' : 'Control');
}

function enableJumpMode(cm: Editor) {
  if (cm.state.jump.marker) {
    return;
  }

  const { cursor, options } = cm.state.jump;
  const pos = cm.coordsChar(cursor);
  const token = cm.getTokenAt(pos, true);
  const getDestination = options.getDestination || cm.getHelper(pos, 'jump');
  if (getDestination) {
    const destination = getDestination(token, options, cm);
    if (destination) {
      const marker = cm.markText(
        { line: pos.line, ch: token.start },
        { line: pos.line, ch: token.end },
        { className: 'CodeMirror-jump-token' },
      );

      cm.state.jump.marker = marker;
      cm.state.jump.destination = destination;
    }
  }
}

function disableJumpMode(cm: Editor) {
  const { marker } = cm.state.jump;
  cm.state.jump.marker = null;
  cm.state.jump.destination = null;

  marker.clear();
}
