<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';
import { 
  Settings, 
  LogOut, 
  User, 
  MapPin, 
  ShieldCheck, 
  Heart, 
  Sparkles,
  ChevronRight,
  Camera
} from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();
const user = computed(() => authStore.user);

onMounted(() => {
  authStore.fetchCurrentUser();
});

const logout = async () => {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    await authStore.logout();
    router.push('/login');
  }
};

const formatRelacion = (val: any) => {
  if (Array.isArray(val)) val = val[0];
  const map: Record<string, string> = {
    'rollos': 'Rollos cortos',
    'seria': 'Relación seria',
    'no_claro': 'No lo tengo claro',
    'amistad': 'Nuevas amistades'
  };
  return map[val] || val;
};
</script>

<template>
  <div class="profile-page">
    <!-- Immersive Background consistent with App -->
    <div class="immersive-bg"></div>
    <div class="abstract-pattern-overlay"></div>

    <div class="profile-wrapper">
      <header class="profile-header">
        <h1 class="page-title">Mi Perfil</h1>
        <button @click="logout" class="logout-icon-btn" title="Cerrar sesión">
          <LogOut class="h-5 w-5" />
        </button>
      </header>

      <main v-if="user" class="profile-main animate-fade-in">
        <!-- Profile Card Summary -->
        <section class="profile-card-glass">
          <div class="profile-hero">
            <div class="avatar-container">
              <img
                :src="user.fotos && user.fotos.length > 0 ? user.fotos[0] : '/placeholder-user.jpg'"
                alt="Profile Photo"
                class="main-avatar"
              />
              <router-link to="/profile/edit" class="edit-badge">
                <Camera class="h-4 w-4" />
              </router-link>
            </div>
            
            <div class="hero-info">
              <div class="name-badge-row">
                <h2 class="user-name">{{ user.nombre }}, {{ user.edad }}</h2>
                <ShieldCheck v-if="user.verificado" class="verified-badge-icon" />
              </div>
              <div class="user-location">
                <MapPin class="h-4 w-4" />
                <span>{{ user.ubicacion?.ciudad || 'Ubicación no definida' }}</span>
              </div>
            </div>
          </div>

          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-value">{{ new Date(user.createdAt).getFullYear() }}</span>
              <span class="stat-label">Miembro</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ user.intereses?.length || 0 }}</span>
              <span class="stat-label">Intereses</span>
            </div>
            <template v-if="user.verificado">
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-value text-verified">Verificado</span>
                <span class="stat-label">Estado</span>
              </div>
            </template>
          </div>
        </section>

        <!-- Navigation Actions -->
        <div class="profile-actions-grid">
          <router-link to="/profile/edit" class="action-card-glass">
            <div class="action-icon settings">
              <Settings class="h-6 w-6" />
            </div>
            <div class="action-text">
              <h3>Ajustes de Perfil</h3>
              <p>Edita tu biografía, fotos e intereses</p>
            </div>
            <ChevronRight class="h-5 w-5 opacity-30" />
          </router-link>

          <div class="action-card-glass">
            <div class="action-icon safety">
              <ShieldCheck class="h-6 w-6" />
            </div>
            <div class="action-text">
              <h3>Seguridad y Privacidad</h3>
              <p>Gestiona tus permisos de llamadas</p>
            </div>
            <ChevronRight class="h-5 w-5 opacity-30" />
          </div>
        </div>

        <!-- Info Sections -->
        <div class="info-sections-container">
          <!-- Biography Section -->
          <section class="glass-section">
            <div class="section-header">
              <User class="h-4 w-4" />
              <h3>SOBRE MÍ</h3>
            </div>
            <p class="bio-content">{{ user.biografia || 'Cuéntale al mundo algo sobre ti...' }}</p>
          </section>

          <!-- Relationship Goals -->
          <section v-if="user.busco && user.busco.length > 0" class="glass-section">
            <div class="section-header">
              <Heart class="h-4 w-4" />
              <h3>BUSCO</h3>
            </div>
            <div class="tag-cloud">
              <span v-for="item in user.busco" :key="item" class="modern-tag relation">
                {{ formatRelacion(item) }}
              </span>
            </div>
          </section>

          <!-- Interests -->
          <section v-if="user.intereses && user.intereses.length > 0" class="glass-section">
            <div class="section-header">
              <Sparkles class="h-4 w-4" />
              <h3>INTERESES</h3>
            </div>
            <div class="tag-cloud">
              <span v-for="interes in user.intereses" :key="interes" class="modern-tag interest">
                {{ interes }}
              </span>
            </div>
          </section>

          <!-- App Preferences -->
          <section class="glass-section preferences">
            <div class="section-header">
              <Settings class="h-4 w-4" />
              <h3>PREFERENCIAS DE DESCUBRIMIENTO</h3>
            </div>
            <div class="preferences-list">
              <div class="pref-row">
                <span>Distancia máxima</span>
                <span class="pref-val">{{ user.configuracion?.distanciaMaxima }} km</span>
              </div>
              <div class="pref-row">
                <span>Rango de edad</span>
                <span class="pref-val">{{ user.configuracion?.rangoEdad?.min }} - {{ user.configuracion?.rangoEdad?.max }}</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <div v-else class="profile-loading">
        <div class="spinner"></div>
        <p>Cargando tu perfil...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
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

.profile-wrapper {
  position: relative;
  z-index: 10;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px 100px;
}

/* Header */
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: -1.5px;
  margin: 0;
}

.logout-icon-btn {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-icon-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

/* Profile Card Glass */
.profile-card-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 32px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
}

.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.main-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.edit-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  background: #db2777;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #1a1a1a;
  transition: transform 0.2s ease;
}

.edit-badge:hover {
  transform: scale(1.1);
}

.user-name {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
}

.name-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.verified-badge-icon {
  color: #3b82f6;
  fill: rgba(59, 130, 246, 0.2);
  width: 24px;
  height: 24px;
}

.user-location {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.5px;
}

.text-verified {
  color: #60a5fa;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.1);
}

/* Action Cards */
.profile-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 640px) {
  .profile-actions-grid { grid-template-columns: 1fr; }
}

.action-card-glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
}

.action-card-glass:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.2);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-icon.settings { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.action-icon.safety { background: rgba(16, 185, 129, 0.15); color: #34d399; }

.action-text h3 {
  font-size: 1rem;
  font-weight: 800;
  margin: 0 0 2px;
}

.action-text p {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.4;
}

/* Info Sections */
.info-sections-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.glass-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: #db2777;
}

.section-header h3 {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 1px;
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
}

.bio-content {
  font-size: 1.05rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 20px;
}

.meta-details-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.modern-tag {
  padding: 10px 20px;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
}

.relation { background: rgba(219, 39, 119, 0.15); color: #f472b6; }
.interest { background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.1); }

.preferences-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pref-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.pref-row:last-child { border-bottom: none; }

.pref-row span:first-child {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.pref-val {
  font-weight: 800;
  color: white;
}

/* Loading */
.profile-loading {
  text-align: center;
  padding: 100px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: white;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 480px) {
  .profile-hero { flex-direction: column; text-align: center; gap: 16px; }
  .user-name { font-size: 1.75rem; }
  .profile-card-glass { padding: 24px 16px; }
  .page-title { font-size: 2rem; }
}
</style>
