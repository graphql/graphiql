/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 * */

export type Maybe<T> = T | null | undefined;

export type ReactComponentLike =
  | string
  | ((props: any, context?: any) => any)
  | (new (props: any, context?: any) => any);

export type ReactElementLike = {
  type: ReactComponentLike;
  props: any;
  key: string | number | null;
};

export type ReactNodeLike =
  | {}
  | ReactElementLike
  | Array<ReactNodeLike>
  | string
  | number
  | boolean
  | null
  | undefined;
