/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 */

/**
 * Utility functions to get a pixel distance from left/top of the window.
 */

export function getLeft(initialElem: HTMLElement) {
  let pt = 0;
  let elem = initialElem;
  while (elem.offsetParent) {
    pt += elem.offsetLeft;
    elem = elem.offsetParent as HTMLElement;
  }
  return pt;
}

export function getTop(initialElem: HTMLElement) {
  let pt = 0;
  let elem = initialElem;
  while (elem.offsetParent) {
    pt += elem.offsetTop;
    elem = elem.offsetParent as HTMLElement;
  }
  return pt;
}
