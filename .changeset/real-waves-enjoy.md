---
'graphiql': major
---

BREAKING: The following static properties of the `GraphiQL` component have been removed:
- `GraphiQL.Button`: You can use the `ToolbarButton` component from `@graphiql/react` instead.
- `GraphiQL.ToolbarButton`: This exposed the same component as `GraphiQL.Button`.
- `GraphiQL.Menu`: You can use the `ToolbarMenu` component from `@graphiql/react` instead.
- `GraphiQL.MenuItem`: You can use the `ToolbarMenu.Item` component from `@graphiql/react` instead.
- `GraphiQL.Group`: Grouping multiple buttons side-by-side is not provided out-of-the box anymore in the new GraphiQL UI. If you want to implement a similar feature in the new vertical toolbar you can do so by adding your own styles for your custom toolbar elements. Example:
  ```jsx
  import { GraphiQL } from "graphiql";
  function CustomGraphiQL() {
    return (
      <GraphiQL>
        <GraphiQL.Toolbar>
          {/* Add custom styles for your buttons using the given class */}
          <div className="button-group">
            <button>1</button>
            <button>2</button>
            <button>3</button>
          </div>
        </GraphiQL.Toolbar>
      </GraphiQL>
    );
  }
  ```
