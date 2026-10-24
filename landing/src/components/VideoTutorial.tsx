import { useState } from 'react';
import { VIDEO_PERMISOS_URL } from '../config';
import { track } from '../lib/track';
import { resolverVideo } from '../lib/video';

export function VideoTutorial() {
  const video = resolverVideo(VIDEO_PERMISOS_URL);
  const [reproduciendo, setReproduciendo] = useState(false);

  return (
    <section id="permisos" aria-labelledby="permisos-titulo" className="px-4 py-10">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-considerar">Tutorial rápido</p>
        <h2 id="permisos-titulo" className="mt-2 font-titulo text-[1.7rem] font-extrabold leading-tight">
          Activa los permisos en 2 minutos
        </h2>
        <p className="mb-5 mt-2 text-gris">
          Mira cómo activar los permisos para que Checa muestre su semáforo encima de Uber y DiDi.
        </p>

        {/* Contenedor 16:9 en celular (9:16 se ve en el propio reproductor de TikTok) */}
        <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-humo bg-tablero">
          {video && reproduciendo ? (
            video.tipo === 'iframe' ? (
              <iframe
                src={video.src}
                title={video.titulo}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <video src={video.src} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black" />
            )
          ) : video ? (
            <button
              type="button"
              onClick={() => {
                setReproduciendo(true);
                track('video_play', 'registro');
              }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-tablero to-asfalto"
              aria-label="Reproducir el video de permisos"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neon text-2xl text-[#04210F] shadow-glow-verde">
                ▶
              </span>
              <span className="text-sm font-bold text-hueso">Ver cómo activar los permisos</span>
            </button>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
              <span aria-hidden="true" className="text-3xl">🎬</span>
              <p className="font-bold">El video de permisos llega muy pronto</p>
              <p className="text-sm text-gris">Te lo compartimos en la comunidad de WhatsApp.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
