<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useCallStore } from '@/store/call';
import { useWebRTC } from '@/composables/useWebRTC';
import { useSocket } from '@/composables/useSocket';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  X,
  ShieldCheck
} from 'lucide-vue-next';

const callStore = useCallStore();
const { 
  startLocalStream,
  stopLocalStream,
  createPeerConnection,
  addLocalStreamToPeerConnection,
  addTrackListeners,
  createOffer,
  createAnswer,
  setLocalDescription,
  setRemoteDescription,
  addIceCandidate,
  hangupPeerConnection,
  toggleMediaTrack,
  createActiveSpeakerMonitor,
} = useWebRTC();

const { socket, onConnect } = useSocket();

const localVideo = ref<HTMLVideoElement | null>(null);
const remoteVideo = ref<HTMLVideoElement | null>(null);

const isAudioActive = ref(true);
const isVideoActive = ref(true);

const isLocalUserSpeaking = ref(false);
const isRemoteUserSpeaking = ref(false);

let localSpeakerMonitor: { stop: () => void; } | null = null;
let remoteSpeakerMonitor: { stop: () => void; } | null = null;

// Watch streams
watch(() => callStore.localStream, (newStream) => {
  if (localVideo.value && newStream) {
    localVideo.value.srcObject = newStream;
    isAudioActive.value = newStream.getAudioTracks().some(track => track.enabled);
    isVideoActive.value = newStream.getVideoTracks().some(track => track.enabled);
    
    localSpeakerMonitor?.stop();
    localSpeakerMonitor = createActiveSpeakerMonitor(
      newStream,
      () => isLocalUserSpeaking.value = true,
      () => isLocalUserSpeaking.value = false
    );
  }
}, { immediate: true });

watch(() => callStore.remoteStream, (newStream) => {
  if (remoteVideo.value && newStream) {
    remoteVideo.value.srcObject = newStream;
    
    remoteSpeakerMonitor?.stop();
    remoteSpeakerMonitor = createActiveSpeakerMonitor(
      newStream,
      () => isRemoteUserSpeaking.value = true,
      () => isRemoteUserSpeaking.value = false
    );
  }
}, { immediate: true });

// Actions
const acceptIncomingCall = async () => {
  try {
    await callStore.acceptCall();
  } catch (error) {
    callStore.error = 'Error al aceptar la llamada.';
    callStore.endCall();
  }
};

const rejectIncomingCall = () => callStore.rejectCall();
const cancelOutgoingCall = () => callStore.cancelCall();

const hangUp = () => {
  localSpeakerMonitor?.stop();
  remoteSpeakerMonitor?.stop();
  localSpeakerMonitor = null;
  remoteSpeakerMonitor = null;

  hangupPeerConnection(callStore.peerConnection);
  stopLocalStream(callStore.localStream);
  callStore.endCall();
};

const toggleAudio = () => {
  if (callStore.localStream) {
    isAudioActive.value = toggleMediaTrack(callStore.localStream, 'audio');
  }
};

const toggleVideo = () => {
  if (callStore.localStream) {
    isVideoActive.value = toggleMediaTrack(callStore.localStream, 'video');
  }
};

onMounted(async () => {
  const connectedSocket = await onConnect();
  if (connectedSocket) {
    connectedSocket.on('call:offer', async (payload: { permisoId: string; sdp: RTCSessionDescriptionInit }) => {
      callStore.setLocalOffer(payload.sdp);
    });

    connectedSocket.on('call:answer', async (payload: { permisoId: string; sdp: RTCSessionDescriptionInit }) => {
      if (callStore.isCalling && callStore.currentPermisoId === payload.permisoId && callStore.peerConnection) {
        await setRemoteDescription(callStore.peerConnection, payload.sdp);
      }
    });
    
    connectedSocket.on('call:ice', async (payload: { permisoId: string; candidate: RTCIceCandidateInit }) => {
      if ((callStore.isCalling || callStore.inCall) && callStore.currentPermisoId === payload.permisoId && callStore.peerConnection) {
        await addIceCandidate(callStore.peerConnection, payload.candidate);
      }
    });
  }
});

onBeforeUnmount(() => {
  if (callStore.inCall || callStore.isCalling || callStore.isReceivingCall) hangUp();
  if (socket.value) { 
    socket.value.off('call:offer');
    socket.value.off('call:answer');
    socket.value.off('call:ice');
  }
});

// Outgoing WebRTC
watch(() => callStore.currentPermisoId, async (newPermisoId) => {
  if (callStore.isCalling && newPermisoId && !callStore.peerConnection) {
    try {
      const stream = await startLocalStream(callStore.callType === 'video');
      callStore.setLocalStream(stream);
      const peerConnection = createPeerConnection(callStore.iceServers, newPermisoId);
      addLocalStreamToPeerConnection(peerConnection, stream);
      addTrackListeners(peerConnection, callStore.setRemoteStream);
      const offer = await createOffer(peerConnection);
      await setLocalDescription(peerConnection, offer);
      callStore.setLocalOffer(offer);
      socket.value?.emit('call:offer', { permisoId: callStore.currentPermisoId, sdp: offer });
    } catch (error) {
      callStore.error = 'Error al configurar la llamada.';
      callStore.cancelCall();
    }
  }
});

