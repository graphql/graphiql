/** @jsx jsx */
import { jsx } from 'theme-ui';
import PropTypes from 'prop-types';

const Tab = ({ active, ...props }) => (
  <button
    sx={{
      padding: 3,
      outline: 'none',
      textAlign: 'end',
      verticalAlign: 'baseline',
      transition: ({ transitions }) => transitions[0],
      cursor: 'pointer',
      ':focus, :hover': {
        boxShadow: active ? 'primaryUnderline' : 'underline',
        color: active ? 'primary' : 'darkText',
      },
      boxShadow: active ? 'primaryUnderline' : 'inset 0 0 0 transparent',
      color: active ? 'primary' : 'text',
    }}
    {...props}
  />
);
Tab.propTypes = { active: PropTypes.bool };

const ListWithCssDividers = ({ children, ...props }) => {
  return (
    <ul
      {...props}
      sx={{
        ...props.sx,
        '& > *': {
          position: 'relative',
        },
        '& > *:not(:first-of-type):before': {
          content: '""',
          display: 'block',
          position: 'absolute',
          background: ({ colors }) => colors.border,
          width: 1,
          top: ({ space }) => space[2],
          bottom: ({ space }) => space[2],
          left: 0,
        },
      }}>
      {children}
    </ul>
  );
};
ListWithCssDividers.propTypes = { sx: PropTypes.object };

const Tabs = ({ tabs, active, onChange }) => {
  return (
    <ListWithCssDividers
      sx={{
        display: 'flex',
        height: '100%',
        alignItems: 'stretch',
      }}>
      {tabs.map((tab, index) => (
        <li sx={{ display: 'grid' }} key={index}>
          <Tab active={active === index} onClick={() => onChange(index)}>
            {tab}
          </Tab>
        </li>
      ))}
    </ListWithCssDividers>
  );
};

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.node).isRequired,
  active: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default Tabs;
