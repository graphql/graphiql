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
