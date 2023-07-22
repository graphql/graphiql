<!--
Say Hello World with Vue!
-->

<script setup>
import { ref } from 'vue';
const query = gql`
  query {
    hello
  }
`;

const message = ref('Hello World!');
</script>

<template>
  <h1>{{ message }}</h1>
</template>
