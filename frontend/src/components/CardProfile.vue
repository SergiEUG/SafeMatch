<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Info, 
  MapPin, 
  X, 
  Heart, 
  ChevronDown, 
  Sparkles
} from 'lucide-vue-next';

const props = defineProps<{
  profile: any;
  preview?: boolean;
}>();

const emit = defineEmits(['like', 'reject']);

const currentPhotoIndex = ref(0);
const showDetails = ref(false);

const displayPhotos = computed(() => {
  const photos = props.profile.fotos || [];
  return photos.length > 0 ? photos : ['/placeholder-user.jpg'];
});

const nextPhoto = () => {
  if (currentPhotoIndex.value < displayPhotos.value.length - 1) {
    currentPhotoIndex.value++;
  } else {
    currentPhotoIndex.value = 0;
  }
};

const prevPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--;
  } else {
    currentPhotoIndex.value = displayPhotos.value.length - 1;
  }
};

const likeProfile = () => {
  emit('like', props.profile);
};

const rejectProfile = () => {
  emit('reject', props.profile);
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
  <div class="modern-card" :class="{ 'preview-mode': preview }">
    <!-- Image Section -->
    <div class="image-viewport">
      <img :src="displayPhotos[currentPhotoIndex]" alt="Foto de perfil" class="main-photo">
      
      <!-- Photo Navigation Indicators -->
      <div v-if="displayPhotos.length > 1" class="photo-stepper">
        <div 
          v-for="(_, index) in displayPhotos" 
          :key="index" 
          class="step-dot" 
          :class="{ active: currentPhotoIndex === index }"
        ></div>
      </div>
      
      <!-- Photo Navigation Tap Areas -->
      <div v-if="displayPhotos.length > 1" class="tap-nav">
        <div class="tap-area left" @click.stop="prevPhoto"></div>
        <div class="tap-area right" @click.stop="nextPhoto"></div>
      </div>
      
      <!-- Bottom Vignette -->
      <div class="card-vignette"></div>
    </div>

    <!-- Info Overlay -->
    <div class="info-overlay" @click.stop="showDetails = true">
      <div class="profile-summary">
        <div class="name-age">
          <h2 class="profile-name">{{ profile.nombre || profile.name }}</h2>
          <span class="profile-age">{{ profile.edad || profile.age }}</span>
        </div>
        
        <div class="meta-info">
          <div class="meta-item">
            <MapPin class="meta-icon" />
            <span>{{ profile.ubicacion?.ciudad || 'Cerca de ti' }}</span>
          </div>
        </div>

        <div v-if="profile.intereses?.length" class="interest-preview">
          <span v-for="tag in profile.intereses.slice(0, 2)" :key="tag" class="mini-tag">
            {{ tag }}
          </span>
          <span v-if="profile.intereses.length > 2" class="mini-tag more">
            +{{ profile.intereses.length - 2 }}
          </span>
        </div>
      </div>
      
      <button class="expand-btn">
        <Info class="h-5 w-5" />
      </button>
    </div>

    <!-- Full Details Drawer -->
    <transition name="drawer">
      <div v-if="showDetails" class="details-drawer" @click.stop>
        <div class="drawer-header">
          <button class="collapse-btn" @click.stop="showDetails = false">
            <ChevronDown class="h-8 w-8" />
          </button>
        </div>
        
        <div class="drawer-content">
          <div class="drawer-profile-top">
            <div class="name-age">
              <h2 class="drawer-name">{{ profile.nombre || profile.name }}</h2>
              <span class="drawer-age">{{ profile.edad || profile.age }}</span>
            </div>
            <div class="drawer-meta-list">
              <div class="meta-item">
                <MapPin class="meta-icon" />
                <span>Vive en {{ profile.ubicacion?.ciudad || 'Ubicación no especificada' }}</span>
              </div>
            </div>
          </div>

          <div class="drawer-divider"></div>

          <section class="details-section">
            <div class="section-title">
              <Sparkles class="h-4 w-4" />
              <h3>Sobre mí</h3>
            </div>
            <p class="bio-text">{{ profile.biografia || 'Sin biografía especificada.' }}</p>
          </section>
          
          <section v-if="profile.busco" class="details-section">
            <div class="section-title">
              <Heart class="h-4 w-4" />
              <h3>Busco</h3>
            </div>
            <div class="tag-list">
              <span class="modern-tag relationship">{{ formatRelacion(profile.busco) }}</span>
            </div>
          </section>

          <section v-if="profile.intereses?.length" class="details-section">
            <h3>Intereses</h3>
            <div class="tag-list">
              <span v-for="tag in profile.intereses" :key="tag" class="modern-tag interest">
                {{ tag }}
              </span>
            </div>
          </section>
          
          <div class="drawer-spacer"></div>
        </div>
      </div>
    </transition>

    <!-- Action Bar -->
    <div v-if="!preview" class="floating-actions" :class="{ 'hidden-actions': showDetails }">
      <button class="action-btn circular-btn reject" @click.stop="rejectProfile" aria-label="Rechazar">
        <X class="h-7 w-7 stroke-[3]" />
      </button>

      <button class="action-btn circular-btn like" @click.stop="likeProfile" aria-label="Me gusta">
        <Heart class="h-7 w-7 fill-current" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.modern-card {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 32px;
  overflow: hidden;
  background: #1a1a1a;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.image-viewport {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  background: #2a2a2a;
}

.main-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-stepper {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
  z-index: 10;
}

.step-dot {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.step-dot.active {
  background: white;
}

.tap-nav {
  position: absolute;
  inset: 0;
  display: flex;
  z-index: 5;
}

.tap-area {
  flex: 1;
  height: 100%;
  cursor: pointer;
}

.card-vignette {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 40%, transparent 100%);
  pointer-events: none;
}

/* Info Overlay */
.info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 80px 24px 100px;
  color: white;
  z-index: 15;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  transition: transform 0.3s ease;
}

