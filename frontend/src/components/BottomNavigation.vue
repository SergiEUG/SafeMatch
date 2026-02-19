<script setup lang="ts">
import { MessageSquare, User, Flame, Heart } from 'lucide-vue-next';
import { useRoute } from 'vue-router';

const route = useRoute();

const navItems = [
  { name: 'discover', path: '/', icon: Flame, label: 'Descubrir' },
  { name: 'likes', path: '/likes', icon: Heart, label: 'Likes' },
  { name: 'chats', path: '/chats', icon: MessageSquare, label: 'Chats' },
  { name: 'profile', path: '/profile', icon: User, label: 'Perfil' },
];

const isActive = (path: string) => {
  if (path === '/' && route.path === '/') return true;
  if (path !== '/' && route.path.startsWith(path)) return true;
  return false;
};
</script>

<template>
  <nav class="bottom-nav-container">
    <div class="nav-content">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        class="nav-item"
        :class="{ 'is-active': isActive(item.path) }"
      >
        <div class="icon-wrapper">
          <component 
            :is="item.icon" 
            class="nav-icon"
            :stroke-width="isActive(item.path) ? 2.5 : 2"
          />
          <div v-if="isActive(item.path)" class="active-indicator"></div>
        </div>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 0 16px 24px;
  pointer-events: none;
}

.nav-content {
  pointer-events: auto;
  max-width: 440px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 72px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #94a3b8;
  transition: all 0.3s ease;
  flex: 1;
  position: relative;
  height: 100%;
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.nav-icon {
  width: 24px;
  height: 24px;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.nav-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
}

/* Active State */
.is-active {
  color: #db2777;
}

.is-active .nav-icon {
  transform: translateY(-2px);
  color: #db2777;
}

.active-indicator {
  position: absolute;
  top: -8px;
  width: 4px;
  height: 4px;
  background: #db2777;
  border-radius: 50%;
  box-shadow: 0 0 10px #db2777;
}

/* Hover Effect */
@media (min-width: 1024px) {
  .nav-item:hover:not(.is-active) {
    color: #64748b;
  }
}

/* Safe Area Inset for modern phones */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .bottom-nav-container {
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
  }
}
</style>
