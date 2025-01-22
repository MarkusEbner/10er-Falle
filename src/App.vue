<template>
  <v-app>
    <v-main>
      <router-view />
      <SpeedInsights />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  import { SpeedInsights } from '@vercel/speed-insights/vue';
</script>
