<template>
  <div>
    <h2>Aktuelle Spieler:</h2>
    <v-list v-if="players.length > 0">
      <v-list-item v-for="player in players" :key="player.id">
        {{ player.name }}
      </v-list-item>
    </v-list>
    <p v-else>Es ist noch keiner da</p>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import supabase from '../supabase';

export interface Player {
  id: string;
  name: string;
}

const props = defineProps<{ sessionId: string }>();

const players = ref<Player[]>([]);
let subscription: any = null;

// Funktion zum Abrufen der Spieler
const fetchPlayers = async () => {
  if (!props.sessionId) return;

  const { data, error } = await supabase
    .from('players')
    .select('id, name, session_id')
    .eq('session_id', props.sessionId);

  if (error) {
    console.error('Error fetching players:', error);
  } else {
    players.value = data as Player[];
  }
};

// Funktion zum Abonnieren von Änderungen
const subscribeToPlayers = () => {
  if (subscription) {
    supabase.removeChannel(subscription); // Alte Subscription entfernen
  }

  subscription = supabase
    .channel('players-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `session_id=eq.${props.sessionId}`,
      },
      (payload) => {
        console.log('Change received:', payload);
        if (payload.eventType === 'INSERT') {
          players.value.push(payload.new as Player);
        } else if (payload.eventType === 'DELETE') {
          players.value = players.value.filter(
            (player) => player.id !== payload.old.id
          );
        } else if (payload.eventType === 'UPDATE') {
          const index = players.value.findIndex(
            (player) => player.id === payload.new.id
          );
          if (index !== -1) {
            players.value[index] = payload.new as Player;
          }
        }
      }
    )
    .subscribe();
};

// Setup Lifecycle Hooks
onMounted(() => {
  fetchPlayers();
  subscribeToPlayers();
});

watch(
  () => props.sessionId,
  async () => {
    await fetchPlayers();
    subscribeToPlayers(); // Neue Subscription, wenn sich sessionId ändert
  }
);

onUnmounted(() => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
});
</script>
