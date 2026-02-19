<script setup lang="ts">
import { reactive, ref, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../services/api';
import { Heart, Loader2, ArrowRight, User, Mail, Lock, Calendar, Phone } from 'lucide-vue-next';

const router = useRouter();

const formState = reactive({
  nombre: '',
  email: '',
  password: '',
  fechaNacimiento: '',
  genero: 'masculino',
  telefono: '',
});

const isLoading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  if (!formState.nombre || !formState.email || !formState.password || !formState.fechaNacimiento || !formState.telefono) {
    error.value = 'Por favor, rellena todos los campos obligatorios';
    return;
  }

  isLoading.value = true;
  error.value = '';
  
  try {
    const payload = { ...formState };
    payload.telefono = '+34' + payload.telefono; // Prepend +34

    const response = await api.register(payload);
    if (response.success) {
      alert('¡Cuenta creada! Ahora puedes iniciar sesión.');
      router.push('/login');
    } else {
      error.value = response.message || 'No se pudo completar el registro';
    }
  } catch (e: any) {
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
};

const { nombre, email, password, fechaNacimiento, genero, telefono } = toRefs(formState);
</script>

<template>
  <div class="login-page-container">
    <!-- Immersive Background with Dynamic Gradient and Abstract Pattern -->
    <div class="immersive-bg"></div>
    <div class="abstract-pattern-overlay" style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm10-20h2v12h-2v-12zm-10 0h2v12h-2v-12zm-10 0h2v12h-2v-12zm-10 0h2v12h-2v-12zM36 0v-2h-2v2h-4v2h4v4h2V4h4V2h-4zM36 40v-2h-2v2h-4v2h4v4h2v-4h4v-2h-4zM0 0h2v12h-2v-12zM0 40h2v12h-2v-12z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>

    <!-- Central Glassmorphism Auth Card -->
    <div class="login-card">
      <header class="card-header">
        <div class="brand-logo">
          <div class="heart-icon-wrapper">
            <Heart class="heart-icon" />
          </div>
          <h1 class="app-title">SafeMatch</h1>
        </div>
        <p class="card-subtitle">Únete a SafeMatch para encontrar tu pareja ideal hoy mismo.</p>
      </header>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div v-if="error" class="error-message animate-shake">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ error }}
        </div>

        <div class="form-field">
          <label for="nombre">Nombre Completo</label>
          <div class="input-wrapper">
            <User class="input-icon" />
            <input 
              id="nombre"
              v-model="nombre" 
              type="text" 
              placeholder="Tu nombre completo"
              class="has-icon"
              required 
            />
          </div>
        </div>

        <div class="form-field">
          <label for="email">Email</label>
          <div class="input-wrapper">
            <Mail class="input-icon" />
            <input 
              id="email"
              v-model="email" 
              type="email" 
              placeholder="tu@email.com"
              class="has-icon"
              required 
            />
          </div>
        </div>

        <div class="form-field">
          <label for="fechaNacimiento">Fecha de Nacimiento</label>
          <div class="input-wrapper">
            <Calendar class="input-icon" />
            <input 
              id="fechaNacimiento"
              v-model="fechaNacimiento" 
              type="date" 
              class="has-icon"
              required 
            />
          </div>
        </div>
          
        <div class="form-field">
          <label for="telefono">Número de Teléfono</label>
          <div class="input-wrapper">
            <Phone class="input-icon" />
            <input
              id="telefono"
              v-model="telefono"
              type="tel"
              placeholder="Ej: 600123456"
              class="has-icon"
              required
            />
          </div>
        </div>

        <div class="form-field">
          <label for="genero">Género</label>
          <select
            id="genero"
            v-model="genero"
            required
          >
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div class="form-field">
          <label for="password">Contraseña</label>
          <div class="input-wrapper">
            <Lock class="input-icon" />
            <input 
              id="password"
              v-model="password" 
              type="password" 
              placeholder="Mínimo 6 caracteres"
              class="has-icon"
              required 
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="login-button"
        >
          <Loader2 v-if="isLoading" class="loader-icon animate-spin" />
          <span v-else>Continuar</span>
          <ArrowRight v-if="!isLoading" class="arrow-icon" />
        </button>
      </form>

      <footer class="card-footer">
        <p>
          ¿Ya tienes cuenta?
          <router-link to="/login">
            Inicia sesión aquí
          </router-link>
        </p>
        <p class="terms-policy-text">
          Al registrarte, aceptas nuestros <router-link to="/terms">Términos y Condiciones</router-link> y nuestra <router-link to="/privacy">Política de Privacidad</router-link>.
        </p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
@import '../../assets/app-style.css';
</style>
