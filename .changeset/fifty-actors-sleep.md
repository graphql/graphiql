---
'graphql-language-service-server': patch
---

this fixes the parsing of file URIs by `graphql-language-service-server` in cases such as:

- windows without WSL
- special characters in filenames
- likely other cases

previously we were using the old approach of `URL(uri).pathname` which was not working! now using the standard `vscode-uri` approach of `URI.parse(uri).fsName`.

this should fix issues with object and fragment type completion as well I think

also for #2066 made it so that graphql config is not loaded into the file cache unnecessarily, and that it's only loaded on editor save events rather than on file changed events

fixes #1644 and #2066
