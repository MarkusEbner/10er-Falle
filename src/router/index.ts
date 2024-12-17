/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router/auto'
import GameMenu from '../pages/GameMenu.vue'
import SessionJoin from '../pages/SessionJoin.vue';
import Game from '../pages/Game.vue';

const routes = [
  { path: '/', name: 'GameMenu', component: GameMenu },
  { path: '/join/:sessionId', name: 'SessionJoin', component: SessionJoin },
  { path: '/game/:sessionId', name: 'Game', component: Game },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('vuetify:dynamic-reload')) {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
