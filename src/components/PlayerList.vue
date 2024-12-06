<template>
    <div>
      <h2>Aktuelle Spieler:</h2>
      <v-list v-if="players.length > 0">
        <v-list-item v-for="player in players" :key="player.id">
          {{ player.name }}
        </v-list-item>
      </v-list>
      <p v-else>Es ist noch keiner gejoint du Moff</p>
    </div>
  </template>
  
  <script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import supabase from '../supabase';

export interface Player {
  id: string;
  name: string;
}

const props = defineProps<{ sessionId: string }>();

const players = ref<Player[]>([]);

// Funktion zum Abrufen der Spieler
const fetchPlayers = async () => {
  const { data, error } = await supabase
    .from('players')
    .select('id, name')
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

  