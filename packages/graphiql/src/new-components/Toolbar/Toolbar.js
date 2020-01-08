/** @jsx jsx */
import { jsx } from 'theme-ui';
import PropTypes from 'prop-types';
import WithDividers from './support/WithDividers';

const Toolbar = ({ children, justifyContent = 'space-between' }) => {
  const needsExtraPadding = !justifyContent.includes('space');
  return (
    <div
      sx={{
        overflow: 'auto',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent,
      }}>
      {needsExtraPadding ? (
        <WithDividers padding>{children}</WithDividers>
      ) : (
        children
      )}
    </div>
  );
};
Toolbar.propTypes = {
  justifyContent: PropTypes.oneOf([
    'space-between',
    'space-around',
    'flex-start',
    'flex-end',
    'center',
  ]),
};

export default Toolbar;
