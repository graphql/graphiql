/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import CodeMirror from 'codemirror';
import { GraphQLInfoOptions } from '../info';

CodeMirror.defineOption(
  'info',
  false,
  (
    cm: CodeMirror.Editor,
    options: GraphQLInfoOptions,
    old?: GraphQLInfoOptions,
  ) => {
    if (old && old !== CodeMirror.Init) {
      const oldOnMouseOver = cm.state.info.onMouseOver;
      CodeMirror.off(cm.getWrapperElement(), 'mouseover', oldOnMouseOver);
      clearTimeout(cm.state.info.hoverTimeout);
      delete cm.state.info;
    }

    if (options) {
      const state: Record<string, any> = (cm.state.info = createState(options));
      state.onMouseOver = onMouseOver.bind(null, cm);
      CodeMirror.on(cm.getWrapperElement(), 'mouseover', state.onMouseOver);
    }
  },
);

function createState(options: GraphQLInfoOptions) {
  return {
    options:
      options instanceof Function
        ? { render: options }
        : options === true
        ? {}
        : options,
  };
}

function getHoverTime(cm: CodeMirror.Editor) {
  const options = cm.state.info.options;
  return options?.hoverTime || 500;
}

function onMouseOver(cm: CodeMirror.Editor, e: MouseEvent) {
  const state = cm.state.info;

  const target = e.target || e.srcElement;

  if (!(target instanceof HTMLElement)) {
    return;
  }
  if (target.nodeName !== 'SPAN' || state.hoverTimeout !== undefined) {
    return;
  }

  const box = target.getBoundingClientRect();

  const onMouseMove = function () {
    clearTimeout(state.hoverTimeout);
    state.hoverTimeout = setTimeout(onHover, hoverTime);
  };

  const onMouseOut = function () {
    CodeMirror.off(document, 'mousemove', onMouseMove);
    CodeMirror.off(cm.getWrapperElement(), 'mouseout', onMouseOut);
    clearTimeout(state.hoverTimeout);
    state.hoverTimeout = undefined;
  };

  const onHover = function () {
    CodeMirror.off(document, 'mousemove', onMouseMove);
    CodeMirror.off(cm.getWrapperElement(), 'mouseout', onMouseOut);
    state.hoverTimeout = undefined;
    onMouseHover(cm, box);
  };

  const hoverTime = getHoverTime(cm);
  state.hoverTimeout = setTimeout(onHover, hoverTime);

  CodeMirror.on(document, 'mousemove', onMouseMove);
  CodeMirror.on(cm.getWrapperElement(), 'mouseout', onMouseOut);
}

function onMouseHover(cm: CodeMirror.Editor, box: DOMRect) {
  const pos = cm.coordsChar({
    left: (box.left + box.right) / 2,
    top: (box.top + box.bottom) / 2,
  });

  const state = cm.state.info;
  const options = state.options;
  const render = options.render || cm.getHelper(pos, 'info');
  if (render) {
    const token = cm.getTokenAt(pos, true);
    if (token) {
      const info: HTMLDivElement = render(token, options, cm, pos);
      if (info) {
        showPopup(cm, box, info);
      }
    }
  }
}

function showPopup(cm: CodeMirror.Editor, box: DOMRect, info: HTMLDivElement) {
  const popup = document.createElement('div');
  popup.className = 'CodeMirror-info';
  popup.appendChild(info);
  document.body.appendChild(popup);

  const popupBox = popup.getBoundingClientRect();
  const popupStyle = window.getComputedStyle(popup);
  const popupWidth =
    popupBox.right -
    popupBox.left +
    parseFloat(popupStyle.marginLeft) +
    parseFloat(popupStyle.marginRight);
  const popupHeight =
    popupBox.bottom -
    popupBox.top +
    parseFloat(popupStyle.marginTop) +
    parseFloat(popupStyle.marginBottom);

  let topPos = box.bottom;
  if (
    popupHeight > window.innerHeight - box.bottom - 15 &&
    box.top > window.innerHeight - box.bottom
  ) {
    topPos = box.top - popupHeight;
  }

  if (topPos < 0) {
    topPos = box.bottom;
  }

  let leftPos = Math.max(0, window.innerWidth - popupWidth - 15);
  if (leftPos > box.left) {
    leftPos = box.left;
  }

  popup.style.opacity = '1';
  popup.style.top = topPos + 'px';
  popup.style.left = leftPos + 'px';

  let popupTimeout: NodeJS.Timeout;

  const onMouseOverPopup = function () {
    clearTimeout(popupTimeout);
  };

  const onMouseOut = function () {
    clearTimeout(popupTimeout);
    popupTimeout = setTimeout(hidePopup, 200);
  };

  const hidePopup = function () {
    CodeMirror.off(popup, 'mouseover', onMouseOverPopup);
    CodeMirror.off(popup, 'mouseout', onMouseOut);
    CodeMirror.off(cm.getWrapperElement(), 'mouseout', onMouseOut);

    if (popup.style.opacity) {
      popup.style.opacity = '0';
      setTimeout(() => {
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }, 600);
    } else if (popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }
  };

  CodeMirror.on(popup, 'mouseover', onMouseOverPopup);
  CodeMirror.on(popup, 'mouseout', onMouseOut);
  CodeMirror.on(cm.getWrapperElement(), 'mouseout', onMouseOut);
}
