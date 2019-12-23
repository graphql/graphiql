import PropTypes from 'prop-types';

export const PANEL_SIZES = ['sidebar', 'aside', 'full-screen'];

/*
Layout components are divided into 3 areas: 
- the gql explorer itself, which has 3 panels (input, response, console)
- the side nav
- the nav panels, which are a potentially infinite stack, 
  they are wrapped in an object that specifies what size they 
  should render at

TODO: For the nav we can probably just pass a list oflinks instead of a component
*/
export const LAYOUT_PROP_TYPES = {
  explorer: PropTypes.shape({
    input: PropTypes.node,
    response: PropTypes.node,
    console: PropTypes.node,
  }).isRequired,
  nav: PropTypes.node.isRequired,
  navPanels: PropTypes.arrayOf(
    PropTypes.shape({
      component: PropTypes.node,
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      size: PropTypes.oneOf(PANEL_SIZES),
    }),
  ),
};
