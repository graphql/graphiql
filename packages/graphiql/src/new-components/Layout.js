/** @jsx jsx */
import { jsx } from 'theme-ui';

import PropTypes from 'prop-types';

const Widget = ({ children }) => <div sx={{ padding: 2 }}>{children}</div>;

const Container = ({ children, mini = false }) => (
  <div
    sx={{
      backgroundColor: !mini && 'cardBackground',
      boxShadow:
        !mini &&
        (theme =>
          `0 0 0 .1px ${theme.colors.border}, 0 1px 4px 0 ${theme.colors.border}`),
    }}>
    {children}
  </div>
);

Container.propTypes = {
  mini: PropTypes.bool,
};

const Layout = ({ nav = 'nav' }) => {
  return (
    <main
      sx={{
        display: 'grid',
        gap: 2,
        padding: 2,
        gridAutoFlow: 'column',
        gridTemplateColumns: '6em',
        gridAutoColumns: 'minmax(30em, 1fr)',
        minHeight: '100vh',
      }}>
      <Container mini>{nav}</Container>
      <Container>
        <Widget>{'container'}</Widget>
      </Container>
      <Container>
        <Widget>{'container'}</Widget>
      </Container>
      <Container>
        <Widget>{'container'}</Widget>
      </Container>
    </main>
  );
};

Layout.propTypes = {
  nav: PropTypes.node,
};
export default Layout;
