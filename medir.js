// Medición sin cookies: anota eventos en Supabase (tabla web_eventos, solo inserción).
(function () {
  'use strict';
  var URL = 'https://gqsadclvftkzwrihfipz.supabase.co/rest/v1/web_eventos';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxc2FkY2x2ZnRrendyaWhmaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NDY5NTEsImV4cCI6MjEwNzMyMjk1MX0.yLcJBXuE8kz_PXiUpCL_7ArDoINhce6NbbsBo2NMQTc';
  var ss = {};
  try { ss = window.sessionStorage; } catch (e) {}
  function get(k) { try { return ss.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { ss.setItem(k, v); } catch (e) {} }
  function cut(v, n) { return v ? String(v).slice(0, n) : null; }

  var visita = get('checa_v');
  if (!visita) { visita = Math.random().toString(36).slice(2, 12); set('checa_v', visita); }

  // Fuente: utm_source, ?ref= o el sitio de donde vino (se guarda para toda la visita)
  var q = new URLSearchParams(location.search);
  var fuente = q.get('utm_source') || (q.get('ref') ? 'referido' : null);
  if (!fuente && document.referrer) {
    try { var h = new URL(document.referrer).hostname; if (h !== location.hostname) fuente = h.replace(/^www\./, ''); } catch (e) {}
  }
  if (fuente) set('checa_f', fuente);
  if (q.get('utm_campaign')) set('checa_c', q.get('utm_campaign'));

  var ua = navigator.userAgent || '';
  var disp = /Android/i.test(ua) ? 'android' : /iPhone|iPad|iPod/i.test(ua) ? 'iphone' : /Mobi/i.test(ua) ? 'otro' : 'pc';
  var pagina = location.pathname.replace(/^\/PWA-Checa-Multimedia/, '') || '/';

  window.checaTrack = function (evento, datos) {
    datos = datos || {};
    var body = JSON.stringify({
      evento: evento, pagina: cut(pagina, 60), desde: cut(datos.desde, 30), visita: visita,
      fuente: cut(get('checa_f'), 60), campana: cut(get('checa_c'), 60), dispositivo: disp
    });
    try {
      fetch(URL, { method: 'POST', keepalive: true, body: body, headers: {
        'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' } })
        .catch(function () {});
    } catch (e) {}
  };
  if (!/localhost|127\.0\.0\.1/.test(location.hostname)) window.checaTrack('visita');
})();
