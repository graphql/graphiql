import { JSXElementConstructor } from 'react';

export const createComponentGroup = <
  Root extends JSXElementConstructor<any>,
  Children extends { [key: string]: JSXElementConstructor<any> },
>(
  root: Root,
  children: Children,
): Root & Children =>
  Object.entries(children).reduce<any>((r, [key, value]) => {
    r[key] = value;
    return r;
  }, root);
