# Checa — seguimiento del proyecto y punto de reanudación

Última actualización: 21 de octubre de 2026.

## Estado rápido
- **Sí: los cambios están en `main`** del repositorio web `jeal1498/checa-web`. El cambio más reciente fue confirmado en GitHub.
- Commit más reciente: [4801d83](https://github.com/jeal1498/checa-web/commit/4801d83b5bc4c577bb04255dfb7d6c3a3319b165) — “Actualiza cupo del plan fundador a 50 lugares”.
- Archivo: `landing/src/components/Pricing.tsx`; cambió el texto “Limitado a 100 lugares” por “Solo 50 lugares”.
- **Importante:** esto solo cambia el texto visible. El límite real de 50 aún no está implementado en backend.
- Los cambios anteriores de precios se hicieron mediante commits en los repositorios, pero no se ha desplegado la Edge Function ni publicado una nueva versión de Android como parte de este trabajo.

## Repositorios
- Android (privado): https://github.com/jeal1498/Mi-Ruta
  - Paquete Android: `com.jeal1498.checa`
  - Namespace Kotlin: `com.karen.miruta`
- Web (público): https://github.com/jeal1498/checa-web
  - Web pública: https://jeal1498.github.io/checa-web/
- Supabase: proyecto `gqsadclvftkzwrihfipz`, nombre `checa`, región us-east-1.

## Modelo comercial acordado
- Versión Google Play: suscripciones auto-renovables y pagos procesados por Google Play.
- Versión descargable directamente: mantener Mercado Pago, si se confirma este diseño final.
- Precios regulares: mensual **$119 MXN**, 6 meses **$589 MXN**, anual **$1,059 MXN**.
- Precios de fundador: mensual **$71 MXN**, 6 meses **$353 MXN**, anual **$635 MXN** (aprox. 40% de descuento).
- Cupo fundador: **50 personas máximo**, no 100.
- El precio fundador actual se calcula en `supabase/functions/mp-pago/index.ts` según la fecha de creación/condiciones de beta; no hay aún un contador o asignación transaccional de 50 plazas.

## Cambios realizados
### Android `jeal1498/Mi-Ruta`
- `supabase/functions/_shared/planes.ts`: precios regulares 99→119, 499→589, 899→1059; precios beta/fundador 59→71, 299→353, 539→635.
- `app/src/main/java/com/karen/miruta/MainActivity.kt`: textos de precios y equivalencias actualizados.
- En el código actual de `MainActivity.kt`, el flavor Play aún dice que las compras integradas no están disponibles. **Google Play Billing no está implementado todavía.**
- `supabase/functions/mp-pago/index.ts` crea preferencias de Mercado Pago y calcula elegibilidad de fundador.
- `supabase/functions/mp-webhook/index.ts` confirma pagos Mercado Pago y activa/extiende licencias.
### Web `jeal1498/checa-web`
- `index.html`: precios actualizados; diferencia el sistema actual de pago único Mercado Pago del futuro modelo de suscripciones de Play; equivalencias diarias 3.97, 3.27 y 2.90 MXN; se cambió “Nada se cobra solo” por “Precios claros”.
- `terminos.html`: precios y explicación de pagos actuales vs. suscripciones futuras, cancelación y procesadores actualizados.
- `privacidad.html`: texto sobre procesadores de pago actualizado.
- `landing/src/components/Pricing.tsx`: precios regulares y fundador actualizados; anual fundador $635 y equivalente aprox. $53/mes.
- Último commit del cupo visible: [4801d83](https://github.com/jeal1498/checa-web/commit/4801d83b5bc4c577bb04255dfb7d6c3a3319b165).

## Trabajo previo y contexto de lanzamiento
- Existe workflow `.github/workflows/play-aab-firmado.yml` que genera un AAB firmado como artefacto, sin publicar automáticamente. Requiere secretos `PLAY_UPLOAD_KEYSTORE_BASE64`, `PLAY_UPLOAD_STORE_PASSWORD`, `PLAY_UPLOAD_KEY_ALIAS`, `PLAY_UPLOAD_KEY_PASSWORD`.
- Prueba APK previa usó una clave efímera de build 37 (SHA-1 `EE:ED:C9:D0:BD:40:3F:8E:F2:A1:F8:E3:68:5B:A2:2D:25:AB:99:5D`). El inicio de sesión Google y persistencia al reabrir fueron confirmados. No asumir que esa clave sirve para publicar.
- La cuenta Play personal es nueva y todavía no se había creado la ficha de la app según el último contexto. Confirmar si eso sigue vigente.
- Cuenta personal creada después del 13 nov 2023 suele requerir prueba cerrada de 12 testers durante 14 días consecutivos antes de solicitar acceso a producción; verificar los requisitos mostrados en Play Console.
- La app usa AccessibilityService para leer ofertas de Uber/DiDi. Hay que revisar disclosure, consentimiento, declaración y video de demostración de Play; no presentarla como herramienta de accesibilidad.
- Antes del lanzamiento: revisar eliminación de cuenta, política de privacidad, Data safety y seguridad/RLS de Supabase.
- Alertas previas de Supabase: tablas `public.codigos`, `public.invitaciones`, `public.pagos` con RLS habilitado pero sin políticas; funciones `SECURITY DEFINER` con permisos potencialmente amplios; protección contra contraseñas filtradas desactivada y alertas de rendimiento de Auth. No se han corregido todavía.
- Un token personal de GitHub se compartió en una conversación previa. No repetirlo ni usarlo; revocarlo si aún no se ha hecho. Nunca pedir ni exponer secretos.

## Plan de trabajo
1. **Verificar estado:** revisar últimos commits, ramas y build de ambos repositorios antes de editar.
2. **Cupo fundador:** diseñar asignación segura de máximo 50 plazas (operación atómica para evitar que usuarios simultáneos superen el límite); acordar elegibilidad y qué ocurre con fundadores existentes.
3. **Configurar Play Console:** crear productos/base plans mensual, semestral y anual; acordar IDs definitivos y precio/oferta de fundador.
4. **Backend de suscripciones:** validar purchase tokens con Google Play Developer API antes de otorgar licencia; tratar renovaciones, cancelaciones, expiraciones, reembolsos/revocaciones, idempotencia y restauración; preservar pagos/licencias de Mercado Pago.
5. **Android Billing:** implementar compras, acknowledge, restauración y estado de suscripción para flavor Play; mantener Mercado Pago solo en la distribución directa; pruebas con license testers y errores de red.
6. **Lanzamiento:** generar AAB firmado, completar prueba cerrada si aplica, revisar políticas y publicar solo con autorización explícita.

## Punto exacto de reanudación
Precios actualizados en repositorios; el texto de la web anuncia 50 plazas y el commit está en `main` del repo web. El límite no está aplicado en backend. Google Play Billing aún no está implementado. Siguiente paso recomendado: inspeccionar estado actual de `main` en ambos repositorios y definir la implementación segura del cupo de 50 y el modelo de licencias antes de programar la facturación. No desplegar ni publicar sin autorización explícita.

## Regla de trabajo
La persona usuaria prefiere que no se realicen cambios en repositorios, backend o producción sin autorización explícita (“adelante” o equivalente). Mantener esta bitácora al día después de cada avance, indicando archivos, commits, pruebas, despliegues y pendientes.
