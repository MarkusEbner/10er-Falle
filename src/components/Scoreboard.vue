<template>
  <div>
    <v-card>
      <div v-if="sessionData">
        <p v-if="sessionData?.game_over">Das Spiel ist beendet! {{ players.find((player) => player.id === sessionData?.current_player_id)?.name }} hat verloren!</p>
      </div>
    </v-card>

    <v-card>
      <v-card-title>Du bist Spieler {{ playerName }} 
        <v-icon icon="mdi-face-man"/> 
      </v-card-title>
      <v-card-title>Würfel
        <v-icon icon="mdi-dice-6"/>    
      </v-card-title>
      <v-btn @click="rollLebenswürfel"> Lebenswürfel </v-btn>
      <v-btn @click="rollSpielwürfel" color="primary" :disabled="!yourTurn">
        Spielwürfel würfeln {{ sessionData?.last_roll }}
        <v-icon :icon="getDiceIcon(sessionData?.last_roll)" class="ml-2"/>
      </v-btn>
      <v-divider/>
      <v-card-title>Scoreboard für Lebenswürfel:</v-card-title>
      <v-list v-if="players.length > 0">
      <v-card-subtitle v-if="currentPlayer">Aktueller Spieler: {{ currentPlayer.name }}</v-card-subtitle >
      <v-list-item v-for="player in players" :key="player.id" :class="{ 'current-player': player.id === currentPlayer?.id }">
        
        <v-list-item-title>{{ player.name }}</v-list-item-title>
        <v-list-item-subtitle>Leben: {{ player.score }}
          <v-icon :icon="getDiceIcon(player.score)" class="ml-2"/>
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
    <v-card-title>Spielstand: {{ sessionData?.current_score }}</v-card-title>
    <v-btn @click="reset">Spiel zurücksetzen</v-btn>
    <v-btn v-if="yourTurn" @click="hochdrehen(false)">Hochdrehen</v-btn>
  </v-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute } from 'vue-router';
import supabase from '../supabase';

export interface Player {
  id: number;
  name: string;
  score: number;
}

export interface SessionData {
  current_score: number;
  last_roll: number;
  game_over: boolean;
  current_player_id: number;
  player_order: number[];
}

const props = defineProps<{ sessionId: string }>();

const route = useRoute();
const playerId = ref(Number(route.params.playerId));
const players = ref<Player[]>([]);
const currentPlayer = ref<Player>();
const currentPlayerIndex = ref<number>(0);
const sessionData = ref<SessionData | null>(null);
const yourTurn = ref<boolean>(false);

const playerName = computed (() => players.value.find(player => player.id === playerId.value)?.name);


let playersSubscription: any;
let sessionSubscription: any;

 const rollLebenswürfel = async () => {
  const diceRolls: { playerId: number, roll: number, name: string }[] = [];
  for (const player of players.value) {
    const roll = Math.floor(Math.random() * 6) + 1;
    diceRolls.push({ playerId: player.id, roll, name: player.name });
    player.score = roll; // Speichern des Wurfs
  }
 

   // Update alle Würfe in der DB
   const { error } = await supabase
    .from('players')
    .upsert(diceRolls.map(dice => ({ id: dice.playerId, name:dice.name, session_id:props.sessionId, score: dice.roll })));

  if (error) {
    console.error('Fehler beim Aktualisieren der Würfe:', error);
    return;
  }

   // Bestimme den Spieler mit dem höchsten Wurf
  players.value = players.value.sort((a, b) => b.score! - a.score!); // Sortiere die Spieler nach dem Wurf (absteigend)
   console.log('Spieler nach Wurf:', players.value);
   currentPlayer.value = players.value[0]
   currentPlayerIndex.value = 0;
   console.log('currentPlayer:', currentPlayer.value);
  // Setze den aktuellen Spieler in der Session und ändere die order
  const { error: sessionError } = await supabase
    .from('sessions')
    .update({ current_player_id: players.value[0].id, current_score: players.value[0].score, player_order: players.value.map(player => player.id) })
    .eq('id', props.sessionId);
    
  if (sessionError) {
    console.error('Fehler beim Setzen des aktuellen Spielers:', sessionError);
    return;
  }
} 

