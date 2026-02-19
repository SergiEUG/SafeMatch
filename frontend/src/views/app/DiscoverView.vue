<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '../../services/api';
import SwipeCard from '../../components/SwipeCard.vue';
import { Heart, RefreshCw, X, Star, Settings } from 'lucide-vue-next';
import type { User } from '../../types';

const users = ref<User[]>([]);
const isLoading = ref(true);
const showMatch = ref<User | null>(null);

const loadUsers = async () => {
  isLoading.value = true;
  try {
    const response = await api.discoverUsers();
    if (response.success && response.data?.usuarios.length > 0) {
      users.value = response.data.usuarios;
    } else {
      users.value = [];
    }
  } catch (error) {
    console.error('Error loading users:', error);
    users.value = [];
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadUsers();
});

const handleLike = async (targetUser: User) => {
  try {
    const response = await api.likeUser(targetUser._id);
    if (response.data?.match) {
      showMatch.value = targetUser;
    }
  } catch (error) {
    console.error('Error liking user:', error);
  }
  users.value = users.value.slice(1);
};

const handleDislike = async (targetUser: User) => {
  try {
    await api.dislikeUser(targetUser._id);
  } catch (error) {
    console.error('Error disliking user:', error);
  }
  users.value = users.value.slice(1);
};

const currentUser = computed(() => users.value[0]);
const nextUser = computed(() => users.value[1]);
</script>

<template>
  <div class="flex h-screen flex-col bg-gray-50 overflow-hidden">
    <!-- Professional Header -->
    <header class="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 z-50">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 tinder-gradient rounded-lg flex items-center justify-center shadow-md">
          <Heart class="h-5 w-5 text-white fill-white" />
        </div>
        <span class="text-xl font-black tracking-tighter text-gray-900">SafeMatch</span>
      </div>
      <router-link to="/app/profile" class="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
        <Settings class="h-6 w-6" />
      </router-link>
    </header>

    <main class="flex-1 relative flex flex-col items-center justify-center p-4">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center gap-4">
        <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p class="text-gray-400 font-medium animate-pulse">Buscando personas...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="users.length === 0" class="flex flex-col items-center text-center max-w-xs animate-in fade-in zoom-in duration-500">
        <div class="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center mb-6">
          <Heart class="h-12 w-12 text-gray-200" />
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">No hay nadie nuevo</h2>
        <p class="text-gray-500 mb-8 leading-relaxed">
          Has visto a todas las personas cerca de ti. ¡Vuelve más tarde para ver nuevos perfiles!
        </p>
        <button
          @click="loadUsers"
          class="flex items-center gap-2 px-8 py-3 tinder-gradient text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <RefreshCw class="h-5 w-5" />
          Actualizar
        </button>
      </div>

      <!-- Card Stack -->
      <div v-else class="relative w-full max-w-md h-full max-h-[600px] mb-20">
        <!-- Next User (Background) -->
        <SwipeCard
          v-if="nextUser"
          :user="nextUser"
          :is-top="false"
          class="scale-95 translate-y-4 opacity-40 blur-[1px]"
        />
        
        <!-- Current User (Top) -->
        <SwipeCard
          v-if="currentUser"
          :user="currentUser"
          :is-top="true"
          @like="handleLike(currentUser)"
          @dislike="handleDislike(currentUser)"
        />
      </div>

      <!-- Main Action Buttons -->
      <div v-if="users.length > 0 && !isLoading && currentUser" class="absolute bottom-8 flex items-center gap-6 z-50">
        <button 
          @click="handleDislike(currentUser)"
          class="w-16 h-16 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-red-500 hover:scale-110 active:scale-95 transition-all"
        >
          <X class="h-8 w-8 stroke-[3]" />
        </button>
        
        <button 
          class="w-12 h-12 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-blue-400 hover:scale-110 active:scale-95 transition-all"
        >
          <Star class="h-6 w-6 fill-current" />
        </button>
        
        <button 
          @click="handleLike(currentUser)"
          class="w-16 h-16 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-green-500 hover:scale-110 active:scale-95 transition-all"
        >
          <Heart class="h-8 w-8 fill-current" />
        </button>
      </div>
    </main>

    <!-- Match Modal -->
    <transition name="match-zoom">
      <div v-if="showMatch" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" />
        <div class="relative w-full max-w-sm bg-white rounded-[2.5rem] p-10 text-center shadow-2xl overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-2 tinder-gradient" />
          
          <div class="relative mb-8">
            <div class="w-32 h-32 mx-auto rounded-full tinder-gradient flex items-center justify-center animate-pulse">
              <Heart class="h-16 w-16 text-white fill-white" />
            </div>
            <div class="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Star class="h-6 w-6 text-white fill-white" />
            </div>
          </div>

          <h2 class="text-4xl font-black text-gray-900 mb-2 italic">¡Es un Match!</h2>
          <p class="text-gray-500 mb-10 text-lg">
            Tú y <span class="font-bold text-gray-900">{{ showMatch.nombre }}</span> os habéis gustado.
          </p>

          <div class="flex flex-col gap-4">
            <button
              class="w-full py-4 tinder-gradient text-white rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 transition-opacity"
              @click="showMatch = null"
            >
              Enviar Mensaje
            </button>
            <button
              class="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-colors"
              @click="showMatch = null"
            >
              Seguir buscando
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.match-zoom-enter-active, .match-zoom-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.match-zoom-enter-from, .match-zoom-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

.tinder-gradient {
  background: linear-gradient(262deg, #ff7854 0%, #fd267d 100%);
}
</style>
