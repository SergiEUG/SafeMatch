import { defineStore } from 'pinia';
import { useSocket } from '@/composables/useSocket';
import type { User } from '@/types';

interface CallState {
  isCalling: boolean; // true if an outgoing call is being initiated
  isReceivingCall: boolean; // true if an incoming call is active
  inCall: boolean; // true if a call is established and active
  callType: 'audio' | 'video' | null;
  currentPermisoId: string | null;
  remoteUser: User | null; // The user you are calling or who is calling you
  matchId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  iceServers: RTCIceServer[];
  error: string | null;
  peerConnection: RTCPeerConnection | null; // WebRTC Peer Connection
  localOffer: RTCSessionDescriptionInit | null;
}

export const useCallStore = defineStore('call', {
  state: (): CallState => ({
    isCalling: false,
    isReceivingCall: false,
    inCall: false,
    callType: null,
    currentPermisoId: null,
    remoteUser: null,
    matchId: null,
    localStream: null,
    remoteStream: null,
    iceServers: [],
    error: null,
    peerConnection: null,
    localOffer: null,
  }),
  actions: {
    // --- Call Initiation ---
    async requestCall(matchId: string, remoteUser: User, type: 'audio' | 'video') {
      this.isCalling = true;
      this.error = null;
      this.callType = type;
      this.remoteUser = remoteUser;
      this.matchId = matchId;

      try {
        const { socket } = useSocket();
        if (!socket.value) {
          throw new Error('Socket not connected');
        }

        // Request call from backend
        const ack: any = await new Promise((resolve) => {
          socket.value?.emit('call:request', { matchId, tipo: type }, resolve);
        });

        if (ack.exito) {
          this.currentPermisoId = ack.permisoId;
          // Optionally start ringing sound here
        } else {
          throw new Error(ack.error || 'Failed to request call');
        }
      } catch (err: any) {
        this.error = err.message;
        this.resetCallState();
        console.error('Error requesting call:', err);
        // Optionally stop ringing sound here
        throw err;
      }
    },

    // --- Handling Incoming Call ---
    async handleIncomingCall(payload: { permisoId: string; matchId: string; solicitante: User; tipo: 'audio' | 'video'; expiraEn: number }) {
      // Check if already in a call or calling someone else
      if (this.inCall || this.isCalling || this.isReceivingCall) {
        // Automatically reject the incoming call if busy
        const { socket } = useSocket();
        if (socket.value && payload.permisoId) {
          socket.value.emit('call:reject', { permisoId: payload.permisoId });
        }
        return;
      }

      this.isReceivingCall = true;
      this.currentPermisoId = payload.permisoId;
      this.callType = payload.tipo;
      this.remoteUser = payload.solicitante;
      this.matchId = payload.matchId;
      // Optionally play incoming call sound here
    },

    // --- Accepting Call ---
    async acceptCall() {
      if (!this.currentPermisoId) {
        this.error = 'No incoming call to accept.';
        this.resetCallState();
        return;
      }

      try {
        const { socket } = useSocket();
        if (!socket.value) throw new Error('Socket not connected');

        const ack: any = await new Promise((resolve) => {
          socket.value?.emit('call:accept', { permisoId: this.currentPermisoId }, resolve);
        });

        if (ack.exito) {
          this.iceServers = ack.iceServers || [];
          this.isReceivingCall = false;
          this.inCall = true;
          // Transition to call screen
        } else {
          throw new Error(ack.error || 'Failed to accept call');
        }
      } catch (err: any) {
        this.error = err.message;
        this.resetCallState();
        console.error('Error accepting call:', err);
        throw err;
      }
    },

    // --- Rejecting Call ---
    async rejectCall(permisoIdToReject?: string) {
      const id = permisoIdToReject || this.currentPermisoId;
      if (!id) return;

      try {
        const { socket } = useSocket();
        if (socket.value) {
          socket.value.emit('call:reject', { permisoId: id });
        }
      } catch (err: any) {
        console.error('Error rejecting call:', err);
      } finally {
        this.resetCallState();
      }
    },

    // --- Cancelling Outgoing Call ---
    async cancelCall() {
      if (!this.currentPermisoId || !this.isCalling) return;

      try {
        const { socket } = useSocket();
        if (socket.value) {
          socket.value.emit('call:cancel', { permisoId: this.currentPermisoId });
        }
      } catch (err: any) {
        console.error('Error canceling call:', err);
      } finally {
        this.resetCallState();
      }
    },

    // --- Ending Active Call ---
    async endCall() {
      if (!this.currentPermisoId || !this.inCall) return;

      try {
        const { socket } = useSocket();
        if (socket.value) {
          socket.value.emit('call:end', { permisoId: this.currentPermisoId });
        }
      } catch (err: any) {
        console.error('Error ending call:', err);
      } finally {
        this.resetCallState();
      }
    },

    // --- WebSocket Signaling Handlers ---
    // These will be called by App.vue's global listeners
    handleCallAccepted(payload: { permisoId: string; matchId: string }) {
      if (this.isCalling && this.currentPermisoId === payload.permisoId) {
        this.isCalling = false;
        this.inCall = true;
        // Optionally stop ringing sound here
      }
    },

    handleCallRejected(payload: { permisoId: string; matchId: string }) {
      if (this.isCalling && this.currentPermisoId === payload.permisoId) {
        this.error = 'Call rejected.';
        this.resetCallState();
        // Optionally stop ringing sound here
      }
    },

    handleCallCancelled(payload: { permisoId: string; matchId: string }) {
      if (this.isReceivingCall && this.currentPermisoId === payload.permisoId) {
        this.error = 'Call cancelled by caller.';
        this.resetCallState();
        // Optionally stop incoming call sound here
      }
    },

    handleCallEnded(payload: { permisoId: string; duracion: number; finalizadaPor: string }) {
      if (this.inCall && this.currentPermisoId === payload.permisoId) {
        this.error = `Call ended. Duration: ${payload.duracion}s`;
        this.resetCallState();
      }
    },

    // --- WebRTC Local Stream Management ---
    setLocalStream(stream: MediaStream | null) {
      this.localStream = stream;
    },
    setRemoteStream(stream: MediaStream) {
      this.remoteStream = stream;
    },
    setPeerConnection(pc: RTCPeerConnection | null) {
      this.peerConnection = pc;
    },
    setLocalOffer(offer: RTCSessionDescriptionInit) {
      this.localOffer = offer;
    },

    // --- Reset ---
    resetCallState() {
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      if (this.peerConnection) {
        this.peerConnection.close();
      }

      this.isCalling = false;
      this.isReceivingCall = false;
      this.inCall = false;
      this.callType = null;
      this.currentPermisoId = null;
      this.remoteUser = null;
      this.matchId = null;
      this.localStream = null;
      this.remoteStream = null;
      this.iceServers = [];
      this.error = null;
      this.peerConnection = null;
      this.localOffer = null;
    },
  },
  getters: {
    // isActiveCall: (state) => state.isCalling || state.isReceivingCall || state.inCall,
    // activeCallMatchId: (state) => state.matchId,
    // getRemoteUser: (state) => state.remoteUser,
  },
});
