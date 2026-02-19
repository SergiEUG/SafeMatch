<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useSocket } from '@/composables/useSocket';
import { useCallStore } from '@/store/call';
import { useMatchesStore, processContactoCompartidoForDisplay } from '@/store/matches';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  Mail, 
  Send, 
  ShieldCheck,
  ShieldAlert
} from 'lucide-vue-next';

const props = defineProps<{
  match: any;
}>();

const authStore = useAuthStore();
const { socket } = useSocket();
const callStore = useCallStore();
const matchesStore = useMatchesStore();

const messages = ref<any[]>([]);
const newMessage = ref('');
const isLoading = ref(true);
const isSending = ref(false);
const callPermissions = ref<any[]>([]);
const showPermissionPrompt = ref(false);
const messageBox = ref<HTMLElement | null>(null);

const currentMatch = computed(() => {
  if (!props.match?.id && !props.match?._id) return null;
  return matchesStore.getMatchById(props.match.id || props.match._id);
});

const otherUserInMatch = computed(() => {
  if (!currentMatch.value || !authStore.user) return null;
  const myId = authStore.user.id || authStore.user._id;
  return currentMatch.value.usuarios?.find(
    (user: any) => user && (user._id || user.id) !== myId
  );
});

const isCallEnabled = computed(() => {
  if (callPermissions.value.length < 2) return false;
  return callPermissions.value.every(p => p && p.status === 'ACCEPTED');
});

const scrollToBottom = () => {
  nextTick(() => {
    if (messageBox.value) {
      messageBox.value.scrollTop = messageBox.value.scrollHeight;
    }
  });
};

