<template>
  <div v-if="isLoading" class="loading-full-page">Cargando Chat...</div>
  <div v-else-if="match" class="chat-detail-view">
    <ChatContainer :match="match" />
  </div>
  <div v-else class="error-full-page">
    <p>No se pudo cargar la información del chat. Por favor, vuelve a la <router-link to="/chats">lista de chats</router-link>.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import ChatContainer from '@/components/ChatContainer.vue';
import api from '@/services/api';
import { useMatchesStore } from '@/store/matches';

const route = useRoute();
import type { Match } from '@/types'; // Import Match type

const match = ref<Match | null>(null);
const isLoading = ref(true);
const matchesStore = useMatchesStore();

onMounted(async () => {
  // Ensure matchId is always a string
  const rawMatchId = route.params.matchId;
  const matchId = Array.isArray(rawMatchId) ? rawMatchId[0] : (rawMatchId as string);

  if (!matchId) {
    isLoading.value = false;
    return;
  }
  
  try {
    const response = await api.getMatch(matchId);
    if (response.success && response.data && response.data.match) { // Access response.data.match
      const fetchedMatch = response.data.match; // This is now the actual Match object
      // Normalize the ID property, which is crucial for the store and components.
      const processedMatch = {
        ...fetchedMatch,
        id: (fetchedMatch._id || fetchedMatch.id || '') as string // Prefer _id if available, then id
      };

      // Add/update the match in the Pinia store so ChatContainer can find it
      matchesStore.addNewMatch(processedMatch);
      // Set the local ref to the processed data
      match.value = processedMatch;
    } else {
      throw new Error(response.message || 'Failed to fetch match data');
    }
  } catch (error) {
    console.error('Error fetching match details:', error);
    match.value = null;
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.loading-full-page, .error-full-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #999;
}
.error-full-page a {
  color: #ef4444;
  text-decoration: underline;
}
</style>
