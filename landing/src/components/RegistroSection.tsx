import { useEffect, useState } from 'react';
import { CIERRE_REGISTRO_MS, CIERRE_REGISTRO_TEXTO, WHATSAPP_COMUNIDAD } from '../config';
import { consultarLugares, guardarRegistroLocal, leerRegistroLocal } from '../lib/testers';
import { track } from '../lib/track';
import { Escasez } from './Escasez';
import { PostRegistro } from './PostRegistro';
import { TesterForm } from './TesterForm';

interface Props {
  onEstado?: (registrado: boolean) => void;
}

export function RegistroSection({ onEstado }: Props) {
  // Estado de «registro completado»: se recuerda en este teléfono para que, al recargar,
  // se vean directo los enlaces de acceso.
  const [registro, setRegistro] = useState<{ nombre: string } | null>(() => leerRegistroLocal());

  const [lugares, setLugares] = useState<number | null>(null);
  useEffect(() => {
    consultarLugares().then(setLugares);
  }, []);
  const cerrado = Date.now() >= CIERRE_REGISTRO_MS || lugares === 0;

  function alRegistrar(nombre: string) {
    guardarRegistroLocal(nombre);
    setRegistro({ nombre });
    onEstado?.(true);
    // Lleva al inicio del bloque para que se vean los botones nuevos.
    document.getElementById('registro')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function otroCorreo() {
    try {
      window.localStorage.removeItem('checa_registro_v1');
    } catch {
      /* nada */
    }
    setRegistro(null);
    onEstado?.(false);
  }

  return (
    <section id="registro" aria-labelledby="registro-titulo" className="scroll-mt-4 px-4 py-8">
      <div className="mx-auto max-w-xl rounded-[28px] border border-neon/30 bg-tablero p-5 shadow-glow-verde sm:p-7">
        {registro ? (
          <PostRegistro nombre={registro.nombre} onOtroCorreo={otroCorreo} />
        ) : (
          <>
            <h2 id="registro-titulo" className="font-titulo text-[1.7rem] font-extrabold leading-tight">
              Únete a la Beta Privada de Google Play
            </h2>
            {cerrado ? (
              <div className="mt-3 space-y-4">
                <p className="text-[0.98rem] leading-snug text-hueso/90">
                  El registro de testers ya cerró
                  {lugares === 0 ? ': se llenaron los 50 lugares.' : ` (cerraba el ${CIERRE_REGISTRO_TEXTO}).`} Entra a la
                  comunidad de WhatsApp para enterarte cuando Checa llegue a Google Play.
                </p>
                <a
                  href={WHATSAPP_COMUNIDAD}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('beta_whatsapp', 'registro')}
                  className="flex min-h-14 w-full items-center justify-center rounded-full bg-aceptar px-5 py-3 text-center text-base font-extrabold leading-tight text-[#04210F] shadow-glow-verde transition active:scale-[0.98] sm:hover:bg-neon"
                >
                  🟢 Entrar a la comunidad de WhatsApp
                </a>
              </div>
            ) : (
              <>
                <p className="mb-4 mt-2 text-[0.98rem] text-gris">Toma menos de un minuto.</p>
                <Escasez lugares={lugares} />
                <TesterForm onRegistrado={alRegistrar} />
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
