/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { Maybe, ReactNodeLike } from '../../../types';

export type Color = string;
export type Colors = {
  text: Color;
  darkText: Color;
  background: Color;
  cardBackground: Color;
  primary: Color;
  border: Color;
};

export type FontSizes = number[];

export type Spaces = {
  rowPadding: number;
  rowMinHeight: number;
};

type Shadow = string;
export type Shadows = {
  card: Shadow;
  primaryUnderline: Shadow;
  underline: Shadow;
};

export type Font = string;
export type Fonts = {
  body: Font;
  heading: Font;
  monospace: Font;
};

export type Space = number[];

export type GraphiQLTheme = {
  fonts: Fonts;
  fontSizes: number[];
  colors: Colors;
  transitions: string[];
  space: Space;
  spaces: Spaces;
  shadows: Shadows;
};

export type PanelSize = 'sidebar' | 'aside' | 'full-screen';

/*
Layout components are divided into 3 areas:
- the gql explorer itself, which has 3 panels (input, response, console)
- the side nav
- the nav panels, which are a potentially infinite stack,
  they are wrapped in an object that specifies what size they
  should render at

TODO: For the nav we can probably just pass a list oflinks instead of a component
*/
export type LayoutPropTypes = {
  session?: {
    input?: ReactNodeLike;
    response?: ReactNodeLike;
    console?: ReactNodeLike;
  };
  nav: ReactNodeLike;
  navPanels?: Maybe<
    { component?: ReactNodeLike; key?: string | number; size?: PanelSize }[]
  >;
};
