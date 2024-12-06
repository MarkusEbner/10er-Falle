<template>
  <v-container>
    <v-text-field v-model="creatorName" label="Dein Name"></v-text-field>
    <v-btn @click="openSession">Neue 10er Falle Session eröffnen</v-btn>
    <v-divider/>
    <v-text-field v-if="showLink" v-model="sessionLink" label="Session-Link" readonly></v-text-field>
    <PlayerList :sessionId="sessionId" class="mt-4"/>
    <v-btn v-if="sessionId" @click="startGame" color="success">
      Start Game
    </v-btn>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import supabase from '../supabase'; // Import Supabase client

const creatorName = ref('')
const sessionLink = ref('');
const showLink = ref<boolean>(false)
const sessionId = ref('')

const openSession = async () => {
   sessionId.value = Math.random().toString(36).substr(2, 8); // Generiere eine zufällige Session ID
    const { error } = await supabase
    .from('sessions')
    .insert([{ id: sessionId.value, creator: creatorName.value }]); // Setze 'CreatorName' auf den tatsächlichen Namen des Erstellers

  if (error) {
    console.error('Fehler beim Erstellen der Session:', error);
  } else {
       // Füge den Spieler zur 'players'-Tabelle hinzu und setze die session_id
       const { error: playerError } = await supabase
      .from('players')
      .insert([{ name: creatorName.value, session_id: sessionId.value }]); // Setze den Spieler in die 'players'-Tabelle mit der session_id

    if (playerError) {
      console.error('Fehler beim Hinzufügen des Spielers:', playerError);
    } else {
      // Zeige den generierten Link an, nachdem die Session und der Spieler gespeichert wurden
      showLink.value = true;
      sessionLink.value = `https://10er-falle.vercel.app/join/${sessionId.value}`;
    }
  }
};

const startGame = async () => {
  // Notify all players to roll a number
  await supabase
    .from('sessions')
    .update({ game_started: true })
    .eq('id', sessionId.value);

  console.log('Game started!');
};

</script>
