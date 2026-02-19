<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { MapPin, X, Info } from 'lucide-vue-next';
import type { User } from '../types';

const props = defineProps<{
  user: User;
  isTop?: boolean;
  isPreview?: boolean; // New prop for preview mode
}>();

const emit = defineEmits(['like', 'dislike', 'superLike']);

const currentPhotoIndex = ref(0);
const dragState = ref({ x: 0, y: 0, isDragging: false });
const exitDirection = ref<'left' | 'right' | null>(null);
const startPos = ref({ x: 0, y: 0 });
const showDetails = ref(false);

const photos = computed(() =>
  props.user.fotos && props.user.fotos.length > 0
    ? props.user.fotos
    : ['/placeholder-user.jpg']
);


const nextPhoto = () => {
  if (currentPhotoIndex.value < photos.value.length - 1) {
    currentPhotoIndex.value++;
  } else {
    currentPhotoIndex.value = 0;
  }
};

const prevPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--;
  } else {
    currentPhotoIndex.value = photos.value.length - 1;
  }
};

const handleDragStart = (clientX: number, clientY: number) => {
  if (!props.isTop || showDetails.value || props.isPreview) return; // Disable drag in preview
  startPos.value = { x: clientX, y: clientY };
  dragState.value.isDragging = true;
};

const handleDragMove = (clientX: number, clientY: number) => {
  if (!dragState.value.isDragging || props.isPreview) return; // Disable drag in preview
  dragState.value.x = clientX - startPos.value.x;
  dragState.value.y = clientY - startPos.value.y;
};

const handleDragEnd = () => {
  if (!dragState.value.isDragging || props.isPreview) return; // Disable drag in preview

  const threshold = 120;
  if (Math.abs(dragState.value.x) > threshold) {
    if (dragState.value.x > 0) {
      exitDirection.value = 'right';
      window.setTimeout(() => emit('like'), 250);
    } else {
      exitDirection.value = 'left';
      window.setTimeout(() => emit('dislike'), 250);
    }
  } else {
    dragState.value = { x: 0, y: 0, isDragging: false };
  }
};

const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
const onMouseUp = () => handleDragEnd();

