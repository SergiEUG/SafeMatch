<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { toast } from '../composables/useToast';
import { 
  ArrowLeft, 
  Check, 
  Plus, 
  X, 
  MapPin, 
  Navigation,
  Image as ImageIcon,
  User,
  Sparkles,
  Zap
} from 'lucide-vue-next';

const props = defineProps<{
  user: any
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update', data: any): Promise<boolean>;
}>();

const isSaving = ref(false);
const isLocating = ref(false);
const newInterest = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

// Clonamos los datos para editarlos localmente
const formData = reactive({
  biografia: props.user?.biografia || '',
  busco: props.user?.busco?.length ? [props.user.busco[0]] : ['todos'],
  intereses: [...(props.user?.intereses || [])],
  ubicacion: {
    ciudad: props.user?.ubicacion?.ciudad || '',
    lat: Array.isArray(props.user?.ubicacion?.coordinates) ? props.user.ubicacion.coordinates[1] : null,
    lng: Array.isArray(props.user?.ubicacion?.coordinates) ? props.user.ubicacion.coordinates[0] : null,
  },
  configuracion: {
    rangoEdad: {
      min: props.user?.configuracion?.rangoEdad?.min || 18,
      max: props.user?.configuracion?.rangoEdad?.max || 99
    },
    distanciaMaxima: props.user?.configuracion?.distanciaMaxima || 50
  },
  fotos: [...(props.user?.fotos || [])]
});

const syncFromUser = (user: any) => {
  formData.biografia = user?.biografia || '';
  formData.busco = user?.busco?.length ? [user.busco[0]] : ['todos'];
  formData.intereses = [...(user?.intereses || [])];
  formData.ubicacion.ciudad = user?.ubicacion?.ciudad || '';
  formData.ubicacion.lat = Array.isArray(user?.ubicacion?.coordinates) ? user.ubicacion.coordinates[1] : null;
  formData.ubicacion.lng = Array.isArray(user?.ubicacion?.coordinates) ? user.ubicacion.coordinates[0] : null;
  formData.configuracion.rangoEdad.min = user?.configuracion?.rangoEdad?.min || 18;
  formData.configuracion.rangoEdad.max = user?.configuracion?.rangoEdad?.max || 99;
  formData.configuracion.distanciaMaxima = user?.configuracion?.distanciaMaxima || 50;
  formData.fotos = [...(user?.fotos || [])];
};

watch(() => props.user, (u) => syncFromUser(u), { deep: true });

const addInterest = () => {
  const interest = newInterest.value.trim();
  if (!interest) return;
  if (formData.intereses.length >= 10) {
    toast.warning('Máximo 10 intereses');
    return;
  }
  if (formData.intereses.includes(interest)) {
    toast.info('Ya añadido');
    return;
  }
  formData.intereses.push(interest);
  newInterest.value = '';
};

const removeInterest = (i: number) => {
  formData.intereses.splice(i, 1);
};

const removePhoto = (i: number) => {
  if (confirm('¿Eliminar esta foto?')) {
    formData.fotos.splice(i, 1);
  }
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    const files = Array.from(target.files);
    files.forEach(file => {
      if (formData.fotos.length >= 6) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) formData.fotos.push(e.target.result as string);
      };
      reader.readAsDataURL(file);
    });
    target.value = '';
  }
};

const useMyLocation = async () => {
  if (!('geolocation' in navigator)) return;
  isLocating.value = true;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
    });
    formData.ubicacion.lat = pos.coords.latitude;
    formData.ubicacion.lng = pos.coords.longitude;
    toast.success('Ubicación actualizada');
  } catch (e) {
    toast.error('No se pudo obtener la ubicación');
  } finally {
    isLocating.value = false;
  }
};

const saveAndClose = async () => {
  if (formData.configuracion.rangoEdad.min > formData.configuracion.rangoEdad.max) {
    toast.error('Edad mínima inválida');
    return;
  }
  
  isSaving.value = true;
  const payload = {
    biografia: formData.biografia,
    busco: formData.busco,
    intereses: formData.intereses,
    ubicacion: {
      ciudad: formData.ubicacion.ciudad,
      ...(typeof formData.ubicacion.lat === 'number' && typeof formData.ubicacion.lng === 'number'
        ? { type: 'Point', coordinates: [formData.ubicacion.lng, formData.ubicacion.lat] }
        : {}),
    },
    configuracion: {
      rangoEdad: formData.configuracion.rangoEdad,
      distanciaMaxima: formData.configuracion.distanciaMaxima
    },
    fotos: formData.fotos
  };

  const success = await emit('update', payload);
  isSaving.value = false;
  if (success) emit('close');
};
</script>

