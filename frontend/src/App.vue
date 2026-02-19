<template>
  <div class="app-container" :class="{ 'has-sidebar': showNav }">
    <router-view />
    <BottomNav v-if="showNav" />
    <!-- Sistema de Notificacions Toast -->
    <ToastContainer />
    <!-- Modal de llamadas -->
    <CallModal />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from './store/auth';
import { useMatchesStore } from './store/matches';
import { useCallStore } from './store/call'; // Import the call store
import { useSocket } from './composables/useSocket';
import type { Match, User } from '@/types'; // Import User type for call payload
import BottomNav from './components/BottomNav.vue';
import ToastContainer from './components/ToastContainer.vue';
import CallModal from './components/CallModal.vue'; // Import CallModal

const route = useRoute();
const authStore = useAuthStore();
const matchesStore = useMatchesStore();
const callStore = useCallStore(); // Initialize call store
const { connect, disconnect, socket } = useSocket();

onMounted(() => {
  authStore.init();
});

// Gestionar connexió WebSocket quan l'usuari s'autentica
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth && authStore.token) {
      // Connectar WebSocket amb el token JWT
      connect(authStore.token);

      if (socket.value) {
        // --- Match Listeners ---
        socket.value.on('match:nuevo', (data: { match: Match }) => {
          console.log('Nou match rebut via WebSocket:', data);
          if (data && data.match) {
            // Normalize the ID, just like in the store's fetchMatches action and ChatsView
            const processedMatch = {
              ...data.match,
              id: (data.match._id || data.match.id || '') as string // Prefer _id if available, then id
            };
            if (processedMatch.id) { // This check remains valid for non-empty string IDs
              matchesStore.addNewMatch(processedMatch);
            } else {
              console.error('Processed match has no valid ID for addNewMatch:', processedMatch);
            }
          } else {
            console.error('Payload de "match:nuevo" inesperado:', data);
          }
        });

        // --- Call Listeners ---
        socket.value.on('call:incoming', (payload: { permisoId: string; matchId: string; solicitante: User; tipo: 'audio' | 'video'; expiraEn: number }) => {
          console.log('Llamada entrante via WebSocket:', payload);
          callStore.handleIncomingCall(payload);
        });
        socket.value.on('call:accepted', (payload: { permisoId: string; matchId: string }) => {
          console.log('Llamada aceptada via WebSocket:', payload);
          callStore.handleCallAccepted(payload);
        });
        socket.value.on('call:rejected', (payload: { permisoId: string; matchId: string }) => {
          console.log('Llamada rechazada via WebSocket:', payload);
          callStore.handleCallRejected(payload);
        });
        socket.value.on('call:cancelled', (payload: { permisoId: string; matchId: string }) => {
          console.log('Llamada cancelada via WebSocket:', payload);
          callStore.handleCallCancelled(payload);
        });
        socket.value.on('call:ended', (payload: { permisoId: string; duracion: number; finalizadaPor: string }) => {
          console.log('Llamada finalizada via WebSocket:', payload);
          callStore.handleCallEnded(payload);
        });

        // --- WebRTC Signaling Listeners (handled by useWebRTC) ---
        // These are low-level and will be set up dynamically by useWebRTC composable
        // when a call is being established, so no global listeners here for them.
      }

    } else {
      // Desconnectar si fa logout
      if (socket.value) {
        socket.value.off('match:nuevo');
        socket.value.off('call:incoming');
        socket.value.off('call:accepted');
        socket.value.off('call:rejected');
        socket.value.off('call:cancelled');
        socket.value.off('call:ended');
        // No need to turn off call:offer/answer/ice here as they are not globally listened
      }
      disconnect();
      callStore.resetCallState(); // Ensure call state is reset on logout
    }
  },
  { immediate: true }
);

const showNav = computed(() => {
  const noNavRoutes = ['/login', '/register'];
  return !noNavRoutes.includes(route.path) && authStore.isAuthenticated && !callStore.inCall && !callStore.isCalling && !callStore.isReceivingCall;
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800;900&display=swap');

* {
  box-sizing: border-box;
}

body {
  font-family: 'Montserrat', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #F5F5F5;
  color: #333;
  -webkit-tap-highlight-color: transparent;
}

.app-container {
  background: white;
  min-height: 100vh;
  position: relative;
  box-shadow: 0 0 20px rgba(0,0,0,0.05);
  transition: padding-left 0.4s ease;
}

@media (min-width: 1024px) {
  .app-container.has-sidebar {
    padding-left: 280px; /* Ancho de la Sidebar */
  }
}
</style>
