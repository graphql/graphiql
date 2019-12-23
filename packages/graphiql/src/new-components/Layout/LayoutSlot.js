/** @jsx jsx */
import { jsx } from 'theme-ui';
import PropTypes from 'prop-types';

const LayoutSlot = ({ children, name }) => (
  <div
    sx={{
      display: 'grid',
      gridTemplate: '100% / 100%',
    }}
    data-slot={name}>
    {children}
  </div>
);

LayoutSlot.propTypes = { name: PropTypes.string };
export default LayoutSlot;
