<template>
  <v-container>
    <v-btn @click="startGame">Neue 10er Falle Session starten</v-btn>
    <v-divider/>
    <v-text-field v-model="sessionLink" label="Session-Link" readonly></v-text-field>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const sessionLink = ref('');
const startGame = () => {
  sessionLink.value = `https://10er-falle.vercel.app/join/${Math.random()
    .toString(36)
    .substr(2, 8)}`;
};
</script>
