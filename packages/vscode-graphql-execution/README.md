## `graphql.vscode-graphql-execution`

This extension provides standalone support for executing graphql operations inline in your code for:

- .ts/.tsx
- .js/.jsx
- .graphql, .gql or .graphqls files

## How it works

1. A codelens will appear above all operations - clicking will begin executing the operation.
2. (If variables are specified in the operation), a dialog will prompt for these variables
3. Then, the results or network error should appear, voila!
4. If no endpoints are configured, it will exit early and tell you to define them.

## Configuring the extension

### `graphql-config`

Your graphql config file will need to contain either a schema-as-url OR an endpoints configuration. Either of the following are valid:

```yaml
schema: https://localhost:3000/graphql
```

```yaml
schema: schema.graphql
extensions:
  endpoints:
    default:
      url: 'https://localhost:3000/graphql'
```

```yaml
projects:
  app:
    schema: schema.graphql
    extensions:
      endpoints:
        default:
          url: 'https://localhost:3000/graphql'
```

### Disable codelens

To disable the codelens, please specify this setting in `settings.json` or `user.json`:

```json
{
  ...
 "vscode-graphql-execution.showExecCodelens": false
}
```

### Self Signed Certificates

Enable this (`false` by default) to allow node to use non-authorized SSL certificates.

```json
{
  "vscode-graphql-execution.rejectUnauthorized": true
}
```
