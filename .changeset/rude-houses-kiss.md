---
'graphiql': major
---

BREAKING: The `GraphiQL` component has been refactored to be a function component. Attaching a ref to this component will no longer provide access to props, state or class methods. In order to interact with or change `GraphiQL` state you need to use the contexts and hooks provided by the `@graphiql/react` package. More details and examples can be found in the migration guide.
