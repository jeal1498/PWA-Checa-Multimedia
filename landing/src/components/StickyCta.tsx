import { useEffect, useState } from 'react';

/** Botón fijo en el celular: aparece cuando el formulario no está en pantalla y se oculta al registrarse. */
export function StickyCta({ oculto }: { oculto: boolean }) {
  const [formularioVisible, setFormularioVisible] = useState(true);

  useEffect(() => {
    const el = document.getElementById('registro');
    if (!el || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(([entrada]) => setFormularioVisible(entrada.isIntersecting), {
      threshold: 0.15,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [oculto]);

  if (oculto || formularioVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-humo bg-asfalto/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden">
      <a
        href="#registro"
        className="flex min-h-13 w-full items-center justify-center rounded-full bg-neon px-5 py-3 text-center text-sm font-extrabold uppercase tracking-wide text-[#04210F] shadow-glow-verde"
      >
        Registrar mi correo
      </a>
    </div>
  );
}