// Incoming WebRTC
watch(() => [callStore.inCall, callStore.localOffer], async ([inCall, localOffer]) => {
  if (inCall && localOffer && typeof localOffer === 'object' && !callStore.peerConnection && callStore.callType && callStore.currentPermisoId && callStore.iceServers.length > 0) {
    try {
      const stream = await startLocalStream(callStore.callType === 'video');
      callStore.setLocalStream(stream);
      const peerConnection = createPeerConnection(callStore.iceServers, callStore.currentPermisoId);
      addLocalStreamToPeerConnection(peerConnection, stream);
      addTrackListeners(peerConnection, callStore.setRemoteStream);
      await setRemoteDescription(peerConnection, localOffer as RTCSessionDescriptionInit); 
      const answer = await createAnswer(peerConnection);
      await setLocalDescription(peerConnection, answer);
      socket.value?.emit('call:answer', { permisoId: callStore.currentPermisoId, sdp: answer });
    } catch (error) {
      callStore.error = 'Error en la conexión de video.';
      callStore.endCall();
    }
  }
});
</script>

<template>
  <transition name="call-fade">
    <div v-if="callStore.isCalling || callStore.isReceivingCall || callStore.inCall" class="call-overlay">
      <div class="call-container">
        
        <!-- --- INCOMING CALL --- -->
        <div v-if="callStore.isReceivingCall" class="call-step animate-in">
          <div class="caller-id">
            <div class="avatar-wrap large pulse">
              <img :src="callStore.remoteUser?.fotos?.[0] || '/placeholder-user.jpg'" alt="Avatar">
            </div>
            <h2 class="name">{{ callStore.remoteUser?.nombre }}</h2>
            <p class="status">Llamada de {{ callStore.callType === 'video' ? 'Video' : 'Audio' }} entrante</p>
          </div>
          <div class="call-actions">
            <button @click="rejectIncomingCall" class="action-btn circle-btn reject" aria-label="Rechazar">
              <PhoneOff class="h-7 w-7" />
            </button>
            <button @click="acceptIncomingCall" class="action-btn circle-btn accept" aria-label="Aceptar">
              <Phone class="h-7 w-7" />
            </button>
          </div>
        </div>

        <!-- --- OUTGOING CALL --- -->
        <div v-else-if="callStore.isCalling" class="call-step animate-in">
          <div class="caller-id">
            <div class="avatar-wrap large pulse-slow">
              <img :src="callStore.remoteUser?.fotos?.[0] || '/placeholder-user.jpg'" alt="Avatar">
            </div>
            <h2 class="name">{{ callStore.remoteUser?.nombre }}</h2>
            <p class="status">Llamando...</p>
          </div>
          <div class="call-actions">
            <button @click="cancelOutgoingCall" class="action-btn circle-btn cancel" aria-label="Cancelar">
              <X class="h-7 w-7" />
            </button>
          </div>
        </div>

        <!-- --- ACTIVE CALL --- -->
        <div v-else-if="callStore.inCall" class="active-call animate-in">
          <!-- Main Video View -->
          <div class="video-grid">
            <div class="remote-video-container" :class="{ 'is-audio': callStore.callType === 'audio' }">
              <video 
                ref="remoteVideo" 
                autoplay 
                playsinline 
                class="remote-video"
                :class="{ 'speaking': isRemoteUserSpeaking }"
              ></video>
              <!-- Remote Placeholder for Audio Calls -->
              <div v-if="callStore.callType === 'audio'" class="audio-placeholder">
                <div class="avatar-wrap xl" :class="{ 'speaking-glow': isRemoteUserSpeaking }">
                  <img :src="callStore.remoteUser?.fotos?.[0] || '/placeholder-user.jpg'" alt="Avatar">
                </div>
                <h3>{{ callStore.remoteUser?.nombre }}</h3>
                <div class="audio-waves" v-if="isRemoteUserSpeaking">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>

            <!-- Local Pip -->
            <div class="local-pip" :class="{ 'hidden-pip': callStore.callType === 'audio' }">
              <video 
                ref="localVideo" 
                autoplay 
                muted 
                playsinline 
                class="local-video"
                :class="{ 'speaking': isLocalUserSpeaking }"
              ></video>
            </div>
          </div>

          <!-- Top Overlay Info -->
          <div class="call-top-bar">
            <div class="safety-badge">
              <ShieldCheck class="h-4 w-4" />
              <span>Conexión Segura</span>
            </div>
          </div>

          <!-- Bottom Controls -->
          <div class="call-controls-wrap">
            <div class="controls-glass">
              <button 
                @click="toggleAudio" 
                class="control-btn" 
                :class="{ 'off': !isAudioActive }"
              >
                <Mic v-if="isAudioActive" class="h-6 w-6" />
                <MicOff v-else class="h-6 w-6" />
              </button>

              <button 
                v-if="callStore.callType === 'video'" 
                @click="toggleVideo" 
                class="control-btn" 
                :class="{ 'off': !isVideoActive }"
              >
                <Video v-if="isVideoActive" class="h-6 w-6" />
                <VideoOff v-else class="h-6 w-6" />
              </button>

              <button @click="hangUp" class="hangup-btn" aria-label="Colgar">
                <PhoneOff class="h-7 w-7" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="callStore.error" class="call-error-toast">{{ callStore.error }}</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.call-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #0f172a;
  color: white;
  font-family: 'Montserrat', sans-serif;
  overflow: hidden;
}

