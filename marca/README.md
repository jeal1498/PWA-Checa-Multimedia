# Identidad de marca Checa v2

**Fuente única de la identidad de marca.** Vive aquí, en `PWA-Checa-Multimedia`, y el repo de la app (`jeal1498/Mi-Ruta`) apunta a esta carpeta cuando se pide la marca. Se publica en https://jeal1498.github.io/PWA-Checa-Multimedia/marca/

Aprobada el 17 oct 2026. Ya se aplica a la web (17 oct 2026); aún no a la app.

- **Logo:** el semáforo con la luz verde encendida y una ✓ dentro. Versiones en SVG: `semaforo*.svg` (solo semáforo), `logo-*.svg` (semáforo + «Checa»), `icono-app.svg`.
- **Texto del logo:** los SVG llaman a *Bricolage Grotesque 800*; si la fuente no está instalada cae a Arial Black. Para entregar a imprenta, convertir el texto a trazos.
- **Colores y medidas:** `tokens.json`, `tokens.css` y `colors-android.xml`.
- **Marca:** asfalto y hueso. El color solo decide: aceptar `#22C55E` (igual al verde del logo), considerar `#FACC15` (amarillo de la raya de la calle), rechazar `#EF4444`.
- **PNG:** `png/icono-32|180|192|512.png`, generados de `icono-app.svg`.
- **Láminas de diseño (reglas del logo, tipografía, voz, recursos, plantillas, subtítulos, movimiento, pop-up, marcas ajenas, material de venta y tarjeta de marca):** en el artifact «Checa: identidad de marca».
- **Sonido:** carpeta `sonido/` con los efectos oficiales (aprobados el 17 oct 2026): logo y aceptar con campanas, y considerar, rechazar, pop-up, número y sello del «tablero del auto». Sintetizados con `generar_sonidos.py`. Reglas en `sonido/README.md`.
