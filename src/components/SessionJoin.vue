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

    <v-divider class="mt-4"/>
      
        <PlayerList :sessionId="sessionId" />
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import supabase from '../supabase'; // Import Supabase client

// Define Player type
interface Player {
  id: number;
  name: string;
}

const route = useRoute();
const sessionId = route.params.sessionId; // sessionId is now a string

// Initialize players ref with the Player type
const players = ref<Player[]>([]); // Specify the type here
const playerName = ref('');
const isPlayerJoined = computed(() => {
  return players.value.some(player => player.name === playerName.value);
});

// Check if the current user is the creator
// const isCreator = computed(() => sessionData.value.creator === playerName.value);

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
        players.value = data as Player[]; // Cast data to Player[] to ensure type safety
      }
    }
  }
};

</script>
