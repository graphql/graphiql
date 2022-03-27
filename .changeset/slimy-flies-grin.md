---
'graphiql': patch
---

Finally remove inline `require()` for codemirror addon imports, replace with modern dynamic `import()` (which enables `esbuild`, `vite`, etc).

This change should allow your bundler to code split codemirror-graphql and the codemirror addons based on which you import. For SSR support, GraphiQL must load these modules dynamically. 

If you want to use other codemirror addons (vim, etc) for non-ssr you can just import them top level, or for SSR, you can just dynamically import them.
