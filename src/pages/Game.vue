<template>
  <v-container>
    <h2>10er Falle - Runde gestartet!</h2>
    <Scoreboard :sessionId="sessionId" />
  </v-container>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';

const route = useRoute();
const sessionId = route.params.sessionId as string;

</script>
