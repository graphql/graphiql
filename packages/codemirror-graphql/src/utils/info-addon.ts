/**
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { defineOption, Init, on, off, Editor } from 'codemirror';
import { GraphQLInfoOptions } from '../info';

defineOption(
  'info',
  false,
  (cm: Editor, options: GraphQLInfoOptions, old?: GraphQLInfoOptions) => {
    if (old && old !== Init) {
      const oldOnMouseOver = cm.state.info.onMouseOver;
      off(cm.getWrapperElement(), 'mouseover', oldOnMouseOver);
      clearTimeout(cm.state.info.hoverTimeout);
      delete cm.state.info;
    }

    if (options) {
      const state: Record<string, any> = (cm.state.info = createState(options));
      state.onMouseOver = onMouseOver.bind(null, cm);
      on(cm.getWrapperElement(), 'mouseover', state.onMouseOver);
    }
  },
);

function createState(options: GraphQLInfoOptions) {
  return {
    options:
      options instanceof Function
        ? { render: options }
        : typeof options === 'object'
        ? options
        : {},
  };
}

function getHoverTime(cm: Editor) {
  const { options } = cm.state.info;
  return options?.hoverTime || 500;
}

function onMouseOver(cm: Editor, e: MouseEvent) {
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
    off(document, 'mousemove', onMouseMove);
    off(cm.getWrapperElement(), 'mouseout', onMouseOut);
    clearTimeout(state.hoverTimeout);
    state.hoverTimeout = undefined;
  };

  const onHover = function () {
    off(document, 'mousemove', onMouseMove);
    off(cm.getWrapperElement(), 'mouseout', onMouseOut);
    state.hoverTimeout = undefined;
    onMouseHover(cm, box);
  };

  const hoverTime = getHoverTime(cm);
  state.hoverTimeout = setTimeout(onHover, hoverTime);

  on(document, 'mousemove', onMouseMove);
  on(cm.getWrapperElement(), 'mouseout', onMouseOut);
}

function onMouseHover(cm: Editor, box: DOMRect) {
  const pos = cm.coordsChar(
    {
      left: (box.left + box.right) / 2,
      top: (box.top + box.bottom) / 2,
    },
    'window',
  ); // 'window' allows to work when editor is not full page and window has scrolled

  const state = cm.state.info;
  const { options } = state;
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

function showPopup(cm: Editor, box: DOMRect, info: HTMLDivElement) {
  const popup = document.createElement('div');
  popup.className = 'CodeMirror-info';
  popup.append(info);
  document.body.append(popup);

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
    off(popup, 'mouseover', onMouseOverPopup);
    off(popup, 'mouseout', onMouseOut);
    off(cm.getWrapperElement(), 'mouseout', onMouseOut);

    if (popup.style.opacity) {
      popup.style.opacity = '0';
      setTimeout(() => {
        if (popup.parentNode) {
          popup.remove();
        }
      }, 600);
    } else if (popup.parentNode) {
      popup.remove();
    }
  };

  on(popup, 'mouseover', onMouseOverPopup);
  on(popup, 'mouseout', onMouseOut);
  on(cm.getWrapperElement(), 'mouseout', onMouseOut);
}
