---
'@graphiql/react': patch
---

Keep the active tab selected when a tab to its right is closed. `closeTab` decremented `activeTabIndex` unconditionally, without comparing it to the index of the closed tab.
Closing a tab positioned after the active one does not shift the active tab
Closing the active tab, or a tab before it, is unchanged.
