<template>
    <div>
      <h2>Scoreboard:</h2>
      <v-list v-if="players.length > 0">
        <v-list-item v-for="player in players" :key="player.id">
            <v-list-item-title>{{ player.name }}</v-list-item-title>
            <v-list-item-subtitle>Punkte: {{ player.score }}</v-list-item-subtitle>
        </v-list-item>
        
      </v-list>
    </div>
  </template>
  
  <script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import supabase from '../supabase';

export interface Player {
  id: string;
  name: string;
  score: number;
}

const props = defineProps<{ sessionId: string }>();

const players = ref<Player[]>([]);

// Funktion zum Abrufen der Spieler
const fetchPlayers = async () => {
  const { data, error } = await supabase
    .from('players')
    .select('id, name, score')
    .eq('session_id', props.sessionId);
  if (error) {
    console.error('Error fetching players:', error);
  } else {
    players.value = data as Player[];
  }
};

// Spieler beim Mounten laden
onMounted(
    fetchPlayers
);

// Aktualisieren, wenn sich sessionId ändert
watch(() => props.sessionId, fetchPlayers);
watch(() => players.value, fetchPlayers);
</script>

  