.call-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Steps (Incoming/Outgoing) */
.call-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 60px;
  width: 100%;
  max-width: 400px;
  padding: 40px;
}

.caller-id {
  text-align: center;
}

.avatar-wrap {
  position: relative;
  border-radius: 50%;
  padding: 6px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 auto 32px;
}

.avatar-wrap img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
}

.avatar-wrap.large { width: 160px; height: 160px; }
.avatar-wrap.xl { width: 200px; height: 200px; }

.name { font-size: 2.2rem; font-weight: 900; margin: 0 0 8px; }
.status { font-size: 1.1rem; color: rgba(255, 255, 255, 0.6); font-weight: 600; }

.call-actions {
  display: flex;
  gap: 40px;
}

.circle-btn {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.circle-btn:hover { transform: scale(1.1); }
.circle-btn:active { transform: scale(0.9); }

.accept { background: #10b981; color: white; box-shadow: 0 0 30px rgba(16, 185, 129, 0.4); }
.reject, .cancel { background: #ef4444; color: white; box-shadow: 0 0 30px rgba(239, 68, 68, 0.4); }

/* Active Call */
.active-call {
  width: 100%;
  height: 100%;
  position: relative;
  background: black;
}

.video-grid {
  width: 100%;
  height: 100%;
  position: relative;
}

.remote-video-container {
  width: 100%;
  height: 100%;
  background: #1e293b;
  display: flex;
  justify-content: center;
  align-items: center;
}

.remote-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.3s;
}

.audio-placeholder {
  text-align: center;
}

.audio-placeholder h3 {
  font-size: 1.8rem;
  margin-top: 24px;
  font-weight: 800;
}

.local-pip {
  position: absolute;
  top: 40px;
  right: 20px;
  width: 120px;
  height: 180px;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  background: #0f172a;
}

.local-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hidden-pip { display: none; }

/* Top Bar */
.call-top-bar {
  position: absolute;
  top: 40px;
  left: 20px;
  z-index: 10;
}

.safety-badge {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Controls */
.call-controls-wrap {
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 0 20px;
}

.controls-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.control-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.control-btn:hover { background: rgba(255, 255, 255, 0.2); }
.control-btn.off { background: #ef4444; color: white; }

.hangup-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: #ef4444;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
  transition: all 0.3s;
}

.hangup-btn:hover { transform: scale(1.1); box-shadow: 0 0 30px rgba(239, 68, 68, 0.6); }

/* Animations & Effects */
.pulse { animation: avatarPulse 2s infinite; }
.pulse-slow { animation: avatarPulse 3s infinite; }

@keyframes avatarPulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
  70% { box-shadow: 0 0 0 30px rgba(255, 255, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
}

.speaking-glow {
  box-shadow: 0 0 40px rgba(16, 185, 129, 0.6) !important;
  border-color: #10b981 !important;
}

.speaking {
  border: 3px solid #10b981 !important;
  transition: border 0.2s;
}

.call-error-toast {
  position: absolute;
  top: 100px;
  background: #ef4444;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

/* Transitions */
.call-fade-enter-active, .call-fade-leave-active { transition: opacity 0.5s; }
.call-fade-enter-from, .call-fade-leave-to { opacity: 0; }

.animate-in { animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

/* Audio Waves */
.audio-waves {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
  height: 20px;
}

.audio-waves span {
  width: 4px;
  height: 100%;
  background: #10b981;
  border-radius: 2px;
  animation: wave 1s infinite ease-in-out;
}

.audio-waves span:nth-child(2) { animation-delay: 0.2s; }
.audio-waves span:nth-child(3) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% { height: 8px; }
  50% { height: 20px; }
}

@media (max-width: 480px) {
  .avatar-wrap.large { width: 140px; height: 140px; }
  .name { font-size: 1.8rem; }
  .controls-glass { gap: 16px; padding: 10px 20px; }
  .local-pip { width: 100px; height: 150px; top: 20px; right: 20px; }
}
</style>
