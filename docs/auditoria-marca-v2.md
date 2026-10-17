# Auditoría de la web contra la marca v2

Fecha: 17 oct 2026. Fuente de la marca: `marca/` (README, tokens, SVG) y el artifact «Checa: identidad de marca» (láminas de logo, tipografía, voz, recursos, movimiento, pop-up y marcas ajenas). Capturas «antes» a 390 px y 1280 px de las 4 páginas, tomadas con Chromium. Ninguna tiene scroll horizontal.

## 1. Lo que choca con la marca

### Colores
- Fondo `#000`, `#0A0C0B`, tarjetas `#111413`, líneas `#262B28`: verdosos. La marca pide asfalto `#0C0C10`, tablero `#16161C`, humo `#3A3A45`.
- Texto `#F1F5F2` y gris `#A3ADA7`: deben ser hueso `#F4F4EF` y gris `#A3A3AD`.
- Verde como decoración: kickers, títulos del héroe y del precio, íconos, viñetas, bordes de tarjetas, botón principal, barra de avance, `summary::after`. La marca prohíbe el verde sin significado de «aceptar». Hoy los botones son verdes; deben ser hueso con texto asfalto.
- Dorado `#E8B84A` (estrellas, nota de referido, `.beta`, `.btn-gold`): no existe en la marca.
- Rojo `#F43F5E` (favicon, logo del encabezado, chip «Rechazar»): debe ser `#EF4444`. Amarillo `#EAB308` en favicon y pop-up: debe ser `#FACC15`.
- Pop-up de la web: paleta vieja declarada en el propio CSS (`--p-card`, `--p-yellow`, `--p-red`); texto sobre rojo en blanco (debe ser `#1F0000`).
- `theme-color`: `#000000` en inicio e instalar, `#0E1110` en legales. Debe ser `#0C0C10`.

### Letras
- Fira Sans y Fira Code desde Google Fonts. La marca pide Bricolage Grotesque 800 (títulos y números), DM Sans (texto) y JetBrains Mono (datos y etiquetas), autohospedadas. No hay ninguna fuente en el repo.
- Títulos sin interletraje de marca (−4 % a −5 %). `.kicker` en mayúsculas con Fira Sans; debe ir en JetBrains Mono.
- Dependencia externa: 2 `preconnect` + hoja de Google Fonts en inicio e instalar. Contradice «autohospedadas».

### Logo y favicon
- El logo del encabezado es un semáforo propio, con luces encendidas las tres (rojo, amarillo y verde) y sin ✓. La marca: luces roja y ámbar apagadas, verde encendida con ✓, más «Checa».
- `favicon.svg`: igual de incorrecto (tres luces encendidas, `#EAB308`, `#EF4444`). Los SVG de marca (`semaforo.svg`, `logo-oscuro.svg`, `icono-app.svg`) ya existen.
- Altura del logo del encabezado: 38 px solo semáforo; el completo debe ser ≥ 32 px. Cumple.
- No hay apple-touch-icon, ni íconos PNG, ni `manifest`.
- Los legales llevan el logo sin `aria-label`.

### Imágenes
- `og.png` (1200×630): semáforo viejo, fondo `#000`, Fira Sans y verde como decoración en «checa cuánto te queda». Hay que rehacerlo. Además nombra «Uber y DiDi» en la imagen (aceptable como frase factual, pero conviene quitarlo) y no lleva «Números de ejemplo» (no hay cifras).
- `og:image` sin `alt`, sin `twitter:image`, sin `og:image:type`.
- `media/vsl.jpg` y `vsl.mp4`: son clip real de Eduardo; no se tocan. Notas: los subtítulos del video usan rosa/rojo (`¿ACEPTAS A CIEGAS?`, «CIEGAS») que no es el `#EF4444` ni el estilo de la lámina de subtítulos. Es decisión de Eduardo si se rehace el clip; la web solo puede enmarcar el póster con los radios de marca.

### Formas
- Radios 16, 14, 12, 10 y 40 px. Marca: 28, 20 y píldora. Botones con radio 12 px: deben ser píldora.
- Esquinas rectas: `.note` (`border-radius:0 12px 12px 0` con borde izquierdo de 4 px), `.install li::before` con número plano, filas del pop-up.
- Íconos: trazo 2 y 2.5 (marca: 2.2 redondeado). Los de Confianza (ojo, teléfono, escudo, flecha circular) no están en la lámina de íconos: usar los de la lámina (candado, check, gasolina, hora, km, recogida, neto, voz) o dibujarlos con el mismo estilo. Los checks de viñetas se dibujan con bordes CSS, no con trazo.
- Emoji: `⚡` en el pop-up de `app.js` («⚡ Dinámica +$15 incluido»). Prohibido.
- Estrella dorada «en la mejor oferta»: la marca marca la mejor oferta con borde hueso y etiqueta «Mejor»; no hay estrella.

