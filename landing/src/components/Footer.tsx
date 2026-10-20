export function Footer() {
  return (
    <footer className="px-4 pb-28 pt-6 text-center text-xs leading-relaxed text-gris">
      <nav aria-label="Legal" className="mb-3 flex justify-center gap-5 font-semibold">
        <a href="../privacidad.html" className="underline underline-offset-2">
          Privacidad
        </a>
        <a href="../terminos.html" className="underline underline-offset-2">
          Términos y reembolsos
        </a>
      </nav>
      <p className="mx-auto max-w-md">
        © {new Date().getFullYear()} Checa. Proyecto independiente. No afiliado a Uber ni a DiDi; sus nombres son marcas
        de sus dueños.
      </p>
    </footer>
  );
}
