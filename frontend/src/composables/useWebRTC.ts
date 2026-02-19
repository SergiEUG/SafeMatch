import { useCallStore } from '@/store/call';
import { useSocket } from './useSocket';

export function useWebRTC() {
  const callStore = useCallStore();
  const { socket } = useSocket();

  // --- WebRTC Setup ---
  const createPeerConnection = (iceServers: RTCIceServer[], permisoId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers });
    callStore.setPeerConnection(pc); // Store the PC instance

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.value?.emit('call:ice', {
          permisoId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc?.iceConnectionState);
      if (pc?.iceConnectionState === 'failed' || pc?.iceConnectionState === 'disconnected') {
        console.warn('ICE connection failed or disconnected. Attempting to restart ICE.');
      } else if (pc?.iceConnectionState === 'closed') {
        console.log('ICE connection closed.');
        callStore.resetCallState();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Peer connection state:', pc?.connectionState);
      if (pc?.connectionState === 'disconnected' || pc?.connectionState === 'failed') {
        console.warn('Peer connection disconnected or failed.');
        callStore.endCall(); // Attempt to end call
      } else if (pc?.connectionState === 'closed') {
        console.log('Peer connection closed.');
        callStore.resetCallState();
      }
    };
    
    return pc;
  };

  const startLocalStream = async (video: boolean = true): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: video ? { width: 640, height: 480 } : false,
      audio: true,
    });
    callStore.setLocalStream(stream);
    return stream;
  };

  const stopLocalStream = (stream: MediaStream | null) => {
    if (stream) { // Add null check for stream
      stream.getTracks().forEach((track) => track.stop());
    }
    callStore.setLocalStream(null); // Update store directly
  };

  const addLocalStreamToPeerConnection = (pc: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
  };

  const addTrackListeners = (pc: RTCPeerConnection, onRemoteStream: (stream: MediaStream) => void) => {
    pc.ontrack = (event) => {
      console.log('Remote track received:', event.streams);
      if (event.streams && event.streams[0]) {
        onRemoteStream(event.streams[0]);
      }
    };
  };

  // Modified: Only create and return offer, CallModal will set local description and emit
  const createOffer = async (pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> => {
    const offer = await pc.createOffer();
    return offer;
  };

  // Modified: Only create and return answer, CallModal will set local description and emit
  const createAnswer = async (pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> => {
    const answer = await pc.createAnswer();
    return answer;
  };

  const setLocalDescription = async (pc: RTCPeerConnection, sdp: RTCSessionDescriptionInit) => {
    await pc.setLocalDescription(sdp);
  };

  const setRemoteDescription = async (pc: RTCPeerConnection, sdp: RTCSessionDescriptionInit) => {
    await pc.setRemoteDescription(sdp);
  };
  
  const addIceCandidate = async (pc: RTCPeerConnection, candidate: RTCIceCandidateInit) => {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error('Error adding received ICE candidate', e);
    }
  };

  const hangupPeerConnection = (pc: RTCPeerConnection | null) => { // Corrected typo and added null check
    if (pc) {
      pc.close();
      callStore.setPeerConnection(null);
    }
  };

  const toggleMediaTrack = (stream: MediaStream, type: 'audio' | 'video'): boolean => {
    const tracks = type === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks();
    if (tracks.length > 0 && tracks[0]) { // Added check for tracks[0]
      tracks[0].enabled = !tracks[0].enabled;
      return tracks[0].enabled;
    }
    return false;
  };

  const createActiveSpeakerMonitor = (stream: MediaStream, onIsSpeaking: () => void, onIsNotSpeaking: () => void) => {
    if (stream.getAudioTracks().length === 0) {
      return { stop: () => {} }; // No audio track to monitor
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let isSpeaking = false;
    const speakingThreshold = 20; // Volume threshold to be considered "speaking"
    const silenceDelay = 200; // ms of silence before switching to not speaking
    let silenceTimeout: number | undefined;

    let animationFrameId: number;

    const loop = () => {
      animationFrameId = requestAnimationFrame(loop); // Schedule next frame

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;

      if (average > speakingThreshold) {
        if (!isSpeaking) {
          isSpeaking = true;
          onIsSpeaking();
        }
        clearTimeout(silenceTimeout);
        silenceTimeout = window.setTimeout(() => {
          isSpeaking = false;
          onIsNotSpeaking();
        }, silenceDelay);
      }
    };

    loop();

    return {
      stop: () => {
        clearTimeout(silenceTimeout);
        cancelAnimationFrame(animationFrameId);
        if (audioContext.state !== 'closed') {
          source.disconnect();
          audioContext.close();
        }
      }
    };
  };

  return {
    createPeerConnection,
    startLocalStream,
    stopLocalStream,
    addLocalStreamToPeerConnection,
    addTrackListeners,
    createOffer,
    createAnswer,
    setLocalDescription, // Exposed for CallModal
    setRemoteDescription,
    addIceCandidate,
    hangupPeerConnection,
    toggleMediaTrack,
    createActiveSpeakerMonitor,
  };
}
