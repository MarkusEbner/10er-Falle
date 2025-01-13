<template>
    <v-container>
      <h2>10er Falle - Runde gestartet!</h2>
      <v-btn @click="rollDice" color="primary" class="mt-4">
        Würfeln!
      </v-btn>
      <p v-if="currentRoll">Du hast eine {{ currentRoll }} gewürfelt!</p>
  
      <v-divider class="mt-4"></v-divider>
      <Scoreboard :sessionId="sessionId" />
    </v-container>
  </template>
  
  <script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import supabase from '../supabase';
  
  // Lokale Daten
  const players = ref<{ id: string; name: string; score: number }[]>([]);
  const currentRoll = ref<number | null>(null);
  // const hasRolled = ref(false);
  
  const route = useRoute();
  const sessionId = route.params.sessionId as string;
  const playerId = route.params.playerId;
  
  // Würfeln
  // TODO subcription to update all other players
  // Oder einfach scoreboard wie PlayerList.vue auslaugern!
  const rollDice = async () => {
    //if (hasRolled.value) return;
  
    const roll = Math.floor(Math.random() * 6) + 1; // Würfeln
    currentRoll.value = roll;
    // hasRolled.value = true;
  
    // Würfelergebnis speichern
    const { error } = await supabase
      .from('players')
      .update({ score: roll })
      .eq('id', playerId);
  
    if (error) {
      console.error('Fehler beim Speichern des Würfelergebnisses:', error);
    } else {
      // Spieler-Liste aktualisieren
      await loadPlayers();
    }
  };
  
  // Spieler-Liste laden
  const loadPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('id, name, score')
      .eq('session_id', sessionId);
  
    if (!error && data) {

      players.value = data.map((p) => ({ ...p, score: p.score || 0 }));
    }
  };
  
  // Initialisierung
  onMounted(async () => {
    await loadPlayers();
  });

  </script>
  