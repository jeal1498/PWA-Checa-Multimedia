# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Eduardo, dueño de Checa. No es técnico. Usa el Admin casi siempre en el teléfono (Android), varias veces al día y en ratos sueltos. Su trabajo ahí: saber de un vistazo si todo funciona y, cuando algo falla o hay pendientes, resolverlo con pocos toques. Existe un rol "revisor" (puede dar veredictos) y uno de solo lectura; hoy el único usuario confirmado es Eduardo.

## Product Purpose
Checa es una app Android para conductores de plataformas de transporte en México: lee en pantalla la tarifa, los km y los minutos de cada oferta y le dice al conductor cuánto le queda. El Admin (`admin-checa-7e3a91/`) es el centro de control del dueño: salud del sistema, errores y ofertas mal leídas por la app, versiones, dispositivos, auditoría de la IA y configuración. Éxito: Eduardo sabe en segundos si puede ignorarlo hoy, y revisar capturas no le cuesta esfuerzo.

## Positioning
Un tablero hecho para un dueño no técnico: responde "¿puedo ignorarlo hoy?" en lenguaje llano y nunca inventa datos (sin datos se muestra "aún no se sabe", no un cero ni un verde falso).

## Operating Context
Acceso con Google (Supabase); las funciones `admin_*` validan el rol en el servidor y registran cada consulta. Web estática en GitHub Pages, JS sin framework, sin dependencias propias. El teléfono suele tener señal irregular. Eduardo lo mira entre otras tareas.

## Capabilities and Constraints
- Módulos: Inicio · Salud, Errores (expediente como cola), Ofertas (con Revisar capturas), Versiones, Equipos, Auditoría IA, Ajustes.
- Inicio: veredicto con semáforo, cadena de 7 pasos de la lectura, hasta 3 alertas "Por revisar", cifras y gráficas plegadas en "Todo el detalle", y el pendiente de revisión de capturas.
- Reglas de datos: n<30 se marca "pocos casos para opinar"; nunca verde si faltan datos.
- CSP estricta (`style-src 'self'`, sin estilos en línea); datos se pintan con `textContent`; fuentes autohospedadas en `/fonts`.
- Idioma: español de México, palabras de todos los días; sin tecnicismos (OCR, p50, n =).

## Brand Commitments
Identidad de marca Checa v2 (`marca/`, aprobada el 17 oct 2026) es vinculante para el Admin: asfalto `#0C0C10` y hueso `#F4F4EF`; el color solo decide (aceptar `#22C55E`, considerar `#FACC15`, rechazar `#EF4444`); Bricolage Grotesque 800 para títulos y números, DM Sans para texto, JetBrains Mono para datos y etiquetas; formas de píldora y radios 28/20; el semáforo con la luz verde y ✓ como logo; sin emoji ni verde decorativo. Tokens en `marca/tokens.css` y `marca/tokens.json`. El rediseño cambia composición y detalle, no la identidad.

## Evidence on Hand
Código actual del Admin (`admin-checa-7e3a91/`), marca v2 completa en `marca/`, auditorías en `docs/auditoria-admin-ux.md` y `docs/auditoria-marca-v2.md`, críticas en `.impeccable/critique/`. No hay datos reales de producción en el repositorio: las pruebas visuales usan datos simulados y deben rotularse así.

## Product Principles
1. Responder primero "¿puedo ignorarlo hoy?"; todo lo demás, a un toque.
2. Honestidad de datos: lo que no se sabe se dice, nunca se rellena.
3. Una tarea principal por pantalla y lenguaje llano.
4. Pensado para el pulgar y para atención interrumpida: acciones abajo, estado que sobrevive a una interrupción.
5. El color decide, no decora.

## Accessibility & Inclusion
Contraste mínimo 4.5:1, letra mínima de 12px, objetivos táctiles de 44px, el estado nunca solo por color (siempre con texto), `prefers-reduced-motion` respetado, foco visible y diálogos con foco atrapado.
