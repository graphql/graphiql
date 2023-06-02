---
'@graphiql/react': minor
---

- Add a clear history button to clear all history as well as trash icons to clear individual history items

- Change so item is in history items or history favorites, not both

- Fix history label editing so if the same item is in the list more than once it edits the correct label

- Pass the entire history item in history functions (addToHistory, editLabel, toggleFavorite, etc.) so users building their own HistoryContext.Provider will get any additional props they added to the item in their customized functions

- Adds a "setActive" callback users can use to customize their UI when the history item is clicked
