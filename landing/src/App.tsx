import { useState } from 'react';
import { Faq } from './components/Faq';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Pricing } from './components/Pricing';
import { RegistroSection } from './components/RegistroSection';
import { StickyCta } from './components/StickyCta';
import { VideoTutorial } from './components/VideoTutorial';
import { leerRegistroLocal } from './lib/testers';

export default function App() {
  const [registrado, setRegistrado] = useState<boolean>(() => leerRegistroLocal() !== null);

  return (
    <>
      <a
        href="#registro"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-30 focus:rounded-full focus:bg-hueso focus:px-4 focus:py-2 focus:text-asfalto"
      >
        Saltar al registro
      </a>
      <main>
        <Hero />
        <RegistroSection onEstado={setRegistrado} />
        <div className="raya" aria-hidden="true" />
        <VideoTutorial />
        <Pricing />
        <Faq />
      </main>
      <Footer />
      <StickyCta oculto={registrado} />
    </>
  );
}