onMounted(() => {
  if (!props.isPreview) { // Only add listeners if not in preview mode
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
});

onUnmounted(() => {
  if (!props.isPreview) { // Only remove listeners if not in preview mode
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }
});

const rotation = computed(() => dragState.value.x * 0.08);
const likeOpacity = computed(() => Math.min(dragState.value.x / 100, 1));
const dislikeOpacity = computed(() => Math.min(-dragState.value.x / 100, 1));

const cardStyle = computed(() => {
  if (props.isPreview) { // New condition for preview mode
    return {
      transform: 'none', // No dragging animation
      transition: 'none',
    };
  }
  if (exitDirection.value) {
    return {
      transform: `translateX(${exitDirection.value === 'right' ? '150%' : '-150%'}) translateY(${dragState.value.y}px) rotate(${exitDirection.value === 'right' ? 45 : -45}deg)`,
      transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      opacity: 0
    };
  }
  return {
    transform: `translateX(${dragState.value.x}px) translateY(${dragState.value.y * 0.2}px) rotate(${rotation.value}deg)`,
    transition: dragState.value.isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  };
});

const calculateAge = (birthDate: string) => {
  if (!birthDate) return '';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};
</script>

<template>
  <div
    class="absolute inset-0 select-none overflow-hidden rounded-2xl swipe-card-shadow"
    :class="[
      dragState.isDragging ? 'cursor-grabbing' : 'cursor-grab',
      !isTop && 'pointer-events-none',
      isPreview && 'cursor-default pointer-events-none' // Disable events in preview
    ]"
    :style="cardStyle"
    @mousedown="!isPreview && handleDragStart($event.clientX, $event.clientY)"
    @touchstart="!isPreview && handleDragStart($event.touches[0]?.clientX || 0, $event.touches[0]?.clientY || 0)"
    @touchmove="!isPreview && handleDragMove($event.touches[0]?.clientX || 0, $event.touches[0]?.clientY || 0)"
    @touchend="!isPreview && handleDragEnd"
  >
    <!-- Image and Main Info -->
    <div class="relative h-full w-full">
            <div class="absolute inset-0 z-10">
              <img
                :src="photos[currentPhotoIndex]"
                :alt="user.nombre"
                class="h-full w-full object-cover transition-transform duration-500"
                :class="{ 'scale-110': showDetails && !isPreview }"
                draggable="false"
              />
            </div>
      
            <!-- Photo navigation indicators -->
            <div v-if="photos.length > 1" class="absolute top-2 left-0 right-0 flex justify-center gap-1.5 px-4 z-35">
              <div
                v-for="(_, i) in photos"
                :key="i"
                class="h-1 flex-1 rounded-full transition-all duration-300"
                :class="i === currentPhotoIndex ? 'bg-white shadow-sm' : 'bg-white/30'"
              />
            </div>
      
            <!-- Photo tap areas -->
            <div v-if="!showDetails" class="absolute inset-0 flex z-25">
              <div class="w-1/2 h-full" @click.stop="prevPhoto" />
              <div class="w-1/2 h-full" @click.stop="nextPhoto" />
            </div>
      
            <!-- Overlay Labels -->
            <div
              v-if="!isPreview && likeOpacity > 0"
              class="absolute top-12 left-8 z-30 rotate-[-20deg] rounded-lg border-[6px] border-green-500 px-4 py-1"
              :style="{ opacity: likeOpacity }"
            >
              <span class="text-4xl font-black text-green-500 tracking-widest uppercase">Like</span>
            </div>
            <div
              v-if="!isPreview && dislikeOpacity > 0"
              class="absolute top-12 right-8 z-30 rotate-[20deg] rounded-lg border-[6px] border-red-500 px-4 py-1"
              :style="{ opacity: dislikeOpacity }"
            >
              <span class="text-4xl font-black text-red-500 tracking-widest uppercase">Nope</span>
            </div>
      
            <!-- Bottom Info Gradient -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none z-20" />
      
            <!-- User Brief -->
            <div class="absolute bottom-0 left-0 right-0 p-6 text-white z-30 transition-all duration-300" :class="{ 'translate-y-full': showDetails && !isPreview }">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-baseline gap-2">
                  <h2 class="text-3xl font-bold">{{ user.nombre }}</h2>
                  <span class="text-2xl font-light">{{ user.edad || calculateAge(user.fechaNacimiento) }}</span>
                </div>
                <button
                  v-if="!isPreview"
                  @click.stop="showDetails = true"
                  class="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <Info class="h-5 w-5" />
                </button>
              </div>
      
              <div v-if="user.ubicacion?.ciudad" class="flex items-center gap-1.5 text-white/80 text-sm mb-3">
                <MapPin class="h-4 w-4" />
                <span>{{ user.ubicacion.ciudad }}</span>
              </div>
      
              <div v-if="user.intereses?.length" class="flex flex-wrap gap-2">
                <span
                  v-for="interest in user.intereses.slice(0, 3)"
                  :key="interest"
                  class="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm border border-white/10"
                >
                  {{ interest }}
                </span>
              </div>
            </div>
      <!-- Detailed View Overlay -->
      <div 
        class="absolute inset-0 bg-white z-40 transition-transform duration-500 ease-in-out p-6 overflow-y-auto text-gray-900"
        :class="showDetails ? 'translate-y-0' : 'translate-y-full'"
      >
        <button 
          @click="showDetails = false"
          class="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X class="h-6 w-6" />
        </button>

        <div class="pt-8">
          <div class="flex items-baseline gap-2 mb-4">
            <h2 class="text-3xl font-black">{{ user.nombre }}</h2>
            <span class="text-2xl font-medium text-gray-500">{{ user.edad || calculateAge(user.fechaNacimiento) }}</span>
          </div>

          <div class="space-y-6">
            <section v-if="user.biografia">
              <h3 class="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Sobre mí</h3>
              <p class="text-gray-700 leading-relaxed">{{ user.biografia }}</p>
            </section>

            <section v-if="user.intereses?.length">
              <h3 class="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Intereses</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="interest in user.intereses"
                  :key="interest"
                  class="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-700"
                >
                  {{ interest }}
                </span>
              </div>
            </section>

            <section class="border-t pt-6">
              <div class="flex items-center gap-3 text-gray-600">
                <MapPin class="h-5 w-5 text-primary" />
                <span class="font-medium">Vive en {{ user.ubicacion?.ciudad || 'Desconocido' }}</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.swipe-card-shadow {
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}
</style>