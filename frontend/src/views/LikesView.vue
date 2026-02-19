<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/services/api';
import CardProfile from '@/components/CardProfile.vue';
import { useMatchesStore } from '@/store/matches';
import { useAuthStore } from '@/store/auth';
import { 
  Heart, 
  MessageSquare, 
  UserPlus, 
  X, 
  Sparkles,
  ArrowRight,
  Ghost
} from 'lucide-vue-next';

const router = useRouter();
const matchesStore = useMatchesStore();
const authStore = useAuthStore();

const activeTab = ref<'likes' | 'matches'>('likes');
const receivedLikes = ref<any[]>([]);
const isLoading = ref(true);
const selectedProfile = ref<any>(null);

const matches = computed(() => matchesStore.allMatches);

const loadData = async () => {
  isLoading.value = true;
  try {
    const likesRes = await api.getReceivedLikes();
    if (likesRes.success) {
      receivedLikes.value = likesRes.data;
    }
  } catch (error) {
    console.error('Error cargando datos de likes:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await loadData();
  matchesStore.fetchMatches();
});

const getOtherUserInMatch = (match: any) => {
  if (!authStore.user || !match.usuarios) return null;
  return match.usuarios.find((user: any) => (user._id || user.id) !== authStore.user?.id) || null;
};

const handleLike = async (userId: string) => {
  receivedLikes.value = receivedLikes.value.filter(like => like.de._id !== userId);
  if (selectedProfile.value?._id === userId) {
    selectedProfile.value = null;
  }

  try {
    const res = await api.likeUser(userId);
    if (res.success && res.data.esMatch) {
      activeTab.value = 'matches';
      // In a real app, we'd trigger a celebration here
    }
  } catch (error) {
    console.error("Error en 'handleLike':", error);
  }
};

const handleReject = async (userId: string) => {
  receivedLikes.value = receivedLikes.value.filter(like => like.de._id !== userId);
  if (selectedProfile.value?._id === userId) {
    selectedProfile.value = null;
  }
  
  try {
    await api.dislikeUser(userId);
  } catch (error) {
    console.error("Error en 'handleReject':", error);
  }
};

const viewProfile = (user: any) => {
  selectedProfile.value = {
    ...user,
    age: calculateAge(user.fechaNacimiento)
  };
};

const calculateAge = (birthday: string) => {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const goToChat = (match: any) => {
  const matchId = match._id || match.id;
  router.push(`/chats/${matchId}`);
};
</script>

<template>
  <div class="likes-page">
    <!-- Immersive Background consistent with App -->
    <div class="immersive-bg"></div>
    <div class="abstract-pattern-overlay"></div>

    <div class="content-wrapper">
      <header class="page-header">
        <h1 class="page-title">Tus Conexiones</h1>
        <p class="page-subtitle">Gestiona tus interesados y matches recientes</p>
      </header>

      <!-- Glass Tabs Navigation -->
      <div class="tabs-container">
        <div class="glass-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'likes' }" 
            @click="activeTab = 'likes'"
          >
            <UserPlus class="tab-icon" />
            <span>Likes</span>
            <span v-if="receivedLikes.length > 0" class="badge">{{ receivedLikes.length }}</span>
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'matches' }" 
            @click="activeTab = 'matches'"
          >
            <Heart class="tab-icon" />
            <span>Matches</span>
            <span v-if="matches.length > 0" class="badge matches-badge">{{ matches.length }}</span>
          </button>
        </div>
      </div>

      <main class="likes-main">
        <!-- Loading State -->
        <div v-if="isLoading" class="state-container">
          <div class="loading-spinner"></div>
          <p>Sincronizando tus conexiones...</p>
        </div>

        <!-- LIKES RECIBIDOS -->
        <div v-else-if="activeTab === 'likes'" class="view-content animate-fade">
          <div v-if="receivedLikes.length > 0" class="likes-grid">
            <div 
              v-for="like in receivedLikes" 
              :key="like._id" 
              class="like-card-modern"
              @click="viewProfile(like.de)"
            >
              <div class="card-image-wrap">
                <img :src="like.de.fotos?.[0] || '/placeholder-user.jpg'" alt="Foto">
                <div class="card-vignette"></div>
              </div>
              <div class="card-info-modern">
                <h3>{{ like.de.nombre }}, {{ calculateAge(like.de.fechaNacimiento) }}</h3>
                <div class="card-actions-modern">
                  <button class="circle-btn reject-btn" @click.stop="handleReject(like.de._id)">
                    <X class="h-5 w-5" />
                  </button>
                  <button class="circle-btn like-btn" @click.stop="handleLike(like.de._id)">
                    <Heart class="h-5 w-5 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state-modern">
            <div class="empty-icon-box">
              <Ghost class="h-12 w-12" />
            </div>
            <h3>Nada por aquí todavía</h3>
            <p>Sigue explorando en la sección de Descubrir para recibir tus primeros likes.</p>
            <router-link to="/" class="cta-btn">
              Ir a Descubrir
              <ArrowRight class="h-4 w-4" />
            </router-link>
          </div>
        </div>

        <!-- MATCHES -->
        <div v-else-if="activeTab === 'matches'" class="view-content animate-fade">
          <div v-if="matches.length > 0" class="matches-grid-modern">
            <div 
              v-for="match in matches" 
              :key="match._id || match.id" 
              class="match-card-glass" 
              @click="goToChat(match)"
            >
              <div class="match-avatar-stack">
                <img :src="getOtherUserInMatch(match)?.fotos?.[0] || '/placeholder-user.jpg'" alt="Avatar">
                <div class="match-indicator">
                  <Sparkles class="h-3 w-3 fill-current" />
                </div>
              </div>
              <div class="match-meta">
                <h3>{{ getOtherUserInMatch(match)?.nombre || 'Usuario' }}</h3>
                <p>¡Es un match! Envía un mensaje...</p>
              </div>
              <button class="chat-action-btn">
                <MessageSquare class="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div v-else class="empty-state-modern">
            <div class="empty-icon-box match-empty">
              <Heart class="h-12 w-12" />
            </div>
            <h3>El amor está cerca</h3>
            <p>Cuando tú y otra persona os deis Like mutuamente, aparecerán aquí.</p>
          </div>
        </div>
      </main>
    </div>

    <!-- Professional Profile View Modal -->
    <transition name="modal-fade">
      <div v-if="selectedProfile" class="modal-overlay" @click="selectedProfile = null">
        <div class="modal-card-wrap" @click.stop>
          <div class="modal-close-top" @click="selectedProfile = null">
            <X class="h-6 w-6" />
          </div>
          <CardProfile 
            :profile="selectedProfile" 
            @like="handleLike(selectedProfile._id)" 
            @reject="handleReject(selectedProfile._id)" 
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.likes-page {
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

.content-wrapper {
  position: relative;
  z-index: 10;
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px 100px;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: -1px;
  margin-bottom: 8px;
  background: linear-gradient(to bottom, #ffffff, #f1f5f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
}

/* Tabs */
.tabs-container {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.glass-tabs {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 6px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  gap: 4px;
}

.tab-btn {
  padding: 12px 24px;
  border-radius: 16px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: white;
  color: #db2777;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.tab-icon {
  width: 18px;
  height: 18px;
}

.badge {
  background: #db2777;
  color: white;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 800;
}

.tab-btn.active .badge {
  background: #fdf2f8;
  color: #db2777;
}

/* Main Grid */
.likes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.like-card-modern {
  position: relative;
  aspect-ratio: 3/4;
  border-radius: 24px;
  overflow: hidden;
  background: #2a2a2a;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.like-card-modern:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.card-image-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.card-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-vignette {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%);
}

.card-info-modern {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  color: white;
}

.card-info-modern h3 {
  font-size: 1.1rem;
  font-weight: 800;
  margin-bottom: 12px;
}

.card-actions-modern {
  display: flex;
  gap: 12px;
}

.circle-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reject-btn {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  color: white;
}

.reject-btn:hover {
  background: #ef4444;
}

.like-btn {
  background: white;
  color: #db2777;
}

.like-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(219, 39, 119, 0.4);
}

/* Matches Grid */
.matches-grid-modern {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.match-card-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.match-card-glass:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(8px);
  border-color: rgba(255, 255, 255, 0.3);
}

.match-avatar-stack {
  position: relative;
  width: 64px;
  height: 64px;
}

.match-avatar-stack img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

.match-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #db2777;
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #1a1a1a;
}

.match-meta {
  flex: 1;
}

.match-meta h3 {
  font-size: 1.2rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.match-meta p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
  margin: 0;
}

.chat-action-btn {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: white;
  color: #db2777;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.match-card-glass:hover .chat-action-btn {
  background: #db2777;
  color: white;
  transform: rotate(15deg);
}

/* States */
.state-container {
  text-align: center;
  padding: 80px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: white;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state-modern {
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 40px;
  padding: 60px 40px;
  text-align: center;
}

.empty-icon-box {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: rgba(255, 255, 255, 0.3);
}

.match-empty {
  color: #db2777;
  background: rgba(219, 39, 119, 0.1);
}

.empty-state-modern h3 {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 12px;
}

.empty-state-modern p {
  color: rgba(255, 255, 255, 0.6);
  max-width: 320px;
  margin: 0 auto 32px;
}

.cta-btn {
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

.cta-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 25px rgba(255, 255, 255, 0.2);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card-wrap {
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 600px;
}

.modal-close-top {
  position: absolute;
  top: -50px;
  right: 0;
  color: white;
  cursor: pointer;
}

/* Animations */
.animate-fade {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: all 0.4s ease;
}

.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@media (max-width: 640px) {
  .likes-grid {
    grid-template-columns: 1fr 1fr;
  }
  .page-title {
    font-size: 2rem;
  }
}
</style>
