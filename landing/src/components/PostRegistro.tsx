import { WHATSAPP_COMUNIDAD } from '../config';
import { track } from '../lib/track';

interface Props {
  nombre: string;
  onOtroCorreo: () => void;
}

export function PostRegistro({ nombre, onOtroCorreo }: Props) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-neon text-xl font-black text-[#04210F]"
        >
          ✓
        </span>
        <div>
          <h3 className="font-titulo text-2xl font-extrabold leading-tight">
            {nombre ? `¡Listo, ${nombre}!` : '¡Listo!'}
          </h3>
          <p className="mt-1.5 text-[0.98rem] leading-snug text-hueso/90">
            Tu correo quedó registrado en la lista de testers. Ahora entra a la comunidad de WhatsApp: ahí te compartimos
            el enlace de Google Play para instalar Checa, además de avisos, actualizaciones y soporte.
          </p>
        </div>
      </div>

      <a
        href={WHATSAPP_COMUNIDAD}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track('beta_whatsapp', 'registro')}
        className="flex min-h-14 w-full items-center justify-center rounded-full bg-aceptar px-5 py-3 text-center text-base font-extrabold leading-tight text-[#04210F] shadow-glow-verde transition active:scale-[0.98] sm:hover:bg-neon"
      >
        🟢 Entrar a la comunidad de WhatsApp
      </a>

      <p className="text-center text-sm text-gris">
        Usa el mismo correo de Gmail de tu Play Store para abrir el enlace de la prueba.{' '}
        <button type="button" onClick={onOtroCorreo} className="underline underline-offset-2">
          Usar otro correo
        </button>
      </p>
    </div>
  );
}
