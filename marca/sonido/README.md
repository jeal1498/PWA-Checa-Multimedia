# Sonido de marca Checa (v2) — OFICIAL

**Aprobado por Eduardo el 17 oct 2026.** Es una mezcla de dos ideas que se probaron en video:
- **Logo y ACEPTAR → «el semáforo»:** campanas en do mayor (lo musical y de marca).
- **Todo lo demás → «el tablero del auto»:** direccional, relé, odómetro y golpes secos (lo mecánico y familiar).

Los efectos están **sintetizados** (no grabados ni generados con IA): cada corrida de `generar_sonidos.py` da los mismos archivos, sin derechos de terceros.

| Archivo | Cuándo suena | Qué es | Dura |
|---|---|---|---|
| `logo-semaforo` | Animación del logo (rojo 0.1 s, ámbar 0.4 s, verde 0.7 s, ✓ 0.9 s) | Do5 → Mi5 → Sol5 y ping Do6 | 1.8 s |
| `aceptar` | ACEPTAR, o un resultado bueno | Sol5 → Do6, campana que sube | 0.7 s |
| `considerar` | CONSIDERAR | Tic-toc de direccional (1900 y 1300 Hz) | 0.6 s |
| `rechazar` | RECHAZAR, o lo que pierdes | Dos pitidos graves que bajan, apagados | 0.8 s |
| `popup-entra` | Entra un pop-up o una tarjeta | «Clac» de relé con un golpe sordo | 0.3 s |
| `numero-sube` | Un número que cuenta hacia arriba | Odómetro: 10 clics que se aceleran | 0.9 s |
| `sello` | El sello inclinado (ACEPTAR, RECHAZAR…) | «Ka-chunk»: clic y golpe sordo | 0.5 s |

Formatos: `wav/` (16 bits, 44.1 kHz, mono) y `mp3/` (192 kbps). `demo-completa.mp3` los junta con pausas para escucharlos de corrido.

**Niveles:** pico entre −2.5 y −4.4 dBFS. En video, con voz: volumen **0.3 a 0.5** (`data-volume`); sin voz, hasta 0.8. La voz siempre manda.

## Reglas de uso
1. **Un sonido por evento visual**, nunca por palabra del subtítulo. Máximo 3 efectos por escena.
2. **El semáforo es el vocabulario:** `aceptar`, `considerar` y `rechazar` solo acompañan a su color.
3. **No tapar la voz:** si el efecto cae sobre una palabra, bajarlo a 0.3 o moverlo antes.
4. `logo-semaforo` solo en la pantalla final y en introducciones del logo; una vez por video.
5. `popup-entra` sirve para cualquier tarjeta que aparece; `sello` solo con el sello inclinado.

## Cuidado: el cambio de timbre
El logo y `aceptar` suenan a campana y el resto es seco y mecánico. Si en un video se siente como dos marcas, usar el logo y `aceptar` solo en los momentos de remate y dejar el resto como acompañamiento.

## Verificación
Cada nota sale en su frecuencia (523, 659, 784 y 1047 Hz en el logo; 784 → 1047 en `aceptar`; 1900 y 1300 Hz en `considerar`) y ningún archivo recorta ni queda en silencio. Los siete archivos son **idénticos byte a byte** a los que Eduardo escuchó en el video de la mezcla.

## Regenerar o ajustar
`python3 -I generar_sonidos.py` (necesita `numpy` y `ffmpeg`). Las notas y duraciones están en `sonidos()`. El generador descarta tres clics del logo de la propuesta B descartada solo para conservar el mismo ruido que se aprobó; si se cambia algún sonido, ese ruido puede variar.

## Pendiente
Ya están conectados a la plantilla de video `checa-marca-v2` (`construir.py` los agrega solos). Falta la app Android, que sigue con la voz «Aceptar/Considerar/Rechazar» más `ToneGenerator`. **Música:** se descartó el 17 oct 2026.