const rollSpielwürfel = async () => {
  if(!sessionData.value) {
    console.error('SessionData not loaded');
    return;
  }
  if (sessionData.value.game_over) {
    console.error('Das Spiel ist bereits beendet');
    return;
  }
  if(!currentPlayer.value) {
    console.error('Current player not loaded');
    return;
  }
  const aktuellerWurf = Math.floor(Math.random() * 6) + 1;
  const allgemeinerSpielstand = sessionData.value.current_score + aktuellerWurf
  console.log(`Aktueller Wurf: ${aktuellerWurf}. Neuer Spielstand: ${allgemeinerSpielstand}`);
  if (allgemeinerSpielstand >= 16) {
    // TODO Dialog aufplopppen, dass Spiel beendet ist, allgemeiner Score und letzten Wurf anzeigen
    // Reset button anzeigen
    await gameOverAlert();
    return
  } else if (allgemeinerSpielstand === 15){
    // TODO dieser fall muss hochdrehen für den nächsten Spieler erzwingen
    await hochdrehen(true);
    return
  }
 
  const { error } = await supabase
    .from('sessions')
    .update({ current_score: allgemeinerSpielstand, last_roll: aktuellerWurf })
    .eq('id', props.sessionId);
  if (error) {
    console.error('Fehler beim Aktualisieren des Spielstands:', error);
  }
  await switchToNextPlayer()
  
}

const gameOverAlert = async () => {
    const { error } = await supabase
      .from('sessions')
      .update({ game_over: true })
      .eq('id', props.sessionId);
      // display loser and reset button
    if (error) {
      console.error('Fehler beim Beenden des Spiels:', error);
    } else {
      console.log('Das Spiel ist beendet');
    }
}

const reset = async () => {
  // Reset the game
  const { error } = await supabase
    .from('sessions')
    .update({ current_score: 0, game_over: false })
    .eq('id', props.sessionId);
  if (error) {
    console.error('Failed to reset game:', error);
    return
  }
};


// todo muss im allgemeinen spiel auch möglich sein 
// muss bei 15 einforced werden
const hochdrehen = async (erzwungen: boolean) => {
  if(!currentPlayer.value) {
    console.error('Current player not loaded');
    return;
  }
  if (erzwungen) {
    await switchToNextPlayer()
    currentPlayer.value = players.value[currentPlayerIndex.value]
  }
  currentPlayer.value.score = currentPlayer.value.score + 1 

    if (currentPlayer.value.score > 6) {
      await gameOverAlert();
    }
    const { error } = await supabase
    .from('players')
    .update({ score: currentPlayer.value.score })
    .eq('id', currentPlayer.value.id);
    if (error) {
      console.error('Fehler beim Leben hochdrehen:', error);
      return;
    } else {
      // todo move to edge case 15
      const { error: sessionError } = await supabase
      .from('sessions')
      .update({ current_player_id: currentPlayer.value.id, current_score: currentPlayer.value.score })
      .eq('id', props.sessionId);
    
      if (sessionError) {
        console.error('Fehler beim Setzen des aktuellen Spielers:', sessionError);
        return;
      }
      console.log(`Spieler ${currentPlayer.value.name} hat hochgedreht. Er darf nochmal den Spielwürfel würfeln!`);
    }
}

// Funktion zum Wechseln des aktuellen Spielers
const switchToNextPlayer = async () => {
  if(!sessionData.value) {
    return;
  }
  console.log('player',players.value)
  console.log('players order in session', sessionData.value.player_order)
  currentPlayerIndex.value = sessionData.value.player_order.indexOf(sessionData.value.current_player_id);
  const nextPlayerIndex = (currentPlayerIndex.value + 1) % sessionData.value.player_order.length;
  const nextPlayerId = sessionData.value.player_order[nextPlayerIndex];
  // currentPlayer.value = sessionData.value.player_order[nextPlayerIndex].;
  yourTurn.value = !yourTurn.value;

  const { error } = await supabase
    .from('sessions')
    .update({ current_player_id: nextPlayerId })
    .eq('id', props.sessionId);

  if (error) {
    console.error('Fehler beim Aktualisieren des aktuellen Spielers:', error);
  } else {
    currentPlayerIndex.value = nextPlayerIndex;
  }
};

const getDiceIcon = (score: number | undefined): string => {
  if(!score) {
    return 'mdi-dice-d10';
  }
  const diceIcons: { [key: number]: string } = {
    1: 'mdi-dice-1',
    2: 'mdi-dice-2',
    3: 'mdi-dice-3',
    4: 'mdi-dice-4',
    5: 'mdi-dice-5',
    6: 'mdi-dice-6',
  };
  return diceIcons[score] || 'mdi-dice-6';
};

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
    const playerOrder = players.value.map(player => player.id);
    await supabase
      .from('sessions')
      .update({ player_order: playerOrder })
      .eq('id', props.sessionId);
  }
};

// Funktion zum Abrufen der Session-Daten
const fetchSessionData = async () => {
  const { data, error } = await supabase
    .from('sessions')
    .select('current_score, game_over, current_player_id, player_order')
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
          currentPlayer.value = players.value.find((player) => player.id === payload.new.current_player_id);
          console.log('deine id:', playerId.value);
          if(currentPlayer.value && currentPlayer.value.id === playerId.value) {
            yourTurn.value = true;
          } else {
            yourTurn.value = false;
          }
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

<style scoped>
.current-player {
  background-color: red; /* Change this to your desired color */
  font-weight: bold;
}
</style>