const loadMessages = async () => {
  if (!props.match?.id && !props.match?._id) return;
  isLoading.value = true;
  try {
    const response = await api.getMessages(props.match.id || props.match._id);
    if (response.success) {
      messages.value = response.data.mensajes || [];
      scrollToBottom();
    }
  } catch (error) {
    console.error('Error cargando mensajes:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleNewMessage = (data: any) => {
  const matchId = props.match.id || props.match._id;
  if (data.matchId === matchId && data.mensaje) {
    const exists = messages.value.some(m => m && m._id === data.mensaje._id);
    if (!exists) {
      messages.value.push(data.mensaje);
      scrollToBottom();
    }
  }
};

const handlePermissionsUpdate = (data: any) => {
  const matchId = props.match.id || props.match._id;
  if (data.matchId === matchId) {
    callPermissions.value = data.callPermissions || [];
    const myId = authStore.user?.id || authStore.user?._id;
    const myPermission = callPermissions.value.find(p => p && p.userId === myId);
    if (myPermission && myPermission.status !== 'PENDING') {
      showPermissionPrompt.value = false;
    }
  }
};

const handleContactStatusUpdate = (data: any) => {
  const matchId = props.match.id || props.match._id;
  if (data.matchId === matchId) {
    matchesStore.updateMatchContactoCompartido({
      matchId: data.matchId,
      contactoCompartido: data.contactoCompartido,
      currentUserId: (authStore.user?.id || authStore.user?._id || '') as string,
      otherUserName: otherUserInMatch.value?.nombre || 'Usuario Desconocido',
      myPhoneNumber: data.myPhoneNumber,
      otherUserPhoneNumber: data.otherUserPhoneNumber,
      solicitanteNombre: data.solicitanteNombre,
    });
  }
};

const sendMessage = () => {
  if (!newMessage.value.trim() || !socket.value || isSending.value) return;
  
  const matchId = props.match.id || props.match._id;
  isSending.value = true;
  socket.value.emit('chat:send', {
    matchId: matchId,
    contenido: newMessage.value.trim()
  }, (ack: any) => {
    isSending.value = false;
    if (ack && ack.exito) {
      newMessage.value = '';
    }
  });
};

const requestCall = async (type: 'audio' | 'video') => {
  if (!otherUserInMatch.value || !props.match) return;
  const matchId = props.match.id || props.match._id;
  try {
    await callStore.requestCall(matchId, otherUserInMatch.value, type);
  } catch (error: any) {
    alert('Error al iniciar la llamada: ' + error.message);
  }
};

const shareContact = async () => {
  if (!confirm('¿Quieres compartir tu número de teléfono de forma segura?')) return;
  const matchId = props.match.id || props.match._id;
  try {
    await api.shareContact(matchId);
  } catch (error) {
    console.error('Error sharing contact:', error);
  }
};

const handlePermissionResponse = async (status: 'ACCEPTED' | 'DECLINED') => {
  showPermissionPrompt.value = false;
  const matchId = props.match.id || props.match._id;
  try {
    await api.updateCallPermission(matchId, status);
  } catch (error) {
    console.error('Error actualizando permiso:', error);
  }
};

const isOwn = (msg: any) => {
  const myId = authStore.user?.id || authStore.user?._id;
  if (!msg || !myId || !msg.remitente) return false;
  
  const senderId = (typeof msg.remitente === 'object' && msg.remitente !== null) 
    ? (msg.remitente._id || msg.remitente.id) 
    : msg.remitente;
    
  return senderId === myId;
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

onMounted(async () => {
  const matchId = props.match.id || props.match._id;
  await loadMessages();
  if (socket.value && matchId) {
    socket.value.emit('chat:join', { matchId });
    socket.value.on('chat:receive', handleNewMessage);
    socket.value.on('permissions:call:updated', handlePermissionsUpdate);
    socket.value.on('contact:status-update', handleContactStatusUpdate);
  }
  
  if (currentMatch.value && authStore.user) {
    processContactoCompartidoForDisplay(currentMatch.value, authStore, {
      myPhoneNumber: currentMatch.value.contactoCompartido.compartido ? authStore.user.contacto?.telefono : undefined,
      otherUserPhoneNumber: currentMatch.value.contactoCompartido.compartido ? otherUserInMatch.value?.contacto?.telefono : undefined,
    });
  }
});

onBeforeUnmount(() => {
  const matchId = props.match.id || props.match._id;
  if (socket.value && matchId) {
    socket.value.off('chat:receive', handleNewMessage);
    socket.value.off('permissions:call:updated', handlePermissionsUpdate);
    socket.value.off('contact:status-update', handleContactStatusUpdate);
    socket.value.emit('chat:leave', { matchId });
  }
});

watch(() => authStore.user, async (newUser) => {
  const matchId = props.match.id || props.match._id;
  if (newUser?.id || newUser?._id) {
    try {
      const response = await api.getCallPermissions(matchId);
      if (response.success) {
        callPermissions.value = response.data.callPermissions;
        const myId = newUser.id || newUser._id;
        const myPermission = callPermissions.value.find(p => p.userId === myId);
        if (myPermission && myPermission.status === 'PENDING') {
          showPermissionPrompt.value = true;
        }
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  }
}, { immediate: true });
</script>

<template>
  <div class="chat-viewport">
    <!-- Immersive Background consistent with App -->
    <div class="immersive-bg"></div>
    <div class="abstract-pattern-overlay"></div>

    <div class="chat-main-container">
      <!-- Modern Glass Header -->
      <header class="chat-glass-header">
        <router-link to="/chats" class="action-icon-btn">
          <ArrowLeft class="h-6 w-6" />
        </router-link>
        
        <div class="user-meta">
          <div class="avatar-wrap">
            <img :src="otherUserInMatch?.fotos?.[0] || '/placeholder-user.jpg'" alt="avatar">
            <div class="status-dot"></div>
          </div>
          <div class="meta-text">
            <h3>{{ otherUserInMatch?.nombre || 'Usuario' }}</h3>
            <span class="status-text">En línea ahora</span>
          </div>
        </div>
        
        <div class="header-actions">
          <template v-if="isCallEnabled">
            <button class="action-icon-btn call-btn" @click="requestCall('audio')">
              <Phone class="h-5 w-5" />
            </button>
            <button class="action-icon-btn call-btn" @click="requestCall('video')">
              <Video class="h-5 w-5" />
            </button>
          </template>
        </div>
      </header>

      <!-- Security/Contact Banner -->
      <div v-if="currentMatch?.sharedContactDisplayInfo" class="security-banner animate-slide-down">
        <ShieldCheck class="h-5 w-5 text-emerald-400" />
        <p>{{ currentMatch.sharedContactDisplayInfo }}</p>
      </div>
      
      <!-- Call Permission Prompt -->
      <div v-if="showPermissionPrompt" class="security-banner permission-alert animate-slide-down">
        <ShieldAlert class="h-5 w-5 text-amber-400" />
        <div class="permission-content">
          <p>¿Permitir llamadas con {{ otherUserInMatch?.nombre }}?</p>
          <div class="p-actions">
            <button @click="handlePermissionResponse('DECLINED')" class="p-btn deny">No</button>
            <button @click="handlePermissionResponse('ACCEPTED')" class="p-btn allow">Sí, permitir</button>
          </div>
        </div>
      </div>

      <!-- Messages Area -->
      <main class="messages-area" ref="messageBox">
        <div v-if="isLoading" class="chat-loading-state">
          <div class="spinner"></div>
          <span>Recuperando historial...</span>
        </div>
        
        <template v-else>
          <div v-if="messages.length === 0" class="chat-welcome">
            <div class="welcome-avatar">
              <img :src="otherUserInMatch?.fotos?.[0] || '/placeholder-user.jpg'" alt="avatar">
            </div>
            <h2>¡Es un Match!</h2>
            <p>Saluda a {{ otherUserInMatch?.nombre }} para romper el hielo.</p>
            <div class="safety-hint">
              <ShieldCheck class="h-4 w-4" />
              <span>Vuestras conversaciones son seguras</span>
            </div>
          </div>

          <div 
            v-for="msg in messages" 
            :key="msg._id" 
            :class="['message-group', isOwn(msg) ? 'is-own' : 'is-other']"
          >
            <div class="bubble-wrapper">
              <div class="bubble">
                <p class="content">{{ msg.contenido }}</p>
                <span class="time">{{ formatTime(msg.createdAt) }}</span>
              </div>
            </div>
          </div>
        </template>
      </main>

      <!-- Floating Input Area -->
      <footer class="chat-footer">
        <div class="input-glass-card">
          <button class="utility-btn" @click="shareContact" title="Compartir contacto">
            <Mail class="h-6 w-6" />
          </button>
          
          <div class="input-wrapper">
            <input 
              v-model="newMessage"
              type="text" 
              placeholder="Escribe un mensaje..."
              @keyup.enter="sendMessage"
              :disabled="isSending"
            />
          </div>
          
          <button 
            class="send-btn" 
            @click="sendMessage"
            :disabled="isSending || !newMessage.trim()"
          >
            <Send v-if="!isSending" class="h-5 w-5" />
            <div v-else class="mini-spinner"></div>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.chat-viewport {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.chat-main-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

/* Header Styles */
.chat-glass-header {
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.user-meta {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 10px;
  cursor: pointer;
}

.avatar-wrap {
  position: relative;
  width: 48px;
  height: 48px;
}

.avatar-wrap img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #1be4a1;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.meta-text h3 {
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
}

.status-text {
  font-size: 0.75rem;
  color: #1be4a1;
  font-weight: 600;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

/* Security Banners */
.security-banner {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.permission-alert {
  background: rgba(180, 83, 9, 0.3);
  border-bottom: 1px solid rgba(251, 191, 36, 0.2);
}

.permission-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.p-actions {
  display: flex;
  gap: 8px;
}

.p-btn {
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
}

.p-btn.allow { background: white; color: #b45309; }
.p-btn.deny { background: rgba(255, 255, 255, 0.1); color: white; }

/* Messages Area */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
}

.chat-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 100px;
  color: white;
  opacity: 0.7;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: rotate 1s linear infinite;
}

@keyframes rotate { to { transform: rotate(360deg); } }

.chat-welcome {
  text-align: center;
  margin: 40px auto;
  max-width: 300px;
  color: white;
}

.welcome-avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.welcome-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.safety-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  font-size: 0.75rem;
  margin-top: 16px;
  opacity: 0.7;
}

.message-group {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.is-own { align-self: flex-end; }
.is-other { align-self: flex-start; }

.bubble {
  padding: 12px 16px;
  border-radius: 20px;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.is-own .bubble {
  background: white;
  color: #1a1a1a;
  border-bottom-right-radius: 4px;
}

.is-other .bubble {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom-left-radius: 4px;
}

.content {
  margin: 0;
  line-height: 1.5;
  font-weight: 500;
}

.time {
  font-size: 0.65rem;
  opacity: 0.6;
  margin-top: 4px;
  display: block;
  text-align: right;
}

/* Footer & Input */
.chat-footer {
  padding: 20px;
  background: transparent;
}

.input-glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

.utility-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  color: #db2777;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.input-wrapper {
  flex: 1;
}

.input-wrapper input {
  width: 100%;
  background: transparent;
  border: none;
  padding: 12px 8px;
  color: white;
  font-size: 1rem;
  outline: none;
}

.input-wrapper input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #db2777, #ef4444);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.send-btn:disabled {
  opacity: 0.5;
  filter: grayscale(1);
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(219, 39, 119, 0.4);
}

/* Fixes for Mobile Viewport */
@media (max-width: 480px) {
  .chat-glass-header { height: 70px; padding: 0 12px; }
  .messages-area { padding: 16px; }
  .chat-footer { padding: 12px; }
  .input-glass-card { border-radius: 24px; }
}

/* Animations */
.animate-slide-down {
  animation: slideDown 0.4s ease-out;
}

@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
