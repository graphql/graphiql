/** @jsx jsx */
import { jsx } from 'theme-ui';

import PropTypes from 'prop-types';
import { Card, CardRow } from './Layout/LayoutBlocks';

/*
Layout is divided into 3 'slot' areas: 
- the explorer itself, which has 3 panels (input, response, console)
- the nav
- the nav panels, which are a potentially infinite stack
*/

const defaults = {
  explorer: {
    input: <Card>{'input'}</Card>,
    response: <Card>{'response'}</Card>,
    console: <Card>{'console'}</Card>,
  },
  nav: 'nav',
  navPanels: [<Card key="main sidebar">{'sidebar'}</Card>],
};

const Slot = ({ children, name }) => (
  <div
    sx={{
      display: 'grid',
    }}
    data-slot={name}>
    {children}
  </div>
);
Slot.propTypes = { name: PropTypes.string };

const Layout = ({
  nav = defaults.nav,
  explorer = defaults.explorer,
  navPanels = defaults.navPanels,
}) => {
  return (
    <main
      sx={{
        display: 'grid',
        gap: 2,
        padding: 2,
        gridAutoFlow: 'column',
        gridTemplateColumns: '6em minmax(10em, 1fr)',
        gridAutoColumns: '1fr',
        minHeight: '100vh',
      }}>
      {nav && <Slot name="nav">{nav}</Slot>}
      {navPanels && <Slot name="nav-panels">{navPanels}</Slot>}
      {explorer && (
        <div
          sx={{
            display: 'grid',
            alignItems: 'stretch',
            gap: 2,
            minWidth: '60em',
            gridTemplateAreas: `'a b' 'c c'`,
            'div[data-slot="explorer-console"]': {
              gridArea: 'c',
            },
          }}>
          <Slot name="explorer-input">{explorer.input}</Slot>
          <Slot name="explorer-response">{explorer.response}</Slot>
          <Slot name="explorer-console">{explorer.console}</Slot>
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
  }),
  nav: PropTypes.node,
  navPanels: PropTypes.arrayOf(PropTypes.node),
};
export default Layout;
