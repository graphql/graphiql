import type { GlobalProvider } from '@ladle/react';

import React from 'react';

// styles | this is a simple override of ladle-main styles
import './styles.css';

export const Provider: GlobalProvider = ({ children, globalState }) => {
  return <div className="ladle-container">{children}</div>;
};
