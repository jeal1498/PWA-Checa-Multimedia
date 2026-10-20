export type VideoFuente =
  | { tipo: 'iframe'; src: string; titulo: string }
  | { tipo: 'archivo'; src: string }
  | null;

/** Convierte un enlace de YouTube, TikTok o un .mp4 en algo que se pueda incrustar. */
export function resolverVideo(url: string): VideoFuente {
  const limpio = url.trim();
  if (!limpio) return null;

  if (/\.(mp4|webm)(\?.*)?$/i.test(limpio)) return { tipo: 'archivo', src: limpio };

  try {
    const u = new URL(limpio);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      if (/^[\w-]{6,20}$/.test(id)) return yt(id);
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed)\/([\w-]{6,20})/)?.[1];
      if (id && /^[\w-]{6,20}$/.test(id)) return yt(id);
    }
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
      const id = u.pathname.match(/\/video\/(\d{8,25})/)?.[1];
      if (id) return { tipo: 'iframe', src: `https://www.tiktok.com/embed/v2/${id}`, titulo: 'Video de TikTok: permisos de Checa' };
    }
  } catch {
    /* no es un enlace */
  }
  return null;
}

function yt(id: string): VideoFuente {
  return {
    tipo: 'iframe',
    src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&autoplay=1`,
    titulo: 'Video de YouTube: permisos de Checa',
  };
}
