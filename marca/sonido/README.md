# Sonido de marca Checa (v2)

Efectos oficiales, **sintetizados** (no grabados ni generados con IA): cada corrida de `generar_sonidos.py` da los mismos archivos, sin derechos de terceros. Se oyen bien en el altavoz de un teléfono y quedan por debajo de la voz.

**Idea:** el semáforo. Tres notas que suben (rojo, ámbar, verde) y un «ping» de campana al final, que es la ✓. Todo en do mayor.

| Archivo | Cuándo suena | Qué es | Dura |
|---|---|---|---|
| `logo-semaforo` | Animación del logo (rojo 0.1 s, ámbar 0.4 s, verde 0.7 s, ✓ 0.9 s) | Do5 → Mi5 → Sol5 y ping Do6 | 1.8 s |
| `aceptar` | ACEPTAR, o un resultado bueno | Sol5 → Do6, campana que sube | 0.7 s |
| `considerar` | CONSIDERAR | Dos toques iguales en Mi5 (como las 2 vibraciones cortas) | 0.6 s |
| `rechazar` | RECHAZAR, o lo que pierdes | Nota grave que baja (≈ Do4 → Sol3), sin agresividad | 0.8 s |
| `popup-entra` | Entra un pop-up o una tarjeta | «Pop» corto que baja de 760 a 360 Hz | 0.3 s |
| `numero-sube` | Un número que cuenta hacia arriba | Seis toques cada vez más agudos | 0.8 s |
| `sello` | El sello inclinado (ACEPTAR, RECHAZAR…) | Golpe sordo | 0.5 s |

Formatos: `wav/` (16 bits, 44.1 kHz, mono) y `mp3/` (192 kbps). `demo-completa.mp3` los junta con pausas para escucharlos de corrido.

**Niveles:** todos normalizados a pico entre −2.5 y −4.4 dBFS (RMS −15 a −18 dB). En video, con voz: volumen **0.3 a 0.5** (`data-volume`); sin voz, hasta 0.8. La voz siempre manda.

## Reglas de uso
1. **Un sonido por evento visual**, nunca por palabra del subtítulo. Máximo 3 efectos por escena.
2. **El semáforo es el vocabulario:** `aceptar`, `considerar` y `rechazar` solo acompañan a su color. No usar `aceptar` para algo neutro.
3. **No tapar la voz:** si el efecto cae sobre una palabra, bajarlo a 0.3 o moverlo antes de ella.
4. `logo-semaforo` solo en la pantalla final y en introducciones del logo; una vez por video.
5. **Sin música obligatoria.** Si se usa, la voz la baja (`carve`) y los efectos van por encima de ella.

## Verificación (17 oct 2026)
Se comprobó con análisis de espectro que cada nota sale en su frecuencia (523, 659, 784 y 1047 Hz en el logo; 784 → 1047 en `aceptar`; 659 dos veces en `considerar`; descenso en `rechazar`) y que ningún archivo recorta ni queda en silencio. **No se escuchó con oídos**: falta que Eduardo los apruebe antes de usarlos en un video publicado.

## Regenerar o ajustar
`python3 -I generar_sonidos.py` (necesita `numpy` y `ffmpeg`). Las notas y duraciones están al inicio de `sonidos()`; para cambiar un sonido se edita ahí y se vuelve a correr.

## Pendiente
- Aprobación de Eduardo.
- Aplicarlos: la plantilla de video `checa-marca-v2` aún no los incluye (copiar `mp3/` a `assets/sfx/` y declararlos como `<audio>` en `construir.py`), y la app Android sigue con la voz «Aceptar/Considerar/Rechazar» más `ToneGenerator`.