.profile-summary {
  flex: 1;
}

.name-age {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 4px;
}

.profile-name {
  font-size: 2.2rem;
  font-weight: 900;
  margin: 0;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.profile-age {
  font-size: 1.8rem;
  font-weight: 400;
  opacity: 0.9;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  opacity: 0.9;
}

.meta-icon {
  width: 16px;
  height: 16px;
}

.interest-preview {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.mini-tag {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  padding: 4px 12px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mini-tag.more {
  background: rgba(255, 255, 255, 0.1);
}

.expand-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  color: #333;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.expand-btn:hover {
  transform: scale(1.1);
}

/* Floating Actions */
.floating-actions {
  position: absolute;
  bottom: 24px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  z-index: 40;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hidden-actions {
  transform: translateY(150px);
  opacity: 0;
}

.circular-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.circular-btn:hover {
  transform: translateY(-4px) scale(1.05);
}

.circular-btn:active {
  transform: scale(0.9);
}

.reject {
  background: white;
  color: #ef4444;
}

.reject:hover {
  background: #fffafa;
  box-shadow: 0 10px 25px rgba(239, 68, 68, 0.2);
}

.superlike {
  width: 52px;
  height: 52px;
  background: white;
  color: #3b82f6;
}

.superlike:hover {
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);
}

.like {
  background: linear-gradient(135deg, #f87171 0%, #db2777 100%);
  color: white;
}

.like:hover {
  box-shadow: 0 10px 25px rgba(219, 39, 119, 0.3);
}

/* Details Drawer */
.details-drawer {
  position: absolute;
  inset: 0;
  background: white;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  padding: 12px;
  display: flex;
  justify-content: center;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.collapse-btn {
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  transition: color 0.2s ease;
}

.collapse-btn:hover {
  color: #999;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  color: #1a1a1a;
}

.drawer-profile-top {
  margin-bottom: 24px;
}

.drawer-name {
  font-size: 2.2rem;
  font-weight: 900;
  margin: 0;
  color: #1a1a1a;
}

.drawer-age {
  font-size: 2.2rem;
  font-weight: 300;
  color: #666;
}

.drawer-meta-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drawer-meta-list .meta-item {
  color: #555;
  font-size: 1rem;
}

.drawer-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 24px 0;
}

.details-section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #db2777;
  margin-bottom: 12px;
}

.details-section h3 {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
  color: #999;
}

.bio-text {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #444;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.modern-tag {
  padding: 8px 18px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
}

.relationship {
  background: #fff1f2;
  color: #e11d48;
}

.interest {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.drawer-spacer {
  height: 40px;
}

/* Transitions */
.drawer-enter-active, .drawer-leave-active {
  transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
}

.drawer-enter-from, .drawer-leave-to {
  transform: translateY(100%);
}

@media (max-width: 480px) {
  .profile-name { font-size: 1.8rem; }
  .profile-age { font-size: 1.5rem; }
  .circular-btn { width: 56px; height: 56px; }
  .superlike { width: 44px; height: 44px; }
}
</style>
