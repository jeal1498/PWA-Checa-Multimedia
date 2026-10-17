# Video de /instalar/ (17 oct 2026)

`media/instalar.mp4` (55 s, 720×1280): los 5 pasos de la página, con la voz de Fernando y la marca v2. Son ilustraciones, no capturas de la app. Armado con la plantilla `video/hyperframes/checa-marca-v2` de `jeal1498/Mi-Ruta`: `construir.patch` agrega los tipos de escena `paso`, `listo` y `fin` y deja que el último cuadro no sea el cierre estándar (aquí cierra con ayuda por WhatsApp, sin redes ni link). Si cambian los pasos de la página, hay que actualizar `SCRIPT.md` y `escenas.json` y volver a renderizar: `python3 -I construir.py --render`.

**Reemplazado (17 oct 2026):** `media/instalar.mp4` ahora es el tutorial real de Eduardo (`Mi-Ruta/marketing/videos/CHECA/20 - Cómo instalar Checa`), recortado del «Paso dos» al «Probar en pantalla» (0:20–3:04 del original) y con el final de ilustraciones de este video («Listo» y ayuda por WhatsApp) en lugar del cierre con redes. La versión ilustrada de 55 s está en el commit `550dffb`.
