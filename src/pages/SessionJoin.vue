<template>
  <v-container>
    <h1>Join Session {{ sessionId }}</h1>

    <!-- Input for player name -->
    <v-text-field 
      v-model="playerName" 
      label="Dein Name" 
      outlined 
      dense 
      required
      :error-messages="playerNameError"
      @blur="validatePlayerName"
    />

    <!-- Join session button -->
    <v-btn 
      @click="joinSession" 
      :disabled="!isPlayerNameValid || isPlayerJoined" 
      color="primary"
    >
      Join Session
    </v-btn>

    <v-divider class="mt-4" />
      
    <PlayerList :sessionId="sessionId" />
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import supabase from '../supabase'; // Import Supabase client

// Define Player type
interface Player {
  id: number;
  name: string;
}

const route = useRoute();
const sessionId = route.params.sessionId as string; // sessionId is now a string

// Initialize state variables
const players = ref<Player[]>([]);
const playerName = ref('');
const playerId = ref<number | null>(null);
const playerNameError = ref<string | null>(null); // For validation error messages
const isPlayerNameValid = ref(false); // Tracks if the name is valid

// Computed property to check if the player has already joined
const isPlayerJoined = computed(() => {
  return players.value.some(player => player.name === playerName.value.trim());
});

// Validate player name
const validatePlayerName = () => {
  if (!playerName.value.trim()) {
    playerNameError.value = 'Name darf nicht leer sein.';
    isPlayerNameValid.value = false;
  } else {
    playerNameError.value = null;
    isPlayerNameValid.value = true;
  }
};

onMounted(() => {
  const channel = supabase
    .channel('public:game_sessions') // Kanalname
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
      (payload) => {
        if (payload.new.game_started) {
          // Weiterleitung zur Spielseite
          window.location.href = `/game/${sessionId}/${playerId.value}`;
          console.log('Game started!');
        }
      }
    )
    .subscribe();

  onUnmounted(() => {
    supabase.removeChannel(channel); // Abonnement aufräumen, wenn Komponente entfernt wird
  });
});

const joinSession = async () => {
  validatePlayerName(); // Validate before joining
  if (isPlayerNameValid.value && !isPlayerJoined.value) {
    // Spieler in der Tabelle "players" hinzufügen und die ID zurückgeben
    const { data, error } = await supabase
      .from('players')
      .insert([{ name: playerName.value.trim(), session_id: sessionId }])
      .select('id'); // Die ID des eingefügten Spielers zurückgeben

    if (error) {
      console.error('Error joining session:', error);
    } else if (data && data.length > 0) {
      // Spieler-ID speichern
      playerId.value = data[0].id;
      console.log('Joined session with playerId:', playerId.value);

      // Abrufen der aktuellen Spieler aus der Datenbank
      const { data: playersData, error: fetchError } = await supabase
        .from('players')
        .select('id, name')
        .eq('session_id', sessionId);

      if (fetchError) {
        console.error('Error fetching players:', fetchError);
      } else {
        // Spieler zur Liste hinzufügen
        players.value = playersData as Player[];
      }
    }
  }
};
</script>
