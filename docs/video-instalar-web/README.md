# Video de /instalar/ (17 oct 2026)

`media/instalar.mp4` (3:03, 720×1280) está hecho a partir del tutorial de Eduardo («20 · Cómo instalar Checa», `Mi-Ruta/marketing/videos/CHECA/20 - Cómo instalar Checa`): misma voz, mismos pasos y las capturas de su grabación original (Drive `1_konXN6bdc1hyDYrOt2tt0kqwunm8ycR`), ahora en marca v2 (asfalto y hueso, Bricolage/DM Sans/JetBrains Mono, subtítulos con palabra activa en amarillo, raya de carretera). Va del «Paso dos» al «Paso doce» (Probar en pantalla), con una tarjeta de inicio y otra de «Listo» y ayuda por WhatsApp (sin redes ni link).

`build-v2.py` es `Mi-Ruta/video/tutorial-instalar/build.py` adaptado: usa solo las líneas 1 y 4–42 de la voz original más dos líneas finales, redibuja con la marca v2, difumina cuentas y nombre, y renderiza en paralelo. Necesita los cuadros de la grabación a 4 fps en `f4/` (`ffmpeg -i grabacion.mp4 -vf fps=4 -q:v 2 f4/%05d.jpg`), la carpeta `voz/` (`l01` = línea 1 original, `l02…l40` = líneas 4…42, `l41` y `l42` = las dos líneas finales) y las fuentes TTF de la marca junto al script. Luego: `python3 -I build-v2.py audio` y `python3 -I build-v2.py`.

Versiones anteriores: ilustrada de 55 s (commit `550dffb`), recorte del TikTok (`efcf8b9`) y TikTok embebido (`d6a5dc3`).
