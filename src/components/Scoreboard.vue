<template>
  <div>
    <v-card>
      <div v-if="sessionData">
      <p>Aktueller Punktestand: {{ sessionData.current_score }}</p>
      <p v-if="sessionData.game_over">Das Spiel ist beendet!</p>
    </div>
    </v-card>

    <v-card>
      <h2>Scoreboard für Lebenswürfel:</h2>
    <v-list v-if="players.length > 0">
      <v-list-item v-for="player in players" :key="player.id">
        <v-list-item-title>{{ player.name }}</v-list-item-title>
        <v-list-item-subtitle>Leben: {{ player.score }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-card>
  
    
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import supabase from '../supabase';

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface SessionData {
  current_score: number;
  game_over: boolean;
}

const props = defineProps<{ sessionId: string }>();

const players = ref<Player[]>([]);
const sessionData = ref<SessionData | null>(null);

let playersSubscription: any;
let sessionSubscription: any;

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

// Funktion zum Abrufen der Session-Daten
const fetchSessionData = async () => {
  const { data, error } = await supabase
    .from('sessions')
    .select('current_score, game_over')
    .eq('id', props.sessionId)
    .single();
  if (error) {
    console.error('Error fetching session data:', error);
  } else {
    sessionData.value = data as SessionData;
  }
};

// Realtime-Subscription einrichten
const setupSubscriptions = () => {
  // Spieler-Änderungen überwachen
  playersSubscription = supabase
    .channel(`players:${props.sessionId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `session_id=eq.${props.sessionId}` },
      (payload) => {
        console.log('Players change:', payload);
        fetchPlayers(); // Spieler erneut laden
      }
    )
    .subscribe();

  // Session-Änderungen überwachen
  sessionSubscription = supabase
    .channel(`sessions:${props.sessionId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${props.sessionId}` },
      (payload) => {
        console.log('Session change:', payload);
        if (payload.new) {
          sessionData.value = payload.new as SessionData;
        }
      }
    )
    .subscribe();
};

// Abonnements beenden
const cleanupSubscriptions = () => {
  if (playersSubscription) {
    supabase.removeChannel(playersSubscription);
  }
  if (sessionSubscription) {
    supabase.removeChannel(sessionSubscription);
  }
};

// Daten beim Mounten laden und Subscriptions einrichten
onMounted(async () => {
  await fetchPlayers();
  await fetchSessionData();
  setupSubscriptions();
});

// Cleanup bei Komponentendemontage
onBeforeUnmount(() => {
  cleanupSubscriptions();
});
</script>
