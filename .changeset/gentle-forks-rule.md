---
'codemirror-graphql': major
---

BREAKING: Change the implementation of the info popup when hovering items in the code editor:
- For fields the type prefix was removed, i.e. `MyType.myField` -> `myField`
- For args, the type and field was removed, i.e. `MyType.myField(myArg: MyArgType)` -> `myArg: MyArgType`
- The DOM structure of the info tooltip changed to enable more flexible styling:
  - The first section (i.e. the clickable parts like type and field name) are wrapped in an additional div
  - The markdown content for deprecation reasons is wrapped in an additional div
