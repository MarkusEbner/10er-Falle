<template>
  <v-container>
    <h1>Join Session {{ sessionId }} </h1>
    <p> </p>
    <v-text-field v-model="name" label="Dein Name"></v-text-field>
    <v-btn @click="joinSession">Session beitreten</v-btn>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const sessionId = route.params.sessionId

const name = ref('');

const joinSession = () => {
  if (name.value) {
    alert(`Willkommen, ${name.value}!`);
  } else {
    alert('Bitte gib einen Namen ein.');
  }
};
</script>
