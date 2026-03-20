export interface FotoGaleria {
  id: string;
  titulo: string;
  /** URL absoluta (Supabase) o ruta bajo public/ sin barra inicial */
  imagenes: string[];
  origen?: 'local' | 'remoto';
}

/** Álbum en Supabase para la pantalla de administración */
export interface GaleriaFotoAdmin {
  id: string;
  storagePath: string;
  url: string;
}

export interface GaleriaAlbumAdmin {
  id: string;
  titulo: string;
  fotos: GaleriaFotoAdmin[];
}
