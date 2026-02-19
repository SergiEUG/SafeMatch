<template>
  <div class="profile-container">
    <!-- LOADING STATE -->
    <div v-if="isLoading" class="loading-screen">
      <div class="spinner"></div>
      <p>Cargando perfil...</p>
    </div>

    <!-- MODO VISUALIZACIÓN (Por defecto) -->
    <div v-else-if="!isEditing" class="profile-view">
      <!-- Header con foto principal -->
      <div class="profile-header">
        <div class="profile-photo-main">
          <img 
            :src="profileData.fotos?.[0] || '/placeholder-user.jpg'" 
            alt="Foto de perfil"
            @error="handleImageError"
          />
        </div>
        <h1 class="profile-name">{{ profileData.nombre }}, {{ calculatedAge || '—' }}</h1>
        <p v-if="profileData.ubicacion?.ciudad" class="profile-location">
          📍 {{ profileData.ubicacion.ciudad }}
        </p>
      </div>

      <!-- Botones de acción -->
      <div class="action-buttons">
        <button class="btn-action btn-edit" @click="startEditing">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          <span>Editar Perfil</span>
        </button>

        <button class="btn-action btn-preview" @click="showPreview = true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
          <span>Ver Tarjeta</span>
        </button>

        <button class="btn-action btn-add-photo" @click="triggerPhotoUpload">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          <span>Añadir Foto</span>
        </button>
      </div>

      <!-- Información del perfil -->
      <div class="profile-sections">
        <!-- Sobre mí -->
        <div v-if="profileData.biografia" class="profile-section">
          <h3>Sobre mí</h3>
          <p>{{ profileData.biografia }}</p>
        </div>

        <!-- Intereses -->
        <div v-if="profileData.intereses?.length" class="profile-section">
          <h3>Intereses</h3>
          <div class="interests-grid">
            <span v-for="(interest, i) in profileData.intereses" :key="i" class="interest-tag">
              {{ interest }}
            </span>
          </div>
        </div>

        <!-- Fotos -->
        <div v-if="profileData.fotos?.length" class="profile-section">
          <h3>Mis Fotos ({{ profileData.fotos.length }}/6)</h3>
          <div class="photos-grid">
            <div v-for="(foto, i) in profileData.fotos" :key="i" class="photo-item">
              <img :src="foto" :alt="`Foto ${Number(i) + 1}`" />
            </div>
          </div>
        </div>
      </div>

      <!-- Botón cerrar sesión -->
      <button class="btn-logout" @click="handleLogout">
        Cerrar Sesión
      </button>
    </div>

    <!-- MODO EDICIÓN -->
    <div v-else class="edit-view">
      <div class="edit-header">
        <button class="btn-back" @click="cancelEditing">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h2>Editar Perfil</h2>
        <button class="btn-save" @click="saveProfile" :disabled="isSaving">
          {{ isSaving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>

      <div class="edit-content">
        <!-- Sobre mí -->
        <div class="form-group">
          <label>Sobre mí</label>
          <textarea 
            v-model="editForm.biografia" 
            placeholder="Cuéntanos sobre ti..."
            maxlength="500"
          ></textarea>
          <span class="char-count">{{ editForm.biografia.length }}/500</span>
        </div>

        <!-- Qué busco -->
        <div class="form-group">
          <label>Qué busco</label>
          <select v-model="editForm.busco[0]">
            <option value="masculino">Hombres</option>
            <option value="femenino">Mujeres</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        <!-- Intereses -->
        <div class="form-group">
          <label>Intereses ({{ editForm.intereses.length }}/10)</label>
          <div class="interest-input">
            <input 
              v-model="newInterest" 
              @keyup.enter="addInterest"
              placeholder="Añade un interés..."
              maxlength="30"
            />
            <button @click="addInterest" class="btn-add-interest">+</button>
          </div>
          <div class="interests-list">
            <span v-for="(interest, i) in editForm.intereses" :key="i" class="interest-chip">
              {{ interest }}
              <button @click="removeInterest(i)" class="btn-remove">×</button>
            </span>
          </div>
        </div>

        <!-- Edad -->
        <div class="form-group">
          <label>Rango de edad que buscas</label>
          <div class="age-range">
            <div class="age-input">
              <label>Mín</label>
              <input 
                type="number" 
                v-model.number="editForm.configuracion.rangoEdad.min" 
                min="18" 
                max="99"
              />
            </div>
            <div class="age-input">
              <label>Máx</label>
              <input 
                type="number" 
                v-model.number="editForm.configuracion.rangoEdad.max" 
                min="18" 
                max="99"
              />
            </div>
          </div>
        </div>

        <!-- Ubicación -->
        <div class="form-group">
          <label>Ubicación</label>
          <input 
            type="text" 
            v-model="editForm.ubicacion.ciudad" 
            placeholder="Tu ciudad"
          />
          <div class="location-row">
            <input
              type="number"
              v-model.number="editForm.ubicacion.lat"
              step="0.000001"
              placeholder="Latitud"
            />
            <input
              type="number"
              v-model.number="editForm.ubicacion.lng"
              step="0.000001"
              placeholder="Longitud"
            />
          </div>
          <button class="btn-location" @click="useMyLocation" :disabled="isLocating">
            {{ isLocating ? 'Obteniendo ubicación…' : 'Usar mi ubicación' }}
          </button>
        </div>

        <!-- Fotos -->
        <div class="form-group">
          <label>Mis Fotos ({{ editForm.fotos.length }}/6)</label>
          <div class="photos-edit-grid">
            <div v-for="(foto, i) in editForm.fotos" :key="i" class="photo-edit-item">
              <img :src="foto" />
              <button @click="removePhoto(i)" class="btn-delete-photo">×</button>
            </div>
            <button 
              v-if="editForm.fotos.length < 6" 
              @click="triggerPhotoUpload"
              class="photo-add-placeholder"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
              <span>Añadir foto</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- PREVIEW MODAL -->
    <div v-if="showPreview" class="preview-modal" @click="showPreview = false">
      <div class="preview-content" @click.stop>
        <div class="preview-card">
          <img 
            :src="profileData.fotos?.[0] || '/placeholder-user.jpg'" 
            alt="Preview"
            class="preview-image"
          />
          <div class="preview-info">
            <h2>{{ profileData.nombre }}, {{ calculatedAge || '—' }}</h2>
            <p v-if="profileData.biografia">{{ profileData.biografia }}</p>
            <div v-if="profileData.intereses?.length" class="preview-interests">
              <span v-for="(i, idx) in profileData.intereses.slice(0, 3)" :key="idx">{{ i }}</span>
            </div>
          </div>
        </div>
        <button @click="showPreview = false" class="btn-close-preview">Cerrar</button>
      </div>
    </div>

    <!-- Input oculto para fotos -->
    <input 
      type="file" 
      ref="fileInput" 
      @change="handlePhotoUpload" 
      accept="image/*"
      style="display: none;"
    />

    <!-- Loading overlay -->
    <div v-if="isSaving" class="saving-overlay">
      <div class="spinner"></div>
      <p>Guardando cambios...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import { api } from '../../services/api';

const router = useRouter();
const authStore = useAuthStore();

const isLoading = ref(true);
const isEditing = ref(false);
const isSaving = ref(false);
const showPreview = ref(false);
const newInterest = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const isLocating = ref(false);

// Datos del perfil (fuente de verdad)
const profileData = ref<any>({
  nombre: '',
  edad: null,
  biografia: '',
  fotos: [],
  intereses: [],
  ubicacion: { ciudad: '' },
  configuracion: {
    rangoEdad: { min: 18, max: 99 }
  },
  fechaNacimiento: null,
  busco: ['todos']
});

// Formulario de edición (copia temporal)
const editForm = reactive({
  biografia: '',
  busco: ['todos'],
  intereses: [] as string[],
  ubicacion: { ciudad: '', lat: null as number | null, lng: null as number | null },
  configuracion: {
    rangoEdad: { min: 18, max: 99 }
  },
  fotos: [] as string[]
});

// Calcular edad
const calculatedAge = computed(() => {
  if (!profileData.value.fechaNacimiento) return null;
  const birth = new Date(profileData.value.fechaNacimiento);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
});

// Cargar datos del perfil
const loadProfile = async () => {
  isLoading.value = true;
  try {
    console.log('🔄 Cargando perfil desde backend...');
    const response = await api.getCurrentUser();
    
    if (response.success && response.data?.usuario) {
      const user = response.data.usuario;
      console.log('✅ Perfil cargado:', user);
      
      profileData.value = {
        nombre: user.nombre || '',
        edad: user.edad,
        biografia: user.biografia || '',
        fotos: user.fotos || [],
        intereses: user.intereses || [],
        ubicacion: user.ubicacion || { ciudad: '' },
        configuracion: user.configuracion || { rangoEdad: { min: 18, max: 99 } },
        fechaNacimiento: user.fechaNacimiento,
        busco: user.busco || ['todos']
      };

      // Actualizar store
      authStore.updateUser(user);
    } else {
      console.error('❌ Error al cargar perfil: respuesta inválida');
      alert('Error al cargar el perfil');
    }
  } catch (error: any) {
    console.error('❌ Error al cargar perfil:', error);
    alert('Error al cargar el perfil: ' + (error.message || 'Unknown error'));
  } finally {
    isLoading.value = false;
  }
};

// Iniciar edición
const startEditing = () => {
  console.log('📝 Iniciando edición...');
  // Copiar datos actuales al formulario
  editForm.biografia = profileData.value.biografia;
  editForm.busco = [...profileData.value.busco];
  editForm.intereses = [...profileData.value.intereses];
  editForm.ubicacion = {
    ciudad: profileData.value.ubicacion?.ciudad || '',
    lat: Array.isArray(profileData.value.ubicacion?.coordinates) ? profileData.value.ubicacion.coordinates[1] : null,
    lng: Array.isArray(profileData.value.ubicacion?.coordinates) ? profileData.value.ubicacion.coordinates[0] : null,
  };
  editForm.configuracion = JSON.parse(JSON.stringify(profileData.value.configuracion));
  editForm.fotos = [...profileData.value.fotos];
  
  isEditing.value = true;
};

// Cancelar edición
const cancelEditing = () => {
  console.log('❌ Cancelando edición...');
  isEditing.value = false;
};

// Guardar perfil
const saveProfile = async () => {
  console.log('💾 Guardando perfil...');
  
  // Validar
  if (editForm.configuracion.rangoEdad.min > editForm.configuracion.rangoEdad.max) {
    alert('La edad mínima no puede ser mayor que la máxima');
    return;
  }

  isSaving.value = true;

  try {
    const payload = {
      biografia: editForm.biografia,
      busco: editForm.busco,
      intereses: editForm.intereses,
      ubicacion: {
        ciudad: editForm.ubicacion.ciudad,
        ...(typeof editForm.ubicacion.lat === 'number' && typeof editForm.ubicacion.lng === 'number'
          ? { type: 'Point', coordinates: [editForm.ubicacion.lng, editForm.ubicacion.lat] }
          : {}),
      },
      configuracion: {
        rangoEdad: editForm.configuracion.rangoEdad
      },
      fotos: editForm.fotos
    };

    console.log('📤 Enviando:', payload);
    const response = await api.updateProfile(payload);

    if (response.success) {
      console.log('✅ Perfil guardado correctamente');
      alert('Perfil actualizado correctamente ✨');
      
      // Recargar datos
      await loadProfile();
      
      // Salir del modo edición
      isEditing.value = false;
    } else {
      throw new Error('Error al guardar');
    }
  } catch (error: any) {
    console.error('❌ Error al guardar:', error);
    alert('Error al guardar: ' + (error.message || 'Unknown error'));
  } finally {
    isSaving.value = false;
  }
};

const useMyLocation = async () => {
  if (!('geolocation' in navigator)) {
    alert('Tu navegador no soporta geolocalización');
    return;
  }
  isLocating.value = true;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    });
    editForm.ubicacion.lat = pos.coords.latitude;
    editForm.ubicacion.lng = pos.coords.longitude;
    alert('Ubicación capturada');
  } catch (e: any) {
    alert(e?.message || 'No se pudo obtener tu ubicación');
  } finally {
    isLocating.value = false;
  }
};

