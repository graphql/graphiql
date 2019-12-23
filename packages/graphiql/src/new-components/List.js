/** @jsx jsx */
import { jsx } from 'theme-ui';

import PropTypes from 'prop-types';

const ListRow = ({ children, flex = false, padding = true }) => (
  <div
    sx={{
      overflow: 'auto',
      flex: flex && '1 1 auto',
      padding: padding && 2,
    }}>
    {children}
  </div>
);
ListRow.propTypes = {
  flex: PropTypes.bool,
  padding: PropTypes.bool,
};

const List = ({ children }) => (
  <div
    sx={{
      backgroundColor: 'cardBackground',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      '> *:not(:first-of-type)': {
        borderTop: theme => `1px solid ${theme.colors.border}`,
      },
      '> *': {
        flex: '0 0 auto',
      },
    }}>
    {children}
  </div>
);

List.propTypes = {
  mini: PropTypes.bool,
};

export default List;
export { ListRow };
