import { useState } from 'react';
import { guardarRegistroLocal, leerRegistroLocal } from '../lib/testers';
import { PostRegistro } from './PostRegistro';
import { TesterForm } from './TesterForm';

interface Props {
  onEstado?: (registrado: boolean) => void;
}

export function RegistroSection({ onEstado }: Props) {
  // Estado de «registro completado»: se recuerda en este teléfono para que, al recargar,
  // se vean directo los enlaces de acceso.
  const [registro, setRegistro] = useState<{ nombre: string } | null>(() => leerRegistroLocal());

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
            <p className="mb-5 mt-2 text-[0.98rem] text-gris">Toma menos de un minuto.</p>
            <TesterForm onRegistrado={alRegistrar} />
          </>
        )}
      </div>
    </section>
  );
}
