<template>
  <v-container>
    <v-text-field
      v-model="creatorName"
      label="Dein Name"
      :error-messages="creatorNameError"
      @input="creatorNameTouched = true"
      required
    />
    <v-btn @click="openSession" :disabled="!isCreatorNameValid"
      >Neue 10er Falle Session eröffnen</v-btn
    >
    <v-divider />
    <v-text-field
      v-if="showLink"
      v-model="sessionLink"
      label="Session-Link"
      readonly
      appendInnerIcon="mdi-content-copy"
      @click:append-inner="copyToClipboard"
    >
    </v-text-field>
    <PlayerList :sessionId="sessionId" class="mt-4" />
    <v-btn v-if="sessionId" @click="startGame" color="success">
      Start Game
    </v-btn>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import supabase from '../supabase'; // Import Supabase client

// TODO maybe reset these when user leaves the page because of caching issues (e.g. when user goes back to the menu player list could be empty)
const creatorName = ref('');
const sessionLink = ref('');
const playerId = ref<number | null>(null); // Ref für die playerId
const showLink = ref<boolean>(false);
const sessionId = ref('');
const creatorNameTouched = ref(false);

const creatorNameError = computed(() => {
  if (!creatorNameTouched.value) {
    return null; // Noch keine Fehlermeldung anzeigen
  }
  if (!creatorName.value.trim()) {
    return 'Name darf nicht leer sein.';
  }
  return null;
});

const isCreatorNameValid = computed(() => {
  return creatorNameTouched.value && !creatorNameError.value;
});

const openSession = async () => {
  if (!isCreatorNameValid.value) {
    return; // Beenden, falls ungültig
  }
  // Generate a random session ID and set it immediately
  const newSessionId = Math.random().toString(36).substr(2, 8);
  sessionId.value = newSessionId;

  // Insert the session into the 'sessions' table
  const { error: sessionError } = await supabase
    .from('sessions')
    .insert([{ id: newSessionId, creator: creatorName.value }]);

  if (sessionError) {
    console.error('Fehler beim Erstellen der Session:', sessionError);
    return;
  }

  // Insert the creator as a player in the 'players' table
  const { data: playerData, error: playerError } = await supabase
    .from('players')
    .insert([{ name: creatorName.value, session_id: newSessionId }])
    .select('id');

  if (playerError) {
    console.error('Fehler beim Hinzufügen des Spielers:', playerError);
    return;
  }

  if (playerData && playerData.length > 0) {
    playerId.value = playerData[0].id;
    showLink.value = true;
    sessionLink.value = `https://10er-falle.vercel.app/join/${newSessionId}`;
  }
};

const startGame = async () => {
  // Notify all players to roll a number
  const { error } = await supabase
    .from('sessions')
    .update({ game_started: true })
    .eq('id', sessionId.value);
  if (!error) {
    window.location.href = `/game/${sessionId.value}/${playerId.value}`;
  }
  console.log('Game started!');
};

const copyToClipboard = () => {
  navigator.clipboard
    .writeText(sessionLink.value)
    .then(() => {
      console.log('Session link copied to clipboard');
    })
    .catch((err) => {
      console.error('Failed to copy session link: ', err);
    });
};

onMounted(() => {
  creatorName.value = '';
  sessionLink.value = '';
  playerId.value = null;
  showLink.value = false;
  sessionId.value = '';
});
</script>
