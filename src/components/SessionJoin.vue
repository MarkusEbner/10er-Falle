<template>
  <v-container>
    <h1>Join Session {{ sessionId }}</h1>

    <!-- Input for player name -->
    <v-text-field 
      v-model="playerName" 
      label="Enter your name" 
      outlined 
      dense
    />

    <!-- Join session button -->
    <v-btn @click="joinSession" :disabled="isPlayerJoined" color="primary">
      Join Session
    </v-btn>

    <!-- Show start game button only if the user is the creator -->
    <v-btn v-if="isCreator" @click="startGame" color="success">
      Start Game
    </v-btn>
    <v-divider class="mt-4"/>
       <!-- Display list of players -->
       <template v-if="players.length > 0">
      <h2 class="mt-4">Aktuelle Spieler:</h2>
      <v-list>
        <v-list-item v-for="player in players" :key="player.id">
              {{ player.name }}
            </v-list-item>
      </v-list>
    </template>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import supabase from '../supabase'; // Import Supabase client

const route = useRoute();
const sessionId = route.params.sessionId; // sessionId is now a string

const players = ref([]);
const playerName = ref('');
const isPlayerJoined = computed(() => {
  return players.value.some(player => player.name === playerName.value);
});

const sessionData = ref({
  creator: '',
  players: []
});

// Fetch players and session creator information when the component is mounted
onMounted(async () => {
  const { data, error } = await supabase
    .from('players')
    .select('id, name')
    .eq('session_id', sessionId);

  if (error) {
    console.error(error);
  } else {
    players.value = data;
  }

  const { data: sessionInfo, error: sessionError } = await supabase
    .from('sessions')
    .select('creator')
    .eq('id', sessionId)
    .single();

  if (sessionError) {
    console.error(sessionError);
  } else {
    sessionData.value.creator = sessionInfo.creator;
  }
});

// Check if the current user is the creator
const isCreator = computed(() => sessionData.value.creator === playerName.value);

const joinSession = async () => {
  if (playerName.value && !isPlayerJoined.value) {
    // Spieler in der Tabelle "players" hinzufügen
    const { error } = await supabase
      .from('players')
      .insert([{ name: playerName.value, session_id: sessionId }]);

    if (error) {
      console.error('Error joining session:', error);
    } else {
      // Abrufen der aktuellen Spieler aus der Datenbank
      const { data, error: fetchError } = await supabase
        .from('players')
        .select('id, name')
        .eq('session_id', sessionId);

      if (fetchError) {
        console.error('Error fetching players:', fetchError);
      } else {
        // Spieler zur Liste hinzufügen
        players.value = data;
      }
    }

    // Setze den Session Creator, wenn nicht bereits gesetzt
    if (!sessionData.value.creator) {
      const { error: creatorError } = await supabase
        .from('sessions')
        .update({ creator: playerName.value })
        .eq('id', sessionId);

      if (creatorError) {
        console.error('Error updating creator:', creatorError);
      } else {
        sessionData.value.creator = playerName.value;
      }
    }
  }
};



// Start the game (only for the creator)
const startGame = () => {
  if (isCreator.value) {
    alert('Game Started!');
    // You can add further logic here to move to a game screen or state
  }
};
</script>

<style scoped>
/* Optional: Add some basic styling */
button:disabled {
  background-color: grey;
}
</style>
