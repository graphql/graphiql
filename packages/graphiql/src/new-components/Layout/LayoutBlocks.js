/** @jsx jsx */
import { jsx } from 'theme-ui';

import PropTypes from 'prop-types';

const CardRowText = ({ children }) => (
  <p
    sx={{
      padding: 2,
    }}>
    {children}
  </p>
);

const CardRow = ({ children, flex = false }) => (
  <div
    sx={{
      overflow: 'auto',
      flex: flex && '1 1 auto',
    }}>
    {children}
  </div>
);
CardRow.propTypes = {
  flex: PropTypes.bool,
};

const Card = ({ children }) => (
  <div
    sx={{
      backgroundColor: 'cardBackground',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: theme =>
        `0 0 0 .1px ${theme.colors.border}, 0 1px 4px 0 ${theme.colors.border}`,
      '> *:not(:first-child)': {
        borderTop: theme => `1px solid ${theme.colors.border}`,
      },
      '> *': {
        flex: '0 0 auto',
      },
    }}>
    {children}
  </div>
);

Card.propTypes = {
  mini: PropTypes.bool,
};

export { Card, CardRow, CardRowText };
