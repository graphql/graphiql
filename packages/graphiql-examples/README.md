Example GraphiQL Install
========================

This example uses the browserified, unminified CDN version of GraphiQL found in packages/graphiql to make it easy to test changes. It's also used by netlify builds

1. Run `yarn` and `yarn build` in the root of this project
2. Navigate to this directory (packages/graphiql-examples/cdn) in Terminal
3. Then, run `yarn setup` and `yarn start`
4. Open your browser to the automatically generated address listed in your console. e.g. `Started on http://localhost:49811/`

## Notes

- If the `setup` script fails, it's because `graphiql` hasn't been built.
- Thanks to @orta being super clever, if you run this from a host other than localhost (i.e. remotely or by changing your /etc/hosts file) it will load the remote swapi graphql instead of the local server (the old graphcool one for now)
