<template>
  <v-container>
    <h2>10er Falle - Runde gestartet!</h2>
    <p v-if="currentPlayer">Aktueller Spieler: {{ currentPlayer.name }}</p>
    <v-btn @click="rollGameDice" color="primary" class="mt-4" >
      Spielwürfel würfeln!
    </v-btn>
    <p v-if="currentRoll">Du hast eine {{ currentRoll }} gewürfelt!</p>
    <v-divider class="mt-4"></v-divider>
    <Scoreboard :sessionId="sessionId" />
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import supabase from '../supabase';
// import PlayerList from './PlayerList.vue';

const route = useRoute();
const sessionId = route.params.sessionId as string;
const playerId = route.params.playerId as string;

// Lokale State-Daten
const players = ref<{ id: string; name: string; score: number }[]>([]);
const currentRoll = ref<number | null>(null);
const currentSum = ref<number>(0);
const currentPlayerIndex = ref<number>(0);

// Computed: Aktueller Spieler
const currentPlayer = computed(() => players.value[currentPlayerIndex.value]);
const isCurrentPlayer = computed(() => currentPlayer.value?.id === playerId);

// Spieler-Liste laden
const loadPlayers = async () => {
  const { data, error } = await supabase
    .from('players')
    .select('id, name, score')
    .eq('session_id', sessionId);

  if (!error && data) {
    players.value = data;
  } else {
    console.error('Fehler beim Laden der Spieler:', error);
  }
};

const rollGameDice = async () => {
  const roll = Math.floor(Math.random() * 6) + 1; // Generate a random number between 1 and 6
  currentRoll.value = roll;

  const newSum = currentSum.value + roll;

  console.log(`Player ${currentPlayer.value.name} rolled a ${roll}. New score: ${newSum}`);

  // Update the session's current_score in the database
  const { error: sessionError } = await supabase
    .from('sessions')
    .update({ current_score: newSum })
    .eq('id', sessionId);

  if (sessionError) {
    console.error('Failed to update session score:', sessionError);
  } else {
    console.log(`Session current_score updated to ${newSum}`);
  }

  if (newSum >= 16) {
    // Player loses
    alert(`${currentPlayer.value.name} has lost!`);
    currentSum.value = 0; // Reset the local score
    nextRound();
  } else if (newSum === 15) {
    // Update the lifeDice of the next player
    const nextPlayer = players.value[(currentPlayerIndex.value + 1) % players.value.length];
    const { error: lifeDiceError } = await supabase
      .from('players')
      .update({ score: nextPlayer.score + 1 })
      .eq('id', nextPlayer.id);

    if (!lifeDiceError) {
      alert(`${nextPlayer.name} turns their lifeDice to ${nextPlayer.score + 1}.`);
      currentSum.value = 0; // Reset the local score
      currentPlayerIndex.value = players.value.indexOf(nextPlayer); // Move to the next player
    } else {
      console.error('Failed to update lifeDice for next player:', lifeDiceError);
    }
  } else {
    currentSum.value = newSum; // Update the local score
    currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.value.length; // Move to the next player
  }
};


// Nächste Runde starten
const nextRound = () => {
  currentPlayerIndex.value = players.value.findIndex(
    (player) => player.score === Math.min(...players.value.map((p) => p.score))
  );
};

// Subscription einrichten
let playersSubscription: any;
const setupSubscription = () => {
  playersSubscription = supabase
    .channel(`players:${sessionId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `session_id=eq.${sessionId}` },
      (payload) => {
        if (payload.eventType === 'UPDATE') {
          loadPlayers(); // Spieler neu laden bei Update
        }
      }
    )
    .subscribe();
};

// Abonnement aufräumen
onBeforeUnmount(() => {
  supabase.removeChannel(playersSubscription);
});

// Initialisierung
onMounted(async () => {
  await loadPlayers();
  setupSubscription();
});
</script>
