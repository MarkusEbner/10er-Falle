<template>
  <v-container>
    <v-text-field v-model="name" label="Dein Name"></v-text-field>
    <v-btn @click="joinSession">Session beitreten</v-btn>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const name = ref('');
const joinSession = () => {
  if (name.value) {
    alert(`Willkommen, ${name.value}!`);
  } else {
    alert('Bitte gib einen Namen ein.');
  }
};
</script>
