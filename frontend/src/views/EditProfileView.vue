<template>
  <div class="edit-profile-wrapper">
    <div v-if="isLoading" class="loading-state">Cargando perfil...</div>
    <ProfileSettings
      v-else-if="user"
      :user="user"
      @update="handleUpdate"
      @close="navigateBack"
    />
  </div>
</template>

<script>
import ProfileSettings from '@/components/ProfileSettings.vue';
import { useAuthStore } from '@/store/auth';
import { api } from '@/services/api';

export default {
  name: 'EditProfileView',
  components: {
    ProfileSettings,
  },
  data() {
    return {
      isLoading: false
    }
  },
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  computed: {
    user() {
      return this.authStore.user;
    }
  },
  async mounted() {
    // Asegurar que tenemos los datos más frescos del servidor
    this.refreshUser();
  },
  methods: {
    async refreshUser() {
      this.isLoading = true;
      try {
        // Importante: refrescar vía store para mantener también localStorage sincronizado
        const ok = await this.authStore.fetchCurrentUser();
        if (!ok) throw new Error('No se pudo refrescar el usuario');
      } catch (error) {
        console.error('Error refrescando usuario:', error);
        // Si el token es inválido/expiró, forzar logout y volver a login
        try { await this.authStore.logout(); } catch {}
        this.$router.push('/login');
      } finally {
        this.isLoading = false;
      }
    },
    navigateBack() {
      this.$router.back();
    },
    async handleUpdate(newData) {
      try {
        const response = await api.updateProfile(newData);
        if (response.success) {
          // Actualizar store local con la respuesta del servidor (y persistir)
          this.authStore.updateUser(response.data.usuario);
          alert('¡Perfil actualizado con éxito!');
          return true;
        }
        return false;
      } catch (error) {
        alert('Error al actualizar: ' + error.message);
        return false;
      }
    }
  }
};
</script>

<style scoped>
.edit-profile-wrapper {
  background-color: #F5F5F5; /* Mantener el color de fondo consistente */
  min-height: 100vh;
  font-family: 'Montserrat', sans-serif;
}

.loading-state {
  text-align: center;
  padding: 50px;
  color: #999;
}
</style>
