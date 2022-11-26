import * as React from 'react';
import type { GlobalProvider } from '@ladle/react';

// styles | overrides for ladle container/wrapper styles
import './styles.css';

export const Provider: GlobalProvider = ({ children }) => {
  return (
    <div className="ladle-wrap">
      {children}
    </div>
  );
};
