// Medición sin cookies: usa window.checaTrack de ../medir.js (tabla web_eventos).
// Solo se usan eventos que la tabla ya acepta.
export type Evento =
  | 'clic_descargar'
  | 'descarga'
  | 'beta'            // registro enviado
  | 'beta_whatsapp'   // clic en la comunidad de WhatsApp
  | 'video_play';

declare global {
  interface Window {
    checaTrack?: (evento: string, datos?: { desde?: string }) => void;
  }
}

export function track(evento: Evento, desde?: string): void {
  try {
    window.checaTrack?.(evento, { desde });
  } catch {
    /* la medición nunca debe romper la página */
  }
}

/** Fuente y campaña de la visita (las deja medir.js en sessionStorage). */
export function origenVisita(): { fuente: string | null; campana: string | null } {
  try {
    return {
      fuente: window.sessionStorage.getItem('checa_f'),
      campana: window.sessionStorage.getItem('checa_c'),
    };
  } catch {
    return { fuente: null, campana: null };
  }
}

export function dispositivo(): 'android' | 'iphone' | 'pc' | 'otro' {
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iphone';
  if (/Mobi/i.test(ua)) return 'otro';
  return 'pc';
}
