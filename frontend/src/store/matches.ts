import { defineStore } from 'pinia';
import { api } from '@/services/api';
import type { Match, Message } from '@/types';
import { useAuthStore } from '@/store/auth'; // Import auth store to get current user ID

// Helper to calculate and set sharedContactDisplayInfo
export function processContactoCompartidoForDisplay(match: Match & { sharedContactDisplayInfo?: string | null }, authStore: ReturnType<typeof useAuthStore>, eventPayload?: { myPhoneNumber?: string, otherUserPhoneNumber?: string, solicitanteNombre?: string }) {
  const currentUserId = authStore.user?.id;
  if (!currentUserId) {
    match.sharedContactDisplayInfo = null;
    return;
  }
  const otherUser = match.usuarios?.find(u => u._id !== currentUserId);
  const otherUserName = otherUser?.nombre || 'el otro usuario';

  if (match.contactoCompartido.compartido) {
    let displayMessage = '¡Contactos compartidos mutuamente!\n';
    const myPhoneNumber = eventPayload?.myPhoneNumber || match.usuarios?.find(u => u._id === currentUserId)?.contacto?.telefono;
    const otherUserPhoneNumber = eventPayload?.otherUserPhoneNumber || match.usuarios?.find(u => u._id === otherUser?._id)?.contacto?.telefono;

    if (myPhoneNumber && otherUserPhoneNumber) {
      const currentUserName = authStore.user?.nombre || 'Tu'; // Get current user's name
      displayMessage += `${currentUserName}: ${myPhoneNumber}\n`;
      displayMessage += `${otherUserName}: ${otherUserPhoneNumber}`;
    } else {
      displayMessage += `Los números de teléfono están disponibles.`;
    }
    match.sharedContactDisplayInfo = displayMessage;
  } else if (match.contactoCompartido.solicitadoPor === currentUserId) {
    match.sharedContactDisplayInfo = 'Solicitud para compartir contacto enviada. Esperando que el otro usuario acepte.';
        } else if (match.contactoCompartido.solicitadoPor && match.contactoCompartido.solicitadoPor !== currentUserId) {
          // Other user sent a request
          const requestingUser = match.usuarios?.find(u => u._id === match.contactoCompartido.solicitadoPor);
          const requestingUserName = eventPayload?.solicitanteNombre || requestingUser?.nombre || 'el otro usuario'; // Prioritize eventPayload.solicitanteNombre
          match.sharedContactDisplayInfo = `${requestingUserName} quiere intercambiar contactos.`;
        } else {
          match.sharedContactDisplayInfo = null; // No request or shared info
        }}

interface MatchesState {
  matches: (Match & { sharedContactDisplayInfo?: string | null })[];
  isLoading: boolean;
  error: string | null;
}

export const useMatchesStore = defineStore('matches', {
  state: (): MatchesState => ({
    matches: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchMatches() {
      this.isLoading = true;
      this.error = null;
      const authStore = useAuthStore(); // Instantiate authStore inside the action
      try {
        const response = await api.getMatches();
        if (response.success && response.data && response.data.matches) {
          this.matches = response.data.matches.map((match: any) => {
            const processedMatch = {
              ...match,
              id: match.id || match._id,
              contactoCompartido: {
                solicitadoPor: match.contactoCompartido?.solicitadoPor || null,
                aceptadoPor: match.contactoCompartido?.aceptadoPor || null,
                compartido: match.contactoCompartido?.compartido || false,
                fechaSolicitud: match.contactoCompartido?.fechaSolicitud || undefined,
                fechaAceptacion: match.contactoCompartido?.fechaAceptacion || undefined,
              },
              sharedContactDisplayInfo: null, // Initialized to null, will be calculated next
            };
            // Calculate initial display info based on fetched state
            processContactoCompartidoForDisplay(processedMatch, authStore);
            return processedMatch;
          });
        } else {
          this.error = 'Failed to fetch matches.';
        }
      } catch (error: any) {
        this.error = error.message || 'Error fetching matches.';
        console.error('Error fetching matches:', error);
      } finally {
        this.isLoading = false;
      }
    },

    addNewMatch(newMatch: Match) {
      console.log(`MatchesStore: Attempting to add new match with ID: ${newMatch.id}`);
      const existingIndex = this.matches.findIndex(m => m.id === newMatch.id);
      const authStore = useAuthStore(); // Instantiate authStore inside the action
      if (existingIndex === -1) {
        const processedMatch = {
          ...newMatch,
          sharedContactDisplayInfo: null,
          contactoCompartido: newMatch.contactoCompartido || {
            solicitadoPor: null,
            aceptadoPor: null,
            compartido: false,
          },
        };
        processContactoCompartidoForDisplay(processedMatch, authStore);
        this.matches.unshift(processedMatch);
        console.log('MatchesStore: New match added.');
      } else {
        console.log('MatchesStore: Match already exists. Updating existing match.');
        // Preserve sharedContactDisplayInfo if it exists, but also update based on newMatch's contactoCompartido
        const existingMatch = this.matches[existingIndex];
        const updatedMatch = {
          ...newMatch,
          sharedContactDisplayInfo: existingMatch?.sharedContactDisplayInfo ?? null, // Keep existing display info if any
          contactoCompartido: newMatch.contactoCompartido || existingMatch?.contactoCompartido,
        };
        processContactoCompartidoForDisplay(updatedMatch, authStore); // Recalculate
        this.matches[existingIndex] = updatedMatch;
      }
    },

    updateMatchLastMessage(matchId: string, message: Message) {
      const match = this.matches.find(m => m.id === matchId);
      if (match) {
        match.ultimoMensaje = message;
        match.ultimaActividad = message.createdAt; // Update last activity as well
      }
    },

    setSharedContactDisplayInfo(matchId: string, info: string | null) {
      const match = this.matches.find(m => m.id === matchId);
      if (match) {
        match.sharedContactDisplayInfo = info;
      }
    },

    updateMatchContactoCompartido(eventPayload: {
      matchId: string;
      contactoCompartido: Match['contactoCompartido'];
      currentUserId: string;
      otherUserName: string;
      myPhoneNumber?: string;
      otherUserPhoneNumber?: string;
      solicitanteNombre?: string; // Only present for 'request-sent' from backend
    }) {
      const authStore = useAuthStore(); // Access authStore here
      const match = this.matches.find(m => m.id === eventPayload.matchId);
      if (match) {
        match.contactoCompartido = { ...match.contactoCompartido, ...eventPayload.contactoCompartido };
        
        // Pass relevant data for display message generation
        processContactoCompartidoForDisplay(
          match,
          authStore, // Pass the authStore instance
          { // Pass relevant parts of eventPayload as the eventPayload argument
            myPhoneNumber: eventPayload.myPhoneNumber,
            otherUserPhoneNumber: eventPayload.otherUserPhoneNumber,
            solicitanteNombre: eventPayload.solicitanteNombre,
          }
        );
      }
    },
  },
  getters: {
    allMatches: (state) => state.matches,
    getMatchById: (state) => (id: string) => state.matches.find(match => match.id === id),
  },
});
