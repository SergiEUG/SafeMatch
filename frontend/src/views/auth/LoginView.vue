<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import { Heart, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    error.value = 'Por favor, rellena todos los campos';
    return;
  }

  isLoading.value = true;
  error.value = '';
  
  try {
    const success = await authStore.login(email.value, password.value);
    if (success) {
      router.push('/');
    } else {
      error.value = 'Email o contraseña incorrectos';
    }
  } catch (e: any) {
    error.value = e.message || 'Error al iniciar sesión';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login-page-container">
    <!-- Immersive Background with Dynamic Gradient and Abstract Pattern -->
    <div class="immersive-bg"></div>
    <div class="abstract-pattern-overlay" style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm10-20h2v12h-2v-12zm-10 0h2v12h-2v-12zm-10 0h2v12h-2v-12zm-10 0h2v12h-2v-12zM36 0v-2h-2v2h-4v2h4v4h2V4h4V2h-4zM36 40v-2h-2v2h-4v2h4v4h2v-4h4v-2h-4zM0 0h2v12h-2v-12zM0 40h2v12h-2v-12z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>

    <!-- Central Glassmorphism Login Card -->
    <div class="login-card">
      <header class="card-header">
        <div class="brand-logo">
          <div class="heart-icon-wrapper">
            <Heart class="heart-icon" />
          </div>
          <h1 class="app-title">SafeMatch</h1>
        </div>
        <p class="card-subtitle">Inicia sesión en SafeMatch y encuentra tu próxima conexión apasionada.</p>
      </header>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div v-if="error" class="error-message animate-shake">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ error }}
        </div>

        <div class="form-field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            required
          />
        </div>

        <div class="form-field">
          <label for="password">Contraseña</label>
          <div class="password-input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="toggle-visibility-btn"
            >
              <EyeOff v-if="showPassword" />
              <Eye v-else />
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="login-button"
        >
          <Loader2 v-if="isLoading" class="loader-icon animate-spin" />
          <span v-else>Iniciar Sesión</span>
          <ArrowRight v-if="!isLoading" class="arrow-icon" />
        </button>

        <router-link to="/register" class="register-button">
          Únete ahora
          <ArrowRight class="arrow-icon" />
        </router-link>
      </form>

      <footer class="card-footer">
        <p>
          ¿Olvidaste tu contraseña?
          <router-link to="/forgot-password">
            Recuperar
          </router-link>
        </p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
@import '../../assets/app-style.css';
</style>
