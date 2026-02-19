<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/api';
import { 
  Search, 
  Ghost, 
  ChevronRight, 
  Sparkles
} from 'lucide-vue-next';

const conversations = ref<any[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');

onMounted(async () => {
  try {
    const response = await api.getConversations();
    if (response.data) {
      conversations.value = response.data;
    }
  } catch (error) {
    console.error('Error fetching conversations:', error);
  } finally {
    isLoading.value = false;
  }
});

const formatTime = (timestamp: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
};

const filteredConversations = () => {
  if (!searchQuery.value) return conversations.value;
  return conversations.value.filter(c => 
    c.otherUser.nombre.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
};
</script>

<template>
  <div class="chats-page">
    <!-- Immersive Background consistent with App -->
    <div class="immersive-bg"></div>
    <div class="abstract-pattern-overlay"></div>

    <div class="chats-wrapper">
      <header class="chats-header">
        <div class="title-area">
          <h1 class="page-title">Mensajes</h1>
          <div class="active-badge">
            <div class="pulse-dot"></div>
            <span>{{ conversations.length }} chats activos</span>
          </div>
        </div>
        
        <div class="search-box">
          <Search class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar una conversación..."
            class="search-input"
          />
        </div>
      </header>

      <main class="chats-main">
        <!-- Loading State -->
        <div v-if="isLoading" class="convo-list">
          <div v-for="n in 5" :key="n" class="skeleton-item">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-text">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line body"></div>
            </div>
          </div>
        </div>

        <!-- Conversations List -->
        <div v-else-if="filteredConversations().length > 0" class="convo-list">
          <router-link 
            v-for="convo in filteredConversations()" 
            :key="convo.matchId"
            :to="`/chats/${convo.matchId}`"
            class="convo-card"
          >
            <div class="avatar-container">
              <img :src="convo.otherUser.fotos?.[0] || '/placeholder-user.jpg'" alt="avatar" />
              <div class="online-indicator"></div>
            </div>
            
            <div class="convo-info">
              <div class="convo-top">
                <h3 class="name">{{ convo.otherUser.nombre }}</h3>
                <span class="time">{{ formatTime(convo.lastMessage.createdAt) }}</span>
              </div>
              
              <div class="convo-bottom">
                <p class="last-msg">{{ convo.lastMessage.contenido }}</p>
                <div v-if="convo.unreadCount > 0" class="unread-count">
                  {{ convo.unreadCount }}
                </div>
                <ChevronRight v-else class="chevron-icon" />
              </div>
            </div>
          </router-link>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon-wrap">
            <Ghost v-if="!searchQuery" class="h-12 w-12" />
            <Search v-else class="h-12 w-12" />
          </div>
          <h3>{{ searchQuery ? 'No hay resultados' : 'Bandeja de entrada vacía' }}</h3>
          <p>{{ searchQuery ? 'Prueba con otro nombre o borra la búsqueda.' : '¡Empieza a deslizar! Tus matches aparecerán aquí cuando les envíes un mensaje.' }}</p>
          <router-link v-if="!searchQuery" to="/" class="cta-link">
            <Sparkles class="h-4 w-4" />
            <span>Descubrir personas</span>
          </router-link>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.chats-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  color: white;
  overflow-x: hidden;
}

/* Background Styles */
.immersive-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #5b21b6 0%, #db2777 50%, #ef4444 100%);
  z-index: 0;
}

.abstract-pattern-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0.05;
  background-image: url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm10-20h2v12h-2v-12zm-10 0h2v12h-2v-12zm-10 0h2v12h-2v-12zm-10 0h2v12h-2v-12zM36 0v-2h-2v2h-4v2h4v4h2V4h4V2h-4zM36 40v-2h-2v2h-4v2h4v4h2v-4h4v-2h-4zM0 0h2v12h-2v-12zM0 40h2v12h-2v-12z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');
}

.chats-wrapper {
  position: relative;
  z-index: 10;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px 100px;
}

/* Header */
.chats-header {
  margin-bottom: 32px;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: -1.5px;
  margin: 0;
}

.active-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 6px 14px;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #1be4a1;
  border-radius: 50%;
  box-shadow: 0 0 10px #1be4a1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

/* Search Box */
.search-box {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.5);
}

.search-input {
  width: 100%;
  padding: 16px 16px 16px 52px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: white;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
}

/* Convo List */
.convo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.convo-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.convo-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(8px);
  border-color: rgba(255, 255, 255, 0.3);
}

.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.avatar-container img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.online-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 14px;
  height: 14px;
  background: #1be4a1;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.1);
}

.convo-info {
  flex: 1;
  min-width: 0;
}

.convo-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.name {
  font-size: 1.15rem;
  font-weight: 800;
  margin: 0;
}

.time {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
}

.convo-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-msg {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.unread-count {
  background: #db2777;
  color: white;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 900;
  box-shadow: 0 4px 10px rgba(219, 39, 119, 0.4);
}

.chevron-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.2);
}

/* Skeletons */
.skeleton-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  animation: shimmer 1.5s infinite linear;
}

.skeleton-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.skeleton-text {
  flex: 1;
}

.skeleton-line {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-line.title { width: 40%; height: 16px; }
.skeleton-line.body { width: 70%; height: 12px; }

@keyframes shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 0.8; }
  100% { opacity: 0.5; }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 40px;
  border: 2px dashed rgba(255, 255, 255, 0.1);
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: rgba(255, 255, 255, 0.2);
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 12px;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.5);
  max-width: 320px;
  margin: 0 auto 32px;
  line-height: 1.5;
}

.cta-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: white;
  color: #db2777;
  padding: 14px 28px;
  border-radius: 20px;
  font-weight: 800;
  text-decoration: none;
  transition: all 0.3s ease;
}

.cta-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(255, 255, 255, 0.2);
}

@media (max-width: 480px) {
  .page-title { font-size: 2rem; }
  .chats-wrapper { padding: 24px 16px 100px; }
  .avatar-container img { width: 56px; height: 56px; }
}
</style>
