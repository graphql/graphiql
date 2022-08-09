/** @jsx jsx */

/**
 *  Copyright (c) 2021 GraphQL Contributors.
 *
 *  This source code is licensed under the MIT license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 */

import { PropsWithChildren } from 'react';
import { GraphiQLTheme, PanelSize, LayoutPropTypes } from '../types';

import { jsx, SxStyleProp } from 'theme-ui';

const NAV_WIDTH = '6em';
const CONTENT_MIN_WIDTH = '60em';

function sizeInCSSUnits(theme: GraphiQLTheme, size: PanelSize) {
  switch (size) {
    case 'sidebar':
      return '10em';
    case 'aside':
      return '20em';
    default:
      return `calc(100vw - ${theme.space[2] * 3}px - ${NAV_WIDTH})`;
  }
}

type CardPropTypes = PropsWithChildren<{
  size?: PanelSize;
  transparent?: boolean;
  innerSx?: SxStyleProp;
}>;

const Card = ({
  children,
  size,
  transparent = false,
  innerSx,
}: CardPropTypes) => (
  <div
    sx={
      {
        display: 'grid',
        backgroundColor: !transparent ? 'cardBackground' : undefined,
        boxShadow: !transparent && 'card',
        minWidth: size && (theme => sizeInCSSUnits(theme, size)),
        gridTemplate: '100% / 100%',
        ...(innerSx ?? {}),
      } as SxStyleProp
    }
  >
    {children}
  </div>
);

const gridBase = {
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: '1fr',
  gridAutoRows: '100%',
  gap: 3,
};

const Layout = ({ nav, navPanels, session }: LayoutPropTypes) => {
  const hasNavPanels = (navPanels && navPanels?.length > 0) || false;
  return (
    <main
      sx={{
        ...gridBase,
        padding: 3,
        gridTemplate: hasNavPanels
          ? `'nav panels session' 100% / ${NAV_WIDTH} min-content minmax(${CONTENT_MIN_WIDTH}, 1fr)`
          : `'nav session' 100% / ${NAV_WIDTH} minmax(${CONTENT_MIN_WIDTH}, 1fr)`,
        height: '100%',
      }}
    >
      {nav && (
        <Card innerSx={{ gridArea: 'nav' }} transparent>
          {nav}
        </Card>
      )}
      {hasNavPanels && (
        <div
          sx={{
            gridArea: 'panels',
            ...gridBase,
          }}
        >
          {navPanels!.map(({ component, key, size }) => (
            <Card key={key} size={size}>
              {component}
            </Card>
          ))}
        </div>
      )}
      {session && (
        <div
          sx={{
            ...gridBase,
            gridArea: 'session',
            gridAutoRows: '1fr',
            gridTemplateAreas: `'input response' 'console console'`,
          }}
        >
          <Card innerSx={{ gridArea: 'input' }}>{session.input}</Card>
          <Card innerSx={{ gridArea: 'response' }}>{session.response}</Card>
          <Card innerSx={{ gridArea: 'console' }}>{session.console}</Card>
        </div>
      )}
    </main>
  );
};

export default Layout;
