# TODO: get tags inside of other code blocks working

```js
const variable = 1;

const query = graphql`
  query {
    something(arg: ${variable})
  }
`;
const Component = () => {
  return <div>{query}</div>;
};
```

```ts
const variable: number = 1;

graphql`
    query {
        something(variable: ${variable})
    }
`;
const Component = () => {
  return <div> </div>;
};
```

### svelte

```svelte
<script>
    const query = gql`
    query {
        hello
    }
    `;
	let name = 'world';
    const query = ``
</script>

<h1>Hello {name}!</h1>
```

## vue

```vue
<script>
const query = gql`
  query {
    hello
  }
`;
export default {
  data() {
    return {
      message: 'Hello World!',
    };
  },
};
</script>

<template>
  <h1>{{ message }}</h1>
</template>
```
