/** @jsx jsx */
import { jsx } from 'theme-ui';

import PropTypes from 'prop-types';
import LayoutSlot from './LayoutSlot';
import { PANEL_SIZES } from './../constants';

export const NAV_WIDTH = '6em';

/*
Layout is divided into 3 'slot' areas: 
- the explorer itself, which has 3 panels (input, response, console)
- the nav
- the nav panels, which are a potentially infinite stack, 
  they are wrapped in `LayoutNavPanel` to specify what size 
  they want to render at

This should allow third parties to provide their own Layout+LayoutNavPanel
as long as itit exposes the same API
*/

const defaults = {
  explorer: {
    input: 'input',
    response: 'response',
    console: 'console',
  },
  nav: 'nav',
  navPanels: [],
};

const Layout = ({
  nav = defaults.nav,
  navPanels = defaults.navPanels,
  explorer = defaults.explorer,
}) => {
  return (
    <main
      sx={{
        display: 'grid',
        gap: 2,
        padding: 2,
        gridAutoFlow: 'column',
        gridTemplateColumns: `${NAV_WIDTH} min-content minmax(60em, 1fr)`,
        gridAutoColumns: '1fr',
        gridAutoRows: '100%',
        height: '100vh',
      }}>
      {nav && <LayoutSlot name="nav">{nav}</LayoutSlot>}
      {navPanels && (
        <div
          sx={{
            display: 'grid',
            gridAutoFlow: 'column',
            alignItems: 'stretch',
            gap: 2,
          }}>
          {navPanels.map(({ component, key, size }) => (
            <LayoutSlot name={key} key={key} size={size}>
              {component}
            </LayoutSlot>
          ))}
        </div>
      )}
      {explorer && (
        <div
          sx={{
            display: 'grid',
            alignItems: 'stretch',
            gap: 2,
            gridTemplateAreas: `'a b' 'c c'`,
            'div[data-slot="explorer-console"]': {
              gridArea: 'c',
            },
          }}>
          <LayoutSlot name="explorer-input">{explorer.input}</LayoutSlot>
          <LayoutSlot name="explorer-response">{explorer.response}</LayoutSlot>
          <LayoutSlot name="explorer-console">{explorer.console}</LayoutSlot>
        </div>
      )}
    </main>
  );
};

Layout.propTypes = {
  explorer: PropTypes.shape({
    input: PropTypes.node,
    response: PropTypes.node,
    console: PropTypes.node,
  }).isRequired,
  nav: PropTypes.node.isRequired,
  navPanels: PropTypes.arrayOf(
    PropTypes.shape({
      component: PropTypes.node,
      key: PropTypes.string,
      size: PropTypes.oneOf(PANEL_SIZES),
    }),
  ).isRequired,
};

export default Layout;
