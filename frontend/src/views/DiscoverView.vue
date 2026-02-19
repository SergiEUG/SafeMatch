<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import CardProfile from '@/components/CardProfile.vue';
import MatchOverlay from '@/components/MatchOverlay.vue';
import { api } from '@/services/api';
import { Sparkles, MapPin, RefreshCcw, Settings, Flame } from 'lucide-vue-next';

const router = useRouter();
const profiles = ref<any[]>([]);
const currentProfileIndex = ref(0);
const isLoading = ref(true);
const showMatch = ref(false);
const matchedUser = ref<any>(null);
const currentPage = ref(1);

const loadProfiles = async () => {
  isLoading.value = true;
  try {
    const response = await api.discoverUsers(currentPage.value);
    if (response.success && response.data) {
      const userList = response.data.usuarios || [];
      
      if (userList.length > 0) {
        profiles.value = userList;
        currentProfileIndex.value = 0;
      } else {
        profiles.value = [];
      }
    }
  } catch (error) {
    console.error('Error al cargar perfiles:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadProfiles();
});

const handleLike = async (profile: any) => {
  try {
    const response = await api.likeUser(profile.id || profile._id);
    if (response.success && response.data?.esMatch) {
      matchedUser.value = profile;
      showMatch.value = true;
      // We don't increment index yet if showing match, or maybe we do
      nextProfile();
    } else {
      nextProfile();
    }
  } catch (error) {
    console.error('Error al dar like:', error);
    nextProfile();
  }
};

const handleReject = async (profile: any) => {
  try {
    await api.dislikeUser(profile.id || profile._id);
  } catch (error) {
    console.error('Error al rechazar:', error);
  }
  nextProfile();
};

const nextProfile = () => {
  currentProfileIndex.value++;
  if (currentProfileIndex.value >= profiles.value.length) {
    currentPage.value++;
    loadProfiles();
  }
};

const goToChat = () => {
  showMatch.value = false;
  router.push('/chats');
};
</script>

<template>
  <div class="discover-page">
    <!-- Immersive Background consistent with Auth -->
    <div class="immersive-bg"></div>
    <div class="abstract-pattern-overlay"></div>

    <div class="discover-container">
      <!-- Modern Transparent Header -->
      <header class="discover-header">
        <div class="logo-area">
          <div class="logo-icon-container">
            <Flame class="logo-icon" />
          </div>
          <h1 class="logo-text">SafeMatch</h1>
        </div>
        
        <div class="header-actions">
          <button class="icon-btn" title="Filtros">
            <Sparkles class="icon" />
          </button>
          <router-link to="/profile" class="profile-link">
            <div class="profile-avatar-placeholder">
              <Settings class="icon" />
            </div>
          </router-link>
        </div>
      </header>

      <main class="discover-main">
        <!-- Loading State -->
        <div v-if="isLoading && profiles.length === 0" class="discovery-loading">
          <div class="skeleton-card-wrapper">
            <div class="skeleton-card">
              <div class="skeleton-shimmer"></div>
            </div>
            <div class="loading-badge">
              <div class="pulse-ring"></div>
              <span>Buscando conexiones...</span>
            </div>
          </div>
        </div>
        
        <!-- Profile Card Stack -->
        <div v-else-if="profiles.length > 0 && currentProfileIndex < profiles.length" class="card-stack">
          <transition-group name="card-swipe">
            <div 
              v-for="(profile, index) in profiles.slice(currentProfileIndex, currentProfileIndex + 2)" 
              :key="profile._id || profile.id"
              class="card-wrapper"
              :style="{ zIndex: 10 - index, transform: `scale(${1 - index * 0.05}) translateY(${index * 15}px)` }"
            >
              <CardProfile
                v-if="index === 0"
                :profile="profile"
                @like="handleLike"
                @reject="handleReject"
              />
              <!-- Background card (simplified) -->
              <div v-else class="bg-card-placeholder">
                <img :src="profile.fotos?.[0] || '/placeholder-user.jpg'" class="blur-img" />
              </div>
            </div>
          </transition-group>
        </div>
        
        <!-- Empty State -->
        <div v-else class="discovery-empty">
          <div class="empty-glass-card">
            <div class="empty-icon-wrapper">
              <MapPin class="empty-icon" />
              <div class="radar-pulse"></div>
            </div>
            <h3>¡Vaya! No hay nadie cerca</h3>
            <p>Has explorado todos los perfiles en tu zona. Prueba a ampliar tus filtros o vuelve más tarde.</p>
            <button @click="loadProfiles" class="modern-refresh-btn">
              <RefreshCcw class="btn-icon" />
              <span>Volver a intentar</span>
            </button>
          </div>
        </div>
      </main>
    </div>
    
    <!-- Match overlay -->
    <MatchOverlay 
      v-if="showMatch" 
      :matchUser="matchedUser"
      @startChat="goToChat" 
      @close="showMatch = false" 
    />
  </div>
</template>

<style scoped>
.discover-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.discover-container {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

/* Immersive Background Styles */
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

/* Header - Hidden on Desktop since it's in Sidebar */
.discover-header {
  padding: 1.5rem 1.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (min-width: 1024px) {
  .discover-header {
    display: none;
  }
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon-container {
  width: 36px;
  height: 36px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.logo-icon {
  width: 22px;
  height: 22px;
  color: #db2777;
  fill: #db2777;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.5px;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.icon-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.profile-link {
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar-placeholder {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5b21b6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Main Content */
.discover-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.5rem 1rem 2rem;
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .discover-main {
    max-width: 1000px;
    padding: 2rem;
    justify-content: center;
  }
}

.card-stack {
  position: relative;
  flex: 1;
  width: 100%;
  perspective: 1000px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-wrapper {
  position: absolute;
  inset: 0;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Card sizing adjustments for desktop */
@media (min-width: 1024px) {
  .card-wrapper {
    height: 90%;
    max-height: 800px;
  }
}

.bg-card-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.blur-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.3;
  filter: blur(10px);
}

/* Loading State */
.discovery-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.skeleton-card-wrapper {
  width: 100%;
  max-width: 360px;
  height: 550px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.skeleton-card {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  from { background-position: -200% 0; }
  to { background-position: 200% 0; }
}

.loading-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  color: white;
  font-weight: 600;
}

.pulse-ring {
  width: 10px;
  height: 10px;
  background: #ef4444;
  border-radius: 50%;
  position: relative;
}

.pulse-ring::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid #ef4444;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}

/* Empty State */
.discovery-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.empty-glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 32px;
  padding: 3rem 2rem;
  text-align: center;
  color: white;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.empty-icon-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: white;
  z-index: 2;
}

.radar-pulse {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: radar 2s infinite;
}

@keyframes radar {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

.empty-glass-card h3 {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.empty-glass-card p {
  opacity: 0.8;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.modern-refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem;
  background: white;
  color: #db2777;
  border: none;
  border-radius: 16px;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

.modern-refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

/* Card Swipe Transitions */
.card-swipe-leave-active {
  transition: all 0.4s ease;
}

.card-swipe-leave-to {
  opacity: 0;
  transform: translateX(100%) rotate(20deg) !important;
}

@media (max-width: 480px) {
  .discover-container {
    height: 100dvh; /* Dynamic viewport height for mobile */
  }
  
  .discover-main {
    padding: 0.5rem 0.75rem 1rem;
  }
  
  .skeleton-card-wrapper {
    height: 100%;
    max-height: 600px;
  }
}
</style>
