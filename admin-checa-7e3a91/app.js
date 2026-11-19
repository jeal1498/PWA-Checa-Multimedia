// Checa Admin: centro de control, salud y calidad (E6/E7). Sin dependencias propias; habla solo con las funciones
// public.admin_* (comprueban el rol en el servidor y registran cada consulta). Todo dato se pinta con textContent
// (nada de innerHTML con datos). Solo recuerda, mientras la pestaña esté abierta, filtros y página (sessionStorage), y el tema. Ningún dato inventado: sin datos → gris «sin datos».
(function () {
  "use strict";
  var cli = null, yo = null, correo = "", falloCarga = false, filtrosAbiertos = false, colaErrores = [], scrollErrores = 0, restaurarScroll = null, ultimaClave = "", vista = "hoy", param = null, pag = { errores: 1, ofertas: 1 }, F = {}, dias = 7;
  var urgentes = null, buscarEq = "";
  var SVG = "http://www.w3.org/2000/svg";
  // Cuatro pestañas, una pregunta cada una: ¿qué pasa? ¿qué decido? ¿qué tan bien va? ¿cómo está configurado?
  var MODULOS = [["hoy", "Hoy", "Hoy"], ["revisar", "Revisar", "Revisar"], ["calidad", "Calidad", "Calidad"], ["ajustes", "Ajustes", "Ajustes"]];
  // Subpestañas: [id, nombre]. La primera es la que se abre por omisión.
  var SUBS = { revisar: [["errores", "Errores"], ["capturas", "Capturas"], ["historial", "Historial"]],
               calidad: [["resumen", "Resumen"], ["versiones", "Versiones"], ["ia", "IA"], ["conductores", "Conductores"]] };
  // Rutas de antes (#errores, #ofertas…) → [pestaña, subpestaña]. Mantienen vivos los enlaces guardados.
  var ANTIGUAS = { inicio: ["hoy", null], errores: ["revisar", null], ofertas: ["revisar", "historial"], versiones: ["calidad", "versiones"],
                   dispositivos: ["calidad", "conductores"], ia: ["calidad", "ia"], config: ["ajustes", null] };
  function traducir(v, p) {
    if (v === "errores" && p) return ["revisar", String(p)];
    if (ANTIGUAS[v]) return ANTIGUAS[v];
    return [v, p || null];
  }
  function esId(p) { return p !== null && p !== undefined && /^\d+$/.test(String(p)); }
  function enDetalle() { return vista === "revisar" && esId(param); }
  function enListaErrores() { return vista === "revisar" && (!param || param === "errores"); }
  var ESTADO = { operativo: "ok", degradado: "aviso", fuera_de_servicio: "mal", sin_comprobar: "nd", sin_datos: "nd", no_aplicable: "nd",
                 verde: "ok", amarillo: "aviso", amarillo_parcial: "aviso", rojo: "mal", gris: "nd" };
  // Palabras de todos los días: quien lo lee no tiene que ser técnico.
  var TEXTO = { operativo: "Bien", degradado: "Con problemas", fuera_de_servicio: "No funciona", sin_comprobar: "Sin comprobar",
                sin_datos: "Aún no se sabe", no_aplicable: "No aplica", verde: "Todo bien", amarillo: "Con avisos", amarillo_parcial: "Faltan datos",
                rojo: "Hay un problema", gris: "Aún no se sabe" };
  var RESPUESTA = { operativo: "Sí, funciona.", degradado: "Funciona, pero con problemas.", fuera_de_servicio: "No funciona.", sin_comprobar: "Todavía no se comprueba.",
                    sin_datos: "Aún no se sabe: faltan datos.", no_aplicable: "No aplica por ahora." };
  var ORDEN = { fuera_de_servicio: 0, degradado: 1, operativo: 2, sin_comprobar: 3, sin_datos: 4, no_aplicable: 5 };
  // clave del componente → [pregunta, qué significa]
  var PREGUNTA = {
    base_de_datos: ["¿Responde tu base de datos?", "Es donde se guarda todo. Si no responde, no se puede ver nada de lo demás."],
    api: ["¿Funciona esta página?", "Comprueba que Checa Admin puede pedir datos al servidor."],
    ingesta: ["¿Llegan datos de la app?", "Los teléfonos mandan sus lecturas a tu base de datos. Si pasa un día sin llegar nada, aquí te avisa."],
    aplicacion_android: ["¿Alguien usa la app?", "Cuenta los teléfonos que mandaron algo en los últimos días."],
    ocr: ["¿El teléfono lee el texto de la pantalla?", "Es el primer paso: convertir lo que se ve en texto. Si falla mucho, la app no puede leer ofertas."],
    interpretacion: ["¿La app entiende tarifa, km y minutos?", "Es el segundo paso: sacar los números del texto. Se mide cuando hay suficientes casos."],
    revision_ia: ["¿El revisor automático funciona?", "Es la segunda opinión que revisa lo que lee la app. Si se acaba el saldo, aquí lo dirá."],
    almacenamiento: ["¿Se guardan las capturas?", "Las capturas de pantalla que ayudan a revisar errores. Se borran solas a los 7 días."],
    mercado_pago: ["¿Funcionan los cobros del canal directo?", "Se comprueba cuando haya cobros reales."],
    play_billing: ["¿Funcionan los cobros de Google Play?", "Todavía no existen; se activan antes del 1 de febrero de 2027."]
  };
  // gravedad del servidor → palabra clara
  var GRAVEDAD = { alta: "URGENTE", media: "REVISAR", baja: "NO URGENTE" };

  function el(tag, attrs, hijos) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (attrs[k] === null || attrs[k] === undefined) return;
      if (k === "texto") e.textContent = attrs[k];
      else if (k === "clase") e.className = attrs[k];
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (hijos || []).forEach(function (h) { if (h) e.appendChild(typeof h === "string" ? document.createTextNode(h) : h); });
    return e;
  }
  function sv(tag, attrs, hijos) {
    var e = document.createElementNS(SVG, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    (hijos || []).forEach(function (h) { e.appendChild(h); });
    return e;
  }
  // Íconos de línea para la barra (solo formas; sin texto del servidor).
  var ICONOS = { hoy: "M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5", revisar: "M7 3.5h10a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-11a3 3 0 0 1 3-3zM8.5 12l2.5 2.5 4.5-5",
                 calidad: "M4 20v-7M10 20V6M16 20v-9M21 20H3", ajustes: "M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M8 14v6",
                 buscar: "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM16 16l4.5 4.5" };
  function icono(id) {
    return sv("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "ico", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round" }, [sv("path", { d: ICONOS[id] })]);
  }
  function aviso(t, reintentar, detalle) {
    var a = document.getElementById("aviso"); a.textContent = "";
    if (!t) { a.hidden = true; return; }
    a.appendChild(el("span", { clase: "aviso-t", texto: t }));
    if (detalle) a.appendChild(el("small", { texto: detalle }));
    if (reintentar) a.appendChild(el("button", { type: "button", texto: "Reintentar", onclick: function () { pintar(); } }));
    a.appendChild(el("button", { type: "button", clase: "cerrar-aviso", texto: "Cerrar", "aria-label": "Cerrar aviso", onclick: function () { aviso(""); } }));
    a.hidden = false;
  }
  function toast(t, accion, ms) {
    var x = el("div", { id: "toast", role: "status" }, [el("span", { texto: t })].concat(accion ? [el("button", { type: "button", id: "toast-accion", texto: accion.texto, onclick: accion.onclick })] : []));
    if (accion) x.setAttribute("data-v", "1");
    var v = document.getElementById("toast"); if (v) v.remove();
    document.body.appendChild(x); setTimeout(function () { if (x.isConnected) x.remove(); }, ms || 3000);
  }
  function casos(k, n) {
    var nulo = function (v) { return v === undefined || v === null; };
    return nulo(n) ? (nulo(k) ? "" : String(k)) : nulo(k) ? n + " casos" : k + " de " + n + " casos";
  }
  function txt(v) { return v === null || v === undefined || v === "" ? "—" : String(v); }
  function pct(v) { return v === null || v === undefined ? "—" : (Number(v) * 100).toFixed(1) + " %"; }
  var TZ = "America/Mexico_City";
  function iso(d) { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); }
  function hora(f) { var d = new Date(f); return !f || isNaN(d) ? "—" : new Intl.DateTimeFormat("es-MX", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d); }
  // «hoy 20:10», «ayer 08:05», «12 nov 20:10»: siempre en hora de México, nunca en UTC.
  function fechaHora(f) {
    var d = new Date(f); if (!f || isNaN(d)) return "—";
    var dia = iso(d), hoy = iso(new Date()), ayer = iso(new Date(Date.now() - 864e5));
    var pre = dia === hoy ? "hoy" : dia === ayer ? "ayer" : new Intl.DateTimeFormat("es-MX", { timeZone: TZ, day: "numeric", month: "short" }).format(d).replace(".", "");
    return pre + " " + hora(f);
  }
  function rango() {
    return { desde: (F.desde || iso(new Date(Date.now() - dias * 864e5))) + "T06:00:00Z", hasta: (F.hasta || iso(new Date(Date.now() + 864e5))) + "T06:00:00Z" };
  }
  function esc(s) { return s; }
  function punto(estado) { return el("span", { clase: "punto " + (ESTADO[estado] || "nd"), role: "img", "aria-label": TEXTO[estado] || estado, title: TEXTO[estado] || estado }); }
  function insignia(estado) { return el("span", { clase: "insignia " + (ESTADO[estado] || "nd"), texto: TEXTO[estado] || estado }); }

  async function llamar(fn, args) {
    aviso("");
    var r;
    try { r = await cli.rpc(fn, args || {}); } catch (e) { falloCarga = true; aviso("No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.", true); return null; }
    if (r.error) { falloCarga = true; aviso("No pudimos cargar los datos. Intenta de nuevo en un momento.", true, "Detalle técnico: " + (r.error.message || r.error.code || "desconocido")); return null; }
    var d = r.data;
    if (d && d.error) { aviso(d.error === "no_autorizado" ? "No autorizado: tu cuenta no es administradora." : d.error === "no_existe" ? "No existe ese registro." : d.error === "veredicto_invalido" ? "El veredicto no es válido: revisa los valores (la oferta necesita tarifa, distancia y tiempo mayores que cero)." : d.error === "revision_invalida" ? "La revisión no es válida: revisa los valores o el motivo." : d.error === "objetivo_o_evidencia" ? "No se puede comprobar la captura de este caso: no admite veredicto." : "Filtro inválido: " + d.error); return null; }
    return d;
  }
  function ir(v, p) {
    var t = traducir(v, p); v = t[0]; p = t[1];
    if (enListaErrores()) scrollErrores = window.scrollY;
    vista = v; param = p || null;
    if (location.hash !== "#" + v + (p ? "/" + p : "")) { try { history.pushState(null, "", "#" + v + (p ? "/" + p : "")); } catch (e) { /* sin historial */ } }
    restaurarScroll = enListaErrores() ? scrollErrores : null; if (restaurarScroll === null) window.scrollTo(0, 0); pintar();
  }
  function enlace(texto, v, p) { return el("a", { href: "#" + v + (p ? "/" + p : ""), clase: "enlace", texto: texto, onclick: function (ev) { ev.preventDefault(); ir(v, p); } }); }

  // ---------- componentes visuales ----------
  function tarjeta(t, extra) {
    var est = t.estado || (t.n !== undefined && t.n !== null && t.n < 30 ? "insuficiente" : null);
    var valor = t.valor === undefined || t.valor === null ? (t.k !== undefined && t.n ? (t.k / t.n) : null) : t.valor;
    var texto = valor === null ? "—" : (t.unidad && t.unidad.indexOf("proporci") === 0 ? pct(valor) : String(valor));
    return el("div", { clase: "tarjeta", "data-clave": t.clave }, [
      el("div", { clase: "detalle", texto: t.nombre }),
      el("div", { clase: "valor", texto: texto }),
      el("div", { clase: "detalle", texto: casos(t.k, t.n) + (t.unidad && t.unidad.indexOf("proporci") !== 0 ? " · " + t.unidad : "") }),
      est ? el("span", { clase: "etiqueta " + (est === "suficiente" ? "ok" : "aviso"), texto: est === "suficiente" ? "casos suficientes" : "pocos casos para opinar" }) : null,
      t.definicion ? el("details", { clase: "def-ayuda" }, [el("summary", { texto: "¿Qué significa?" }), el("div", { clase: "detalle", texto: t.definicion })]) : null].concat(extra || []));
  }
  function tabla(cols, filas, vacio) {
    if (!filas.length) return el("div", { clase: "vacio", texto: vacio || "Sin datos en este periodo (no es lo mismo que cero errores)." });
    var t = el("table", {}, [el("thead", {}, [el("tr", {}, cols.map(function (c) { return el("th", { texto: c[0] }); }))]),
      el("tbody", {}, filas.map(function (f) { return el("tr", {}, cols.map(function (c) {
        var v = c[1](f); return el("td", { "data-label": c[0] }, [v instanceof Node ? v : document.createTextNode(txt(v))]); })); }))]);
    return el("div", { clase: "tabla" }, [t]);
  }
  function paginas(clave, d) {
    var max = Math.max(1, Math.ceil(d.total / d.por_pagina));
    return el("div", { clase: "paginas" }, [
      el("button", { id: "p-ant", texto: "‹ Anterior", disabled: pag[clave] <= 1 ? "" : null, onclick: function () { pag[clave]--; pintar(); } }),
      el("span", { id: "p-info", texto: "Página " + d.pagina + " de " + max + " · " + d.total + " en total" }),
      el("button", { id: "p-sig", texto: "Siguiente ›", disabled: pag[clave] >= max ? "" : null, onclick: function () { pag[clave]++; pintar(); } })]);
  }
  // Gráfica de líneas simple en SVG: series [{nombre, puntos:[{x:etiqueta, y:número|null}], clase}]. Sin datos → mensaje.
  function grafica(titulo, series, unidad) {
    var base = series[0] ? series[0].puntos : [];
    var caja = el("div", { clase: "grafica" }, [el("div", { clase: "detalle", texto: titulo })]);
    if (!base.length || !series.some(function (s) { return s.puntos.some(function (p) { return p.y !== null && p.y !== undefined; }); })) {
      caja.appendChild(el("div", { clase: "vacio", texto: "Sin datos" })); return caja;
    }
    var W = 360, H = 120, P = 22, max = 0;
    series.forEach(function (s) { s.puntos.forEach(function (p) { if (p.y > max) max = p.y; }); });
    max = max || 1;
    var svg = sv("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": titulo, clase: "svg" });
    svg.setAttribute("class", "svg");
    svg.appendChild(sv("line", { x1: P, y1: H - P, x2: W - 4, y2: H - P, stroke: "currentColor", "stroke-opacity": "0.25" }));
    var t0 = sv("text", { x: 2, y: 12, "font-size": "12", fill: "currentColor" }); t0.textContent = String(max) + (unidad || ""); svg.appendChild(t0);
    series.forEach(function (s, si) {
      var pts = s.puntos.map(function (p, i) { return p.y === null || p.y === undefined ? null :
        [P + (base.length === 1 ? (W - P - 4) / 2 : i * (W - P - 4) / (base.length - 1)), H - P - (p.y / max) * (H - P - 14)]; });
      var d = pts.filter(Boolean).map(function (q, i) { return (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join(" ");
      svg.appendChild(sv("path", { d: d, fill: "none", "stroke-width": "2", class: "linea " + (s.clase || "a" + si) }));
      s.puntos.forEach(function (p, i) { if (!pts[i]) return;
        var c = sv("circle", { cx: pts[i][0], cy: pts[i][1], r: "3", class: "pt " + (s.clase || "a" + si) });
        var tt = sv("title"); tt.textContent = s.nombre + " · " + p.x + ": " + p.y + (unidad || ""); c.appendChild(tt); svg.appendChild(c);
        var zona = sv("circle", { cx: pts[i][0], cy: pts[i][1], r: "11", fill: "transparent", class: "toque" });
        zona.addEventListener("click", function () { lectura.textContent = s.nombre + " · " + p.x + ": " + p.y + (unidad || ""); });
        svg.appendChild(zona); });
    });
    var lectura = el("div", { clase: "lectura", "aria-live": "polite", texto: "Toca un punto para ver su valor." });
    caja.appendChild(svg);
    caja.appendChild(lectura);
    var filas = base.map(function (b, i) { return el("tr", {}, [el("td", { texto: String(b.x) })].concat(series.map(function (s) { var p = s.puntos[i]; return el("td", { texto: p && p.y !== null && p.y !== undefined ? String(p.y) + (unidad || "") : "—" }); }))); });
    caja.appendChild(el("details", { clase: "datos" }, [el("summary", { texto: "Ver tabla de datos" }),
      el("div", { clase: "tabla" }, [el("table", {}, [el("thead", {}, [el("tr", {}, [el("th", { texto: "Día" })].concat(series.map(function (s) { return el("th", { texto: s.nombre }); })))]), el("tbody", {}, filas)])])]));
    caja.appendChild(el("div", { clase: "detalle", texto: series.map(function (s) { return s.nombre; }).join(" · ") + " · " + base[0].x + " → " + base[base.length - 1].x }));
    return caja;
  }
  function selPeriodo(onCambio) {
    return el("div", { clase: "periodo", role: "group", "aria-label": "Periodo" }, [7, 30, 90].map(function (n) {
      return el("button", { "data-dias": n, "aria-pressed": String(dias === n && !F.desde), texto: n + " días", onclick: function () { dias = n; F.desde = F.hasta = null; onCambio(); } });
    }));
  }
  // Mini gráfica de tendencia (sin ejes): solo la forma y el último punto.
  function spark(vals) {
    var v = vals.filter(function (x) { return x !== null && x !== undefined && !isNaN(x); });
    if (v.length < 2) return null;
    var W = 120, H = 28, mx = Math.max.apply(null, v), mn = Math.min.apply(null, v), rg = mx - mn || 1;
    var pts = v.map(function (x, i) { return [(i * W / (v.length - 1)).toFixed(1), (H - 3 - (x - mn) / rg * (H - 6)).toFixed(1)]; });
    var u = pts[pts.length - 1];
    return sv("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", class: "spark", "aria-hidden": "true" }, [
      sv("polyline", { points: pts.map(function (p) { return p.join(","); }).join(" "), fill: "none", stroke: "currentColor", "stroke-width": "1.8", "vector-effect": "non-scaling-stroke" }),
      sv("circle", { cx: u[0], cy: u[1], r: "2.5", fill: "currentColor" })]);
  }
  // Toda la tarjeta lleva a su detalle (los «¿Qué significa?» de dentro siguen funcionando).
  function envolver(t, v, p) {
    t.classList.add("tocable"); t.setAttribute("role", "link"); t.tabIndex = 0;
    var ir_ = function (ev) { if (ev.target.closest("summary, details")) return; ev.preventDefault(); ir(v, p); };
    t.addEventListener("click", ir_); t.addEventListener("keydown", function (ev) { if (ev.key === "Enter") ir_(ev); });
    var tit = t.querySelector(".detalle"); if (tit) tit.appendChild(el("span", { clase: "chev", "aria-hidden": "true", texto: " ›" }));
    return t;
  }
  function fechaLarga() { var x = new Intl.DateTimeFormat("es-MX", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date()).replace(",", ""); return x.charAt(0).toUpperCase() + x.slice(1); }
  function skeleton(c) { c.appendChild(el("div", { clase: "skeleton", "aria-busy": "true" })); }

  // ---------- 01 Inicio (Salud) ----------
  // Qué dice el veredicto, qué luz enciende y qué hacer. Nunca verde si faltan datos: lo decide el servidor (estado_general).
  var VEREDICTO = {
    verde:            ["Todo funciona", "No tienes que hacer nada hoy.", "luz-v"],
    amarillo:         ["Funciona, con avisos", "Revisa los avisos de abajo cuando tengas un momento.", "luz-a"],
    amarillo_parcial: ["Todo lo medible funciona", "Aún no se puede medir todo: faltan datos en algunas cosas.", "luz-a"],
    rojo:             ["Hay algo que atender", "Mira primero la sección «Por revisar».", "luz-r"],
    gris:             ["Aún no se sabe", "Todavía no hay datos suficientes para opinar.", ""]
  };
  // A dónde lleva cada alerta: al lugar donde se puede hacer algo.
  function destinoAlerta(a) {
    var comp = a.componente, t = (a.titulo || "") + " " + (a.descripcion || "");
    if (comp === "revision_ia") return /402/.test(t) ? ["ajustes", "Ver el saldo en Ajustes"] : ["ia", "Ver la IA en Calidad"];
    if (comp === "revision_humana") return ["errores", "Revisar errores"];
    if (comp === "ingesta" || comp === "aplicacion_android") return ["dispositivos", "Ver conductores y dispositivos"];
    return ["ofertas", "Ver el historial de lecturas"];
  }
  // Errores sin veredicto del periodo: el único número que pinta la insignia de Revisar.
  // Solo cuenta errores de la 10.82 en adelante: los anteriores no admiten veredicto (no se puede comprobar su captura).
  var urgPorVersion = {};
  async function contarUrgentes() {
    var r = rango(); await asegurarVersiones();
    var vs = VERSIONES.filter(function (x) { return versionNum(x) >= 10082; });
    var res = await Promise.all(vs.map(function (ver) {
      return cli.rpc("admin_errores", { desde: r.desde, hasta: r.hasta, version: ver, estado_veredicto: "sin_veredicto", pagina: 1, por_pagina: 1 })
        .then(function (x) { return x && x.data && !x.data.error ? Number(x.data.total) : null; }, function () { return null; }); }));
    urgPorVersion = {}; vs.forEach(function (ver, i) { urgPorVersion[ver] = res[i]; });
    var ok = res.filter(function (x) { return x !== null; });
    urgentes = ok.length ? ok.reduce(function (a, b) { return a + b; }, 0) : null;
    var b = document.getElementById("insignia-revisar"); if (b) { b.textContent = urgentes ? String(urgentes) : ""; b.hidden = !urgentes; }
    return urgentes;
  }
  function aclaracion(a) {
    if (a.componente === "revision_ia") return /402/.test(a.titulo + " " + a.descripcion) ? "Se acabó el saldo del revisor automático. Recárgalo." : "El revisor automático está fallando. Mira el detalle.";
    if (a.componente === "revision_humana") return "Nadie ha confirmado si estas lecturas estaban bien o mal. " + (a.gravedad === "baja" ? "No hagas nada ahora." : "Conviene revisarlas.");
    if (a.componente === "ingesta" || a.componente === "aplicacion_android") return "Dejaron de llegar datos de la app. Revisa que el teléfono tenga la app abierta y con internet.";
    return null;
  }
  // Los 7 pasos de la cadena de lectura → componentes del servidor que los miden.
  var PASOS = [{ nombre: "Equipos", claves: ["aplicacion_android"] }, { nombre: "Datos", claves: ["base_de_datos", "api", "ingesta"] }, { nombre: "OCR", claves: ["ocr"] },
               { nombre: "Lectura", claves: ["interpretacion"] }, { nombre: "IA", claves: ["revision_ia"] }, { nombre: "Capturas", claves: ["almacenamiento"] },
               { nombre: "Cobros", claves: ["mercado_pago", "play_billing"] }];
  var GRAVE = { fuera_de_servicio: 0, degradado: 1, sin_comprobar: 2, sin_datos: 2, no_aplicable: 3, operativo: 4 };
  function pasoEstado(paso, comps) {
    var ms = comps.filter(function (x) { return paso.claves.indexOf(x.clave) >= 0; });
    if (!ms.length) return { paso: paso, estado: "sin_datos", peor: { clave: paso.claves[0], nombre: paso.nombre, estado: "sin_datos" } };
    var peor = ms.reduce(function (m, x) { return (GRAVE[x.estado] === undefined ? 2 : GRAVE[x.estado]) < (GRAVE[m.estado] === undefined ? 2 : GRAVE[m.estado]) ? x : m; });
    return { paso: paso, estado: peor.estado, peor: peor };
  }
  async function inicio(c) {
    skeleton(c);
    var r = rango(), d = await llamar("admin_salud", { desde: r.desde, hasta: r.hasta });
    c.textContent = "";
    if (!d) return;
    var inc = d.atencion.length, n = d.componentes.length;
    var comprobados = d.componentes.filter(function (x) { return ["operativo", "degradado", "fuera_de_servicio"].indexOf(x.estado) >= 0; }).length;
    var fallas = d.componentes.filter(function (x) { return x.estado === "fuera_de_servicio" || x.estado === "degradado"; }).length;
    var v = VEREDICTO[d.estado_general] || VEREDICTO.gris;

    // 1 · Veredicto y frase de acción
    var pasos = PASOS.map(function (p) { return pasoEstado(p, d.componentes); });
    var rotos = pasos.filter(function (x) { return x.estado === "fuera_de_servicio" || x.estado === "degradado"; }).length;
    var fraseCadena = rotos ? "Falla " + rotos + (rotos === 1 ? " paso" : " pasos") + " de " + PASOS.length + "." : "Ningún paso de la cadena falla.";
    var heroEl;
    c.appendChild(heroEl = el("section", { clase: "hero estado-v3", id: "estado-general" }, [
      el("div", { clase: "estado-cab" }, [el("span", { clase: "latido " + (ESTADO[d.estado_general] || "nd"), "aria-hidden": "true" }), el("h2", { clase: "estado-t", texto: v[0] })]),
      el("p", { clase: "estado-p", texto: v[1] + " " + fraseCadena + " " + comprobados + " de " + n + " cosas medidas." })]));

    // 2 · Pasos de la lectura: un punto por paso; el que falla se abre solo.
    var peor = -1;
    pasos.forEach(function (x, k) { if (GRAVE[x.estado] <= 1 && (peor < 0 || GRAVE[x.estado] < GRAVE[pasos[peor].estado])) peor = k; });
    var sel = peor;
    var cadena = el("section", { clase: "cadena", id: "cadena", "aria-label": "Pasos de la lectura" });
    var detalleCadena = el("div", { clase: "paso-detalle", "aria-live": "polite" });
    function pintarCadena() {
      cadena.textContent = "";
      cadena.appendChild(el("div", { clase: "pasos" }, pasos.map(function (p, k) {
        return el("button", { type: "button", clase: "paso " + (ESTADO[p.estado] || "nd") + (k === sel ? " sel" : ""), "aria-pressed": String(k === sel), "aria-label": p.paso.nombre + ": " + (TEXTO[p.estado] || p.estado),
          onclick: function () { sel = sel === k ? -1 : k; pintarCadena(); } }, [punto(p.estado), el("span", { texto: p.paso.nombre })]); })));
      detalleCadena.textContent = "";
      if (sel >= 0) {
        var p = pasos[sel], x = p.peor, pq = PREGUNTA[x.clave] || [x.nombre, x.nombre];
        var al = d.atencion.filter(function (q) { return p.paso.claves.indexOf(q.componente) >= 0; })[0];
        var aclara = al ? aclaracion(al) : null;
        detalleCadena.appendChild(el("div", { clase: "fila" }, [insignia(p.estado), el("strong", { texto: p.paso.nombre + " · " + pq[0] })]));
        detalleCadena.appendChild(el("div", { clase: "aclara", texto: aclara || RESPUESTA[p.estado] || TEXTO[p.estado] }));
        if (x.ultima_comprobacion) detalleCadena.appendChild(el("div", { clase: "detalle", texto: "Última vez que se comprobó: " + fechaHora(x.ultima_comprobacion) }));
        if (al) detalleCadena.appendChild(enlace(destinoAlerta(al)[1], destinoAlerta(al)[0]));
      } else detalleCadena.appendChild(el("div", { clase: "detalle", texto: "Toca un paso para ver qué significa." }));
      cadena.appendChild(detalleCadena);
    }
    pintarCadena();
    heroEl.appendChild(cadena);

    // 3 · Por revisar (máximo 3 a la vista, urgente primero)
    var GR = { alta: 0, media: 1, baja: 2 };
    var atn = d.atencion.slice().sort(function (x, y) { return (GR[x.gravedad] === undefined ? 3 : GR[x.gravedad]) - (GR[y.gravedad] === undefined ? 3 : GR[y.gravedad]); });
    // La alerta de la IA trae su acción a la mano: apagarla sin ir a Ajustes (solo un revisor puede).
    var iaEst = null;
    if (yo && yo.rol === "revisor" && atn.some(function (a) { return a.componente === "revision_ia"; })) {
      try { var rie = await cli.rpc("admin_ia_estado"); iaEst = rie && rie.data && !rie.data.error ? rie.data : null; } catch (x) { iaEst = null; }
    }
    function accionIA() {
      if (!iaEst || !iaEst.vision) return null;
      return el("button", { type: "button", clase: "accion-alerta", id: "apagar-ia", texto: "Apagar IA con imagen", onclick: function () {
        hojaConfirmar("¿Apagar la IA con imagen?", "Los teléfonos dejarán de pedirle a la IA que mire la imagen de la oferta y seguirán solo con su lector. Tarda unos 30 segundos en llegar a todos. Puedes volver a encenderla en Ajustes.", "Sí, apagar",
          async function () { var r = await llamar("admin_ia_interruptor", { p_que: "vision", p_activo: false }); if (r && r.ok) { toast("IA con imagen apagada"); pintar(); return true; } return false; }); } });
    }
    function tarjetaAlerta(a) {
      var aclara = aclaracion(a);
      return el("div", { clase: "alerta " + a.gravedad }, [
        el("div", { clase: "fila" }, [el("span", { clase: "tag " + a.gravedad, texto: GRAVEDAD[a.gravedad] || a.gravedad.toUpperCase() }), el("strong", { texto: a.titulo })]),
        aclara ? el("div", { clase: "aclara", texto: aclara }) : null,
        el("details", {}, [el("summary", { texto: "Más detalle" }),
          el("div", { clase: "detalle", texto: a.descripcion }),
          el("div", { clase: "detalle", texto: "Dato técnico: " + a.evidencia })]),
        el("div", { clase: "fila acciones-alerta" }, [a.componente === "revision_ia" ? accionIA() : null, enlace(destinoAlerta(a)[1], destinoAlerta(a)[0])])]);
    }
    // 3 · Atención: lo urgente primero (errores sin veredicto), luego las alertas y la meta de etiquetado.
    c.appendChild(el("h2", { texto: "Atención" }));
    var at = el("div", { id: "alertas", clase: "atencion" });
    var nUrg = await contarUrgentes();
    var desde = VERSIONES.filter(function (x) { return versionNum(x) >= 10082; }).sort(function (a, b) { return versionNum(a) - versionNum(b); })[0] || "10.82";
    at.appendChild(el("a", { href: "#revisar", id: "urgentes", clase: "urgente" + (nUrg ? "" : " al-dia"), onclick: function (ev) {
        ev.preventDefault(); F["f-estado"] = "sin_veredicto"; pag.errores = 1;
        var con = Object.keys(urgPorVersion).filter(function (k) { return urgPorVersion[k] > 0; }); if (con.length === 1) F["f-version"] = con[0];
        ir("revisar"); } }, [
      el("b", { clase: "urgente-n", texto: nUrg === null ? "—" : String(nUrg) }),
      el("span", { clase: "urgente-t" }, [el("strong", { texto: nUrg === 1 ? "Error sin veredicto" : "Errores sin veredicto" }), el("small", { texto: nUrg ? "De la " + desde + " en adelante" : nUrg === 0 ? "Todo al día" : "No se pudo contar" })]),
      el("span", { clase: "urgente-ir", texto: "Revisar" })]));
    // «Errores sin referencia humana» ya lo dice la tarjeta de arriba.
    atn = atn.filter(function (a) { return a.componente !== "revision_humana"; });
    atn.slice(0, 3).forEach(function (a) { at.appendChild(tarjetaAlerta(a)); });
    if (atn.length > 3) at.appendChild(el("details", { clase: "mas-alertas" }, [el("summary", { texto: "Ver las " + (atn.length - 3) + " alertas restantes" }), el("div", { clase: "atencion" }, atn.slice(3).map(tarjetaAlerta))]));
    c.appendChild(at);
    // Meta de etiquetado: capturas confirmadas por una persona.
    var metaN = el("b", { clase: "mono", texto: "—" }), metaS = el("small", { texto: "Capturas de ofertas confirmadas por una persona" }), metaB = el("i");
    c.appendChild(el("h2", { texto: "Meta de etiquetado" }));
    c.appendChild(el("a", { href: "#revisar/capturas", id: "pend-revisar", clase: "meta-et", onclick: function (ev) { ev.preventDefault(); ir("revisar", "capturas"); } }, [
      el("span", { clase: "meta-tx" }, [metaN, metaS, el("span", { clase: "medidor" }, [metaB])]), el("span", { clase: "chev", "aria-hidden": "true", texto: "›" })]));
    pendientesRev().then(function (x) {
      if (!x || !metaN.isConnected) return;
      metaN.textContent = x.rev + " de " + (x.rev + x.pend);
      metaS.textContent = x.pend ? x.pend + " esperando revisión" : "Todo al día";
      metaB.style.width = (x.rev + x.pend ? Math.round(x.rev / (x.rev + x.pend) * 100) : 0) + "%";
    });

    // 4 · Cuatro cifras: cada una lleva a su detalle.
    var porClave = {}; d.indicadores.forEach(function (i) { porClave[i.clave] = i; });
    var DEST = { lecturas: ["calidad", "resumen"], tasa_errores: ["calidad", "versiones"], calidad_interpretacion: ["calidad", "ia"] };
    var hs = d.historia || [];
    var SPARK = { lecturas: hs.map(function (x) { return x.lecturas; }), tasa_errores: hs.map(function (x) { return x.lecturas ? x.errores / x.lecturas : null; }) };
    var cuatro = ["lecturas", "tasa_errores", "calidad_interpretacion"].map(function (k) { return porClave[k]; }).filter(Boolean).map(function (i) {
      var t = tarjeta(i, [SPARK[i.clave] ? spark(SPARK[i.clave]) : null]);
      return envolver(t, DEST[i.clave][0], DEST[i.clave][1]); });
    var kc = await llamar("admin_costos", { desde: r.desde, hasta: r.hasta });
    if (kc) {
      var gasto = (kc.por_modelo || []).reduce(function (s, x) { return s + Number(x.usd || 0); }, 0);
      cuatro.push(envolver(el("div", { clase: "tarjeta", "data-clave": "gasto_ia" }, [el("div", { clase: "detalle", texto: "Gasto en IA" }), el("div", { clase: "valor", texto: (kc.por_modelo || []).length ? "$" + gasto.toFixed(2) : "—" }),
        el("div", { clase: "detalle", texto: "USD en el periodo" })]), "ajustes"));
    }
    if (cuatro.length) { c.appendChild(el("h2", { texto: "Lo esencial" })); c.appendChild(el("div", { clase: "tarjetas cuatro", id: "esencial" }, cuatro)); }

    // 5 · Tendencia
    var h0 = d.historia || [];
    c.appendChild(el("div", { clase: "graficas una", id: "tendencia" }, [grafica("Lecturas y errores por día", [{ nombre: "Lecturas", clase: "a0", puntos: h0.map(function (x) { return { x: x.dia, y: x.lecturas }; }) },
      { nombre: "Errores", clase: "a1", puntos: h0.map(function (x) { return { x: x.dia, y: x.errores }; }) }])]));

    // Cada parte del sistema, a un toque (los números y gráficas de calidad viven en Calidad › Resumen).
    var completo = el("details", { clase: "completo", id: "completo" }, [el("summary", { texto: "Todas las partes del sistema" })]);
    var cuerpo = el("div", { clase: "completo-cuerpo" }); completo.appendChild(cuerpo); c.appendChild(completo); c = cuerpo;
    c.appendChild(el("h2", { texto: "Cada parte, en una pregunta" }));
    var ordenados = d.componentes.slice().sort(function (a, b) { return (ORDEN[a.estado] === undefined ? 9 : ORDEN[a.estado]) - (ORDEN[b.estado] === undefined ? 9 : ORDEN[b.estado]); });
    c.appendChild(el("div", { clase: "carriles", id: "componentes" }, ordenados.map(function (x) {
      var pq = PREGUNTA[x.clave] || [x.nombre, x.nombre];
      return el("div", { clase: "carril comp " + (ESTADO[x.estado] || "nd"), "data-clave": x.clave }, [
        punto(x.estado),
        el("div", { clase: "carril-texto" }, [
          el("strong", { texto: pq[0] }),
          el("div", { clase: "respuesta", texto: RESPUESTA[x.estado] || TEXTO[x.estado] }),
          el("details", {}, [el("summary", { texto: "¿Qué significa?" }), el("p", { texto: pq[1] }),
            el("div", { clase: "detalle", texto: x.nombre + " · cómo se comprueba: " + txt(x.comprobacion) }),
            el("div", { clase: "detalle", texto: "Última vez que se comprobó: " + (x.ultima_comprobacion ? String(x.ultima_comprobacion).slice(0, 19).replace("T", " ") : "—") }),
            x.k !== undefined ? el("div", { clase: "detalle", texto: casos(x.k, x.n) }) : null,
            x.ms ? el("div", { clase: "detalle", texto: "Tiempo típico: " + x.ms + " ms" }) : null,
            el("div", { clase: "detalle", texto: "Depende de: " + ((x.depende_de || []).join(", ") || "—") })])]),
        insignia(x.estado)]);
    })));
  }

  // ---------- Calidad › Resumen: qué tan bien lee la app, con todos sus números ----------
  async function resumen(c) {
    skeleton(c);
    var r = rango(), m = await llamar("admin_metricas", { desde: r.desde, hasta: r.hasta, app: null, version: null }), d = await llamar("admin_salud", { desde: r.desde, hasta: r.hasta });
    var sk = c.querySelector(".skeleton"); if (sk) sk.remove();
    if (m) {
      var ms = m.metricas || [];
      var destac = ["precision_humana", "captura_exacta"].map(function (k) { return ms.filter(function (x) { return x.clave === k; })[0]; }).filter(Boolean);
      if (destac.length) { c.appendChild(el("h2", { texto: "Qué tanto acierta contra una persona" })); c.appendChild(el("div", { clase: "tarjetas dos", id: "calidad" }, destac.map(metricaTarjeta))); }
    }
    if (!d) return;
    c.appendChild(el("h2", { texto: "Los números" }));
    c.appendChild(el("div", { clase: "tarjetas", id: "inicio" }, d.indicadores.map(function (i) {
      return tarjeta(i, [i.clave === "calidad_interpretacion" ? enlace("Ver detalle", "ia") : i.clave === "veredictos_pendientes" ? enlace("Ver errores", "errores") :
        i.clave === "lecturas" || i.clave === "tasa_errores" ? enlace("Ver historial", "ofertas") : null]);
    })));
    var p = d.procesamiento;
    c.appendChild(el("h2", { texto: "Qué tan rápido y completo se revisa" }));
    c.appendChild(el("div", { clase: "tarjetas", id: "procesamiento" }, [["Recibidas", p.recibidas], ["Procesadas", p.procesadas], ["Fallidas", p.fallidas],
      ["Pendientes", p.pendientes === null ? "sin dato" : p.pendientes], ["Tiempo típico (milisegundos)", p.ms_lectura_p50], ["Tiempo de los más lentos (milisegundos)", p.ms_lectura_p90],
      ["Tiempo más lento (milisegundos)", p.ms_lectura_max], ["Lecturas repetidas por la app", p.reintentos]].map(function (x) {
      return el("div", { clase: "tarjeta" }, [el("div", { clase: "detalle", texto: x[0] }), el("div", { clase: "valor", texto: txt(x[1]) })]); })));
    c.appendChild(el("div", { clase: "detalle", texto: p.pendientes_nota }));
    c.appendChild(el("h2", { texto: "Calidad de lo que lee la app" }));
    c.appendChild(el("div", { clase: "tarjetas" }, [["Revisadas por una persona", d.calidad.con_referencia], ["Sin confirmar", d.calidad.sin_veredicto], ["Personas en desacuerdo", d.calidad.conflictos]].map(function (x) {
      return el("div", { clase: "tarjeta" }, [el("div", { clase: "detalle", texto: x[0] }), el("div", { clase: "valor", texto: txt(x[1]) })]); })));
    c.appendChild(el("div", { clase: "detalle", texto: d.calidad.nota }));
    c.appendChild(el("h2", { texto: "Cómo ha ido en los días" }));
    var h = d.historia || [];
    c.appendChild(el("div", { clase: "graficas", id: "graficas" }, [
      grafica("Lecturas y errores por día", [{ nombre: "Lecturas", clase: "a0", puntos: h.map(function (x) { return { x: x.dia, y: x.lecturas }; }) },
                                            { nombre: "Errores", clase: "a1", puntos: h.map(function (x) { return { x: x.dia, y: x.errores }; }) }]),
      grafica("Tiempo típico de lectura", [{ nombre: "ms", clase: "a2", puntos: h.map(function (x) { return { x: x.dia, y: x.ms_p50 }; }) }], " ms"),
      grafica("Costo de la revisión con IA", [{ nombre: "USD", clase: "a3", puntos: (d.costos_historia || []).map(function (x) { return { x: x.dia, y: Number(x.usd) }; }) }], " USD")]));
    if (m) {
      var grupos = { operacion: "Cómo está funcionando", calidad_humana: "Qué tanto acierta contra una persona", acuerdo_ia: "Cuántas veces la IA y el lector coinciden (no significa que acierten)", banco_historico: "Casos viejos (revisados antes)" };
      var mas = el("details", { clase: "mas-metricas", id: "mas-metricas" }, [el("summary", { texto: "Todas las métricas" })]);
      Object.keys(grupos).forEach(function (g) {
        var gs = (m.metricas || []).filter(function (x) { return x.grupo === g; });
        if (!gs.length) return;
        mas.appendChild(el("h2", { texto: grupos[g] }));
        mas.appendChild(el("div", { clase: "tarjetas" }, gs.map(metricaTarjeta)));
      });
      c.appendChild(mas);
    }
  }

  // ---------- 02 Errores ----------
  // Versiones de la app desde la 10.82 (lista desplegable); las nuevas se agregan solas al verse en los datos.
  var VERSIONES = ["10.84", "10.83", "10.82"], versionesCargadas = false;
  function versionNum(v) { var p = String(v).split("."); return Number(p[0]) * 1000 + Number(p[1] || 0); }
  function versionesOpc() {
    return [el("option", { value: "", texto: "Todas" })].concat(VERSIONES.map(function (v) { return el("option", { value: v, texto: v }); }));
  }
  var cargandoVersiones = null;
  function asegurarVersiones() {
    if (versionesCargadas) return Promise.resolve();
    if (cargandoVersiones) return cargandoVersiones;
    cargandoVersiones = (async function () {
      var d = null;
      try { var x = await cli.rpc("admin_versiones", { desde: "2026-11-01T00:00:00Z", hasta: iso(new Date(Date.now() + 864e5)) + "T06:00:00Z" }); d = x && x.data && !x.data.error ? x.data : null; } catch (e) { d = null; }
      versionesCargadas = true;
      if (!d || !d.versiones) return;
      d.versiones.forEach(function (x) { var v = String(x.version || ""); if (/^\d+\.\d+$/.test(v) && versionNum(v) >= 10082 && VERSIONES.indexOf(v) < 0) VERSIONES.push(v); });
      VERSIONES.sort(function (a, b) { return versionNum(b) - versionNum(a); });
    })();
    return cargandoVersiones;
  }
  async function cargarVersiones(sel) {
    await asegurarVersiones();
    var actual = sel.value; sel.textContent = ""; versionesOpc().forEach(function (o) { sel.appendChild(o); }); sel.value = actual;
  }
  function filtrosBase(extra) {
    var r = rango();
    var nodo = el("div", { clase: "filtros" }, [
      el("label", {}, ["Desde", el("input", { id: "f-desde", type: "date", value: r.desde.slice(0, 10) })]),
      el("label", {}, ["Hasta", el("input", { id: "f-hasta", type: "date", value: r.hasta.slice(0, 10) })]),
      el("label", {}, ["App", el("select", { id: "f-app" }, [el("option", { value: "", texto: "Todas" }), el("option", { value: "uber", texto: "Uber" }), el("option", { value: "didi", texto: "DiDi" })])]),
      el("label", {}, ["Versión", el("select", { id: "f-version" }, versionesOpc())])].concat(extra || []).concat([
      el("button", { id: "f-limpiar", type: "button", texto: "Limpiar", onclick: function () { F = {}; pag.errores = pag.ofertas = 1; scrollErrores = 0; pintar(); } })]));
    ["f-app", "f-version", "f-tipo", "f-estado", "f-resultado"].forEach(function (id) { var x = nodo.querySelector("#" + id); if (x && F[id] !== undefined) x.value = F[id]; });
    // 10.84 (propuesta B): los filtros se aplican solos al cambiar y el activo se resalta.
    function aplicar() {
      ["f-desde", "f-hasta", "f-app", "f-version", "f-tipo", "f-estado", "f-resultado"].forEach(function (id) { var x = document.getElementById(id); if (x) F[id] = x.value; });
      F.desde = F["f-desde"] || null; F.hasta = F["f-hasta"] || null; pag.errores = pag.ofertas = 1; scrollErrores = 0; pintar();
    }
    nodo.querySelectorAll("input, select").forEach(function (x) {
      x.addEventListener("change", aplicar);
      if (x.tagName === "SELECT" && x.value) x.parentNode.classList.add("act");
      if (x.id === "f-version") cargarVersiones(x);
    });
    var n = Object.keys(F).filter(function (k) { return F[k] && k.indexOf("f-") === 0 && k !== "f-desde" && k !== "f-hasta"; }).length;
    var pleg = el("details", { clase: "filtros-hoja" }, [el("summary", { texto: "Filtros" + (n ? " (" + n + ")" : "") }), nodo]);
    var movil = !!(window.matchMedia && matchMedia("(max-width:760px)").matches);
    pleg.open = movil ? filtrosAbiertos : true;
    pleg.addEventListener("toggle", function () { if (movil) filtrosAbiertos = pleg.open; });
    return pleg;
  }
  function opciones(id, etiqueta, vals, mapa) {
    return el("label", {}, [etiqueta, el("select", { id: id }, vals.map(function (v) { return el("option", { value: v, texto: (mapa && mapa[v]) || v || "Todos" }); }))]);
  }
  var VER_TXT = { referencia_doble: "Persona e IA de acuerdo", referencia_adjudicada: "Resuelto tras revisar", referencia_humana: "Revisado por una persona", conflicto_humano: "Personas en desacuerdo",
                  solo_ia: "Solo opinó la IA", heredado_no_revisado: "Caso viejo, sin revisar", sin_veredicto: "Sin revisar" };
  var TIPO_TXT = { diferencia: "Diferencia", rescate: "Rescate", desacuerdo: "Desacuerdo", reporte: "Reporte" };
  var RES_TXT = { oferta: "Oferta", duplicada: "Duplicada", varias: "Varias ofertas", abstencion: "Sin lectura", no_oferta: "No era oferta", descartada: "Descartada", timeout: "Tardó demasiado", error: "Error" };
  var VEREDICTOS = ["", "referencia_doble", "referencia_adjudicada", "referencia_humana", "conflicto_humano", "solo_ia", "heredado_no_revisado", "sin_veredicto"];
  function valor(id) { return F[id] ? F[id] : null; }

  // ---------- Errores: tarjetas con la comparación a la vista ----------
  var VER_ET = { solo_ia: ["SOLO IA", "aviso"], conflicto_humano: ["EN DESACUERDO", "mal"], referencia_doble: ["REVISADO", "ok"], referencia_adjudicada: ["REVISADO", "ok"],
                 referencia_humana: ["REVISADO", "ok"], heredado_no_revisado: ["CASO VIEJO", "nd"], sin_veredicto: ["SIN REVISAR", "nd"] };
  var CHIPS = [["sin_veredicto", "Sin revisar"], ["solo_ia", "Solo IA"], ["conflicto_humano", "En desacuerdo"], ["referencia_humana", "Revisados"], ["", "Todos"]];
  function etiquetaVeredicto(v) { var x = VER_ET[v] || [v ? String(v).toUpperCase() : "SIN DATO", "nd"]; return el("span", { clase: "vb " + x[1], texto: x[0] }); }
  function tkm(l) { return [l.tarifa === null || l.tarifa === undefined ? "—" : "$" + l.tarifa, l.km === null || l.km === undefined ? "—" : l.km + " km", l.min === null || l.min === undefined ? "—" : l.min + "'"]; }
  function clave3(l) { return [l.tarifa, l.km, l.min].map(txt).join("|"); }
  // Qué casillas no coinciden: con referencia humana, lo que se aparta de ella; sin ella, lector contra IA.
  function marcas(lec, ia, hu) {
    var L = clave3(lec), I = ia.oferta === false ? "no_oferta" : clave3(ia);
    if (hu) { var H = clave3(hu); return { l: L !== H, i: I !== H, h: L !== H && I !== H }; }
    return { l: L !== I, i: L !== I, h: false };
  }
  function casilla(titulo, lineas, marca) { return el("div", { clase: "casilla" + (marca ? " dif" : "") }, [el("small", { texto: titulo })].concat(lineas.map(function (t) { return el("div", { texto: t }); }))); }
  function comparar3(lec, ia, hu) {
    var m = marcas(lec, ia, hu);
    return el("div", { clase: "comp3", id: "comparar" }, [
      casilla("Lector", tkm(lec), m.l),
      casilla("IA", ia.oferta === false ? ["no era oferta"] : tkm(ia), m.i),
      casilla("Humano", hu ? (hu.clase && hu.tarifa === undefined ? [hu.clase] : tkm(hu)) : ["sin referencia"], m.h)]);
  }
  function tarjetaError(f) {
    var lec = f.lector_lectura || {}, ia = f.ia_lectura || {}, hu = f.referencia || null;
    var CAMPOS = [["Tarifa", "tarifa", function (v) { return "$" + v; }], ["Km", "km", function (v) { return String(v); }], ["Min", "min", function (v) { return String(v); }]];
    var nulo = function (v) { return v === null || v === undefined; };
    var dif = el("div", { clase: "caso-dif" });
    if (ia.oferta === false) dif.append("Lector ", el("b", { texto: tkm(lec).join(" · ") }), " · IA ", el("em", { texto: "no era oferta" }));
    else {
      var c = CAMPOS.filter(function (k) { var ref = hu && !nulo(hu[k[1]]) ? hu[k[1]] : ia[k[1]]; return !nulo(lec[k[1]]) && !nulo(ref) && String(lec[k[1]]) !== String(ref) || (hu && !nulo(hu[k[1]]) && !nulo(ia[k[1]]) && String(ia[k[1]]) !== String(hu[k[1]])); })[0];
      if (c) dif.append(c[0] + ": Lector ", el("b", { texto: nulo(lec[c[1]]) ? "—" : c[2](lec[c[1]]) }), " · IA ", el("em", { texto: nulo(ia[c[1]]) ? "—" : c[2](ia[c[1]]) }), hu && !nulo(hu[c[1]]) ? " · Humano " + c[2](hu[c[1]]) : "");
      else dif.append(el("b", { texto: tkm(lec).join(" · ") }));
    }
    var app = String(f.app || "").toLowerCase(), ve = VER_ET[f.estado_veredicto] || ["SIN DATO", "nd"];
    function abrir(ev) {
      ev.preventDefault();
      if (!(window.matchMedia && matchMedia("(min-width:1000px) and (orientation:landscape)").matches)) { ir("errores", String(f.id)); return; }
      var l = document.getElementById("lado"); if (!l) return; l.textContent = ""; l.hidden = false;
      document.querySelectorAll(".error-tarjeta.sel").forEach(function (x) { x.classList.remove("sel"); }); fila.classList.add("sel");
      expediente(l, f.id); l.scrollTop = 0;
    }
    var fila = el("a", { href: "#revisar/" + f.id, clase: "error-tarjeta caso-fila", "data-id": String(f.id), onclick: abrir }, [
      el("span", { clase: "plat " + (app === "didi" ? "d" : app === "uber" ? "u" : "x"), "aria-hidden": "true", texto: app === "didi" ? "D" : app === "uber" ? "U" : "?" }),
      el("span", { clase: "caso-tx" }, [
        el("span", { clase: "caso-l1" }, [el("b", { texto: "#" + f.id }), el("span", { texto: fechaHora(f.creado) })]),
        dif,
        el("span", { clase: "caso-meta" }, [el("span", { clase: "punto " + ve[1], "aria-hidden": "true" }), (TIPO_TXT[f.tipo] || txt(f.tipo)) + " · " + ve[0].charAt(0) + ve[0].slice(1).toLowerCase() + " · " + txt(f.app) + " " + txt(f.version) + (f.tiene_captura ? " · con captura" : "")])]),
      el("span", { clase: "chev", "aria-hidden": "true", texto: "›" })]);
    return fila;
  }
  function pasosSeg(estado) {
    var k = ESTADOS_SEG.indexOf(estado);
    return el("div", { clase: "pasos-seg", role: "img", "aria-label": "Seguimiento: " + String(estado).replace(/_/g, " ") + ", paso " + (k + 1) + " de " + ESTADOS_SEG.length },
      ESTADOS_SEG.map(function (s, i) { return el("i", { clase: i <= k ? "hecho" : "" }); }));
  }
  async function errores(c) {
    if (esId(param)) return expediente(c, Number(param));
    // La cola abre en «Sin revisar»: primero lo que espera una decisión.
    if (F["f-estado"] === undefined) F["f-estado"] = "sin_veredicto";
    c.appendChild(el("div", { clase: "chips", role: "group", "aria-label": "Veredicto" }, CHIPS.map(function (ch) {
      return el("button", { type: "button", clase: "chip", "aria-pressed": String((F["f-estado"] || "") === ch[0]), texto: ch[1], onclick: function () { F["f-estado"] = ch[0]; pag.errores = 1; scrollErrores = 0; pintar(); } }); })));
    c.appendChild(filtrosBase([opciones("f-tipo", "Tipo", ["", "diferencia", "rescate", "desacuerdo", "reporte"], TIPO_TXT), opciones("f-estado", "Estado de revisión", VEREDICTOS, VER_TXT)]));
    skeleton(c);
    var r = rango(), d = await llamar("admin_errores", { desde: r.desde, hasta: r.hasta, app: valor("f-app"), version: valor("f-version"),
      tipo: valor("f-tipo"), estado_veredicto: valor("f-estado"), pagina: pag.errores, por_pagina: 50 });
    var sk = c.querySelector(".skeleton"); if (sk) sk.remove();
    if (!d) return;
    colaErrores = (d.filas || []).map(function (f) { return Number(f.id); });
    var chipAct = c.querySelector('.chip[aria-pressed="true"]'); if (chipAct) chipAct.textContent += " · " + d.total;
    var lista = el("div", { clase: "lista" }), lado = el("aside", { id: "lado", clase: "lado", "aria-label": "Detalle del error", hidden: "" });
    var dividido = el("div", { clase: "dividido" }, [lista, lado]); c.appendChild(dividido); var cpad = c; c = lista;
    c.appendChild(el("div", { clase: "error-lista", id: "errores-lista" }, d.filas.length ? d.filas.map(tarjetaError) : [el("div", { clase: "vacio", texto: "Sin errores con estos filtros. Prueba quitar la versión o ampliar las fechas." })]));
    c.appendChild(paginas("errores", d));
    c = cpad;
  }
  var ESTADOS_SEG = ["nuevo", "pendiente_de_revision", "en_investigacion", "causa_identificada", "corregido", "verificado", "cerrado"];
  var CAUSAS = ["", "ocr", "interpretacion", "tarjeta_equivocada", "pantalla_cambio", "ia", "dato_ambiguo", "otra"];
  // Captura del error: se descarga con tu sesión (el bucket sigue privado) y se muestra en su cuadro, sin dejar enlace.
  async function cargarCaptura(id) {
    aviso("");
    try {
      var r = await cli.storage.from("capturas").download(id + ".webp");
      if (r.error || !r.data) { aviso(r.error && /not.?found|404|Object/i.test(String(r.error.message || r.error)) ? "La captura ya no existe." : "No se pudo cargar la captura: " + ((r.error && r.error.message) || "sin permiso")); return null; }
      return URL.createObjectURL(r.data);
    } catch (e) { aviso("No se pudo cargar la captura."); return null; }
  }
  function abrirVisor(url, id) {
    var previo = document.activeElement;
    function cerrar() { visor.remove(); document.removeEventListener("keydown", tecla); if (previo && previo.focus) previo.focus(); }
    function tecla(ev) { if (ev.key === "Escape") cerrar(); }
    var img = el("img", { src: url, alt: "Captura del error " + id, clase: "visor-img" });
    img.addEventListener("click", function () { img.classList.toggle("ampliada"); });
    var cierre = el("button", { type: "button", clase: "visor-cierre", "aria-label": "Cerrar captura", texto: "✕", onclick: cerrar });
    var visor = el("div", { id: "visor", role: "dialog", "aria-modal": "true", "aria-label": "Captura del error " + id }, [
      el("div", { clase: "visor-cab" }, [el("b", { texto: "Captura · Error #" + id }), el("span", { clase: "detalle", texto: "Toca la imagen para ampliar" }), cierre]), el("div", { clase: "visor-marco" }, [img])]);
    document.body.appendChild(visor); document.addEventListener("keydown", tecla); cierre.focus();
  }
  function legibleCap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function marcoCaptura(e) {
    var marco = el("div", { clase: "marco-captura vacio", id: "marco-captura" });
    function vacio(texto, conBoton) {
      marco.textContent = ""; marco.classList.add("vacio");
      var centro = el("div", { clase: "marco-centro" }, [conBoton ? el("button", { type: "button", id: "ver-captura", clase: "ver-captura", texto: "Ver captura", onclick: cargar }) : null, el("span", { texto: texto })]);
      marco.appendChild(centro);
    }
    async function cargar(ev) {
      var b = ev && ev.currentTarget; if (b) { b.disabled = true; b.textContent = "Cargando…"; }
      marco.classList.add("cargando");
      var url = await cargarCaptura(e.id);
      marco.classList.remove("cargando");
      if (!url) { vacio("No se pudo cargar.", true); return; }
      marco.textContent = ""; marco.classList.remove("vacio");
      var img = el("img", { src: url, alt: "Captura del error " + e.id, clase: "captura-img" });
      img.addEventListener("click", function () { abrirVisor(url, e.id); });
      marco.appendChild(img);
      marco.appendChild(el("button", { type: "button", clase: "marco-ampliar", "aria-label": "Ampliar captura", texto: "⤢", onclick: function () { abrirVisor(url, e.id); } }));
      if (e.creado) marco.appendChild(el("span", { clase: "marco-hora", texto: hora(e.creado) }));
    }
    if (e.evidencia && e.evidencia.captura) { vacio("Cargando captura…", false); setTimeout(cargar, 0); } else vacio("Sin captura (se borra sola a los 7 días).", false);
    return marco;
  }
  function hojaSeguimiento(id, estadoActual) {
    var viejo = document.getElementById("hoja-seg"); if (viejo) viejo.remove();
    function cerrar() { h.remove(); }
    var sEst = opciones("s-estado", "Estado", ESTADOS_SEG.slice(1)), sCau = opciones("s-causa", "Causa", CAUSAS);
    var h = el("div", { id: "hoja-seg", role: "dialog", "aria-modal": "true", "aria-label": "Registrar seguimiento", onkeydown: function (ev) { if (ev.key === "Escape") cerrar(); } }, [
      el("div", { clase: "velo", onclick: cerrar }),
      el("div", { clase: "panel-hoja" }, [el("div", { clase: "asa", "aria-hidden": "true" }), el("h2", { texto: "Registrar seguimiento" }),
        el("div", { clase: "dos-col" }, [sEst, sCau]),
        el("label", {}, ["Nota (opcional)", el("input", { id: "s-nota", maxlength: "300", autocomplete: "off" })]),
        el("button", { id: "s-guardar", type: "button", clase: "primario", texto: "Guardar", onclick: async function () { await guardarSeguimiento(id); } })])]);
    document.body.appendChild(h);
    var sel = h.querySelector("#s-estado"); if (sel) sel.focus();
  }
  async function guardarSeguimiento(id) {
    var r = await llamar("admin_seguimiento", { id: id, estado: document.getElementById("s-estado").value, causa: document.getElementById("s-causa").value || null,
      nota: document.getElementById("s-nota").value || null });
    var h = document.getElementById("hoja-seg"); if (h) h.remove();
    if (r) pintar();
  }
  // ---------- Veredicto humano: la referencia que usan Auditoría IA, Versiones y Ofertas ----------
  var CLASES_V = [["oferta", "Oferta"], ["no_oferta", "No es oferta"], ["varias", "Varias ofertas"], ["ilegible", "Ilegible"], ["cambio_pantalla", "Cambió la pantalla"]];
  var CONFIANZAS_V = [["baja", "Baja"], ["media", "Media"], ["alta", "Alta"]];
  // Tras guardar un veredicto: pasa solo al siguiente error de la lista (en el panel de escritorio solo se refresca).
  function vecinoError(id, d) { var i = colaErrores.indexOf(Number(id)); return i < 0 ? null : (colaErrores[i + d] || null); }
  // El veredicto se envía 7 segundos después de dar «Guardar», para poder deshacerlo. Se envía antes si cambias de pantalla,
  // si das otro veredicto o si sales de la pestaña.
  var pendienteV = null;
  async function commitirPendiente() {
    var p = pendienteV; if (!p) return; pendienteV = null; clearTimeout(p.timer);
    var t = document.getElementById("toast"); if (t && t.getAttribute("data-v") === "1") t.remove();
    var ok = await p.enviar();
    if (!ok) { aviso("No se pudo guardar el veredicto del error #" + p.id + ". Ábrelo y vuelve a intentarlo.", false); return; }
    toast("Veredicto guardado");
    contarUrgentes();
    if (enDetalle() && String(param) === String(p.id)) pintar();
  }
  function programarVeredicto(id, enviar) { pendienteV = { id: id, enviar: enviar, timer: setTimeout(commitirPendiente, 7000) }; }
  function deshacerVeredicto() {
    var p = pendienteV; if (!p) return; pendienteV = null; clearTimeout(p.timer);
    toast("Veredicto cancelado. No se guardó nada."); ir("errores", String(p.id));
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") commitirPendiente(); });
  function avanzarError(id) {
    var sig = vecinoError(id, 1);
    toast(sig ? "Veredicto listo. Aquí va el siguiente." : "Veredicto listo. Era el último de la lista.", { texto: "Deshacer", onclick: deshacerVeredicto }, 7000);
    if (sig) ir("errores", String(sig)); else pintar();
  }
  function hojaVeredicto(e, lec, ia, sug, guardarSug) {
    var viejo = document.getElementById("hoja-ver"); if (viejo) viejo.remove();
    var conf = "", err = el("div", { clase: "aviso-cmp", id: "ver-error", hidden: "" });
    function cerrar() { h.remove(); }
    function campo(id, etiqueta, unidad, modo) { return el("label", { clase: "campo-v" }, [el("span", { texto: etiqueta + " (" + unidad + ")" }), el("input", { id: id, inputmode: modo || "decimal", autocomplete: "off", enterkeyhint: "next" })]); }
    var inT = campo("v-tarifa", "Tarifa", "$"), inK = campo("v-km", "Distancia", "km"), inM = campo("v-min", "Tiempo", "min");
    var selClase = el("select", { id: "v-clase" }, CLASES_V.map(function (c) { return el("option", { value: c[0], texto: c[1] }); }));
    var nota = el("input", { id: "v-nota", maxlength: "280", autocomplete: "off" });
    function poner(l) { document.getElementById("v-tarifa").value = l.tarifa === null || l.tarifa === undefined ? "" : l.tarifa; document.getElementById("v-km").value = l.km === null || l.km === undefined ? "" : l.km; document.getElementById("v-min").value = l.min === null || l.min === undefined ? "" : l.min; selClase.value = "oferta"; visibilidad(); }
    function visibilidad() { var of = selClase.value === "oferta"; ["v-tarifa", "v-km", "v-min"].forEach(function (id) { document.getElementById(id).closest("label").hidden = !of; }); }
    selClase.addEventListener("change", visibilidad);
    var iaNo = ia.oferta === false;
    var atajos = el("div", { clase: "atajos-v" }, [
      el("button", { type: "button", id: "atajo-ia", onclick: function () { if (iaNo) { selClase.value = "no_oferta"; visibilidad(); } else poner(ia); } }, [el("b", { texto: "La IA acertó" }), el("small", { texto: iaNo ? "no era oferta" : tkm(ia).join(" · ") })]),
      el("button", { type: "button", id: "atajo-lector", onclick: function () { poner(lec); } }, [el("b", { texto: "El Lector acertó" }), el("small", { texto: tkm(lec).join(" · ") })])]);
    var segConf = el("div", { clase: "seg3", role: "group", "aria-label": "Qué tan seguro estás" }, CONFIANZAS_V.map(function (c) {
      return el("button", { type: "button", "data-conf": c[0], "aria-pressed": String(conf === c[0]), texto: c[1], onclick: function (ev) { conf = c[0]; segConf.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-conf") === conf)); }); } }); }));
    var guardar = el("button", { id: "v-guardar", type: "button", clase: "primario", texto: "Guardar veredicto", onclick: async function () {
      err.hidden = true;
      var of = selClase.value === "oferta", t = parseFloat(document.getElementById("v-tarifa").value.replace(",", ".")), k = parseFloat(document.getElementById("v-km").value.replace(",", ".")), m = parseFloat(document.getElementById("v-min").value.replace(",", "."));
      if (of && !(t > 0 && k > 0 && m > 0)) { err.textContent = "Escribe la tarifa, la distancia y el tiempo correctos (mayores que cero)."; err.hidden = false; return; }
      if (!conf) { err.textContent = "Elige qué tan seguro estás de tu respuesta."; err.hidden = false; return; }
      var args = { objetivo: "error_lector", objetivo_id: String(e.id), clase: selClase.value, tarifa: of ? t : null, km: of ? k : null, min: of ? m : null,
        confianza: conf, evidencia_sha256: e.enlace.captura_sha256, nota: nota.value || null };
      var enviar = async function () {
        var r = null;
        // La sugerencia de la IA viaja solo si existe. Si la base aún no la acepta (falta el SQL 010), se guarda el veredicto sin ella.
        if (guardarSug) { try { var r1 = await cli.rpc("admin_veredicto", Object.assign({ ia_sugerencia: guardarSug }, args)); if (r1 && r1.data && r1.data.id) r = r1.data; } catch (x) { r = null; } }
        if (!r) r = await llamar("admin_veredicto", args);
        return !!(r && r.id);
      };
      var lado = document.getElementById("lado");
      if (lado && !lado.hidden) {   // panel de escritorio: se guarda al momento
        guardar.disabled = true; guardar.textContent = "Guardando…";
        if (await enviar()) { h.remove(); toast("Veredicto guardado"); contarUrgentes(); pintar(); } else { guardar.disabled = false; guardar.textContent = "Guardar veredicto"; }
        return;
      }
      await commitirPendiente(); h.remove(); programarVeredicto(e.id, enviar); avanzarError(e.id);
    } });
    var h = el("div", { id: "hoja-ver", role: "dialog", "aria-modal": "true", "aria-label": "Dar veredicto", onkeydown: function (ev) { if (ev.key === "Escape") cerrar(); } }, [
      el("div", { clase: "velo", onclick: cerrar }),
      el("div", { clase: "panel-hoja" }, [el("div", { clase: "asa", "aria-hidden": "true" }), el("h2", { texto: "Dar veredicto" }),
        el("div", { clase: "detalle", texto: "Según la captura de las " + hora(e.creado) + ". Queda guardada como evidencia de tu veredicto." }),
        el("div", { clase: "etq", texto: "Atajos" }), atajos,
        el("div", { clase: "etq", texto: "Qué es" }), el("label", { clase: "campo-v" }, [selClase]),
        el("div", { clase: "campos-v" }, [inT, inK, inM]),
        el("div", { clase: "etq", texto: "Qué tan seguro estás (obligatorio)" }), segConf,
        el("label", { clase: "campo-v" }, [el("span", { texto: "Nota (opcional)" }), nota]), err, guardar])]);
    document.body.appendChild(h);
    if (sug) { if (sug.estado === "vigente") poner({ tarifa: sug.tarifa, km: sug.km, min: sug.min }); else { poner({ tarifa: null, km: null, min: null }); selClase.value = "no_oferta"; visibilidad(); } }
    else { poner(iaNo ? { tarifa: null, km: null, min: null } : ia); if (iaNo) { selClase.value = "no_oferta"; visibilidad(); } }
    selClase.focus();
  }
  async function expediente(c, id) {
    var enLado = c.id === "lado";
    c.appendChild(el("button", { id: "volver", clase: "volver", "aria-label": "Volver a la cola", texto: "‹ Revisar", onclick: function () { ir("revisar"); } }));
    var e = await llamar("admin_error", { id: id });
    if (!e) return;
    var iCola = colaErrores.indexOf(Number(e.id));
    if (!enLado && iCola >= 0) c.appendChild(el("div", { clase: "detalle", id: "exp-pos", texto: "Error " + (iCola + 1) + " de " + colaErrores.length + " en la lista" }));
    c.appendChild(el("div", { clase: "exp-cab" }, [el("h1", { id: "exp-titulo", texto: "Error #" + e.id }), (e.veredicto_humano || {}).estado ? etiquetaVeredicto(e.veredicto_humano.estado) : null]));
    c.appendChild(el("div", { clase: "detalle", texto: txt(e.app) + " " + txt(e.version) + " · " + txt(e.tipo) + " · conductor " + txt(e.conductor) + " · " + fechaHora(e.creado) }));
    var lec = e.lector || {}, ia = e.ia || {}, hu = e.veredicto_humano || {};
    var refE = hu && hu.clase ? hu : null, mE = marcas(lec, ia, refE);
    var iaNo = ia.oferta === false;
    var METR = [["Tarifa", "tarifa", function (v) { return "$" + v; }], ["Distancia", "km", function (v) { return v + " km"; }], ["Tiempo", "min", function (v) { return v + " min"; }]];
    function nulo(v) { return v === null || v === undefined; }
    function bloque(m) {
      var k = m[1], f = m[2], L = lec[k], I = iaNo ? undefined : ia[k], H = refE ? refE[k] : undefined;
      var tieneH = refE && !nulo(H), difL, difI, estado = null;
      if (tieneH) { difL = !nulo(L) && String(L) !== String(H); difI = !iaNo && !nulo(I) && String(I) !== String(H); estado = (difL || difI || iaNo) ? "dif" : "ok"; }
      else if (!iaNo && !nulo(L) && !nulo(I)) { difL = difI = String(L) !== String(I); estado = difL ? "dif" : "ok"; }
      else if (iaNo) { difL = false; difI = true; estado = "dif"; }
      var fila = function (nom, v, dif, texto) { return el("div", { clase: "mt-fila" + (dif ? " x" : "") }, [el("span", { texto: nom }), el("b", { texto: texto !== undefined ? texto : nulo(v) ? "—" : f(v) })]); };
      return { m: m[0], estado: estado, nodo: el("div", { clase: "mt" + (estado === "dif" ? " dif" : ""), "data-metrica": k }, [
        el("div", { clase: "mt-nom" }, [el("span", { texto: m[0] }), estado ? el("em", { clase: estado === "ok" ? "ok" : "no", texto: estado === "ok" ? "✓ iguales" : "✕ difieren" }) : null]),
        fila("Lector", L, difL), fila("IA", I, difI, iaNo ? "no era oferta" : undefined), el("div", { clase: "mt-fila nada" }, [el("span", { texto: "Humano" }), el("b", { texto: refE ? (nulo(H) ? (refE.clase || "—") : f(H)) : "—" })])]) };
    }
    var bl = METR.map(bloque);
    c.appendChild(el("div", { clase: "duo", id: "comparar" }, [marcoCaptura(e), el("div", { clase: "metr" }, bl.map(function (x) { return x.nodo; }))]));
    var iguales = bl.filter(function (x) { return x.estado === "ok"; }).map(function (x) { return x.m.toLowerCase(); }), difieren = bl.filter(function (x) { return x.estado === "dif"; }).map(function (x) { return x.m.toLowerCase(); });
    function lista(xs) { return xs.length > 1 ? xs.slice(0, -1).join(", ") + " y " + xs[xs.length - 1] : xs[0]; }
    if (difieren.length) c.appendChild(el("div", { clase: "aviso-cmp", id: "aviso-diferencia", texto: (iguales.length ? legibleCap(lista(iguales)) + (iguales.length > 1 ? " iguales; " : " igual; ") : "") + lista(difieren) + (difieren.length > 1 ? " distintos." : " distinto.") + (refE ? "" : " Falta un veredicto humano para saber cuál acierta.") }));
    // Sugerencia de la IA que lee la imagen (DeepSeek): una captura a la vez, solo si la captura existe. La decisión es de la persona.
    if (e.evidencia && e.evidencia.captura) {
      var cajaIA = el("div", { id: "ia-vision" }), sugErr = null, precErr = null;
      var pintarIA = function (sug, pidiendo) {
        sugErr = sug; cajaIA.textContent = "";
        if (precErr && precErr.n > 0) cajaIA.appendChild(el("div", { clase: "rev-ia-prec", id: "ia-precision-errores", texto: "Errores revisados con la IA de imagen: " + precErr.n + " (de ellos " + precErr.ofertas + " eran ofertas). La IA de imagen acertó " + precErr.vision + " de " + precErr.n + "; en las ofertas: IA de imagen " + precErr.vision_ofertas + ", Lector " + precErr.lector_ofertas + ", IA de texto " + precErr.texto_ofertas + " de " + precErr.ofertas + (precErr.n < (precErr.minimo || 30) ? " · pocos casos para opinar (menos de " + (precErr.minimo || 30) + ")" : "") }));
        if (!sug) { cajaIA.appendChild(el("button", { type: "button", id: "ver-ia", clase: "rev-ia-pedir", disabled: pidiendo ? "" : null, texto: pidiendo ? "Leyendo con la IA…" : "Pedir sugerencia a la IA", onclick: async function () {
          pintarIA(null, true); aviso("");
          var r = null; try { r = await cli.functions.invoke("admin-leer-captura", { body: { nombre: e.id + ".webp" } }); } catch (x) { r = { error: x }; }
          if (r && r.data && r.data.ok) { pintarIA(Object.assign({ modelo: r.data.modelo, ms: r.data.ms, tokens: r.data.tokens }, r.data.lectura), false); return; }
          var st = r && r.error && r.error.context && r.error.context.status;
          aviso(st === 403 ? "No autorizado para leer capturas." : st === 404 ? "La captura ya no existe." : st === 503 ? "La lectura con IA no está activa (falta la clave de DeepSeek)." : st === 502 ? "La IA no pudo leer esta captura (revisa el saldo de DeepSeek)." : "No se pudo pedir la sugerencia a la IA.");
          pintarIA(null, false); } })); return; }
        var vigente = sug.estado === "vigente";
        var quien = function (k, valor, tol) { var qs = []; if (valor !== null && !nulo(lec[k]) && Math.abs(lec[k] - valor) <= tol) qs.push("el Lector"); if (valor !== null && !iaNo && !nulo(ia[k]) && Math.abs(ia[k] - valor) <= tol) qs.push("la IA de revisión"); return qs.length ? "coincide con " + qs.join(" y ") : "no coincide con ninguno"; };
        var fila = function (nom, valor, f, k, tol) { return el("div", { clase: "mt-fila" }, [el("span", { texto: nom }), el("b", { texto: valor === null ? "—" : f(valor) })].concat([])); };
        var filas = vigente ? [["Tarifa", sug.tarifa, function (v) { return "$" + v; }, "tarifa", 0.01], ["Distancia", sug.km, function (v) { return v + " km"; }, "km", 0.15], ["Tiempo", sug.min, function (v) { return v + " min"; }, "min", 1]] : [];
        cajaIA.appendChild(el("div", { clase: "rev-ia-caja" }, [
          el("div", { clase: "pop-nom", texto: "Sugerencia de la IA que lee la imagen (" + txt(sug.modelo) + ") · confianza " + txt(sug.confianza) + (sug.ms ? " · tardó " + (sug.ms / 1000).toFixed(1) + " s" : "") }),
          el("div", { clase: "rotulo", texto: vigente ? "Oferta vigente" : sug.estado === "vencida" ? "Oferta vencida" : sug.estado === "aceptada" ? "Ya aceptada o tomada" : "No es una oferta" })]
          .concat(filas.map(function (f) { return el("div", {}, [fila(f[0], f[1], f[2]), el("div", { clase: "detalle", texto: quien(f[3], f[1], f[4]) })]); }))
          .concat([sug.nota ? el("div", { clase: "detalle", texto: sug.nota }) : null, el("div", { clase: "detalle", texto: "Es una sugerencia: tú decides." }),
            yo && yo.rol === "revisor" && e.enlace && e.enlace.captura_sha256 ? el("button", { type: "button", id: "ia-usar", texto: vigente ? "Dar veredicto con sus valores" : "Dar veredicto: no es oferta", onclick: function () { hojaVeredicto(e, lec, ia, sug, sug); } }) : null])));
      };
      var pr = null; try { var prr = await cli.rpc("admin_ia_precision_errores"); pr = prr && prr.data; } catch (x) { pr = null; } precErr = pr && !pr.error ? pr : null;
      pintarIA(null, false); c.appendChild(cajaIA);
    }
    var btnVer = null;
    if (yo && yo.rol === "revisor") {
      var sha = e.enlace && e.enlace.captura_sha256;
      btnVer = el("button", { type: "button", id: "dar-veredicto", clase: "dar-veredicto", texto: "Dar veredicto", disabled: sha ? null : "", onclick: function () { hojaVeredicto(e, lec, ia, null, sugErr); } });
      if (enLado) c.appendChild(btnVer);
      if (!sha) c.appendChild(el("div", { clase: "detalle", id: "sin-huella", texto: "No se puede dar veredicto: no se puede comprobar que la captura sea la de este caso (es anterior a la 10.82 o no tiene lectura guardada)." }));
    }
    c.appendChild(el("div", { clase: "detalle", texto: "Veredicto anterior: " + txt(e.veredicto_heredado) + " (no lo dio una persona)" }));
    c.appendChild(el("div", { clase: "h-fila" }, [el("h2", { texto: "Seguimiento" }), el("span", { clase: "detalle", texto: String(e.estado_seguimiento).replace(/_/g, " ") })]));
    c.appendChild(pasosSeg(e.estado_seguimiento));
    c.appendChild(el("div", { clase: "enlaces" }, [enlace("Versión " + e.version + " (" + e.relacionados.misma_version + ")", "versiones"), enlace("Conductor " + e.conductor + " (" + e.relacionados.mismo_conductor + ")", "dispositivos"), enlace("Auditoría IA", "ia")]));
    var en = e.enlace;
    c.appendChild(el("details", { clase: "tecnico", id: "tecnico" }, [el("summary", { texto: "Más detalle" }), el("div", { clase: "tecnico-cuerpo" }, [
      el("div", { clase: "detalle", id: "evidencia", texto: "Captura: " + (e.evidencia.captura ? "existe" : "no existe (se borra sola a los 7 días)") + " · líneas guardadas: " + e.evidencia.lineas_guardadas + " (no se muestran: traen direcciones)" }),
      el("div", { clase: "detalle", texto: "Tipo: " + txt(e.clasificacion) }),
      el("div", { clase: "detalle", id: "enlace", texto: en
        ? "Datos internos: imagen " + en.fotograma_id + " → lectura " + en.lectura_id + " · captura " + en.captura_vinculo + " · código de la captura " + txt(en.captura_sha256)
        : "Este caso es anterior a la 10.82 o no tiene lectura guardada: no se puede comprobar que la captura sea la correcta." })])]));
    c.appendChild(el("details", { clase: "tecnico", id: "historial" }, [el("summary", { texto: "Historial (" + (e.historial || []).length + ")" }), el("div", { clase: "tecnico-cuerpo" }, [
      tabla([["Fecha", function (h) { return fechaHora(h.creado); }], ["Estado", function (h) { return h.estado; }], ["Causa", function (h) { return h.causa; }],
        ["Nota", function (h) { return h.nota; }], ["Quién", function (h) { return h.admin; }]], e.historial, "Sin cambios registrados todavía.")])]));
    // Registro de seguimiento: inline en el panel lateral; barra corta + hoja en teléfono y tableta vertical.
    if (yo && yo.rol === "revisor") {
      if (enLado) {
        c.appendChild(el("div", { clase: "filtros", id: "seguimiento" }, [opciones("s-estado", "Estado", ESTADOS_SEG.slice(1)), opciones("s-causa", "Causa", CAUSAS),
          el("label", {}, ["Nota", el("input", { id: "s-nota", maxlength: "300", size: "30" })]),
          el("button", { id: "s-guardar", texto: "Registrar", onclick: function () { guardarSeguimiento(id); } })]));
      } else {
        c.appendChild(el("div", { clase: "barra-seg", id: "seguimiento" }, [el("div", { clase: "barra-seg-t" }, [el("span", { texto: "Seguimiento" }), el("b", { texto: String(e.estado_seguimiento).replace(/_/g, " ") })]),
          el("button", { type: "button", id: "abrir-registro", clase: "primario", texto: "Registrar", onclick: function () { hojaSeguimiento(id, e.estado_seguimiento); } })]));
      }
    } else { c.appendChild(el("div", { clase: "detalle", texto: "Tu rol es de solo lectura: no puedes cambiar el seguimiento." })); }
    if (!enLado && (btnVer || iCola >= 0)) {
      var ant = vecinoError(e.id, -1), sig = vecinoError(e.id, 1);
      c.appendChild(el("div", { clase: "barra-acc", id: "barra-acc" }, [
        el("button", { type: "button", id: "err-anterior", texto: "‹ Anterior", disabled: ant ? null : "", onclick: function () { ir("errores", String(ant)); } }),
        btnVer,
        el("button", { type: "button", id: "err-siguiente", texto: sig ? "Siguiente ›" : "Fin de la lista", disabled: sig ? null : "", onclick: function () { ir("errores", String(sig)); } })]));
    }
  }

  // ---------- 03 Ofertas ----------
  var RES = { oferta: ["OFERTA", "ok"], no_oferta: ["NO OFERTA", "nd"], descartada: ["DESCARTADA", "nd"], duplicada: ["DUPLICADA", "nd"], varias: ["VARIAS", "aviso"],
              abstencion: ["SIN LECTURA", "aviso"], timeout: ["TARDÓ DEMASIADO", "mal"], error: ["ERROR", "mal"] };
  var RES_CHIPS = [["", "Todos"], ["abstencion", "Sin lectura"], ["error", "Error"], ["duplicada", "Duplicada"]];
  var RES_BARRA = [["Oferta", ["oferta"], "var(--luz-v)"], ["No oferta", ["no_oferta", "descartada"], "var(--gris)"], ["Duplicada", ["duplicada", "varias"], "var(--amarillo)"],
                   ["Sin lectura", ["abstencion"], "var(--luz-a)"], ["Error o tardó demasiado", ["error", "timeout"], "var(--luz-r)"]];
  function etiquetaResultado(r) { var x = RES[r] || [r ? String(r).toUpperCase() : "—", "nd"]; return el("span", { clase: "vb " + x[1], texto: x[0] }); }
  function claseEtapa(s) { s = String(s || "").toLowerCase(); return /err|fall|time|rech|no_/.test(s) ? "x" : /ok|exit|complet|correct|hecho|listo|proces/.test(s) ? "" : "s"; }
  function barraResultados(filas, total) {
    var n = filas.length; if (!n) return null;
    var cuenta = RES_BARRA.map(function (g) { return filas.filter(function (f) { return g[1].indexOf(f.resultado) >= 0; }).length; });
    return el("section", { clase: "barra-res", id: "resultados" }, [
      el("div", { clase: "h-fila" }, [el("h2", { texto: "Qué pasó con las lecturas" }), el("span", { clase: "detalle", texto: total && total > n ? "Solo las " + n + " más recientes (hay " + total + ")" : n + " en total" })]),
      el("div", { clase: "barra", role: "img", "aria-label": RES_BARRA.map(function (g, k) { return g[0] + " " + Math.round(cuenta[k] / n * 100) + "%"; }).join(", ") },
        RES_BARRA.map(function (g, k) { if (!cuenta[k]) return null; var s = el("i"); s.style.width = (cuenta[k] / n * 100) + "%"; s.style.background = g[2]; return s; })),
      el("div", { clase: "leyenda" }, RES_BARRA.map(function (g, k) { var p = el("i"); p.style.background = g[2]; return el("span", {}, [p, g[0] + " " + Math.round(cuenta[k] / n * 100) + "%"]); })),
      el("div", { clase: "detalle", texto: "Calculado con los " + n + " lecturas de esta página." + (total && total > n ? " El total del periodo no está disponible todavía." : "") })]);
  }
  function metricaTarjeta(x) {
    var PROP = ["duplicadas", "abstenciones", "captura_exacta", "con_referencia_humana", "precision_humana", "falsos_positivos_humana", "mezcla_tarjetas_humana", "acuerdo_ia_lector", "banco_heredado"];
    var v = x.valor === null || x.valor === undefined ? "—" : (PROP.indexOf(x.clave) >= 0 ? pct(x.valor) : String(x.valor));
    return el("div", { clase: "tarjeta", "data-clave": x.clave }, [
      el("div", { clase: "detalle", texto: x.nombre }), el("div", { clase: "valor", texto: v }),
      el("div", { clase: "detalle", texto: casos(x.k, x.n) || "sin casos" }),
      el("span", { clase: "etiqueta " + (x.estado === "suficiente" ? "ok" : x.estado === "no_medible" ? "mal" : "aviso"), texto: x.estado.replace("_", " ") }),
      x.motivo ? el("div", { clase: "detalle", texto: x.motivo }) : null,
      el("details", { clase: "def-ayuda" }, [el("summary", { texto: "Cómo se calcula" }), el("div", { clase: "detalle", texto: "Cálculo: " + txt(x.formula) + ". Casos que cuenta: " + txt(x.poblacion) + ". De dónde sale: " + txt(x.fuente) + "." })])]);
  }
  function detalleEvento(f) {
    var ref = f.referencia;
    return el("div", { clase: "evento-detalle" }, [
      el("div", { clase: "etapas-lista" }, (f.etapas || []).map(function (e) { return el("div", { clase: "fila" }, [el("span", { clase: "punto " + (claseEtapa(e.estado) === "x" ? "mal" : claseEtapa(e.estado) === "s" ? "nd" : "ok") }), el("span", { texto: e.etapa + " · " + e.estado })]); })),
      el("div", { clase: "kv" }, [["Lector", f.lector], ["Captura", f.captura_vinculo], ["Veredicto", f.estado_veredicto], ["Respuesta de una persona", ref ? [ref.clase, ref.tarifa, ref.km, ref.min].map(txt).join(" · ") : null], ["Conductor", f.conductor]].reduce(function (acc, p) {
        acc.push(el("span", { texto: p[0] }), el("b", { texto: txt(p[1]) })); return acc; }, [])),
      enlace("Ver errores", "errores")]);
  }
  function tarjetaEvento(f) {
    var cuerpo = null;
    var art = el("article", { clase: "evento", "data-res": f.resultado });
    var cab = el("button", { type: "button", clase: "evento-cab", "aria-expanded": "false", onclick: function () {
      if (window.matchMedia && matchMedia("(min-width:1000px) and (orientation:landscape)").matches) {
        var l = document.getElementById("lado"); if (!l) return; l.textContent = ""; l.hidden = false;
        document.querySelectorAll(".evento.sel").forEach(function (x) { x.classList.remove("sel"); }); art.classList.add("sel");
        l.appendChild(el("div", { clase: "exp-cab" }, [el("h1", { texto: "Evento · " + hora(f.ts_evento) }), etiquetaResultado(f.resultado)])); l.appendChild(detalleEvento(f)); l.scrollTop = 0; return;
      }
      if (cuerpo) { cuerpo.remove(); cuerpo = null; cab.setAttribute("aria-expanded", "false"); art.classList.remove("abierto"); }
      else { cuerpo = detalleEvento(f); art.appendChild(cuerpo); cab.setAttribute("aria-expanded", "true"); art.classList.add("abierto"); } } }, [
      el("div", { clase: "evento-fila" }, [el("b", { texto: hora(f.ts_evento) }), etiquetaResultado(f.resultado), el("span", { clase: "detalle der", texto: txt(f.app) + " " + txt(f.version_app) })]),
      el("div", { clase: "evento-valor" }, [punto(f.nivel), el("span", { texto: [f.tarifa, f.km, f.min].every(function (x) { return x === null || x === undefined; }) ? "—" : tkm({ tarifa: f.tarifa, km: f.km, min: f.min }).join(" · ") })]),
      f.motivo ? el("div", { clase: "detalle", texto: f.motivo }) : null,
      el("div", { clase: "mini", "aria-hidden": "true" }, (f.etapas || []).map(function (e) { return el("i", { clase: claseEtapa(e.estado) }); }))]);
    art.appendChild(cab); return art;
  }
  // ---------- Revisar ofertas: capturas de ofertas aceptar / considerar / rechazar (desde la 10.82) ----------
  var REV_COLORES = [["rojo", "Rechazar", "var(--luz-r)"], ["amarillo", "Considerar", "var(--luz-a)"], ["verde", "Aceptar", "var(--luz-v)"]];
  var REV_META = 30;
  var REV_MOTIVOS = [["no_oferta", "No era una oferta", "mapa, aviso, otra pantalla"], ["vencida", "Oferta vencida o aceptada", "ya no estaba disponible"],
                     ["otra_tarjeta", "Era otra tarjeta", "mostró los datos de otra oferta"], ["ilegible", "No se ve bien", "la captura no permite decidir"]];
  var revNivel = "rojo";
  // Lo que mostró el pop-up sale del nombre: ok-<color>-<tarifa>-<km>-<min>-<ms>-n<id>.webp
  function popDeNombre(n) { var m = /^ok-[a-z]+-([\d.]+)-([\d.]+)-([\d.]+)-/.exec(n || ""); return m ? { tarifa: Number(m[1]), km: Number(m[2]), min: Number(m[3]) } : { tarifa: null, km: null, min: null }; }
  async function huella(blob) { try { var b = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()); return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); } catch (e) { return null; } }

  async function capturas(c) {
    c.appendChild(el("p", { clase: "detalle", texto: "Capturas de ofertas de la 10.82 en adelante: confirma una a la vez si la app leyó bien." }));
    var esRevisor = !!(yo && yo.rol === "revisor");
    var cuerpo = el("div", { id: "rev-cuerpo" }); c.appendChild(cuerpo);
    var estado = { items: [], pend: {}, rev: {}, actual: null, url: null, blob: null, ultima: null, ocupado: false, sug: null, pidiendo: false, prec: null };
    function soltar() { if (estado.url) { URL.revokeObjectURL(estado.url); estado.url = null; } estado.blob = null; estado.sug = null; estado.pidiendo = false; }

    async function cargarCola() {
      var d = await llamar("admin_capturas_pendientes", { p_nivel: revNivel, p_limite: 10 });
      if (!d) return false;
      estado.pend = d.pendientes || {}; estado.rev = d.revisadas || {}; estado.items = d.items || [];
      return true;
    }
    async function cargarPrecision() { var d = await llamar("admin_ia_precision"); estado.prec = d && !d.error ? d : null; }
    async function pedirIA() {
      var it = estado.actual; if (!it || estado.pidiendo) return;
      estado.pidiendo = true; aviso(""); pintarRev();
      var r = null;
      try { r = await cli.functions.invoke("admin-leer-captura", { body: { nombre: it.nombre } }); } catch (e) { r = { error: e }; }
      estado.pidiendo = false;
      if (estado.actual !== it) return;
      if (r && r.data && r.data.ok) estado.sug = Object.assign({ modelo: r.data.modelo, ms: r.data.ms, tokens: r.data.tokens }, r.data.lectura);
      else {
        var st = r && r.error && r.error.context && r.error.context.status;
        aviso(st === 403 ? "No autorizado para leer capturas." : st === 404 ? "La captura ya no existe." : st === 503 ? "La lectura con IA no está activa (falta la clave de DeepSeek)." : st === 502 ? "La IA no pudo leer esta captura (revisa el saldo de DeepSeek)." : "No se pudo pedir la sugerencia a la IA.");
      }
      pintarRev();
    }
    async function siguiente() {
      soltar(); estado.actual = estado.items.shift() || null;
      if (!estado.actual) { await cargarCola(); estado.actual = estado.items.shift() || null; }
      if (estado.actual) {
        var r = await cli.storage.from("capturas").download(estado.actual.nombre).catch(function () { return { error: true }; });
        if (r && r.data) { estado.blob = r.data; estado.url = URL.createObjectURL(r.data); }
      }
      pintarRev();
    }
    async function guardar(args, borrarUltima) {
      if (estado.ocupado || !estado.actual) return; estado.ocupado = true; pintarRev();
      var it = estado.actual, sha = estado.blob ? await huella(estado.blob) : null;
      var p = { p_captura_ok_id: it.id, p_resultado: args.resultado, p_motivo: args.motivo || null, p_tarifa: args.tarifa || null, p_km: args.km || null, p_min: args.min || null, p_nota: args.nota || null, p_evidencia_sha256: sha };
      if (estado.sug) p.p_ia_sugerencia = estado.sug;
      var r = await llamar("admin_revisar_captura", p);
      estado.ocupado = false;
      if (r && r.id) { var conSug = !!estado.sug; estado.ultima = it; estado.pend[it.nivel] = Math.max(0, (estado.pend[it.nivel] || 0) - 1); estado.rev[it.nivel] = (estado.rev[it.nivel] || 0) + 1; if (conSug) await cargarPrecision(); await siguiente(); }
      else pintarRev();
    }
    async function deshacer() {
      if (estado.ocupado || !estado.ultima) return; estado.ocupado = true; pintarRev();
      var it = estado.ultima, r = await llamar("admin_revisar_captura", { p_captura_ok_id: it.id, p_resultado: "anulada" });
      estado.ocupado = false;
      if (r && r.id) { estado.ultima = null; if (estado.actual) estado.items.unshift(estado.actual); estado.actual = it; estado.pend[it.nivel] = (estado.pend[it.nivel] || 0) + 1; estado.rev[it.nivel] = Math.max(0, (estado.rev[it.nivel] || 0) - 1);
        soltar(); var rr = await cli.storage.from("capturas").download(it.nombre).catch(function () { return { error: true }; }); if (rr && rr.data) { estado.blob = rr.data; estado.url = URL.createObjectURL(rr.data); } }
      pintarRev();
    }
    function hoja(titulo, hijos, onGuardar, textoGuardar) {
      var viejo = document.getElementById("hoja-rev"); if (viejo) viejo.remove();
      function cerrar() { h.remove(); }
      var h = el("div", { id: "hoja-rev", role: "dialog", "aria-modal": "true", "aria-label": titulo, onkeydown: function (ev) { if (ev.key === "Escape") cerrar(); } }, [el("div", { clase: "velo", onclick: cerrar }),
        el("div", { clase: "panel-hoja" }, [el("div", { clase: "asa", "aria-hidden": "true" }), el("h2", { texto: titulo })].concat(hijos).concat(onGuardar ? [el("button", { id: "rev-guardar", type: "button", clase: "primario", texto: textoGuardar || "Guardar y siguiente", onclick: function () { if (onGuardar()) cerrar(); } })] : []))]);
      document.body.appendChild(h); var f = h.querySelector("input, button.opcion-rev"); if (f) f.focus();
    }
    function hojaValores(it, base) {
      var pop = base || popDeNombre(it.nombre);
      function campo(id, t, u, v) { return el("label", { clase: "campo-v" }, [el("span", { texto: t + " (" + u + ")" }), el("input", { id: id, inputmode: "decimal", autocomplete: "off", value: v === null ? "" : String(v) })]); }
      var nota = el("input", { id: "rev-nota", maxlength: "280", autocomplete: "off" });
      hoja("Valores correctos", [el("div", { clase: "detalle", texto: (base ? "Valores sugeridos por la IA: $" : "Lo que mostró el pop-up: $") + txt(pop.tarifa) + " · " + txt(pop.km) + " km · " + txt(pop.min) + " min" }),
        el("div", { clase: "campos-v" }, [campo("rev-t", "Tarifa", "$", pop.tarifa), campo("rev-k", "Distancia", "km", pop.km), campo("rev-m", "Tiempo", "min", pop.min)]),
        el("label", { clase: "campo-v" }, [el("span", { texto: "Nota (opcional)" }), nota]), el("div", { clase: "aviso-cmp", id: "rev-error", hidden: "" })], function () {
        function n(id) { return parseFloat(document.getElementById(id).value.replace(",", ".")); }
        var t = n("rev-t"), k = n("rev-k"), m = n("rev-m");
        if (!(t > 0 && k > 0 && m > 0)) { var e = document.getElementById("rev-error"); e.textContent = "Escribe tarifa, distancia y tiempo correctos (mayores que cero)."; e.hidden = false; return false; }
        guardar({ resultado: "valores_mal", tarifa: t, km: k, min: m, nota: nota.value }); return true; });
    }
    function hojaFalso(sugerido) {
      hoja("Salió pop-up y no era oferta: ¿qué pasó?", REV_MOTIVOS.map(function (m) {
        return el("button", { type: "button", clase: "opcion-rev" + (sugerido === m[0] ? " sugerida" : ""), onclick: function () { document.getElementById("hoja-rev").remove(); guardar({ resultado: "falso_positivo", motivo: m[0] }); } }, [el("b", { texto: m[1] }), el("small", { texto: m[2] })]); }), null);
    }
    function pintarRev() {
      cuerpo.textContent = "";
      cuerpo.appendChild(el("div", { clase: "rev-colores", role: "group", "aria-label": "Color del pop-up" }, REV_COLORES.map(function (k) {
        return el("button", { type: "button", clase: "rev-color", "aria-pressed": String(revNivel === k[0]), onclick: async function () { revNivel = k[0]; soltar(); estado.items = []; estado.ultima = null; await cargarCola(); await siguiente(); } },
          [(function () { var p = el("i", { "aria-hidden": "true" }); p.style.background = k[2]; return p; })(), el("span", { texto: k[1] }), el("b", { texto: String(estado.pend[k[0]] || 0) })]); })));
      var tot = REV_COLORES.reduce(function (s, k) { return s + (estado.pend[k[0]] || 0) + (estado.rev[k[0]] || 0); }, 0), hechas = REV_COLORES.reduce(function (s, k) { return s + (estado.rev[k[0]] || 0); }, 0);
      var barra = el("i"); barra.style.width = Math.min(100, (estado.rev[revNivel] || 0) / REV_META * 100) + "%";
      cuerpo.appendChild(el("div", { clase: "rev-prog" }, [el("div", { clase: "rev-prog-t" }, [el("span", { texto: "Revisadas de la 10.82" }), el("b", { texto: hechas + " de " + tot })]), el("div", { clase: "pbar" }, [barra]),
        el("div", { clase: "rev-prog-t" }, [el("span", { texto: "Meta: " + REV_META + " por color" }), el("span", { texto: REV_COLORES.filter(function (k) { return k[0] === revNivel; })[0][1] + " " + (estado.rev[revNivel] || 0) + "/" + REV_META })])]));
      var P = estado.prec;
      if (P && P.n > 0) cuerpo.appendChild(el("div", { clase: "rev-ia-prec", id: "rev-ia-prec", texto: "IA (DeepSeek) acertó " + P.aciertos + " de " + P.n + (P.n < (P.minimo || 30) ? " · pocos casos para opinar (menos de " + (P.minimo || 30) + ")" : " · " + Math.round(P.aciertos / P.n * 100) + " %") }));
      var it = estado.actual;
      if (!it) { cuerpo.appendChild(el("div", { clase: "vacio", id: "rev-vacio", texto: tot - hechas === 0 ? (hechas ? "Todo al día: revisaste " + hechas + " capturas. Vuelve cuando la app suba más." : "No hay capturas por revisar. Cuando la app suba más, aparecerán aquí.") : "Terminaste las de este color. Quedan " + (tot - hechas) + " en los otros colores: elige otro arriba." })); return; }
      var rotulo = REV_COLORES.filter(function (k) { return k[0] === it.nivel; })[0], pop = popDeNombre(it.nombre);
      var marco = el("div", { clase: "marco-captura" + (estado.url ? "" : " vacio"), id: "marco-captura" });
      if (estado.url) { var img = el("img", { src: estado.url, alt: "Captura de la oferta " + it.id, clase: "captura-img" }); img.addEventListener("click", function () { abrirVisor(estado.url, it.id); }); marco.appendChild(img);
        marco.appendChild(el("button", { type: "button", clase: "marco-ampliar", "aria-label": "Ampliar captura", texto: "⤢", onclick: function () { abrirVisor(estado.url, it.id); } })); }
      else marco.appendChild(el("div", { clase: "marco-centro" }, [el("span", { texto: "La captura ya no está disponible." })]));
      marco.appendChild(el("span", { clase: "marco-hora", texto: hora(it.creado) + " · " + txt(it.app) + (it.version ? " · " + it.version : "") }));
      function tile(nom, val, extra) { return el("div", { clase: "pop-tile " + it.nivel }, [el("div", { clase: "pop-nom", texto: nom }), el("div", { clase: "pop-val", texto: val }), extra ? el("div", { clase: "pop-extra", texto: extra }) : null]); }
      var L = it.local || {}, I = it.ia || {};
      function rec(k, u) { var a1 = L[k], b1 = I[k]; if (a1 === undefined && b1 === undefined) return null; return "recogida · Lector " + (a1 === undefined ? "—" : a1) + " " + u + (b1 === undefined ? "" : " · IA " + b1 + " " + u); }
      cuerpo.appendChild(el("div", { clase: "duo", id: "rev-actual" }, [marco, el("div", { clase: "metr" }, [tile("Pop-up en la oferta", rotulo[1].toUpperCase()), tile("Tarifa leída", pop.tarifa === null ? "—" : "$" + pop.tarifa), tile("Distancia leída", pop.km === null ? "—" : pop.km + " km", rec("recKm", "km")), tile("Tiempo leído", pop.min === null ? "—" : pop.min + " min", rec("recMin", "min"))])]));
      cuerpo.appendChild(el("div", { clase: "detalle rev-nota", id: "rev-nota-ayuda", texto: "Los valores salen de lo que leyó la app, no del recuadro de la captura. Si la captura dice otra cosa (por ejemplo los minutos), la captura manda: usa «Valores mal»." }));
      var off = !esRevisor || estado.ocupado;
      cuerpo.appendChild(el("div", { clase: "rev-botones" }, [
        el("button", { type: "button", id: "rev-correcta", clase: "rb ok", disabled: off ? "" : null, onclick: function () { guardar({ resultado: "correcta" }); } }, [el("big", { texto: "✓" }), "Correcta"]),
        el("button", { type: "button", id: "rev-valores", clase: "rb vm", disabled: off ? "" : null, onclick: function () { hojaValores(it); } }, [el("big", { texto: "✎" }), "Valores mal"]),
        el("button", { type: "button", id: "rev-falso", clase: "rb fp", disabled: off ? "" : null, onclick: function () { hojaFalso(); } }, [el("big", { texto: "✕" }), "No era oferta"])]));
      var S = estado.sug;
      if (!S) cuerpo.appendChild(el("button", { type: "button", id: "rev-ia", clase: "rev-ia-pedir", disabled: estado.pidiendo || !esRevisor ? "" : null, texto: estado.pidiendo ? "Leyendo con la IA…" : "Pedir sugerencia a la IA", onclick: pedirIA }));
      else {
        var cmp = function (nom, ia, pv, tol) { var ok = ia !== null && pv !== null && Math.abs(ia - pv) <= tol; return el("div", { clase: "mt-fila" + (ok ? "" : " x") }, [el("span", { texto: nom }), el("b", { texto: (ia === null ? "—" : ia) + (ok ? " ✓" : " ✕") })]); };
        var vigente = S.estado === "vigente", motivoSug = S.estado === "sin_oferta" ? "no_oferta" : "vencida";
        cuerpo.appendChild(el("div", { clase: "rev-ia-caja", id: "rev-ia-caja" }, [
          el("div", { clase: "pop-nom", texto: "Sugerencia de la IA (" + txt(S.modelo) + ") · confianza " + txt(S.confianza) + (S.ms ? " · tardó " + (S.ms / 1000).toFixed(1) + " s" : "") }),
          el("div", { clase: "rotulo", texto: vigente ? "Oferta vigente" : S.estado === "vencida" ? "Oferta vencida" : S.estado === "aceptada" ? "Ya aceptada o tomada" : "No es una oferta" }),
          vigente ? el("div", {}, [cmp("Tarifa", S.tarifa, pop.tarifa, 0.01), cmp("Distancia", S.km, pop.km, 0.15), cmp("Tiempo", S.min, pop.min, 1)]) : null,
          S.nota ? el("div", { clase: "detalle", texto: S.nota }) : null,
          el("div", { clase: "detalle", texto: vigente ? "✓ coincide con el pop-up; ✕ difiere. Tú decides." : "Si coincide con lo que ves, márcalo como «no era oferta». Tú decides." }),
          el("div", { clase: "rev-ia-acciones" }, [
            vigente && S.tarifa !== null && S.km !== null && S.min !== null ? el("button", { type: "button", id: "rev-ia-usar", texto: "Usar sus valores", disabled: off ? "" : null, onclick: function () { hojaValores(it, { tarifa: S.tarifa, km: S.km, min: S.min }); } }) : null,
            !vigente ? el("button", { type: "button", id: "rev-ia-falso", texto: "Marcar «no era oferta»", disabled: off ? "" : null, onclick: function () { hojaFalso(motivoSug); } }) : null])]));
      }
      cuerpo.appendChild(el("div", { clase: "rev-pie" }, [el("span", { clase: "detalle", texto: esRevisor ? "Un toque en «Correcta» pasa a la siguiente." : "Tu rol es de solo lectura: no puedes revisar." }),
        el("button", { type: "button", id: "rev-deshacer", texto: "↶ Deshacer", disabled: estado.ultima && !estado.ocupado ? null : "", onclick: deshacer })]));
    }
    await cargarPrecision();
    if (await cargarCola()) await siguiente();
  }

  // Cuántas capturas esperan revisión (solo lectura; si falla, simplemente no se muestra).
  async function pendientesRev() {
    try { var r = await cli.rpc("admin_capturas_pendientes", { p_nivel: "rojo", p_limite: 1 }), d = r && r.data; if (!d || d.error) return null;
      var suma = function (o) { return Object.keys(o || {}).reduce(function (t, k) { return t + (Number(o[k]) || 0); }, 0); };
      return { pend: suma(d.pendientes), rev: suma(d.revisadas) }; } catch (x) { return null; }
  }
  // ---------- Revisar › Historial: todas las lecturas del periodo (antes «Ofertas») ----------
  async function historial(c) {
    c.appendChild(el("div", { clase: "chips", role: "group", "aria-label": "Resultado" }, RES_CHIPS.map(function (ch) {
      return el("button", { type: "button", clase: "chip", "aria-pressed": String((F["f-resultado"] || "") === ch[0]), texto: ch[1], onclick: function () { F["f-resultado"] = ch[0]; pag.ofertas = 1; pintar(); } }); })));
    c.appendChild(filtrosBase([opciones("f-resultado", "Resultado", ["", "oferta", "duplicada", "varias", "abstencion", "no_oferta", "descartada", "timeout", "error"], RES_TXT)]));
    skeleton(c);
    var r = rango(), d = await llamar("admin_ofertas", { desde: r.desde, hasta: r.hasta, app: valor("f-app"), version: valor("f-version"),
      resultado: valor("f-resultado"), estado_veredicto: null, pagina: pag.ofertas, por_pagina: 50 });
    var sk = c.querySelector(".skeleton"); if (sk) sk.remove();
    if (!d) return;
    var b = barraResultados(d.filas || [], d.total); if (b) c.appendChild(b);
    c.appendChild(el("h2", { texto: "Lecturas" }));
    var lista = el("div", { clase: "lista" }), lado = el("aside", { id: "lado", clase: "lado", "aria-label": "Detalle de la lectura", hidden: "" });
    c.appendChild(el("div", { clase: "dividido" }, [lista, lado]));
    lista.appendChild(el("div", { clase: "error-lista", id: "eventos" }, (d.filas || []).length ? d.filas.map(tarjetaEvento) : [el("div", { clase: "vacio", texto: "Sin lecturas con estos filtros." })]));
    lista.appendChild(paginas("ofertas", d));
  }

  // ---------- 04 Versiones ----------
  var elegidas = {};
  var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function corto(f) { if (!f) return "—"; var d = new Date(f); return isNaN(d) ? String(f).slice(0, 10) : d.getUTCDate() + " " + MESES[d.getUTCMonth()]; }
  function tasa(x, y) { return y ? x / y : null; }
  function calidadV(v) { return tasa(v.coinciden, v.con_referencia); }
  var FILAS_CMP = [
    ["Calidad humana", function (v) { return calidadV(v); }, function (v) { return v.con_referencia >= 30; }, "mayor", function (v) { return v.con_referencia ? pct(calidadV(v)) : "sin referencia"; }, function (v) { return "n=" + v.con_referencia; }],
    ["Falla al procesar", function (v) { return tasa(v.errores_proceso, v.lecturas); }, function (v) { return v.lecturas >= 30; }, "menor", function (v) { return pct(tasa(v.errores_proceso, v.lecturas)); }, null],
    ["Falla del lector", function (v) { return tasa(v.errores_lector, v.lecturas); }, function (v) { return v.lecturas >= 30; }, "menor", function (v) { return pct(tasa(v.errores_lector, v.lecturas)); }, null],
    ["Tiempo del pop-up (típico, ms)", function (v) { return v.ms_popup_p50; }, null, null, function (v) { return txt(v.ms_popup_p50); }, null],
    ["Casos revisados por una persona", function (v) { return v.con_referencia; }, null, null, function (v) { return txt(v.con_referencia); }, null]];
  // Tabla lado a lado. Solo se resalta la mejor y la peor si todas las versiones tienen muestra suficiente (n ≥ 30).
  function tablaComparar(sel) {
    var cab = [el("div", { clase: "vc-h" })].concat(sel.map(function (v) { return el("div", { clase: "vc-h", texto: v.version }); }));
    var celdas = [];
    FILAS_CMP.forEach(function (f) {
      var vals = sel.map(f[1]), ok = f[2] && sel.every(f[2]) && vals.every(function (x) { return x !== null && x !== undefined; });
      var mejor = null, peor = null;
      if (ok && f[3]) { var mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals); if (mx !== mn) { mejor = f[3] === "mayor" ? mx : mn; peor = f[3] === "mayor" ? mn : mx; } }
      celdas.push(el("div", { clase: "vc-l", texto: f[0] }));
      sel.forEach(function (v, k) {
        var cls = "vc-v" + (mejor !== null && vals[k] === mejor ? " mejor" : mejor !== null && vals[k] === peor ? " peor" : "");
        celdas.push(el("div", { clase: cls }, [f[4](v), f[5] ? el("small", { texto: f[5](v) }) : null]));
      });
    });
    var g = el("div", { clase: "vcomp", role: "table", "aria-label": "Comparar versiones" }, cab.concat(celdas));
    g.style.gridTemplateColumns = "1.2fr " + sel.map(function () { return "1fr"; }).join(" ");
    return g;
  }
  function tarjetaVersion(v, onCambio) {
    var cal = v.con_referencia ? pct(calidadV(v)) : "—", on = !!elegidas[v.version];
    var boton = el("button", { type: "button", clase: "comparar-btn", "aria-pressed": String(on), "aria-label": "Comparar versión " + v.version, "data-version": v.version,
      onclick: function () { elegidas[v.version] = !elegidas[v.version]; onCambio(); } }, [el("span", { texto: "Comparar" }), el("span", { clase: "cb", "aria-hidden": "true", texto: on ? "✓" : "" })]);
    return el("article", { clase: "version-tarjeta" + (on ? " sel" : ""), "data-version": v.version }, [
      el("div", { clase: "version-cab" }, [el("b", { texto: v.version }), el("span", { clase: "detalle", texto: "desde " + corto(v.primera) }), boton]),
      el("div", { clase: "comp3" }, [casilla("Calidad", [cal], false), casilla("Error", [pct(tasa(v.errores_proceso, v.lecturas))], false), casilla("ms", [txt(v.ms_popup_p50)], false)]),
      el("div", { clase: v.con_referencia < 30 ? "aviso-cmp" : "detalle", texto: v.con_referencia < 30 ? "Solo " + v.con_referencia + " casos revisados por una persona: aún sin conclusión." : v.con_referencia + " casos revisados por una persona" }),
      el("div", { clase: "detalle", texto: v.lecturas + " lecturas · " + v.conductores + " conductores · " + v.errores_lector + " errores del lector" })]);
  }
  async function versiones(c) {
    skeleton(c);
    var r = rango(), d = await llamar("admin_versiones", { desde: r.desde, hasta: r.hasta });
    var sk = c.querySelector(".skeleton"); if (sk) sk.remove();
    if (!d) return;
    var vs = (d.versiones || []).slice().sort(function (x, y) { return String(y.primera || "").localeCompare(String(x.primera || "")); });
    if (!vs.length) { c.appendChild(el("div", { clase: "vacio", texto: "Sin versiones en este periodo." })); return; }
    var panel = el("section", { id: "comparacion", clase: "panel-cmp", "aria-live": "polite" });
    var lista = el("div", { clase: "error-lista", id: "versiones-lista" });
    function pintarTodo() {
      var sel = vs.filter(function (v) { return elegidas[v.version]; }), manual = sel.length >= 2;
      var usar = manual ? sel.slice(0, 3) : vs.slice(0, 2);
      panel.textContent = "";
      if (usar.length < 2) { panel.appendChild(el("div", { clase: "vacio", texto: "Hace falta más de una versión para poder comparar." })); }
      else {
        panel.appendChild(el("div", { clase: "h-fila" }, [el("h2", { texto: manual ? "Comparando " + usar.length + " versiones" : "La nueva contra la anterior" }),
          manual ? el("button", { type: "button", id: "quitar-cmp", texto: "Quitar", onclick: function () { elegidas = {}; pintarTodo(); } }) : el("span", { clase: "detalle", texto: usar[0].version + " · " + usar[1].version })]));
        panel.appendChild(tablaComparar(usar));
        var cortas = usar.filter(function (v) { return v.con_referencia < 30; });
        panel.appendChild(el("div", { id: "aviso-comparacion", clase: cortas.length ? "aviso-cmp" : "detalle",
          texto: cortas.length ? cortas.map(function (v) { return "La " + v.version + " tiene solo " + v.con_referencia + " casos revisados por una persona (< 30): no se puede declarar mejora ni regresión."; }).join(" ")
            : "Todas las versiones tienen 30 casos o más revisados por una persona. Aun así, los casos no son los mismos en cada versión: confirma la cobertura antes de concluir." }));
        if (manual && sel.length > 3) panel.appendChild(el("div", { clase: "detalle", texto: "Se comparan las 3 primeras versiones marcadas." }));
      }
      lista.textContent = "";
      vs.forEach(function (v) { lista.appendChild(tarjetaVersion(v, pintarTodo)); });
    }
    pintarTodo();
    c.appendChild(el("div", { clase: "ver-layout" }, [el("div", {}, [el("div", { clase: "h-fila" }, [el("h2", { texto: "Todas las versiones" }), el("span", { clase: "detalle", texto: String(vs.length) })]), lista]), panel]));
    if (d.nota_comparacion) c.appendChild(el("div", { clase: "detalle", texto: d.nota_comparacion }));
  }

  // ---------- 05 Conductores y dispositivos ----------
  var tabEq = "conductores", ordenEq = "errores";
  function haceCuanto(f) {
    if (!f) return ["sin actividad", "nd"];
    var d = new Date(f); if (isNaN(d)) return [String(f).slice(0, 16), "nd"];
    var dias = Math.floor((Date.now() - d.getTime()) / 864e5), hh = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    return [dias < 1 ? "hoy " + hh : dias === 1 ? "ayer " + hh : "hace " + dias + " días", dias >= 3 ? "aviso" : "ok", dias];
  }
  function ordenarEq(arr, tasaFn, sufFn) {
    var c = arr.slice();
    if (ordenEq === "lecturas") c.sort(function (x, y) { return y.lecturas - x.lecturas; });
    else if (ordenEq === "inactivos") c.sort(function (x, y) { return String(x.ultima || "").localeCompare(String(y.ultima || "")); });
    else c.sort(function (x, y) { var sx = sufFn(x) ? 1 : 0, sy = sufFn(y) ? 1 : 0; if (sx !== sy) return sy - sx; return (tasaFn(y) || 0) - (tasaFn(x) || 0); });
    return c;
  }
  function tarjetaEq(titulo, sub, x, casillas, aviso) {
    var act = haceCuanto(x.ultima);
    return el("article", { clase: "equipo-tarjeta" }, [
      el("div", { clase: "version-cab" }, [el("b", { texto: titulo }), sub ? el("span", { clase: "detalle", texto: sub }) : null,
        el("span", { clase: "actividad detalle" }, [el("span", { clase: "punto " + (act[1] === "aviso" ? "aviso" : act[1] === "nd" ? "nd" : "ok"), "aria-hidden": "true" }), act[0]])]),
      el("div", { clase: "comp3" }, casillas),
      aviso ? el("div", { clase: "aviso-cmp", texto: aviso }) : null,
      el("div", { clase: "fila etiquetas" }, (x.versiones || []).map(function (v) { return el("span", { clase: "chipv", texto: String(v) }); }))]);
  }
  async function dispositivos(c) {
    skeleton(c);
    var r = rango(), d = await llamar("admin_dispositivos", { desde: r.desde, hasta: r.hasta });
    var sk = c.querySelector(".skeleton"); if (sk) sk.remove();
    if (!d) return;
    var q = buscarEq.trim().toLowerCase();
    function coincide(x) { return !q || [x.conductor, x.telefono, x.android].some(function (v) { return v !== null && v !== undefined && String(v).toLowerCase().indexOf(q) >= 0; }); }
    var disp = (d.dispositivos || []).filter(coincide), cond = (d.conductores || []).filter(coincide);
    if (q) {
      c.appendChild(el("div", { clase: "fila filtro-busqueda", id: "filtro-busqueda" }, [el("span", { texto: "Buscando «" + buscarEq.trim() + "»: " + cond.length + " conductores y " + disp.length + " dispositivos" }),
        el("button", { type: "button", texto: "Quitar", onclick: function () { buscarEq = ""; pintar(); } })]));
      if (!cond.length && disp.length) tabEq = "dispositivos"; else if (cond.length) tabEq = "conductores";
    }
    function suf(x) { return x.muestra_suficiente === undefined ? x.lecturas >= 30 : !!x.muestra_suficiente; }
    function tD(x) { return x.lecturas ? x.errores / x.lecturas : null; }
    function tC(x) { return x.lecturas ? x.errores / x.lecturas : null; }
    function sufC(x) { return x.lecturas >= 30; }
    var cuerpo = el("div", { clase: "equipos-cuerpo" });
    function pintarEq() {
      cuerpo.textContent = "";
      var tabs = el("div", { clase: "tabs2", role: "group", "aria-label": "Equipos" }, [["conductores", "Conductores " + cond.length], ["dispositivos", "Dispositivos " + disp.length]].map(function (t) {
        return el("button", { type: "button", id: "tab-" + t[0], "aria-pressed": String(tabEq === t[0]), texto: t[1], onclick: function () { tabEq = t[0]; pintarEq(); } }); }));
      cuerpo.appendChild(tabs);
      cuerpo.appendChild(el("div", { clase: "chips", role: "group", "aria-label": "Orden" }, [["errores", "Más errores"], ["lecturas", "Más lecturas"], ["inactivos", "Sin actividad"]].map(function (o) {
        return el("button", { type: "button", clase: "chip", "aria-pressed": String(ordenEq === o[0]), texto: o[1], onclick: function () { ordenEq = o[0]; pintarEq(); } }); })));
      // Dispositivos
      var pd = el("section", { clase: "panel-eq" + (tabEq === "dispositivos" ? " activo" : ""), id: "panel-dispositivos", "aria-label": "Dispositivos" });
      pd.appendChild(el("h2", { texto: "Dispositivos" }));
      var ss = disp.filter(suf), maxD = ss.length ? Math.max.apply(null, ss.map(function (x) { return tD(x) || 0; })) : 0;
      var vig = ss.filter(function (x) { return (tD(x) || 0) === maxD && maxD > 0; })[0];
      if (vig) {
        var resto = ss.filter(function (x) { return x !== vig; }), lr = resto.reduce(function (s, x) { return s + x.lecturas; }, 0), er = resto.reduce(function (s, x) { return s + x.errores; }, 0);
        var base = lr ? er / lr : null, veces = base ? tD(vig) / base : null;
        if (veces === null || veces >= 1.5) pd.appendChild(el("div", { clase: "aviso-cmp", id: "vigilar", texto: vig.telefono + " (Android " + txt(vig.android) + ") tiene " + pct(tD(vig)) + " de errores con " + vig.lecturas + " lecturas" + (veces ? ", " + veces.toFixed(1).replace(".0", "") + " veces el resto." : ".") }));
      }
      pd.appendChild(el("div", { clase: "equipo-lista" }, ordenarEq(disp, tD, suf).map(function (x) {
        var hot = suf(x) && tD(x) === maxD && maxD > 0;
        return tarjetaEq(txt(x.telefono), "Android " + txt(x.android), x, [casilla("Lecturas", [String(x.lecturas)], false), casilla("Errores", [x.lecturas ? pct(tD(x)) : "—"], hot),
          casilla("Abstenciones", [x.lecturas ? pct(x.abstenciones / x.lecturas) : "—"], false)], suf(x) ? null : "Pocos casos para opinar (menos de 30 lecturas)."); })));
      if (!disp.length) pd.appendChild(el("div", { clase: "vacio", texto: "Sin dispositivos en este periodo." }));
      cuerpo.appendChild(pd);
      // Conductores
      var pc = el("section", { clase: "panel-eq" + (tabEq === "conductores" ? " activo" : ""), id: "panel-conductores", "aria-label": "Conductores" });
      pc.appendChild(el("div", { clase: "h-fila" }, [el("h2", { texto: "Conductores" }), el("span", { clase: "detalle", texto: "códigos anónimos, sin datos personales" })]));
      var sc = cond.filter(sufC), maxC = sc.length ? Math.max.apply(null, sc.map(function (x) { return tC(x) || 0; })) : 0;
      pc.appendChild(el("div", { clase: "equipo-lista" }, ordenarEq(cond, tC, sufC).map(function (x) {
        var hot = sufC(x) && tC(x) === maxC && maxC > 0;
        return tarjetaEq(txt(x.conductor), null, x, [casilla("Lecturas", [String(x.lecturas)], false), casilla("Error proceso", [x.lecturas ? pct(tC(x)) : "—"], hot),
          casilla("Error lector", [x.lecturas ? pct(x.errores_lector / x.lecturas) : "—"], false)], sufC(x) ? null : "Pocos casos para opinar (menos de 30 lecturas)."); })));
      if (!cond.length) pc.appendChild(el("div", { clase: "vacio", texto: "Sin conductores en este periodo." }));
      cuerpo.appendChild(pc);
    }
    pintarEq();
    c.appendChild(cuerpo);
    c.appendChild(el("div", { clase: "detalle", texto: d.nota }));
  }

  // ---------- 06 Auditoría IA ----------
  function legible(k) { var s = String(k).replace(/_/g, " "); return s.charAt(0).toUpperCase() + s.slice(1); }
  function barraFila(nombre, n, max, color, gris) {
    var tr = el("div", { clase: "tr" }), i = el("i", { clase: gris ? "gr" : "" });
    i.style.width = (max ? Math.max(3, n / max * 100) : 0) + "%"; if (color) i.style.background = color; tr.appendChild(i);
    return [tr, i];
  }
  function listaBarras(obj, vacio, colorDe) {
    var ks = Object.keys(obj || {}).sort(function (x, y) { return obj[y] - obj[x]; });
    if (!ks.length) return el("div", { clase: "vacio", texto: vacio });
    var max = obj[ks[0]];
    return el("div", { clase: "lista-barras" }, ks.map(function (k) {
      var b = barraFila(k, obj[k], max, colorDe ? colorDe(k) : null, false);
      return el("div", { clase: "fila-barra" }, [el("span", { texto: legible(k) }), b[0], el("b", { clase: "n", texto: String(obj[k]) })]); }));
  }
  async function ia(c) {
    skeleton(c);
    var r = rango(), d = await llamar("admin_ia", { desde: r.desde, hasta: r.hasta });
    var sk = c.querySelector(".skeleton"); if (sk) sk.remove();
    if (!d) return;
    var cols = el("div", { clase: "ia-cols" });
    var izq = el("div", { clase: "ia-col" }), der = el("div", { clase: "ia-col" });
    izq.appendChild(el("div", { clase: "tarjetas dos", id: "ia-casos" }, [["Casos revisados", d.casos], ["Revisadas por una persona", d.con_referencia_humana]].map(function (x) {
      return el("div", { clase: "tarjeta" }, [el("div", { clase: "detalle", texto: x[0] }), el("div", { clase: "valor", texto: txt(x[1]) })]); })));
    // 1 · Quién acierta contra el humano (sin ganador si falta muestra)
    var comps = d.componentes || [], cortas = comps.filter(function (x) { return x.n < 30; });
    izq.appendChild(el("h2", { texto: "Quién acierta contra el humano" }));
    if (!comps.length) izq.appendChild(el("div", { clase: "vacio", texto: "Sin referencia humana todavía." }));
    else {
      if (cortas.length) izq.appendChild(el("div", { clase: "aviso-cmp", id: "aviso-muestra", texto: "Con " + Math.min.apply(null, comps.map(function (x) { return x.n; })) + " casos revisados por una persona (menos de 30) todavía no se puede decir quién acierta más." }));
      izq.appendChild(el("div", { clase: "quien", id: "ia-componentes" }, comps.map(function (x) {
        var p = x.n ? x.coinciden / x.n : null, b = barraFila(x.componente, p === null ? 0 : p * 100, 100, null, x.n < 30);
        return el("div", { clase: "fila-quien" }, [el("b", { texto: legible(x.componente) + (x.modelo ? " (" + x.modelo + ")" : "") }), b[0],
          el("div", { clase: "valor-q" }, [p === null ? "sin referencia" : pct(p), el("small", { texto: x.coinciden + " / " + x.n })])]); })));
      if (cortas.length) izq.appendChild(el("div", { clase: "detalle", texto: "Gris: aún son pocos casos para opinar. Con 30 casos o más las barras pasan a negro." }));
    }
    // 2 · Acuerdo IA/lector (no es exactitud)
    var ac = d.acuerdo_ia_lector || {};
    izq.appendChild(el("div", { clase: "tarjeta", id: "ia-acuerdo" }, [el("div", { clase: "detalle", texto: "Acuerdo IA con el lector" }),
      el("div", { clase: "valor", texto: ac.n ? ac.coinciden + " / " + ac.n + " = " + pct(ac.coinciden / ac.n) : "sin datos" }), el("span", { clase: "etiqueta aviso", texto: "no es exactitud" })]));
    // 3 · Discrepancias y fallas
    var totD = Object.keys(d.discrepancias || {}).reduce(function (s, k) { return s + d.discrepancias[k]; }, 0);
    var totF = Object.keys(d.fallas || {}).reduce(function (s, k) { return s + d.fallas[k]; }, 0);
    der.appendChild(el("div", { clase: "h-fila" }, [el("h2", { texto: "Discrepancias" }), el("span", { clase: "detalle", texto: totD + " casos" })]));
    der.appendChild(listaBarras(d.discrepancias, "Sin discrepancias en el periodo."));
    der.appendChild(el("div", { clase: "h-fila" }, [el("h2", { texto: "Fallas de la IA" }), el("span", { clase: "detalle", texto: totF + (totF === 1 ? " vez" : " veces") })]));
    var esSaldo = function (k) { return /402|saldo|credit/i.test(k); };
    der.appendChild(listaBarras(d.fallas, "Sin fallas registradas en el periodo.", function (k) { return esSaldo(k) ? "var(--rojo)" : "var(--amarillo)"; }));
    var saldo = Object.keys(d.fallas || {}).filter(esSaldo).reduce(function (s, k) { return s + d.fallas[k]; }, 0);
    if (saldo) der.appendChild(el("div", { clase: "aviso-cmp", id: "aviso-saldo", texto: "La IA dejó de revisar " + saldo + (saldo === 1 ? " vez" : " veces") + " por falta de saldo. Recárgalo para que siga revisando." }));
    der.appendChild(el("a", { href: "#errores", clase: "boton-enlace", texto: "Revisar estos casos", onclick: function (ev) { ev.preventDefault(); ir("errores"); } }));
    cols.appendChild(izq); cols.appendChild(der); c.appendChild(cols);
    c.appendChild(el("div", { clase: "detalle", texto: d.nota }));
  }

  // ---------- 07 Configuración ----------
  function bytesLeg(n) { if (n === null || n === undefined) return "—"; n = Number(n); return n >= 1073741824 ? (n / 1073741824).toFixed(1) + " GB" : n >= 1048576 ? Math.round(n / 1048576) + " MB" : n >= 1024 ? Math.round(n / 1024) + " KB" : n + " B"; }
  function acordeon(id, titulo, sub, cifra, hijos, abierto) {
    var d = el("details", { clase: "acc", id: id }, [el("summary", {}, [el("span", { clase: "acc-t" }, [el("b", { texto: titulo }), el("small", { texto: sub })]), el("span", { clase: "acc-cifra", texto: cifra })])].concat([el("div", { clase: "acc-cuerpo" }, hijos)]));
    if (abierto) d.open = true; return d;
  }
  function filaKV(t, v, tono) { return el("div", { clase: "kv-fila" }, [el("span", { texto: t }), el("b", { clase: tono || "", texto: txt(v) })]); }
  // Confirmación de una acción con efecto en los teléfonos: dice qué va a pasar y pide una decisión clara.
  function hojaConfirmar(titulo, texto, textoSi, onSi) {
    var viejo = document.getElementById("hoja-conf"); if (viejo) viejo.remove();
    function cerrar() { h.remove(); }
    var si = el("button", { type: "button", id: "conf-si", clase: "primario", texto: textoSi, onclick: async function () { si.disabled = true; si.textContent = "Guardando…"; var ok = await onSi(); if (ok) cerrar(); else { si.disabled = false; si.textContent = textoSi; } } });
    var h = el("div", { id: "hoja-conf", role: "dialog", "aria-modal": "true", "aria-label": titulo, onkeydown: function (ev) { if (ev.key === "Escape") cerrar(); } }, [
      el("div", { clase: "velo", onclick: cerrar }),
      el("div", { clase: "panel-hoja" }, [el("div", { clase: "asa", "aria-hidden": "true" }), el("h2", { texto: titulo }), el("p", { texto: texto }), si,
        el("button", { type: "button", id: "conf-no", texto: "Cancelar", onclick: cerrar })])]);
    document.body.appendChild(h); h.querySelector("#conf-no").focus();
  }
  // Supuestos de la cuenta «cuánto te queda»: se pueden cambiar y se recuerdan en este navegador.
  function supuestos() {
    var sp = { ingreso: 99, cambio: 18.5 };
    try { var g = JSON.parse(localStorage.getItem("checa-supuestos") || "null"); if (g && g.ingreso > 0 && g.cambio > 0) sp = { ingreso: Number(g.ingreso), cambio: Number(g.cambio) }; } catch (x) { /* sin almacenamiento */ }
    return sp;
  }
  function editorSupuestos(ingreso, cambio) {
    var inI = el("input", { id: "sp-ingreso", inputmode: "decimal", autocomplete: "off", value: String(ingreso) }), inC = el("input", { id: "sp-cambio", inputmode: "decimal", autocomplete: "off", value: String(cambio) });
    var err = el("div", { clase: "aviso-cmp", hidden: "" });
    return el("details", { clase: "sub", id: "sp-editor" }, [el("summary", { texto: "Cambiar la cuenta" }), el("div", { clase: "campos-v" }, [
      el("label", { clase: "campo-v" }, [el("span", { texto: "Te queda por usuario ($ al mes)" }), inI]), el("label", { clase: "campo-v" }, [el("span", { texto: "Pesos por dólar" }), inC])]), err,
      el("button", { type: "button", id: "sp-guardar", texto: "Guardar", onclick: function () {
        var i = parseFloat(inI.value.replace(",", ".")), k = parseFloat(inC.value.replace(",", "."));
        if (!(i > 0 && k > 0)) { err.textContent = "Escribe números mayores que cero."; err.hidden = false; return; }
        try { localStorage.setItem("checa-supuestos", JSON.stringify({ ingreso: i, cambio: k })); } catch (x) { err.textContent = "Este navegador no deja guardar el cambio."; err.hidden = false; return; }
        pintar(); } }),
      el("div", { clase: "detalle", texto: "Se guarda solo en este navegador." })]);
  }
  async function config(c) {
    skeleton(c);
    var r = rango(), g = await llamar("admin_config"), k = await llamar("admin_costos", { desde: r.desde, hasta: r.hasta }), cu = await llamar("admin_costo_usuarios", { desde: r.desde, hasta: r.hasta }), b = await llamar("admin_bitacora", { pagina: 1 });
    var sk = c.querySelector(".skeleton"); if (sk) sk.remove();
    var ie = null; try { var rr = await cli.rpc("admin_ia_estado"); ie = rr && rr.data && !rr.data.error ? rr.data : null; } catch (x) { ie = null; }
    var ancho = !!(window.matchMedia && matchMedia("(min-width:761px)").matches);
    var cont = el("div", { clase: "config-cols" }), izq = el("div", { clase: "config-col" }), der = el("div", { clase: "config-col" });
    izq.appendChild(el("h2", { texto: "IA y dinero" })); der.appendChild(el("h2", { texto: "Avisos y accesos" }));
    // 0 · IA con imagen: interruptores remotos y cuánto tarda en contestar
    if (ie) {
      var seg = function (ms) { return ms === null || ms === undefined ? "—" : (ms / 1000).toFixed(1) + " s"; };
      var esRev = !!(yo && yo.rol === "revisor");
      var interruptor = function (que, titulo, detalle, activo) {
        var consecuencia = que === "vision"
          ? (activo ? "Los teléfonos dejarán de pedirle a la IA que mire la imagen de la oferta y seguirán solo con su lector. Tarda unos 30 segundos en llegar a todos." : "Los teléfonos volverán a pedirle a la IA que mire la imagen de la oferta. Cada consulta tiene costo. Tarda unos 30 segundos en llegar a todos.")
          : (activo ? "Los teléfonos sin imagen usarán solo su lector. Tarda unos 30 segundos en llegar a todos." : "Los teléfonos sin imagen volverán a consultar a la IA de texto. Cada consulta tiene costo. Tarda unos 30 segundos en llegar a todos.");
        var btn = el("button", { type: "button", id: "ia-sw-" + que, clase: "ia-sw", "aria-pressed": String(activo), disabled: esRev ? null : "", texto: activo ? "Encendida · Apagar" : "Apagada · Encender", onclick: function () {
          hojaConfirmar((activo ? "¿Apagar " : "¿Encender ") + (que === "vision" ? "la IA con imagen" : "la IA de texto") + "?", consecuencia, activo ? "Sí, apagar" : "Sí, encender", async function () {
            var r = await llamar("admin_ia_interruptor", { p_que: que, p_activo: !activo }); if (r && r.ok) { pintar(); return true; } return false; }); } });
        return el("div", { clase: "ia-fila" }, [el("div", {}, [el("b", { texto: titulo }), el("div", { clase: "detalle", texto: detalle }), esRev ? null : el("div", { clase: "detalle", texto: "Solo un revisor puede cambiarlo. Tu rol es de solo lectura." })]), btn]);
      };
      var modo = function (m, nombre) {
        var d = (ie.modos || {})[m];
        if (!d) return el("div", { clase: "detalle", texto: nombre + ": sin consultas en los últimos 7 días." });
        return el("div", { clase: "ia-modo" }, [el("b", { texto: nombre + " · " + d.n + " consultas (7 días)" }),
          filaKV("Tarda en contestar (típico · los más lentos)", seg(d.ms_ia_p50) + " · " + seg(d.ms_ia_p90)),
          filaKV("Tiempo total vista desde el teléfono (típico · los más lentos)", seg(d.ms_total_p50) + " · " + seg(d.ms_total_p90)),
          filaKV("Con error · sin saldo", d.errores + " · " + d.sin_saldo), filaKV("Costo", "$" + Number(d.costo_usd || 0).toFixed(4) + " USD")]);
      };
      izq.appendChild(acordeon("cfg-ia", "IA con imagen", "encender, apagar y tiempos", ie.vision ? "ON" : "OFF", [
        interruptor("vision", "La IA ve la imagen de la oferta", "Si se apaga, el teléfono sigue solo con su lector.", !!ie.vision),
        interruptor("texto", "IA de texto (la de antes)", "Se usa en teléfonos sin imagen. Apagada, esos teléfonos usan solo su lector.", !!ie.texto),
        modo("vision", "Con imagen"), modo("texto", "De texto"),
        el("div", { clase: "detalle", texto: "Los cambios tardan hasta 30 segundos en llegar a los teléfonos. Último cambio: " + (ie.actualizado ? fechaHora(ie.actualizado) : "—") + (ie.por ? " por " + ie.por : "") + "." })], true));
    }
    // 1 · Costo de la IA
    if (k) {
      var total = (k.por_modelo || []).reduce(function (s, x) { return s + Number(x.usd || 0); }, 0), tok = function (n) { return n === null || n === undefined ? "—" : n >= 1e6 ? (n / 1e6).toFixed(1) + " M" : String(n); };
      var ti = (k.por_modelo || []).reduce(function (s, x) { return s + Number(x.tokens_entrada || 0); }, 0), ts = (k.por_modelo || []).reduce(function (s, x) { return s + Number(x.tokens_salida || 0); }, 0);
      izq.appendChild(acordeon("cfg-costos", "Costo de la IA", "periodo elegido", (k.por_modelo || []).length ? "$" + total.toFixed(2) : "—", [
        (k.por_modelo || []).length ? el("div", {}, (k.por_modelo || []).map(function (x) { return filaKV(x.modelo + " · " + x.consultas + " consultas", "$" + Number(x.usd || 0).toFixed(2)); })) : el("div", { clase: "vacio", texto: "Sin consumo en el periodo." }),
        (k.por_modelo || []).length ? el("div", { clase: "detalle", texto: "Tokens: " + tok(ti) + " entrada · " + tok(ts) + " salida." }) : null,
        el("details", { clase: "sub" }, [el("summary", { texto: "Precio de cada IA" }), el("div", {}, (k.tarifas || []).map(function (x) { return filaKV(x.modelo, "$" + x.usd_mtok_entrada + " entrada · $" + x.usd_mtok_salida + " salida (por M tokens)"); }))]),
        k.nota ? el("div", { clase: "detalle", texto: k.nota }) : null], ancho));
    }
    // 1b · Costo por usuario y lo que te queda de su pago
    if (cu && cu.usuarios) {
      var sp = supuestos(), INGRESO = sp.ingreso, CAMBIO = sp.cambio, us = cu.usuarios, mxn = function (v) { return "$" + Math.round(v) + " MXN"; };
      var gastoMes = function (x) { return Number(x.usd_mes || 0) * CAMBIO; };
      var prom = us.length ? us.reduce(function (t, x) { return t + gastoMes(x); }, 0) / us.length : 0;
      var peor = us.length ? gastoMes(us[0]) : 0;
      izq.appendChild(acordeon("cfg-costo-usuario", "Costo por usuario", "al mes, de cada $" + INGRESO + " que te quedan", us.length ? "Te quedan " + mxn(INGRESO - prom) : "—", [
        us.length ? el("div", {}, [
          filaKV("Gasto de IA de un usuario típico al mes", mxn(prom)),
          filaKV("Te queda de su pago (típico)", mxn(INGRESO - prom), INGRESO - prom < 30 ? "aviso-t" : ""),
          filaKV("Usuario que más gasta · al mes", mxn(peor)),
          filaKV("Te queda de su pago (el que más gasta)", mxn(INGRESO - peor), INGRESO - peor < 30 ? "aviso-t" : "")]) : el("div", { clase: "vacio", texto: "Sin consumo en el periodo." }),
        us.length ? el("details", { clase: "sub" }, [el("summary", { texto: "Ver cada usuario" }), el("div", {}, us.map(function (x) {
          return filaKV(x.usuario + " · " + x.llamadas_dia + " consultas al día · " + x.dias + " días", mxn(gastoMes(x)) + " al mes");
        }))]) : null,
        el("div", { clase: "detalle", texto: "Cuenta de $" + INGRESO + " MXN netos por usuario y $" + CAMBIO + " MXN por dólar. El gasto al mes es el promedio de sus días con uso por 30. Si el periodo es corto, es solo una idea; con 7 días o más es más confiable." }), editorSupuestos(INGRESO, CAMBIO)], ancho));
    }
    if (g) {
      var al = g.almacenamiento || {}, rt = g.retencion || {};
      // 2 · Almacenamiento y retención
      izq.appendChild(el("h2", { texto: "Datos guardados" }));
      izq.appendChild(acordeon("cfg-almacenamiento", "Almacenamiento", "capturas y lecturas", bytesLeg(al.capturas_bytes), [
        filaKV("Capturas guardadas", txt(al.capturas_objetos) + " · " + bytesLeg(al.capturas_bytes)), filaKV("Lecturas guardadas", al.lecturas_filas),
        filaKV("Lecturas vencidas", rt.lecturas_vencidas, rt.lecturas_vencidas > 0 ? "aviso-t" : ""),
        el("div", { clase: "detalle", texto: "Se conservan " + txt(rt.lecturas_dias) + " días las lecturas y " + txt(rt.capturas_dias) + " días las capturas." }), rt.nota ? el("div", { clase: "detalle", texto: rt.nota }) : null], ancho));
      // 3 · Alertas
      var um = g.umbrales_alertas || [];
      der.appendChild(acordeon("cfg-alertas", "Alertas", "avisos y sus límites", String(um.length), [
        um.length ? el("div", {}, um.map(function (x) { return el("div", { clase: "regla" }, [el("div", {}, [el("span", { texto: x.regla }), el("small", { texto: txt(x.umbral) })]), el("span", { clase: "sev " + x.gravedad, texto: GRAVEDAD[x.gravedad] || String(x.gravedad).toUpperCase() })]); })) : el("div", { clase: "vacio", texto: "Sin reglas." }),
        el("div", { clase: "detalle", texto: "Límites que se pueden cambiar: " + (g.umbrales_editables ? "sí" : "no (son fijos; cambiarlos requiere ayuda técnica)") + " · esquema " + g.esquema })], ancho));
      // 4 · Usuarios y permisos
      var ad = g.administradores || [], pm = g.permisos || {};
      der.appendChild(acordeon("cfg-usuarios", "Usuarios y permisos", "tú eres " + txt((g.yo || {}).rol), String(ad.length), [
        el("div", { clase: "fila" }, [el("b", { texto: "Tú: " + txt((g.yo || {}).admin) }), el("span", { clase: "rol", texto: String((g.yo || {}).rol || "").toUpperCase() })]),
        el("div", {}, ad.map(function (x) { return filaKV(x.admin + " · " + x.rol, "desde " + (x.alta || "").slice(0, 10)); })),
        el("div", { clase: "etiquetas fila" }, ["lector", "revisor"].map(function (rl) { return el("span", { clase: "chipv", texto: rl + ": " + (pm[rl] || []).join(", ") }); })),
        el("div", { clase: "detalle", texto: "Para agregar a alguien nuevo se necesita ayuda técnica." })], ancho));
    }
    // 5 · Historial
    if (b) {
      var fs = b.filas || [];
      var fila = function (f) { return el("div", { clase: "regla" }, [el("div", {}, [el("span", { texto: fechaHora(f.creado) + " · " + txt(f.admin) }), el("small", { texto: txt(f.accion) })]), el("span", { clase: "sev nd", texto: txt(f.resultado) + (f.filas !== null && f.filas !== undefined ? " · " + f.filas : "") })]); };
      var resto = fs.slice(10);
      der.appendChild(el("h2", { texto: "Registro" }));
      der.appendChild(acordeon("cfg-historial", "Qué se ha hecho en el Admin", "acciones registradas", String(fs.length), [
        fs.length ? el("div", {}, fs.slice(0, 10).map(fila)) : el("div", { clase: "vacio", texto: "Sin acciones registradas." }),
        resto.length ? el("details", { clase: "sub" }, [el("summary", { texto: "Ver " + resto.length + " más" }), el("div", {}, resto.map(fila))]) : null], false));
    }
    der.appendChild(el("h2", { texto: "Cuenta" }));
    der.appendChild(el("div", { clase: "cuenta", id: "cfg-cuenta" }, [
      filaKV(correo || "Sesión iniciada", yo && yo.rol ? (yo.rol === "revisor" ? "Revisor" : "Solo lectura") : "—"),
      el("div", { clase: "fila" }, [
        el("button", { type: "button", id: "cfg-tema", texto: temaActual() === "dark" ? "Modo claro" : "Modo oscuro", onclick: function () { document.getElementById("tema").click(); this.textContent = temaActual() === "dark" ? "Modo claro" : "Modo oscuro"; } }),
        el("button", { type: "button", id: "cfg-salir", clase: "peligro", texto: "Salir", onclick: function () { document.getElementById("salir").click(); } })])]));
    cont.appendChild(izq); cont.appendChild(der); c.appendChild(cont);
  }

  // Diálogos: con uno abierto, el resto de la página no recibe foco ni toques (inert), Tab se queda dentro
  // y al cerrar el foco vuelve a donde estaba.
  var ultimoFoco = null, devolverFoco = null, modalActivo = false;
  document.addEventListener("focusin", function (ev) { if (!(ev.target.closest && ev.target.closest('[aria-modal="true"]'))) ultimoFoco = ev.target; });
  function fondoInerte(si) { ["raiz", "aviso"].forEach(function (id) { var x = document.getElementById(id); if (x) x.inert = si; }); var h = document.querySelector("header"); if (h) h.inert = si; }
  new MutationObserver(function () {
    var a = document.querySelector('[aria-modal="true"]');
    if (a && !modalActivo) { modalActivo = true; devolverFoco = ultimoFoco; fondoInerte(true); }
    else if (!a && modalActivo) { modalActivo = false; fondoInerte(false); if (devolverFoco && devolverFoco.isConnected && devolverFoco.focus) devolverFoco.focus(); devolverFoco = null; }
  }).observe(document.body, { childList: true });
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Tab") return;
    var m = document.querySelector('[aria-modal="true"]'); if (!m) return;
    var f = Array.prototype.filter.call(m.querySelectorAll("a[href], button, input, select, textarea, summary"), function (x) { return !x.disabled && !x.hidden && x.getClientRects().length > 0; });
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1], act = document.activeElement;
    if (!m.contains(act)) { ev.preventDefault(); a.focus(); }
    else if (ev.shiftKey && act === a) { ev.preventDefault(); z.focus(); }
    else if (!ev.shiftKey && act === z) { ev.preventDefault(); a.focus(); }
  });

  // Cada pestaña es una vista, o un grupo de subvistas.
  var VISTAS = { hoy: inicio, revisar: { errores: errores, capturas: capturas, historial: historial },
                 calidad: { resumen: resumen, versiones: versiones, ia: ia, conductores: dispositivos }, ajustes: config };
  function subActual() {
    if (!SUBS[vista]) return null;
    if (vista === "revisar" && esId(param)) return "errores";
    var ids = SUBS[vista].map(function (x) { return x[0]; });
    return ids.indexOf(param) >= 0 ? param : ids[0];
  }
  function vistaFn() { var v = VISTAS[vista]; return typeof v === "function" ? v : v[subActual()]; }

  // Arriba, para toda la app: el periodo (uno solo) y la búsqueda.
  function herramientas() {
    var h = document.getElementById("herr"); if (!h) return;
    h.textContent = "";
    h.appendChild(selPeriodo(function () { contarUrgentes(); pintar(); }));
    h.appendChild(el("button", { type: "button", id: "btn-buscar", clase: "btn-buscar", "aria-label": "Buscar un caso o un conductor", onclick: abrirBusqueda }, [icono("buscar"), el("span", { clase: "largo", texto: "Buscar" })]));
  }
  function abrirBusqueda() {
    var viejo = document.getElementById("hoja-buscar"); if (viejo) viejo.remove();
    function cerrar() { h.remove(); }
    var entrada = el("input", { id: "q", type: "search", autocomplete: "off", enterkeyhint: "search", placeholder: "Ej. 1432 o C-7F2A", "aria-describedby": "q-ayuda" });
    var err = el("div", { clase: "aviso-cmp", hidden: "" });
    var form = el("form", { clase: "buscar-form" }, [el("label", { clase: "campo-v" }, [el("span", { texto: "Número de caso, código de conductor o teléfono" }), entrada]),
      el("div", { clase: "detalle", id: "q-ayuda", texto: "Un número abre ese error. Un código busca entre conductores y dispositivos del periodo." }), err,
      el("button", { type: "submit", clase: "primario", texto: "Buscar" })]);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = entrada.value.trim().replace(/^#/, "");
      if (!v) { err.textContent = "Escribe un número de caso o un código."; err.hidden = false; return; }
      cerrar();
      if (/^\d+$/.test(v)) ir("revisar", v); else { buscarEq = v; ir("calidad", "conductores"); }
    });
    var h = el("div", { id: "hoja-buscar", role: "dialog", "aria-modal": "true", "aria-label": "Buscar", onkeydown: function (ev) { if (ev.key === "Escape") cerrar(); } }, [
      el("div", { clase: "velo", onclick: cerrar }),
      el("div", { clase: "panel-hoja" }, [el("div", { clase: "asa", "aria-hidden": "true" }), el("h2", { texto: "Buscar" }), form])]);
    document.body.appendChild(h); entrada.focus();
  }

  var ultima = Date.now();
  function barraEstado() {
    return el("div", { clase: "estado-barra" }, [el("span", { id: "est-punto", clase: "punto ok", "aria-hidden": "true" }), el("span", { id: "est-texto", "aria-live": "polite" }),
      el("button", { id: "refrescar", type: "button", texto: "Actualizar", onclick: function () { pintar(); } })]);
  }
  function textoEstado() {
    var t = document.getElementById("est-texto"), p = document.getElementById("est-punto"); if (!t) return;
    var off = navigator.onLine === false, m = Math.floor((Date.now() - ultima) / 60000);
    t.textContent = off ? "Sin conexión. Lo que ves puede no estar al día." : "Actualizado " + (m < 1 ? "hace un momento" : "hace " + m + " min");
    p.className = "punto " + (off ? "mal" : m >= 10 ? "aviso" : "ok");
  }
  setInterval(textoEstado, 30000);
  window.addEventListener("online", function () { textoEstado(); });
  window.addEventListener("offline", textoEstado);

  async function pintar() {
    if (pendienteV && !enDetalle()) await commitirPendiente();
    var claveVista = vista + "/" + (param || ""), yAntes = claveVista === ultimaClave ? window.scrollY : null; ultimaClave = claveVista;
    try { sessionStorage.setItem("checa-vista", JSON.stringify({ F: F, dias: dias, pag: pag })); } catch (x) { /* sin almacenamiento */ }
    var raiz = document.getElementById("raiz");
    raiz.textContent = "";
    herramientas();
    var botones = MODULOS.map(function (m) {
      return el("button", { id: "t-" + m[0], type: "button", "aria-current": m[0] === vista ? "page" : null, "aria-label": m[1], onclick: function () { ir(m[0]); } },
        [icono(m[0]), el("span", { clase: "largo", texto: m[1] }), el("span", { clase: "corto", texto: m[2] }),
         m[0] === "revisar" ? el("span", { id: "insignia-revisar", clase: "insignia-nav", "aria-label": "errores sin veredicto", hidden: urgentes ? null : "", texto: urgentes ? String(urgentes) : "" }) : null]); });
    var nav = el("nav", { id: "menu", "aria-label": "Secciones" }, [el("div", { clase: "pestanas" }, botones)]);
    var marco = el("section", { id: "vista-" + vista, clase: "contenido" });
    raiz.appendChild(nav); raiz.appendChild(marco);
    marco.appendChild(barraEstado());
    // Título de la pestaña y sus subpestañas (no en Hoy ni dentro del detalle de un error).
    if (!enDetalle()) {
      marco.appendChild(el("div", { clase: "titulo-wrap" }, [el("div", { clase: "fecha-hoy", texto: fechaLarga() }), el("h1", { clase: "titulo-tab", texto: MODULOS.filter(function (m) { return m[0] === vista; })[0][1] })]));
      if (SUBS[vista]) {
        var sa = subActual();
        marco.appendChild(el("div", { clase: "subtabs", role: "group", "aria-label": "Secciones de " + vista }, SUBS[vista].map(function (x) {
          return el("button", { type: "button", id: "sub-" + x[0], "aria-pressed": String(x[0] === sa), texto: x[1], onclick: function () { ir(vista, x[0] === SUBS[vista][0][0] ? null : x[0]); } }); })));
      }
    }
    var c = el("div", { clase: "vista-cuerpo", id: "vista-" + vista + "-" + (subActual() || "x") });
    marco.appendChild(c);
    falloCarga = false;
    function fallo(msg) { return el("div", { clase: "vacio fallo", role: "status" }, [el("p", { texto: msg }), el("button", { type: "button", texto: "Reintentar", onclick: function () { pintar(); } })]); }
    try { await vistaFn()(c); } catch (e) { if (window.console) console.error(e); c.textContent = ""; c.appendChild(fallo("Algo salió mal al mostrar esta pantalla.")); falloCarga = false; }
    if (falloCarga && c.isConnected) c.appendChild(fallo("Algunos datos no se pudieron cargar."));
    if (restaurarScroll !== null) { window.scrollTo(0, restaurarScroll); restaurarScroll = null; } else if (yAntes !== null) window.scrollTo(0, yAntes);
    if (!document.querySelector(".estado-barra") && marco.isConnected) marco.insertBefore(barraEstado(), marco.firstChild);
    ultima = Date.now(); textoEstado();
  }

  async function iniciar(cliente) {
    cli = cliente;
    window.Admin.cliente = cliente;
    var s = null;
    try { s = (await cli.auth.getSession()).data.session; } catch (e) { s = null; }
    var btn = document.getElementById("btn-entrar");
    if (!s) {
      if (btn) btn.onclick = function () { cli.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.href.split("#")[0] } }); };
      return;
    }
    try { var gv = JSON.parse(sessionStorage.getItem("checa-vista") || "null"); if (gv && gv.F && typeof gv.F === "object") { F = gv.F; if ([7, 30, 90].indexOf(gv.dias) >= 0) dias = gv.dias; if (gv.pag && gv.pag.errores > 0 && gv.pag.ofertas > 0) pag = gv.pag; } } catch (x) { /* sin almacenamiento */ }
    var h = (location.hash || "").replace(/^#/, "").split("/"), t = traducir(h[0], h[1]);
    if (VISTAS[t[0]]) { vista = t[0]; param = t[1] || null; if (t[0] !== h[0]) { try { history.replaceState(null, "", "#" + vista + (param ? "/" + param : "")); } catch (e) { /* sin historial */ } } }
    correo = (s.user && s.user.email) || ""; document.getElementById("quien").textContent = correo || "Sesión iniciada";
    var salir = document.getElementById("salir");
    salir.hidden = false;
    salir.onclick = async function () { await cli.auth.signOut(); location.reload(); };
    var g = await llamar("admin_config");
    if (g) yo = g.yo;
    var herr = el("div", { id: "herr", clase: "herr" }); document.getElementById("quien").after(herr);
    if (vista !== "hoy") contarUrgentes();   // en Hoy ya se cuenta al pintar
    await pintar();
  }

  // Tema claro/oscuro: sigue al teléfono; el botón lo cambia a mano y lo recuerda (si el navegador lo permite).
  function temaActual() { var t = document.documentElement.getAttribute("data-theme"); return t || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); }
  function aplicarTema(t) { document.documentElement.setAttribute("data-theme", t); var b = document.getElementById("tema"); if (b) b.textContent = t === "dark" ? "Modo claro" : "Modo oscuro"; }
  try { var gt = localStorage.getItem("checa-tema"); if (gt === "dark" || gt === "light") document.documentElement.setAttribute("data-theme", gt); } catch (e) { /* sin almacenamiento */ }

  window.addEventListener("popstate", function () {
    var h = (location.hash || "").replace(/^#/, "").split("/"), t = traducir(h[0], h[1]);
    if (cli && VISTAS[t[0]]) { vista = t[0]; param = t[1] || null; restaurarScroll = enListaErrores() ? scrollErrores : null; pintar(); }
  });
  window.Admin = { iniciar: iniciar, aviso: aviso, pintar: pintar };

  document.addEventListener("DOMContentLoaded", function () {
    var bt = document.getElementById("tema");
    if (bt) { aplicarTema(temaActual()); bt.onclick = function () { var t = temaActual() === "dark" ? "light" : "dark"; aplicarTema(t); try { localStorage.setItem("checa-tema", t); } catch (e) { /* sin almacenamiento */ } }; }
    if (window.CHECA_CLIENTE) { iniciar(window.CHECA_CLIENTE); return; }
    var sc = document.createElement("script");
    // Archivo real del paquete npm con su huella SRI (npm 2.45.4): si el CDN sirviera otra cosa, el navegador no la ejecuta.
    sc.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
    sc.integrity = "sha384-0w2KAL2YHP6wKOkUDzkCDGgVvfmHnj02DHeQ6XcHOgTfFsGyonKOpShMH1x6nk9o";
    sc.crossOrigin = "anonymous";
    sc.onload = function () { iniciar(window.supabase.createClient(window.CHECA_CONFIG.url, window.CHECA_CONFIG.anon)); };
    sc.onerror = function () { aviso("No se pudo cargar la biblioteca de Supabase."); };
    document.head.appendChild(sc);
  });
})();
