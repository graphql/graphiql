/**
 *  Copyright (c) 2017, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';

CodeMirror.defineOption('jump', false, function(cm, options, old) {
  if (old && old !== CodeMirror.Init) {
    const oldOnMouseOver = cm.state.jump.onMouseOver;
    CodeMirror.off(cm.getWrapperElement(), 'mouseover', oldOnMouseOver);
    const oldOnMouseOut = cm.state.jump.onMouseOut;
    CodeMirror.off(cm.getWrapperElement(), 'mouseout', oldOnMouseOut);
    CodeMirror.off(document, 'keydown', cm.state.jump.onKeyDown);
    delete cm.state.jump;
  }

  if (options) {
    const state = (cm.state.jump = {
      options,
      onMouseOver: onMouseOver.bind(null, cm),
      onMouseOut: onMouseOut.bind(null, cm),
      onKeyDown: onKeyDown.bind(null, cm),
    });

    CodeMirror.on(cm.getWrapperElement(), 'mouseover', state.onMouseOver);
    CodeMirror.on(cm.getWrapperElement(), 'mouseout', state.onMouseOut);
    CodeMirror.on(document, 'keydown', state.onKeyDown);
  }
});

function onMouseOver(cm, event) {
  const target = event.target || event.srcElement;
  if (target.nodeName !== 'SPAN') {
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

function onMouseOut(cm) {
  if (!cm.state.jump.isHoldingModifier && cm.state.jump.cursor) {
    cm.state.jump.cursor = null;
    return;
  }

  if (cm.state.jump.isHoldingModifier && cm.state.jump.marker) {
    disableJumpMode(cm);
  }
}

function onKeyDown(cm, event) {
  if (cm.state.jump.isHoldingModifier || !isJumpModifier(event.key)) {
    return;
  }

  cm.state.jump.isHoldingModifier = true;

  if (cm.state.jump.cursor) {
    enableJumpMode(cm);
  }

  const onKeyUp = upEvent => {
    if (upEvent.code !== event.code) {
      return;
    }

    cm.state.jump.isHoldingModifier = false;

    if (cm.state.jump.marker) {
      disableJumpMode(cm);
    }

    CodeMirror.off(document, 'keyup', onKeyUp);
    CodeMirror.off(document, 'click', onClick);
    cm.off('mousedown', onMouseDown);
  };

  const onClick = clickEvent => {
    const destination = cm.state.jump.destination;
    if (destination) {
      cm.state.jump.options.onClick(destination, clickEvent);
    }
  };

  const onMouseDown = (_, downEvent) => {
    if (cm.state.jump.destination) {
      downEvent.codemirrorIgnore = true;
    }
  };

  CodeMirror.on(document, 'keyup', onKeyUp);
  CodeMirror.on(document, 'click', onClick);
  cm.on('mousedown', onMouseDown);
}

const isMac = navigator && navigator.appVersion.indexOf('Mac') !== -1;

function isJumpModifier(key) {
  return key === (isMac ? 'Meta' : 'Control');
}

function enableJumpMode(cm) {
  if (cm.state.jump.marker) {
    return;
  }

  const cursor = cm.state.jump.cursor;
  const pos = cm.coordsChar(cursor);
  const token = cm.getTokenAt(pos, true);

  const options = cm.state.jump.options;
  const getDestination = options.getDestination || cm.getHelper(pos, 'jump');
  if (getDestination) {
    const destination = getDestination(token, options, cm);
    if (destination) {
      const marker = cm.markText(
        {line: pos.line, ch: token.start},
        {line: pos.line, ch: token.end},
        {className: 'CodeMirror-jump-token'},
      );

      cm.state.jump.marker = marker;
      cm.state.jump.destination = destination;
    }
  }
}

function disableJumpMode(cm) {
  const marker = cm.state.jump.marker;
  cm.state.jump.marker = null;
  cm.state.jump.destination = null;

  marker.clear();
}
