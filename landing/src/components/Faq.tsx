const PREGUNTAS: { p: string; r: string }[] = [
  {
    p: '¿Por qué necesito ingresar mi correo de Gmail?',
    r: 'Google Play solo deja instalar versiones de prueba a las cuentas que están en una lista de testers. Con el correo que usas en Play Store en tu celular te agregamos a esa lista. Lo usamos únicamente para darte acceso y avisarte de las actualizaciones de la beta.',
  },
  {
    p: '¿CHECA funciona al mismo tiempo con Uber y DiDi?',
    r: 'Sí. Checa lee las ofertas de Uber y de DiDi. Con pantalla dividida (por ejemplo, en una tablet) muestra un pop-up por app y marca cuál es la mejor oferta. Durante la beta todo viene incluido.',
  },
  {
    p: '¿Es seguro usar los permisos de sobreposición?',
    r: 'Checa solo lee la oferta en pantalla y te muestra el semáforo encima: no acepta, no rechaza ni toca nada en Uber o DiDi, la decisión siempre es tuya. La lectura ocurre en tu teléfono y tus viajes no se envían a ningún servidor. Solo está activa en Uber y DiDi, y si la app de tu banco se queja, pausas el lector con un toque.',
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-titulo" className="px-4 py-10">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-considerar">Preguntas frecuentes</p>
        <h2 id="faq-titulo" className="mt-2 font-titulo text-[1.7rem] font-extrabold leading-tight">
          Lo que más nos preguntan
        </h2>

        <div className="mt-5 space-y-3">
          {PREGUNTAS.map((item) => (
            <details key={item.p} name="faq" className="group rounded-2xl border border-humo bg-tablero">
              <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-base font-bold leading-snug">
                {item.p}
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-asfalto text-xl leading-none text-neon transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="px-4 pb-4 text-[0.98rem] leading-relaxed text-hueso/85">{item.r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
