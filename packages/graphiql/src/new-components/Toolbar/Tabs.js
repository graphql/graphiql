/** @jsx jsx */
import { jsx } from 'theme-ui';
import PropTypes from 'prop-types';
import WithDividers from './support/WithDividers';

const Tab = ({ active, ...props }) => (
  <button
    sx={{
      padding: ({ spaces }) => spaces.rowPadding,
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

const Tabs = ({ tabs, active, onChange }) => {
  return (
    <WithDividers>
      {tabs.map((tab, index) => (
        <Tab
          key={index}
          active={active === index}
          onClick={() => onChange(index)}>
          {tab}
        </Tab>
      ))}
    </WithDividers>
  );
};

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.node).isRequired,
  active: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default Tabs;
