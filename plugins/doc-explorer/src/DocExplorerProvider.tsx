import * as React from 'react';

const DocExplorerContext = React.createContext({
  searchState: '',
  activeType: null,
});

export function DocExplorerProvider() {
  return (
    <DocExplorerContext.Provider
      value={{
        searchState: '',
        activeType: null,
      }}
    />
  );
}
