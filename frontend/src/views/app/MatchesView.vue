<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../services/api';
import { getSocketInstance } from '../../composables/useSocket';
import { toast } from '../../composables/useToast';
import type { Match } from '../../types';
import { MessageCircle, Search, Heart, MoreHorizontal } from 'lucide-vue-next';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const matches = ref<Match[]>([]);
const isLoading = ref(true);
const authStore = useAuthStore(); // Use authStore here

// Computed function to get the other user in a match
const getOtherUserInMatch = (match: Match) => {
  if (!authStore.user || !match.usuarios) return null;
  return match.usuarios.find(user => user._id !== authStore.user?.id) || null;
};

// Funció per carregar matches
const loadMatches = async () => {
  try {
    const response = await api.getMatches();
    if (response.success && response.data) {
      matches.value = response.data.matches;
    }
  } catch (error) {
    console.error('Error loading matches:', error);
    toast.error('Error al cargar los matches');
  } finally {
    isLoading.value = false;
  }
};

// Listener per nous matches via WebSocket
const handleNewMatch = (data: any) => {
  console.log('🎉 Nuevo match recibido:', data);
  
  // Afegir el nou match a la llista si no existeix
  const exists = matches.value.some(m => m.id === data.match.id);
  if (!exists) {
    matches.value.unshift(data.match);
  }
  
  // Mostrar notificació
  toast.success(`¡Nuevo match con ${getOtherUserInMatch(data.match)?.nombre || 'alguien'}! 💕`, 5000);
  
  // Opcional: Preguntar si vol obrir el xat
  setTimeout(() => {
    if (confirm(`¿Quieres abrir el chat con ${getOtherUserInMatch(data.match)?.nombre}?`)) {
      router.push('/chats');
    }
  }, 1000);
};

onMounted(async () => {
  // Carregar matches inicials
  await loadMatches();
  
  // Connectar WebSocket listener
  const socket = getSocketInstance();
  if (socket) {
    socket.on('match:nuevo', handleNewMatch);
  }
});

onUnmounted(() => {
  // Netejar listener
  const socket = getSocketInstance();
  if (socket) {
    socket.off('match:nuevo', handleNewMatch);
  }
});
</script>

<template>
  <div class="min-h-screen bg-white pb-24">
    <!-- Header -->
    <header class="px-6 pt-12 pb-6">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-black text-gray-900 tracking-tight">Mensajes</h1>
        <button class="p-2 rounded-full bg-gray-50 text-gray-400">
          <Search class="h-6 w-6" />
        </button>
      </div>

      <!-- New Matches Horizontal List -->
      <section class="mb-10">
        <h3 class="text-xs font-bold uppercase tracking-widest text-primary mb-4">Nuevos Matches</h3>
        <div class="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-1">
          <div v-if="isLoading" class="flex gap-4">
            <div v-for="i in 3" :key="i" class="w-20 h-28 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
          <div v-else-if="matches.length === 0" class="flex flex-col items-center gap-2 min-w-[80px]">
            <div class="w-20 h-28 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
              <Heart class="h-8 w-8 text-gray-200" />
            </div>
            <span class="text-[10px] font-bold text-gray-300 uppercase">Sin matches</span>
          </div>
          
          <div 
            v-for="match in matches" 
            :key="'new-'+match.id"
            class="flex flex-col items-center gap-2 min-w-[80px] animate-in fade-in slide-in-from-right duration-500"
          >
            <div class="relative">
              <div class="w-20 h-28 rounded-2xl overflow-hidden shadow-md border-2 border-white ring-2 ring-primary/20">
                <img 
                  :src="getOtherUserInMatch(match)?.fotos?.[0] || '/placeholder-user.jpg'" 
                  :alt="getOtherUserInMatch(match)?.nombre || 'Avatar'"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                <Heart class="h-3 w-3 text-white fill-white" />
              </div>
            </div>
            <span class="text-xs font-bold text-gray-700 truncate w-20 text-center">
              {{ getOtherUserInMatch(match)?.nombre || 'Usuario Desconocido' }}
            </span>
          </div>
        </div>
      </section>
    </header>

    <!-- Messages List -->
    <main class="px-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xs font-bold uppercase tracking-widest text-gray-400">Conversaciones</h3>
        <button class="text-xs font-bold text-primary">Marcar todo como leído</button>
      </div>

      <div v-if="isLoading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="flex gap-4 items-center animate-pulse">
          <div class="w-16 h-16 rounded-full bg-gray-100" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-24 bg-gray-100 rounded" />
            <div class="h-3 w-full bg-gray-50 rounded" />
          </div>
        </div>
      </div>

      <div v-else-if="matches.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <MessageCircle class="h-10 w-10 text-gray-200" />
        </div>
        <p class="text-gray-400 font-medium">Aún no tienes conversaciones.<br>¡Empieza a deslizar!</p>
      </div>

      <div v-else class="space-y-2">
        <router-link 
          v-for="match in matches" 
          :key="match.id"
          to="/chats"
          class="w-full flex items-center gap-4 p-4 rounded-[2rem] hover:bg-gray-50 transition-all group active:scale-[0.98]"
        >
          <div class="relative">
            <img 
              :src="getOtherUserInMatch(match)?.fotos?.[0] || '/placeholder-user.jpg'" 
              :alt="getOtherUserInMatch(match)?.nombre || 'Avatar'"
              class="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
            />
          </div>
          
          <div class="flex-1 text-left">
            <div class="flex items-center justify-between mb-1">
              <h4 class="font-bold text-gray-900 group-hover:text-primary transition-colors">
                {{ getOtherUserInMatch(match)?.nombre || 'Usuario Desconocido' }}
              </h4>
              <span class="text-[10px] font-bold text-gray-300 uppercase">
                {{ match.ultimaActividad ? new Date(match.ultimaActividad).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '' }}
              </span>
            </div>
            <p class="text-sm text-gray-400 line-clamp-1 font-medium">
              {{ match.ultimoMensaje?.contenido || '¡Has hecho un match! Saluda a ' + (getOtherUserInMatch(match)?.nombre || 'este usuario') }}
            </p>
          </div>
          
          <div class="flex flex-col items-end gap-2">
            <div v-if="match.unreadCount" class="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <span class="text-[10px] font-black text-white">{{ match.unreadCount }}</span>
            </div>
            <MoreHorizontal class="h-5 w-5 text-gray-200 group-hover:text-gray-400" />
          </div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.text-primary {
  color: #fd267d;
}
.bg-primary {
  background-color: #fd267d;
}
</style>
