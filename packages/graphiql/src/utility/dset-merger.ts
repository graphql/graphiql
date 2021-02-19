// @ts-nocheck

/*
!!IMPORTANT
This is a _fork_ of https://github.com/lukeed/dset/ that adds support in for deep-merging collisions. Once `dset/merge` becomes a thing we can remove this.

@maraisr will be monitoring this.
 */

export function dset<T extends object, V>(
  obj: T,
  keys: string | ArrayLike<string | number>,
  value: V,
): void;
export function dset(obj, keys, val) {
  keys.split && (keys = keys.split('.'));
  let i = 0;
  const l = keys.length;
  let t = obj;
  let x;
  let k;
  for (; i < l; ) {
    k = keys[i++];
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
      break;
    }
    t = t[k] =
      i === l
        ? merge(t[k], val) // Note; this here was the change.
        : typeof (x = t[k]) === typeof keys
        ? x
        : keys[i] * 0 !== 0 || Boolean(~String(keys[i]).indexOf('.'))
        ? {}
        : [];
  }
}

function merge(a, b) {
  if (typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      for (let i = 0; i < b.length; i++) {
        a[i] = merge(a[i], b[i]);
      }
    } else {
      for (const k in b) {
        a[k] = merge(a[k], b[k]);
      }
    }
    return a;
  }
  return b;
}
