import { useId, useRef, useState, type FormEvent } from 'react';
import { correoValido, esGmail, registrarTester } from '../lib/testers';
import { track } from '../lib/track';

interface Props {
  onRegistrado: (nombre: string) => void;
}

type Estado = 'inactivo' | 'enviando' | 'error' | 'cerrado';

export function TesterForm({ onRegistrado }: Props) {
  const idNombre = useId();
  const idCorreo = useId();
  const idNota = useId();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [errNombre, setErrNombre] = useState('');
  const [errCorreo, setErrCorreo] = useState('');
  const [estado, setEstado] = useState<Estado>('inactivo');
  const trampa = useRef<HTMLInputElement>(null);
  const refNombre = useRef<HTMLInputElement>(null);
  const refCorreo = useRef<HTMLInputElement>(null);

  const correoLimpio = correo.trim();
  const avisoNoGmail = correoValido(correoLimpio) && !esGmail(correoLimpio);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (estado === 'enviando') return;

    const n = nombre.trim();
    const eN = n.length === 0 ? 'Escribe tu nombre.' : '';
    const eC = !correoValido(correoLimpio) ? 'Escribe un correo válido, por ejemplo tunombre@gmail.com.' : '';
    setErrNombre(eN);
    setErrCorreo(eC);
    if (eN) return refNombre.current?.focus();
    if (eC) return refCorreo.current?.focus();

    // Campo trampa para bots: una persona nunca lo ve ni lo llena.
    if (trampa.current?.value) {
      onRegistrado(n);
      return;
    }

    setEstado('enviando');
    const r = await registrarTester({ nombre: n, correo: correoLimpio });
    if (r.ok) {
      track('beta', 'registro');
      onRegistrado(n);
    } else {
      setEstado(r.motivo === 'cerrado' ? 'cerrado' : 'error');
    }
  }

  const campo =
    'mt-1.5 block min-h-12 w-full rounded-2xl border bg-asfalto px-4 text-base text-hueso placeholder:text-gris/70 focus:border-neon focus:outline-none focus:ring-2 focus:ring-neon/40';

  return (
    <form onSubmit={enviar} noValidate className="space-y-4" aria-describedby={idNota}>
      <div>
        <label htmlFor={idNombre} className="text-sm font-bold text-hueso">
          Nombre del conductor
        </label>
        <input
          ref={refNombre}
          id={idNombre}
          name="nombre"
          type="text"
          autoComplete="given-name"
          maxLength={80}
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          aria-invalid={errNombre ? true : undefined}
          aria-describedby={errNombre ? `${idNombre}-err` : undefined}
          className={`${campo} ${errNombre ? 'border-rechazar' : 'border-humo'}`}
        />
        {errNombre && (
          <p id={`${idNombre}-err`} role="alert" className="mt-1.5 text-sm font-medium text-rechazar">
            {errNombre}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={idCorreo} className="text-sm font-bold text-hueso">
          Correo de Gmail para Google Play <span className="text-considerar">*</span>
        </label>
        <input
          ref={refCorreo}
          id={idCorreo}
          name="correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={120}
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="tunombre@gmail.com"
          aria-invalid={errCorreo ? true : undefined}
          aria-describedby={`${idNota}${errCorreo ? ` ${idCorreo}-err` : ''}`}
          className={`${campo} ${errCorreo ? 'border-rechazar' : 'border-humo'}`}
        />
        {errCorreo && (
          <p id={`${idCorreo}-err`} role="alert" className="mt-1.5 text-sm font-medium text-rechazar">
            {errCorreo}
          </p>
        )}
        {!errCorreo && avisoNoGmail && (
          <p className="mt-1.5 text-sm text-considerar">
            Ese correo no es de Gmail. Si tu cuenta de Google Play usa otro, déjalo; si no, escribe el de Play Store.
          </p>
        )}
        <p id={idNota} className="mt-2 text-sm leading-snug text-gris">
          Ingresa el mismo correo con el que usas Google Play Store en tu celular para autorizar tu acceso.
        </p>
      </div>

      {/* trampa para bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          No llenar este campo
          <input ref={trampa} type="text" name="sitio_web" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {estado === 'error' && (
        <p role="alert" className="rounded-2xl border border-rechazar/50 bg-rechazar/10 px-4 py-3 text-sm text-hueso">
          No pudimos guardar tu correo. Revisa tu internet e inténtalo otra vez en un momento.
        </p>
      )}

      {estado === 'cerrado' && (
        <p role="alert" className="rounded-2xl border border-considerar/50 bg-considerar/10 px-4 py-3 text-sm text-hueso">
          El registro de testers ya cerró. Recarga la página para ver cómo seguir.
        </p>
      )}

      <button
        type="submit"
        disabled={estado === 'enviando'}
        className="min-h-14 w-full rounded-full bg-neon px-5 py-3 text-[0.95rem] font-extrabold uppercase leading-tight tracking-wide text-[#04210F] shadow-glow-verde transition active:scale-[0.98] disabled:opacity-70 sm:hover:bg-aceptar"
      >
        {estado === 'enviando' ? 'Registrando…' : 'Registrar mi correo'}
      </button>

      <p className="text-center text-xs leading-snug text-gris">
        Usamos tu correo solo para darte acceso a la beta y avisarte de la app. Lee el{' '}
        <a href="../privacidad.html" className="underline underline-offset-2">
          aviso de privacidad
        </a>
        .
      </p>
    </form>
  );
}
