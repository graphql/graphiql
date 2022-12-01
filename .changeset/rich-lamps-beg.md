---
'graphiql': minor
---

1) Added optional props which can be used to toggle the visibility of
   - second panel — with the `hideSecondPanel` prop
   - editor panel — with the `hideEditorPanel` prop
   - results panel — with the `hideResultsPanel` prop

These work independently of each other, so you can have the second panel visible, but the editor panel hidden.
NOTE: If the second panel is hidden, the other two props will be ignored.

2) Added optional props which can be used to add custom styles through class names:
   - second panel — with the `secondPanelClassName` prop
   - editor panel — with the `editorPanelClassName` prop
   - results panel — with the `resultsPanelClassName` prop

NOTE: These props are used only if the corresponding panel is not hidden.