// Añadir interés
const addInterest = () => {
  const interest = newInterest.value.trim();
  if (!interest) return;
  
  if (editForm.intereses.length >= 10) {
    alert('Máximo 10 intereses');
    return;
  }

  if (editForm.intereses.includes(interest)) {
    alert('Este interés ya existe');
    return;
  }

  editForm.intereses.push(interest);
  newInterest.value = '';
};

// Eliminar interés
const removeInterest = (index: number) => {
  editForm.intereses.splice(index, 1);
};

// Trigger upload de foto
const triggerPhotoUpload = () => {
  const currentPhotos = isEditing.value ? editForm.fotos.length : profileData.value.fotos.length;
  
  if (currentPhotos >= 6) {
    alert('Máximo 6 fotos');
    return;
  }
  
  fileInput.value?.click();
};

// Manejar upload de foto
const handlePhotoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  // Validar
  if (!file.type.startsWith('image/')) {
    alert('Por favor selecciona una imagen válida');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('La imagen no puede superar 5MB');
    return;
  }

  // Leer imagen
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target?.result as string;
    
    if (isEditing.value) {
      // Añadir al formulario de edición
      editForm.fotos.push(base64);
    } else {
      // Guardar directamente
      isSaving.value = true;
      try {
        const updatedPhotos = [...profileData.value.fotos, base64];
        const response = await api.updateProfile({ fotos: updatedPhotos });
        
        if (response.success) {
          alert('Foto añadida correctamente 📸');
          await loadProfile();
        }
      } catch (error) {
        alert('Error al subir la foto');
      } finally {
        isSaving.value = false;
      }
    }
    
    // Reset input
    target.value = '';
  };

  reader.readAsDataURL(file);
};

