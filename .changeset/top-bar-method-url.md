---
'@graphiql/toolkit': minor
'@graphiql/react': minor
---

The top bar now displays the active HTTP method and endpoint URL from the configured `transport`. When the transport supports both GET and POST, an inline GET/POST switcher is shown; toggling it changes the method used for subsequent requests. Consumers using a legacy `fetcher` see no switcher and a `—` placeholder for the URL.
