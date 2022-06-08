---
'graphql-language-service-server': patch
'monaco-graphql': patch
'vscode-graphql': patch
---

Disable`fillLeafsOnComplete` by default
    
Users found this generally annoying by default, especially when there are required arguments
    
Without automatically prompting autocompletion of required arguments as well as lead expansion, it makes the extension harder to use
    
You can now supply this in your graphql config:
    
`config.extensions.languageService.fillLeafsOnComplete`
    
Setting it to to `true` will enable this feature.
Will soon add the ability to manually enable this in `monaco-graphql` as well.
    
For both, this kind of behavior would be better as a keyboard command, context menu item &/or codelens prompt
