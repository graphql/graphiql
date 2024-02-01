---
'@graphiql/react': patch
---

Add new `useOptimisticState` hook that can wrap a useState-like hook to perform optimistic caching of state changes, this helps to avoid losing characters when the user is typing rapidly. Example of usage: `const [state, setState] = useOptimisticState(useOperationsEditorState());`
