const { version } = require('react');

// Conditional loading because there is no path `react/compiler-runtime` in React 18
module.exports =
  !process.env.UMD && version.startsWith('19.')
    ? require('react/compiler-runtime')
    : require('react-compiler-runtime');
