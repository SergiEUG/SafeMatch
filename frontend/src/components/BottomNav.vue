<script setup lang="ts">
import { MessageSquare, User, Flame, Heart, LogOut } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

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

const handleLogout = async () => {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    await authStore.logout();
    router.push('/login');
  }
};
</script>

<template>
  <nav class="app-navigation">
    <!-- Desktop Sidebar Branding -->
    <div class="sidebar-logo">
      <div class="logo-box">
        <Flame class="logo-icon" />
      </div>
      <span class="logo-text">SafeMatch</span>
    </div>

    <div class="nav-links">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        class="nav-link"
        :class="{ 'is-active': isActive(item.path) }"
      >
        <div class="icon-container">
          <component :is="item.icon" class="nav-icon" />
          <div v-if="isActive(item.path)" class="active-dot"></div>
        </div>
        <span class="link-label">{{ item.label }}</span>
      </router-link>
    </div>

    <!-- Desktop Footer -->
    <div class="sidebar-footer">
      <button @click="handleLogout" class="logout-btn">
        <LogOut class="logout-icon" />
        <span class="link-label">Cerrar sesión</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
/* Base Styles (Híbrido) */
.app-navigation {
  z-index: 1000;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* --- MOBILE VERSION (Bottom Bar) --- */
@media (max-width: 1023px) {
  .app-navigation {
    position: fixed;
    bottom: 20px;
    left: 16px;
    right: 16px;
    height: 70px;
    border-radius: 24px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    padding: 0 10px;
  }

  .sidebar-logo, .sidebar-footer, .link-label {
    display: none;
  }

  .nav-links {
    display: flex;
    width: 100%;
    justify-content: space-around;
  }

  .nav-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #94a3b8;
    text-decoration: none;
    padding: 10px;
  }

  .nav-icon {
    width: 26px;
    height: 26px;
  }
}

/* --- DESKTOP VERSION (Sidebar) --- */
@media (min-width: 1024px) {
  .app-navigation {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    display: flex;
    flex-direction: column;
    padding: 40px 24px;
    border-right: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 0;
    background: white;
  }

  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 60px;
    padding-left: 12px;
  }

  .logo-box {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #ff7854, #fd267d);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(253, 38, 125, 0.3);
  }

  .logo-icon {
    color: white;
    width: 24px;
    height: 24px;
    fill: white;
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: 900;
    letter-spacing: -1px;
    background: linear-gradient(to right, #1a1a1a, #4a4a4a);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .nav-links {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border-radius: 16px;
    text-decoration: none;
    color: #64748b;
    font-weight: 700;
    transition: all 0.3s ease;
  }

  .nav-link:hover {
    background: rgba(0, 0, 0, 0.03);
    color: #1a1a1a;
    transform: translateX(4px);
  }

  .link-label {
    font-size: 1.05rem;
  }

  .sidebar-footer {
    margin-top: auto;
    padding-top: 20px;
    border-top: 1px solid #f1f5f9;
  }

  .logout-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: none;
    border: none;
    color: #94a3b8;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    border-radius: 16px;
    transition: all 0.3s ease;
  }

  .logout-btn:hover {
    background: #fef2f2;
    color: #ef4444;
  }
}

/* --- SHARED ACTIVE STATES --- */
.is-active {
  color: #db2777 !important;
}

@media (min-width: 1024px) {
  .is-active {
    background: #fff1f2 !important;
  }
}

.icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.active-dot {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 6px;
  height: 6px;
  background: #db2777;
  border-radius: 50%;
  box-shadow: 0 0 10px #db2777;
}

.nav-icon {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.is-active .nav-icon {
  transform: scale(1.1);
  filter: drop-shadow(0 4px 8px rgba(219, 39, 119, 0.2));
}
</style>
