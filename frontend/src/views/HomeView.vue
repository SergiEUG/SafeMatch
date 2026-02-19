<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { Heart } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  if (authStore.isLoading) {
    authStore.init();
  }
  
  setTimeout(() => {
    if (authStore.isAuthenticated) {
      router.replace('/app/discover');
    } else {
      router.replace('/login');
    }
  }, 1000);
});
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-background">
    <div class="flex flex-col items-center">
      <div class="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-lg">
        <Heart class="h-10 w-10 text-primary-foreground" fill="currentColor" />
      </div>
      <h1 class="mb-2 text-3xl font-bold text-foreground">SafeMatch</h1>
      <p class="mb-8 text-muted-foreground">Find your perfect match safely</p>
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  </div>
</template>
