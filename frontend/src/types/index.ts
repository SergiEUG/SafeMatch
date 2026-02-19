export interface User {
  _id: string;
  id?: string;
  email: string;
  nombre: string;
  fechaNacimiento: string;
  genero: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';
  busco: string[];
  biografia: string;
  fotos: string[];
  intereses: string[];
  ubicacion: {
    type?: string;
    coordinates?: number[];
    ciudad: string;
  };
  configuracion: {
    distanciaMaxima: number;
    rangoEdad: { min: number; max: number };
    notificaciones: boolean;
  };
  contacto: {
    telefono: string;
    instagram: string;
    whatsapp: string;
  };
  relacionBuscada?: 'rollos' | 'seria' | 'no_claro' | 'amistad';
  estado: 'activo' | 'pausado';
  ultimaConexion: string;
  verificado: boolean;
  edad?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string; // Formatted ID from service
  _id?: string; // Raw ID from backend
  // usuario: User; // The other user - removed, use `usuarios` directly
  usuarios?: User[]; // Raw users from backend
  ultimoMensaje?: Message;
  unreadCount?: number;
  fechaMatch?: string;
  ultimaActividad?: string;
  contactoCompartido: {
    solicitadoPor: string | null;
    aceptadoPor: string | null;
    compartido: boolean;
    fechaSolicitud?: string;
    fechaAceptacion?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  match: string;
  remitente: string | User;
  contenido: string;
  leido: boolean;
  tipo?: 'texto' | 'imagen' | 'sistema';
  createdAt: string;
}

export interface LikeReceived {
  _id: string;
  de: User;
  para: string;
  tipo: 'like';
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthResponseData {
  usuario: User;
  accessToken: string;
  refreshToken: string;
}

export type AuthResponse = ApiResponse<AuthResponseData>;

export interface DiscoverResponseData {
  usuarios: User[];
  total: number;
  pagina: number;
  paginas: number;
}

export type DiscoverResponse = ApiResponse<DiscoverResponseData>;

export interface MatchResponseData {
  esMatch: boolean;
  match?: Match;
}

export type MatchResponse = ApiResponse<MatchResponseData>;