### Recursos de marca (faltan todos)
- Raya de carretera punteada amarilla con una sola luz verde: no existe.
- Tres puntos (verde, amarillo, rojo) como separador, viñeta o barra: no existen. Las viñetas son checks verdes y los pasos de `/instalar/` son círculos verdes.
- Sellos inclinados: no existen.

### Pop-up (ilustración del «Cómo funciona», `app.js`)
- La altura depende del contenido: la línea `surge` se oculta cuando está vacía (`.surge:empty`), así que los estados no miden lo mismo. La marca: los tres miden exactamente lo mismo (236 px de alto en la lámina).
- Hay textos que son solo un monto («$97» y «$171» en las fichas, «por hora», «por km» debajo). La regla pide «Te quedan $x», «$x/h», «$x/km», «… km total».
- Las cifras de ejemplo van marcadas: el contenedor tiene `aria-label` «números de ejemplo», pero a la vista no hay etiqueta. Falta el letrero visible «Números de ejemplo».
- La tarjeta «Uber · Nuevo viaje» detrás del pop-up usa el nombre de la app: la marca pide pantalla genérica sin nombre ni colores. `OFFERS` en `app.js` rotula `Uber` y `DiDi` en la franja y en la tarjeta.
- Rotación cada 3.8 s con cambio sin transición; la marca pide curva `cubic-bezier(.2,.8,.2,1)`, 200 ms.

### Movimiento
- `transition` con `ease` por omisión, `.15s`, `.2s`, `.25s`, `.3s`; ninguna usa la curva de marca.
- Animación del logo (rojo → ámbar → verde → ✓ en 1.2 s): no existe.
- `prefers-reduced-motion`: ya se respeta (CSS y `app.js` para la rotación). Bien. Falta cubrir la animación nueva del logo cuando se agregue.

### Voz y texto (solo lo que la marca exige; el resto está aprobado)
- `privacidad.html` dice «reconocimiento de texto local»: tecnicismo (OCR) prohibido por la marca. Propuesta aparte, por ser texto legal: «la lectura se hace en tu teléfono, sin internet».
- «Accesibilidad» aparece en FAQ e instalar: es el nombre del ajuste de Android, se mantiene.
- Nombres de competencia: ninguno. Ciudad o país: ninguno en la web; `es-MX`/`es_MX` en `lang` y `og:locale` y moneda «$» son técnicos. El pie y `terminos.html` mencionan «Mercado Pago», «OXXO», «pesos mexicanos» y el teléfono `998` (código de área de una ciudad): pregunta abierta, ver 4.
- Palabras de marca: la web ya usa netos, por km, por hora, recogida, te queda. «Lana» no aparece; no es obligatoria.
- Aviso de independencia: presente en la sección Confianza y en el pie del inicio. El pie de `instalar` lo trae sin «Pagos procesados…» (correcto). Falta en `terminos.html` una frase de independencia al inicio (ya está en el cuerpo).
- «Números de ejemplo»: falta el letrero visible en el pop-up, en «Una oferta de $120…» y en la cifra «$97 netos» del bloque Problema.
- Promesa de ganancia: «Si evitas un solo viaje malo a la semana, el plan de 6 meses se paga solo» es una promesa de ahorro. La marca prohíbe promesas de ganancia. Propuesta aparte (no cambiar sin aprobación): «Con un viaje malo menos a la semana, la cuenta cambia: tú la haces con Checa» u omitirla.

## 2. Lo que falta
- `og:image` nuevo (1200×630 PNG), `twitter:image`, `og:image:alt`.
- `favicon.svg` de marca, `favicon-32.png`, `apple-touch-icon.png` (180 px), `icon-192.png` y `icon-512.png`, `site.webmanifest` con `theme_color` y `background_color`.
- `theme-color` `#0C0C10` en todas las páginas (mismo valor en instalar y legales).
- Fuentes woff2 autohospedadas (Bricolage 800, DM Sans 400/500/700, JetBrains Mono 500/700) con `font-display:swap` y `preload` solo de las que se usan en el primer pantallazo.
- Raya de carretera, tres puntos y sellos como SVG/CSS.
- Etiqueta visible «Números de ejemplo».
- Estados de foco y mínimos táctiles: ya hay `:focus-visible` amarillo (`#FACC15`, color con significado; se cambia a hueso con anillo asfalto para no usar amarillo como decoración).