<template>
  <div class="settings-viewport">
    <!-- Header -->
    <header class="settings-glass-header">
      <button class="icon-btn" @click="$emit('close')">
        <ArrowLeft class="h-6 w-6" />
      </button>
      <h2>Ajustes de Perfil</h2>
      <button class="save-btn" @click="saveAndClose" :disabled="isSaving">
        <Check v-if="!isSaving" class="h-5 w-5" />
        <span v-else class="mini-spinner"></span>
        <span>Guardar</span>
      </button>
    </header>

    <div class="settings-scroll-area">
      <div class="settings-content">
        
        <!-- Photos Section -->
        <section class="settings-card photo-section">
          <div class="section-label">
            <ImageIcon class="h-4 w-4" />
            <span>TUS FOTOS ({{ formData.fotos.length }}/6)</span>
          </div>
          <div class="photos-grid">
            <div v-for="(foto, i) in formData.fotos" :key="i" class="photo-item">
              <img :src="foto" />
              <button class="delete-btn" @click="removePhoto(i)">
                <X class="h-4 w-4" />
              </button>
            </div>
            <div v-if="formData.fotos.length < 6" class="add-photo-box" @click="fileInput?.click()">
              <Plus class="h-8 w-8" />
              <input type="file" @change="handleFileUpload" accept="image/*" multiple hidden ref="fileInput" />
            </div>
          </div>
        </section>

        <!-- About Me -->
        <section class="settings-card">
          <div class="section-label">
            <User class="h-4 w-4" />
            <span>SOBRE MÍ</span>
          </div>
          <textarea 
            v-model="formData.biografia" 
            placeholder="Cuéntanos algo sobre ti..."
            class="modern-textarea"
          ></textarea>
        </section>

        <!-- Discovery Preferences -->
        <section class="settings-card">
          <div class="section-label">
            <Zap class="h-4 w-4" />
            <span>PREFERENCIAS DE DESCUBRIMIENTO</span>
          </div>
          
          <div class="input-group">
            <label>Busco</label>
            <div class="modern-select-wrap">
              <select v-model="formData.busco[0]" class="modern-select">
                <option value="masculino">Hombres</option>
                <option value="femenino">Mujeres</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </div>

          <div class="input-group">
            <label>Rango de edad: {{ formData.configuracion.rangoEdad.min }} - {{ formData.configuracion.rangoEdad.max }}</label>
            <div class="range-inputs">
              <input type="range" v-model.number="formData.configuracion.rangoEdad.min" min="18" max="99" class="modern-range" />
              <input type="range" v-model.number="formData.configuracion.rangoEdad.max" min="18" max="99" class="modern-range" />
            </div>
          </div>

          <div class="input-group">
            <label>Distancia máxima: {{ formData.configuracion.distanciaMaxima }} km</label>
            <input type="range" v-model.number="formData.configuracion.distanciaMaxima" min="1" max="500" class="modern-range" />
          </div>
        </section>

        <!-- Interests -->
        <section class="settings-card">
          <div class="section-label">
            <Sparkles class="h-4 w-4" />
            <span>INTERESES</span>
          </div>
          <div class="interest-input-wrap">
            <input 
              v-model="newInterest" 
              type="text" 
              placeholder="Añadir interés..." 
              @keyup.enter="addInterest"
              class="modern-input"
            />
            <button @click="addInterest" class="add-tag-btn">Añadir</button>
          </div>
          <div class="interests-cloud">
            <span v-for="(tag, i) in formData.intereses" :key="i" class="editable-tag">
              {{ tag }}
              <X class="h-3 w-3" @click="removeInterest(i)" />
            </span>
          </div>
        </section>

        <!-- Location -->
        <section class="settings-card">
          <div class="section-label">
            <MapPin class="h-4 w-4" />
            <span>UBICACIÓN</span>
          </div>
          <div class="location-box">
            <input 
              v-model="formData.ubicacion.ciudad" 
              type="text" 
              placeholder="Tu ciudad" 
              class="modern-input"
            />
            <button class="locate-btn" @click="useMyLocation" :disabled="isLocating">
              <Navigation class="h-4 w-4" :class="{ 'anim-pulse': isLocating }" />
              <span>{{ isLocating ? 'Localizando...' : 'Mi ubicación' }}</span>
            </button>
          </div>
        </section>

        <div class="bottom-spacer"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-viewport {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: #0f172a;
  display: flex;
  flex-direction: column;
}

/* Header */
.settings-glass-header {
  height: 70px;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  color: white;
}

.settings-glass-header h2 {
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
}

.icon-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.icon-btn:hover { opacity: 1; }

.save-btn {
  background: white;
  color: #0f172a;
  border: none;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.save-btn:hover { transform: scale(1.05); }

/* Content */
.settings-scroll-area {
  flex: 1;
  overflow-y: auto;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.settings-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 24px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 1px;
  margin-bottom: 16px;
}

/* Photos */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.photo-item {
  position: relative;
  aspect-ratio: 3/4;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-photo-box {
  aspect-ratio: 3/4;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.2s;
}

.add-photo-box:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: white;
  color: white;
}

/* Inputs */
.modern-textarea {
  width: 100%;
  height: 120px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  color: white;
  font-family: inherit;
  resize: none;
  outline: none;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.modern-select-wrap {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modern-select {
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: white;
  outline: none;
  cursor: pointer;
}

.modern-range {
  width: 100%;
  accent-color: #db2777;
  height: 6px;
  border-radius: 3px;
  margin: 10px 0;
}

.range-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Interests */
.interest-input-wrap {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.modern-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  color: white;
  outline: none;
}

.add-tag-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  padding: 0 20px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
}

.interests-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.editable-tag {
  background: white;
  color: #0f172a;
  padding: 6px 12px;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.editable-tag svg {
  cursor: pointer;
  opacity: 0.5;
}

.editable-tag svg:hover { opacity: 1; color: #ef4444; }

/* Location */
.location-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.locate-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.locate-btn:disabled { opacity: 0.5; }

.bottom-spacer { height: 40px; }

.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0,0,0,0.1);
  border-top-color: #0f172a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
.anim-pulse { animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
