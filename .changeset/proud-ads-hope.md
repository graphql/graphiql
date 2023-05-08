---
'@graphiql/react': minors
---

- Add a clear history button to clear all history as well as trash icons to clear individual history items

- Pass the entire history item in history functions (addToHistory/editLabel/toggleFavorite/etc) so users building their own HistoryContext.Provider will get any additional props they added to the item in their customized functions

- Adds a "setActive" callback users can use to customize their UI when the history item is clicked
