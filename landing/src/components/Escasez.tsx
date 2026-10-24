import { CIERRE_REGISTRO_TEXTO, LUGARES_TOTAL } from '../config';

interface Props {
  /** Lugares que quedan; null = no se pudo consultar (solo se muestra la fecha límite). */
  lugares: number | null;
}

export function Escasez({ lugares }: Props) {
  const ocupados = lugares === null ? 0 : LUGARES_TOTAL - lugares;
  return (
    <div className="mb-5 rounded-2xl border border-considerar/40 bg-considerar/10 px-4 py-3">
      {lugares !== null && (
        <>
          <p className="text-[0.98rem] font-extrabold text-considerar">
            Quedan {lugares} de {LUGARES_TOTAL} lugares de fundador
          </p>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-asfalto"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={LUGARES_TOTAL}
            aria-valuenow={ocupados}
            aria-label="Lugares de fundador ocupados"
          >
            <div className="h-full rounded-full bg-considerar" style={{ width: `${(ocupados / LUGARES_TOTAL) * 100}%` }} />
          </div>
        </>
      )}
      <p className="mt-2 text-sm leading-snug text-hueso/90">
        Gratis hasta enero. Quien se registre en los primeros {LUGARES_TOTAL} conserva −40 % de por vida. El registro
        cierra al llegar a {LUGARES_TOTAL} o el {CIERRE_REGISTRO_TEXTO}.
      </p>
    </div>
  );
}
