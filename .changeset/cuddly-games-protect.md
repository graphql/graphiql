---
'graphql-language-service-cli': patch
'graphql-language-service-server': patch
---

this fixes the URI scheme related bugs and make sure schema as sdl config works again.

`fileURLToPath` had been introduced by a contributor and I didnt test properly, it broke sdl file loading!

definitions, autocomplete, diagnostics, etc should work again
also hides the more verbose logging output for now