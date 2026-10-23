export function Pricing() {
  return (
    <section id="precios" aria-labelledby="precios-titulo" className="px-4 py-10">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-considerar">Precios</p>
        <h2 id="precios-titulo" className="mt-2 font-titulo text-[1.7rem] font-extrabold leading-tight">
          Hoy es gratis. Y entrar ahora te asegura el mejor precio.
        </h2>

        <div className="mt-6 space-y-4">
          {/* Gratis */}
          <div className="rounded-3xl border border-neon/40 bg-tablero p-5">
            <p className="text-sm font-bold uppercase tracking-wider text-gris">Gratis hasta</p>
            <p className="mt-1 font-titulo text-3xl font-extrabold text-neon">31 Enero 2027</p>
            <p className="mt-1 text-sm text-gris">Todo incluido durante la beta. Sin tarjeta.</p>
          </div>

          {/* Plan Fundador */}
          <div className="relative rounded-3xl border-2 border-considerar bg-tablero p-5 shadow-glow-amarillo">
            <span className="absolute -top-3.5 left-5 rounded-full bg-considerar px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#2B2200]">
              Plan Fundador · Solo 50 lugares
            </span>
            <p className="mt-2 text-sm font-semibold text-considerar">40 % menos de por vida · 50 lugares en total</p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-baseline justify-between gap-3 border-b border-humo pb-2">
                <span className="text-base font-bold text-gris">1 mes</span>
                <span className="font-titulo text-3xl font-extrabold text-hueso">$71</span>
              </li>
              <li className="flex items-baseline justify-between gap-3 border-b border-humo pb-2">
                <span className="text-base font-bold text-gris">6 meses</span>
                <span className="font-titulo text-3xl font-extrabold text-hueso">$353</span>
              </li>
              <li className="flex items-baseline justify-between gap-3">
                <span className="text-base font-bold text-gris">1 año</span>
                <span className="font-titulo text-3xl font-extrabold text-hueso">$635</span>
              </li>
            </ul>
            <p className="mt-3 text-sm text-gris">El plan anual equivale a $53 al mes. Los 50 lugares se comparten entre los tres planes y se asignan por orden de registro.</p>
          </div>

          {/* Precio normal */}
          <div className="rounded-3xl border border-humo bg-asfalto p-5">
            <p className="text-sm font-bold uppercase tracking-wider text-gris">Precio normal post-lanzamiento</p>
            <p className="mt-2 text-xl font-bold text-hueso/80">
              <span>$1,059/año</span>
              <span className="mx-2 text-gris">·</span>
              <span>$589/6 meses</span>
              <span className="mx-2 text-gris">·</span>
              <span>$119/mes</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
