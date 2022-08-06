---
'@graphiql/react': minor
---

BREAKING: The `ExecutionContextProvider` and `QueryEditor` components no longer accept the `externalFragments` prop. Instead the prop can now be passed to the `EditorContextProvider` component. The provider component will normalize the prop value and provide a map of type `Map<string, FragmentDefinitionNode>` (using the fragment names as keys) as part of the value of the `EditorContext`.
