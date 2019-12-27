/** @jsx jsx */
import { jsx } from 'theme-ui';

import PropTypes from 'prop-types';
import { PANEL_SIZES, LAYOUT_PROP_TYPES } from './../constants';

const NAV_WIDTH = '6em';
const CONTENT_MIN_WIDTH = '60em';

const sizeInCSSUnits = (theme, size) => {
  switch (size) {
    case 'sidebar':
      return '10em';
    case 'aside':
      return '20em';
    default:
      return `calc(100vw - ${theme.space[2] * 3}px - ${NAV_WIDTH})`;
  }
};

const Card = ({ children, size, transparent = false, innerSx }) => (
  <div
    sx={{
      display: 'grid',
      backgroundColor: !transparent && 'cardBackground',
      boxShadow: !transparent && 'card',
      minWidth: size && (theme => sizeInCSSUnits(theme, size)),
      gridTemplate: '100% / 100%',
      ...innerSx,
    }}>
    {children}
  </div>
);

Card.propTypes = {
  transparent: PropTypes.bool,
  size: PropTypes.oneOf(PANEL_SIZES),
  innerSx: PropTypes.object,
};

const gridBase = {
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: '1fr',
  gridAutoRows: '100%',
  gap: 2,
};

const Layout = ({ nav, navPanels, explorer }) => {
  const hasNavPanels = navPanels && navPanels.length > 0;
  return (
    <main
      sx={{
        ...gridBase,
        padding: 2,
        gridTemplate: hasNavPanels
          ? `'nav panels explorer' 100% / ${NAV_WIDTH} min-content minmax(${CONTENT_MIN_WIDTH}, 1fr)`
          : `'nav explorer' 100% / ${NAV_WIDTH} minmax(${CONTENT_MIN_WIDTH}, 1fr)`,
        height: '100vh',
      }}>
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
          }}>
          {navPanels.map(({ component, key, size }) => (
            <Card key={key} size={size}>
              {component}
            </Card>
          ))}
        </div>
      )}
      {explorer && (
        <div
          sx={{
            ...gridBase,
            gridArea: 'explorer',
            gridAutoRows: '1fr',
            gridTemplateAreas: `'input response' 'console console'`,
          }}>
          <Card>{explorer.input}</Card>
          <Card>{explorer.response}</Card>
          <Card innerSx={{ gridArea: 'console' }}>{explorer.console}</Card>
        </div>
      )}
    </main>
  );
};

Layout.propTypes = LAYOUT_PROP_TYPES;

export default Layout;