## 3. Riesgos
- **Contraste** (calculado, texto sobre fondo): gris `#A3A3AD` / asfalto 7.8:1, / tablero 7.2:1. Hueso / asfalto 17.7:1. `#04210F` / verde 7.5:1. `#2B2200` / amarillo 10.3:1. `#1F0000` / rojo 5.3:1. Rojo `#EF4444` / asfalto 5.2:1. **Humo `#3A3A45` / asfalto 1.7:1: solo bordes y fondos, nunca texto.** Todo cumple AA si el humo no se usa como texto.
- **Peso de fuentes:** 6 archivos woff2 (Bricolage 800, DM Sans ×3, JetBrains Mono ×2); el peso real se mide al descargarlas. Hoy: 1 hoja externa + 2 conexiones. Mitigación: `font-display:swap`, subconjunto latín y `preload` solo de Bricolage 800 y DM Sans 400.
- **Rendimiento:** el video (3.7 MB) ya se carga solo al tocar. El póster pesa 37 KB. No se agregan dependencias.
- **Caché:** `styles.css?v=20261016`: cambiar a `?v=20261017` (o más nuevo) en las 4 páginas.
- **Pop-up de igual tamaño:** el pop-up actual cambia de altura entre ofertas; al fijarlo (236 px en la lámina, escalado) hay que probar que «Rec. 6 km» y «$9.4/km» no se desborden en 390 px.
- **Medición y UTM:** no se toca `medir.js`, `data-dl`, `data-ev` ni los href de descarga.
- **Alineación app/web:** `marca/README.md` dice «Aún no se aplica a la web»; hay que actualizarlo al terminar.

## 4. Preguntas abiertas para Eduardo
1. **Teléfono de WhatsApp (998…)**: el código de área delata la ciudad. La regla dice «sin ciudad ni país en ningún texto o imagen». ¿Se queda como contacto de soporte (los legales y Mercado Pago lo exigen) o prefieres un enlace `wa.me` sin mostrar el número en texto?
2. **«Mercado Pago», «OXXO», «pesos mexicanos», `es-MX`**: ¿se consideran país? Los legales los necesitan para el pago. Propongo dejarlos solo en `terminos.html`.
3. **Promesa «se paga solo»**: ¿la quitamos o la reescribimos?
4. **Subtítulos del video** en rosa/rojo fuera de paleta: ¿se rehace el clip con la lámina de subtítulos o se deja?
5. **Botones de descarga**: en hueso con texto asfalto (según la marca). ¿Confirmas, aunque dejan de ser verdes?

## 5. Plan de cambios (de mayor a menor impacto)
1. **Tokens y fuentes.** `marca/tokens.css` como base de las variables CSS. Fuentes woff2 en `fonts/`, `@font-face`, quitar Google Fonts y `preconnect` de las 4 páginas. Subir `?v=`.
2. **Colores y formas globales.** Fondo asfalto, tarjetas tablero, bordes humo, texto hueso/gris. Quitar el verde decorativo, el dorado y el amarillo de foco. Botones hueso en píldora, tarjetas 28/20 px, sin esquinas rectas.
3. **Logo, favicon y metadatos.** Logo de marca en encabezado, `favicon.svg`, PNG (32, 180, 192, 512), `og.png` nuevo, `theme-color`, `site.webmanifest`.
4. **Pop-up del «Cómo funciona».** Tres estados del mismo tamaño, textos con unidad, sin emoji, sin nombres de apps, letrero «Números de ejemplo», curva de marca.
5. **Recursos.** Raya de carretera en héroe y cierre, tres puntos como separadores y viñetas, sellos Aceptar/Considerar/Rechazar en la tira de «Cómo funciona».
6. **Íconos.** Trazo 2.2 redondeado; viñetas con trazo en vez de CSS; reemplazo de la estrella dorada por la etiqueta «Mejor».
7. **Instalar.** Pasos con tres puntos y progreso con la barra de tres puntos; botón hueso; ayuda por WhatsApp con borde de marca.
8. **Legales y pie.** Mismo encabezado y pie; avisos cortos de la marca; solo Privacidad y Términos.
9. **Movimiento.** Curva y duraciones de marca; animación del logo de 1.2 s con `prefers-reduced-motion`.
10. **Cierre.** Verificar contraste, scroll y medición; actualizar `marca/README.md`.
