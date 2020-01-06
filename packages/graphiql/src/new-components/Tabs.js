/** @jsx jsx */
import { jsx } from 'theme-ui';
import PropTypes from 'prop-types';

const Tab = ({ active, ...props }) => (
  <button
    sx={{
      display: 'flex',
      padding: 3,
      outline: 'none',
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

const Tabs = ({ tabs, active, onChange }) => {
  return (
    <ul
      sx={{
        display: 'flex',
        '& > *': {
          position: 'relative',
        },
        '& > *:not(:first-child):before': {
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
      {tabs.map((tab, index) => (
        <li key={index}>
          <Tab active={active === index} onClick={() => onChange(index)}>
            {tab}
          </Tab>
        </li>
      ))}
    </ul>
  );
};

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.Node).isRequired,
  active: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default Tabs;
