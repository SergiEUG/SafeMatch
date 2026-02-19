<script setup lang="ts">
import { useAuthStore } from '@/store/auth';
import { MessageSquare, ArrowRight, Heart, Star } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  matchUser: any;
}>();

const emit = defineEmits(['startChat', 'close']);

const authStore = useAuthStore();
const myPhoto = computed(() => authStore.user?.fotos?.[0] || '/placeholder-user.jpg');
const matchPhoto = computed(() => props.matchUser?.fotos?.[0] || '/placeholder-user.jpg');
</script>

<template>
  <div class="match-experience">
    <!-- Immersive Backdrop -->
    <div class="backdrop-blur" @click="$emit('close')"></div>
    
    <div class="match-card-container">
      <!-- Animated Background Elements -->
      <div class="particle p1"></div>
      <div class="particle p2"></div>
      <div class="particle p3"></div>

      <div class="match-card">
        <header class="match-header">
          <div class="match-badge">
            <Star class="h-4 w-4 fill-current" />
            <span>NUEVA CONEXIÓN</span>
          </div>
          <h2 class="match-title">¡Es un Match!</h2>
          <p class="match-subtitle">Tú y <strong>{{ matchUser?.nombre }}</strong> os habéis gustado mutuamente.</p>
        </header>

        <div class="match-visuals">
          <div class="avatar-wrap left-avatar">
            <div class="avatar-glow"></div>
            <img :src="myPhoto" alt="Tú" class="match-avatar">
          </div>
          
          <div class="heart-junction">
            <div class="heart-pulse">
              <Heart class="h-10 w-10 text-white fill-white" />
            </div>
            <div class="connection-line"></div>
          </div>
          
          <div class="avatar-wrap right-avatar">
            <div class="avatar-glow"></div>
            <img :src="matchPhoto" alt="Match" class="match-avatar">
          </div>
        </div>

        <div class="match-actions">
          <button class="primary-action-btn" @click="$emit('startChat')">
            <MessageSquare class="h-5 w-5" />
            <span>Enviar mensaje ahora</span>
            <ArrowRight class="h-5 w-5 ml-auto" />
          </button>
          
          <button class="secondary-action-btn" @click="$emit('close')">
            Seguir explorando
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.match-experience {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.backdrop-blur {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.match-card-container {
  position: relative;
  width: 100%;
  max-width: 440px;
  perspective: 1000px;
  animation: cardPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.match-card {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 40px;
  padding: 48px 32px 32px;
  text-align: center;
  overflow: hidden;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5);
}

.match-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #5b21b6, #db2777, #ef4444);
}

/* Header */
.match-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 16px;
  border-radius: 50px;
  color: #fbbf24;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 1px;
  margin-bottom: 24px;
}

.match-title {
  font-size: 3.5rem;
  font-weight: 900;
  margin: 0 0 12px;
  color: white;
  line-height: 1;
  font-style: italic;
  letter-spacing: -2px;
  background: linear-gradient(to bottom, #ffffff 50%, #f9a8d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.match-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  line-height: 1.5;
  margin-bottom: 48px;
}

/* Visuals */
.match-visuals {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 60px;
  position: relative;
}

.avatar-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  padding: 4px;
  background: rgba(255, 255, 255, 0.2);
  z-index: 2;
}

.avatar-glow {
  position: absolute;
  inset: -10px;
  background: radial-gradient(circle, rgba(219, 39, 119, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  animation: glowPulse 2s infinite ease-in-out;
}

.match-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.left-avatar { transform: rotate(-5deg); animation: slideLeft 0.8s ease-out; }
.right-avatar { transform: rotate(5deg); animation: slideRight 0.8s ease-out; }

.heart-junction {
  position: relative;
  z-index: 5;
}

.heart-pulse {
  background: linear-gradient(135deg, #db2777, #ef4444);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.6);
  animation: beat 0.8s infinite cubic-bezier(0.21, 0.6, 0.35, 1);
}

/* Actions */
.match-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.primary-action-btn {
  background: white;
  color: #db2777;
  border: none;
  padding: 18px 24px;
  border-radius: 20px;
  font-size: 1.1rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.primary-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  background: #f9f9f9;
}

.secondary-action-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Particles */
.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  opacity: 0.4;
}

.p1 { top: 10%; left: 10%; animation: float 4s infinite; }
.p2 { top: 20%; right: 15%; animation: float 6s infinite 1s; }
.p3 { bottom: 15%; left: 20%; animation: float 5s infinite 0.5s; }

/* Animations */
@keyframes cardPop {
  0% { transform: scale(0.8) translateY(40px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

@keyframes beat {
  0% { transform: scale(1); }
  15% { transform: scale(1.2); }
  30% { transform: scale(1); }
  45% { transform: scale(1.1); }
  60% { transform: scale(1); }
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.3); opacity: 0.6; }
}

@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-20px) translateX(10px); }
}

@keyframes slideLeft {
  0% { transform: translateX(-60px) rotate(-15deg); opacity: 0; }
  100% { transform: translateX(0) rotate(-5deg); opacity: 1; }
}

@keyframes slideRight {
  0% { transform: translateX(60px) rotate(15deg); opacity: 0; }
  100% { transform: translateX(0) rotate(5deg); opacity: 1; }
}

@media (max-width: 480px) {
  .match-title { font-size: 2.8rem; }
  .avatar-wrap { width: 100px; height: 100px; }
  .heart-pulse { width: 52px; height: 52px; }
  .match-card { padding: 40px 24px 24px; }
}
</style>
