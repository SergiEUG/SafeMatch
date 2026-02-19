import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'discover',
      component: () => import('../views/DiscoverView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/chats',
      name: 'ChatList',
      component: () => import('../views/ChatListView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/chats/:matchId',
      name: 'chat-detail',
      component: () => import('../views/ChatsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/likes',
      name: 'likes',
      component: () => import('../views/LikesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: () => import('../views/EditProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/RegisterView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  
  if (authStore.isLoading) {
    authStore.init();
  }

  const publicPages = ['/login', '/register'];
  const authRequired = !publicPages.includes(to.path);

  if (authRequired && !authStore.isAuthenticated) {
    return next('/login');
  }

  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    return next('/');
  }

  next();
});

export default router;
