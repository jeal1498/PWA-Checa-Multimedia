// Todo lo que Eduardo puede querer cambiar sin tocar los componentes.

export const WHATSAPP_COMUNIDAD = 'https://chat.whatsapp.com/BtQoeEV2bQ3BbdvMfm3M0v';

// Rutas relativas a /registro/ (la landing vive en checa-web/registro/).
export const URL_INSTALAR = '../instalar/?desde=registro';
export const URL_APK_DIRECTO = '../descargar/Checa.apk';

export const FECHA_FIN_GRATIS = '31 de enero de 2027';

// Video de permisos (sobreposición de pantalla sobre Uber y DiDi).
// Acepta: enlace de YouTube (watch, youtu.be o shorts), enlace de TikTok (…/video/123…)
// o un archivo de video (.mp4). Vacío = se muestra una tarjeta «Próximamente».
export const VIDEO_PERMISOS_URL = '';

// Dónde se guardan los correos. Es la misma base de la web (tabla `testers`, solo inserción).
// La llave anon es pública por diseño (igual que en medir.js); la tabla no se puede leer desde la web.
export const SUPABASE_URL = 'https://gqsadclvftkzwrihfipz.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxc2FkY2x2ZnRrendyaWhmaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NDY5NTEsImV4cCI6MjEwNzMyMjk1MX0.yLcJBXuE8kz_PXiUpCL_7ArDoINhce6NbbsBo2NMQTc';
export const TESTERS_ENDPOINT = `${SUPABASE_URL}/rest/v1/testers`;

// Marca en el navegador de que este teléfono ya se registró (solo el nombre, nunca el correo).
export const CLAVE_REGISTRO = 'checa_registro_v1';
