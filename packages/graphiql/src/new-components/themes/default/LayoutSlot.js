/** @jsx jsx */
import { jsx } from 'theme-ui';
import PropTypes from 'prop-types';
import { PANEL_SIZES } from './../constants';
import { NAV_WIDTH } from './Layout';

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

const LayoutSlot = ({ children, name, size }) => (
  <div
    sx={{
      display: 'grid',
      minWidth: size && (theme => sizeInCSSUnits(theme, size)),
      gridTemplate: '100% / 100%',
    }}
    data-slot={name}>
    {children}
  </div>
);

LayoutSlot.propTypes = {
  name: PropTypes.string,
  size: PropTypes.oneOf(PANEL_SIZES),
};
export default LayoutSlot;
