/** @jsx jsx */
import { jsx } from 'theme-ui';

const Item = ({ children }) => (
  <button
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: '.2s',
      ':hover': {
        transform: 'scale(1.1)',
      },
      ':active': {
        transform: 'scale(.95)',
      },
    }}>
    {children}
  </button>
);

const Nav = () => {
  return (
    <nav
      sx={{
        display: 'grid',
        gridAutoFlow: 'row',
        gridAutoRows: '2em',
        fontSize: '3em',
      }}>
      <Item>{'🐽'}</Item>
      <Item>{'👨‍🌾'}</Item>
      <Item>{'🐝'}</Item>
    </nav>
  );
};

export default Nav;
