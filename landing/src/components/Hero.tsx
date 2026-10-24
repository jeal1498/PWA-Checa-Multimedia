export function Hero() {
  return (
    <header className="relative overflow-hidden px-4 pt-6 pb-8">
      {/* resplandor verde de fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[130%] -translate-x-1/2 rounded-full bg-aceptar/20 blur-3xl"
      />
      <div className="relative mx-auto max-w-xl">
        <img src="../marca/logo-oscuro.svg" alt="Checa" width="130" height="34" className="h-8 w-auto" />

        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-considerar/40 bg-considerar/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-considerar">
          <span aria-hidden="true" className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-considerar opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-considerar" />
          </span>
          Fase Beta Privada para Conductores
        </p>

        <h1 className="mt-4 font-titulo text-[2.1rem] font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
          Calcula en tiempo real la <span className="text-neon">ganancia real</span> de tus viajes de Uber y DiDi
        </h1>

        <p className="mt-4 text-lg leading-snug text-hueso/85">
          Filtra viajes basura antes de aceptarlos.{' '}
          <strong className="font-bold text-considerar">¡Gratis hasta el 31 de Enero de 2027!</strong> Los primeros 50
          testers conservan −40 % de por vida.
        </p>

        <a
          href="#registro"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-hueso px-6 text-base font-bold text-asfalto transition active:scale-[0.98] sm:hover:bg-white"
        >
          Quiero entrar a la beta ↓
        </a>
      </div>
    </header>
  );
}
