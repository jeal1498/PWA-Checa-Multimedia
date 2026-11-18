# Auditoría UI/UX — Checa Admin (`admin-checa-7e3a91/`)

Método: skill `ui-ux-pro-max` (10 categorías por prioridad) + búsquedas `--domain ux` y `--design-system`. Revisión estática de `index.html`, `estilo.css` y `app.js`. No se probó en dispositivo real (el admin exige login con Google).

## Calificación global: **7.4 / 10**

| # | Categoría (prioridad) | Nota | Resumen |
|---|---|---|---|
| 1 | Accesibilidad (crítica) | 6.0 | Falta foco visible, tabs sin semántica, grises con poco contraste |
| 2 | Táctil e interacción (crítica) | 8.5 | Botones ≥44px en móvil/tablet, nav inferior; sin retroalimentación al pulsar |
| 3 | Rendimiento (alta) | 7.5 | Sin librerías propias, skeletons; fuentes admin no se cargan; sin caché offline |
| 4 | Estilo (alta) | 8.5 | Coherente, claro/oscuro, íconos SVG, lenguaje no técnico |
| 5 | Layout y responsive (alta) | 8.5 | 3 modos (teléfono/tableta/escritorio), tablas→tarjetas, safe-area |
| 6 | Tipografía y color (media) | 6.5 | Textos de 10–12px; gris `#8a8a92` ≈3.3:1 sobre blanco |
| 7 | Animación (media) | 8.0 | Sutil, respeta `prefers-reduced-motion` |
| 8 | Formularios (media) | 6.5 | Filtros con etiqueta, pero sin `inputmode`/`autocomplete`, sin error por campo |
| 9 | Navegación (alta) | 6.5 | 7 pestañas en barra inferior (límite recomendado: 5), Atrás del navegador roto |
| 10 | Gráficas y datos (baja) | 7.5 | `role=img` + `aria-label`; color + etiqueta; sin tooltip táctil ni tabla alternativa |

## Lo que ya está bien
- Viewport con `viewport-fit=cover`, safe-areas, `color-scheme` claro/oscuro con tokens CSS.
- Móvil: nav inferior fija, tarjetas 2 columnas, tablas convertidas a tarjetas con `data-label`, inputs a 16px (evita zoom iOS).
- Tableta: breakpoint propio 761–1100px, barra lateral compacta, controles de 44px.
- Estado nunca solo por color (insignia + texto + punto). Sin `innerHTML` con datos, CSP estricta.

## Hallazgos (ordenados por severidad)

**Alta**
1. **Sin `:focus-visible`** en ningún elemento (0 reglas). Teclado, lectores y tabletas con teclado no ven dónde están.
2. **7 módulos en la barra inferior del teléfono** con texto de 10px. Se aprieta (≈50px por botón en 360px) y excede el máximo de 5.
3. **Atrás del navegador/gesto no funciona:** `ir()` usa `history.replaceState`; no hay historial entre módulos (`app.js:81`). En Android el gesto "atrás" saca de la app.
4. **Contraste insuficiente:** `--gris #8a8a92` y `--tenue #5b5b64` en textos de 11–12px (`.def`, `.detalle`, `.etiqueta`, `summary`). Modo oscuro `--gris #7a7a84` también bajo.

**Media**
5. **Tabs sin semántica:** los botones usan `aria-selected` sin `role="tab"`/`tablist`; falta `aria-current="page"`.
6. **Texto demasiado pequeño:** 10px (nav móvil), 11px (`.def`, `.tag`), 12px (`.detalle`, filtros). Mínimo recomendado 12px; cuerpo 14–16px.
7. **Fuentes no cargadas:** `estilo.css` declara "DM Sans/Bricolage/JetBrains Mono" pero no hay `@font-face` ni la CSP permite otras fuentes; cae a `system-ui`. Hay que empaquetarlas (ya existen en `/fonts`).
8. **Filtros:** `placeholder` como pista en "Versión", sin `inputmode`, `enterkeyhint` ni botón "Limpiar".
9. **Gráficas sin alternativa táctil:** sin tooltip al tocar ni tabla de datos para lectores.
10. **Cabecera móvil:** `Checa Admin + correo + Modo claro + Salir` compite por espacio; el correo se trunca sin elipsis.

**Baja**
11. Sin retroalimentación de pulsación (`:active`) en botones táctiles.
12. Sin `aria-live` en cambios de módulo/carga; el `role=alert` cubre solo errores.
13. Sin estado "sin conexión"; no hay "actualizado hace X" ni botón de refrescar (útil en tableta fija como monitor).
14. En tableta horizontal el contenido se queda en 1300px y la barra lateral de 168px sin colapsar.

## Propuesta

### Fase 1 — Rápida (≈1–2 h, solo CSS/HTML, bajo riesgo)
- Agregar `:focus-visible { outline:3px solid var(--texto); outline-offset:2px }` y `:active { transform:scale(.98) }`.
- Subir contraste: `--tenue` a `#4a4a52` (claro) y `--gris` a `#6b6b73`; en oscuro `--gris #9a9aa4`.
- Tamaños mínimos: nav móvil 11→12px, `.def/.tag/.detalle` 12px, tarjetas 14px.
- `@font-face` locales (DM Sans, Bricolage, JetBrains Mono) con `font-display:swap`.
- `role="tablist"`/`role="tab"` + `aria-current` en `nav`.

### Fase 2 — Navegación móvil (≈3–4 h)
- **Móvil:** barra inferior de **4 destinos** (Salud, Errores, Ofertas, **Más**). "Más" abre una hoja inferior (bottom sheet) con Versiones, Equipos, IA y Ajustes. Cada botón ≥56px y texto 12px.
- **Tableta:** barra lateral que se colapsa a solo íconos (72px) en vertical y se expande en horizontal.
- Usar `history.pushState` + `popstate` para que Atrás regrese al módulo anterior.
- Cabecera móvil: solo logo + menú de cuenta (correo, tema, salir) en un desplegable.

### Fase 3 — Datos y tableta (≈4–6 h)
- Tableta horizontal: panel dividido (lista a la izquierda, detalle a la derecha) en Errores/Ofertas.
- Gráficas: toque para ver valor, y `<details>` con tabla de datos.
- Filtros en hoja inferior en móvil ("Filtros (2)") con `inputmode`, "Limpiar" y errores junto al campo.
- Indicador "Actualizado hace X min" + jalar para refrescar; aviso de "sin conexión".

### Meta de calificación
Tras Fase 1: **8.2**. Tras Fase 2: **8.8**. Tras Fase 3: **9.3**.

## Checklist de verificación (probar en 360×800, 390×844, 768×1024, 1024×768 y 1180×820)
- [ ] Sin scroll horizontal en ningún módulo
- [ ] Todos los botones ≥44×44px, separados ≥8px
- [ ] Foco visible con teclado en cada control
- [ ] Contraste ≥4.5:1 en claro y oscuro
- [ ] Atrás regresa al módulo anterior
- [ ] Contenido no queda tapado por la barra inferior ni el notch