// Eliminar foto
const removePhoto = (index: number) => {
  if (confirm('¿Eliminar esta foto?')) {
    editForm.fotos.splice(index, 1);
  }
};

// Manejar error de imagen
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = '/placeholder-user.jpg';
};

// Logout
const handleLogout = async () => {
  if (confirm('¿Seguro que quieres cerrar sesión?')) {
    await authStore.logout();
    router.push('/login');
  }
};

// Cargar al montar
onMounted(async () => {
  console.log('🚀 Componente ProfileView montado');
  await loadProfile();
});
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 80px;
}

/* LOADING */
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #fd267d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* VISTA PERFIL */
.profile-view {
  padding: 20px;
}

.profile-header {
  text-align: center;
  margin-bottom: 30px;
}

.profile-photo-main {
  width: 150px;
  height: 150px;
  margin: 0 auto 20px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #fff;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.profile-photo-main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-name {
  font-size: 1.8rem;
  font-weight: 800;
  color: #333;
  margin: 10px 0;
}

.profile-location {
  color: #666;
  font-size: 0.95rem;
}

/* BOTONES ACCIÓN */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.btn-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: white;
  border: 2px solid #eee;
  border-radius: 15px;
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 100px;
  max-width: 150px;
}

.btn-action svg {
  width: 24px;
  height: 24px;
}

