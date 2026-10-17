(function () {
  'use strict';

  // Ofertas de ejemplo. km y min totales = recogida + viaje (igual que la app).
  var OFFERS = [
    { fare: 120, pk: 1.5, pm: 4, tk: 10, tm: 18 },
    { fare: 95, pk: 2.5, pm: 7, tk: 13, tm: 20 },
    { fare: 62, pk: 4.5, pm: 11, tk: 6, tm: 19 }
  ];
  var LABEL = { green: 'ACEPTAR', yellow: 'CONSIDERAR', red: 'RECHAZAR' };
  var settings = { metaKm: 8, metaHora: 150, gasPrice: 24, kml: 12 };

  // Medición (paso 7): se conecta aquí sin tocar el resto
  function track(name, data) { if (window.checaTrack) try { window.checaTrack(name, data || {}); } catch (e) {} }

  function money(n) { return '$' + Math.round(n).toLocaleString('es-MX'); }
  function dec(n) { return (Math.round(n * 10) / 10).toLocaleString('es-MX'); }

  function evaluate(o) {
    var km = o.pk + o.tk, min = o.pm + o.tm;
    var perKm = o.fare / km, perHour = o.fare / min * 60;
    var gas = km / settings.kml * settings.gasPrice;
    var okKm = perKm >= settings.metaKm, okH = perHour >= settings.metaHora;
    var color = okKm && okH ? 'green' : (okKm || okH ? 'yellow' : 'red');
    return { km: km, min: min, perKm: perKm, perHour: perHour, gas: gas, net: o.fare - gas, okKm: okKm, okH: okH, color: color };
  }

  function render(pop, o) {
    var r = evaluate(o);
    pop.setAttribute('data-c', r.color);
    pop.innerHTML =
      '<div class="pop-band">' + LABEL[r.color] + '</div>' +
      '<div class="pop-body">' +
        '<div class="pop-lbl">Te quedan</div>' +
        '<div class="pop-net">' + money(r.net) + '</div>' +
        '<div class="pop-sub">Viaje ' + money(o.fare) + ' · Gasolina −' + money(r.gas) + '</div>' +
        '<div class="chips">' +
          '<div class="chip ' + (r.okH ? 'ok' : 'no') + '">' + money(r.perHour) + '/h</div>' +
          '<div class="chip ' + (r.okKm ? 'ok' : 'no') + '">$' + dec(r.perKm) + '/km</div>' +
          '<div class="chip">' + dec(r.km) + ' km total</div>' +
        '</div>' +
      '</div>';
    pop.setAttribute('aria-label', 'Checa dice ' + LABEL[r.color] + ': te quedan ' + money(r.net) + ' netos (números de ejemplo)');
  }

  function fillOffer(card, o) {
    card.innerHTML = '<span>Nuevo viaje</span><b>' + money(o.fare) + '</b>' +
      'Recogida ' + o.pm + ' min (' + dec(o.pk) + ' km) · Viaje ' + o.tm + ' min (' + dec(o.tk) + ' km)' +
      '<div class="ln"></div><div class="ln s"></div>';
  }

  // Hero: rota las 3 ofertas
  var heroPop = document.getElementById('hero-pop');
  var heroOffer = document.getElementById('hero-offer');
  var hi = 0;
  function heroShow() { render(heroPop, OFFERS[hi]); fillOffer(heroOffer, OFFERS[hi]); }
  if (heroPop) {
    heroShow();
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!still) setInterval(function () { hi = (hi + 1) % OFFERS.length; heroShow(); }, 3800);
  }

  // Demo interactiva
  var demoPop = document.getElementById('demo-pop');
  var btns = document.querySelectorAll('.offer-btn');
  var current = 0;
  function demoShow() {
    render(demoPop, OFFERS[current]);
    btns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === current ? 'true' : 'false'); });
  }
  btns.forEach(function (b, i) {
    var o = OFFERS[i];
    b.innerHTML = '<span class="fare">' + money(o.fare) + '</span><span class="app">' + o.app + '</span>' +
      '<span class="det">Recogida ' + dec(o.pk) + ' km · ' + o.pm + ' min &nbsp;|&nbsp; Viaje ' + dec(o.tk) + ' km · ' + o.tm + ' min</span>';
    b.addEventListener('click', function () { current = i; demoShow(); });
  });
  function bindRange(id, key, fmt) {
    var el = document.getElementById(id), out = document.getElementById(id + '-out');
    if (!el) return;
    function upd() { settings[key] = parseFloat(el.value); out.textContent = fmt(settings[key]); demoShow(); }
    el.addEventListener('input', upd); upd();
  }
  if (demoPop) {
    bindRange('r-km', 'metaKm', function (v) { return '$' + dec(v) + '/km'; });
    bindRange('r-h', 'metaHora', function (v) { return '$' + v + '/h'; });
    bindRange('r-gas', 'gasPrice', function (v) { return '$' + dec(v) + '/l'; });
    demoShow();
  }

  // Calculadora de ahorro
  var calc = document.getElementById('calc');
  if (calc) {
    var f = function (id) { return parseFloat(document.getElementById(id).value) || 0; };
    var upd = function () {
      var perTrip = (f('c-good') - f('c-bad')) * f('c-km');
      var day = perTrip * f('c-n');
      var month = day * f('c-days');
      document.getElementById('c-month').textContent = money(Math.max(0, month));
      document.getElementById('c-detail').textContent =
        money(Math.max(0, perTrip)) + ' por viaje × ' + f('c-n') + ' al día = ' + money(Math.max(0, day)) + ' al día, por ' + f('c-days') + ' días.';
    };
    calc.addEventListener('input', upd); upd();
  }

  // Versión del APK (si falla, el botón sigue funcionando)
  var metas = document.querySelectorAll('.dl-meta');
  if (metas.length && window.fetch) {
    fetch('descargar/version.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (v) {
        var parts = ['Versión ' + v.version];
        if (v.fecha) {
          var d = new Date(v.fecha + 'T12:00:00');
          parts.push(isNaN(d) ? v.fecha : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }));
        }
        if (v.tamano) parts.push(v.tamano);
        var txt = parts.join(' · ') + ' · Android 8+';
        metas.forEach(function (m) { m.textContent = txt; });
      })
      .catch(function () {});
  }

  // Video: se carga solo al tocar (ahorra datos)
  var vp = document.getElementById('vid-play');
  if (vp) vp.addEventListener('click', function () {
    var box = document.getElementById('vid-box');
    var v = document.createElement('video');
    v.src = box.getAttribute('data-src') || 'media/vsl.mp4'; v.poster = box.getAttribute('data-poster') || '';
    v.controls = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute('playsinline', '');
    box.innerHTML = ''; box.appendChild(v);
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    track('video_play');
  });

  // Invitación de un amigo: ?ref=CODIGO se guarda y se copia al tocar Descargar (la app lo lee al abrirse)
  var ref = null;
  try {
    var m = location.search.match(/[?&]ref=([A-Za-z0-9]{4}-?[A-Za-z0-9]{3})(?:&|$)/);
    if (m) localStorage.setItem('checa_ref', m[1].toUpperCase());
    ref = localStorage.getItem('checa_ref');
  } catch (e) {}
  var refBox = document.getElementById('ref-note');
  if (ref && refBox) {
    refBox.innerHTML = 'Te invitó un amigo (código <b>' + ref.replace(/[^A-Z0-9-]/g, '') + '</b>). Si pagas cualquier paquete, <b>los dos ganan 1 mes gratis</b>.';
    refBox.hidden = false;
  }
  function copiarRef() {
    if (!ref || !navigator.clipboard) return;
    try { navigator.clipboard.writeText('CHECA-REF:' + ref).catch(function () {}); } catch (e) {}
  }

  // Descargar: baja el APK y lleva a la guía de instalación
  document.querySelectorAll('[data-dl]').forEach(function (a) {
    a.addEventListener('click', function () {
      var src = a.getAttribute('data-dl');
      copiarRef();
      track('clic_descargar', { desde: src });
    });
  });
  document.querySelectorAll('[data-ev]').forEach(function (a) {
    a.addEventListener('click', function () { track(a.getAttribute('data-ev')); });
  });

  // iPhone o computadora: avisar que Checa es para Android
  var note = document.getElementById('device-note');
  var ua = navigator.userAgent || '';
  if (note && !/Android/i.test(ua)) {
    note.textContent = /iPhone|iPad|iPod/i.test(ua)
      ? 'Checa funciona solo en Android. Si manejas con un Android, abre esta página en ese teléfono.'
      : 'Estás en computadora: abre esta página en tu teléfono Android para instalar Checa.';
    note.hidden = false;
  }

  // Botón fijo en el teléfono: visible mientras el botón principal no está en pantalla (y antes del cierre)
  var sticky = document.getElementById('sticky-cta');
  var heroCta = document.querySelector('#inicio .ctas');
  var fin = document.querySelector('.final');
  if (sticky && heroCta) {
    var enPantalla = function (el) { var r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
    var pintar = function () { sticky.classList.toggle('show', !enPantalla(heroCta) && !(fin && enPantalla(fin))); };
    addEventListener('scroll', pintar, { passive: true });
    addEventListener('resize', pintar);
    pintar();
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