.btn-action span {
  font-size: 0.8rem;
  font-weight: 700;
}

.btn-edit {
  color: #fd267d;
  border-color: #fd267d;
}

.btn-preview {
  color: #666;
}

.btn-add-photo {
  color: #10b981;
  border-color: #10b981;
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* SECCIONES */
.profile-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-section {
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.profile-section h3 {
  font-size: 0.9rem;
  font-weight: 800;
  color: #333;
  text-transform: uppercase;
  margin-bottom: 15px;
  letter-spacing: 0.5px;
}

.interests-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.interest-tag {
  background: #f0f2f5;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.photo-item {
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* MODO EDICIÓN */
.edit-view {
  background: white;
  min-height: 100vh;
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}

.edit-header h2 {
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
}

.btn-back, .btn-save {
  background: none;
  border: none;
  color: #fd267d;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  padding: 5px 10px;
}

.btn-back svg {
  width: 24px;
  height: 24px;
}

.btn-save:disabled {
  opacity: 0.5;
}

.edit-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  color: #888;
  margin-bottom: 10px;
  text-transform: uppercase;
}

textarea, input[type="text"], input[type="number"], select {
  width: 100%;
  padding: 15px;
  border-radius: 12px;
  border: 1px solid #eee;
  font-family: inherit;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.location-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}

.btn-location {
  margin-top: 10px;
  width: 100%;
  padding: 12px 15px;
  border-radius: 12px;
  border: 1px solid #eee;
  background: #f8f9fa;
  font-weight: 800;
  cursor: pointer;
}

.btn-location:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.char-count {
  font-size: 0.75rem;
  color: #999;
  margin-top: 5px;
  display: block;
}

.interest-input {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.interest-input input {
  flex: 1;
}

.btn-add-interest {
  width: 50px;
  background: #fd267d;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.5rem;
  cursor: pointer;
  font-weight: bold;
}

.interests-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.interest-chip {
  background: #f0f2f5;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-remove {
  background: none;
  border: none;
  color: #ff4458;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.age-range {
  display: flex;
  gap: 15px;
}

.age-input {
  flex: 1;
  background: #f8f9fa;
  padding: 10px 15px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.age-input label {
  font-size: 0.8rem;
  color: #888;
  margin: 0;
  text-transform: none;
}

.age-input input {
  width: 60px;
  border: none;
  background: transparent;
  text-align: right;
  font-weight: 800;
  padding: 0;
}

.photos-edit-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.photo-edit-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
}

.photo-edit-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-delete-photo {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 30px;
  height: 30px;
  background: rgba(0,0,0,0.7);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.photo-add-placeholder {
  aspect-ratio: 1;
  background: #f8f9fa;
  border: 2px dashed #ddd;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  gap: 5px;
}

.photo-add-placeholder svg {
  width: 30px;
  height: 30px;
  color: #999;
}

.photo-add-placeholder span {
  font-size: 0.75rem;
  color: #999;
  font-weight: 600;
}

/* PREVIEW MODAL */
.preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-content {
  max-width: 400px;
  width: 100%;
}

.preview-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.preview-image {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
}

.preview-info {
  padding: 20px;
}

.preview-info h2 {
  font-size: 1.5rem;
  margin: 0 0 10px 0;
}

.preview-info p {
  margin: 10px 0;
  color: #666;
}

.preview-interests {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 15px;
}

.preview-interests span {
  background: #f0f2f5;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
}

.btn-close-preview {
  width: 100%;
  margin-top: 20px;
  padding: 15px;
  background: white;
  border: none;
  border-radius: 30px;
  font-weight: 800;
  cursor: pointer;
}

/* LOGOUT */
.btn-logout {
  width: 100%;
  margin-top: 30px;
  padding: 15px;
  background: transparent;
  border: none;
  color: #ff4458;
  font-weight: 800;
  cursor: pointer;
}

/* SAVING OVERLAY */
.saving-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.9);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}
</style>
