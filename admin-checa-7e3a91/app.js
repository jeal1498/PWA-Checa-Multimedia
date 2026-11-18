// Checa Admin: centro de control, salud y calidad (E6/E7). Sin dependencias propias; habla solo con las funciones
// public.admin_* (comprueban el rol en el servidor y registran cada consulta). Todo dato se pinta con textContent
// (nada de innerHTML con datos). No guarda nada en el navegador. Ningún dato inventado: sin datos → gris «sin datos».
(function () {
  "use strict";
  var cli = null, yo = null, vista = "inicio", param = null, pag = { errores: 1, ofertas: 1 }, F = {}, dias = 7;
  var SVG = "http://www.w3.org/2000/svg";
  // [id, nombre completo, nombre corto para la barra inferior del teléfono]
  var MODULOS = [["inicio", "Inicio · Salud", "Salud"], ["errores", "Errores", "Errores"], ["ofertas", "Ofertas", "Ofertas"], ["versiones", "Versiones", "Versiones"],
                 ["dispositivos", "Conductores y dispositivos", "Equipos"], ["ia", "Auditoría IA", "IA"], ["config", "Configuración", "Ajustes"]];
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
  var ICONOS = { inicio: "M3 12h4l3-7 4 14 3-7h4", errores: "M12 3 2 21h20L12 3zM12 10v5M12 18v.01", ofertas: "M4 6h16M4 12h16M4 18h10",
                 versiones: "M7 4v16M17 4v16M3 8l4-4 4 4M13 16l4 4 4-4", dispositivos: "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2",
                 ia: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z", config: "M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M8 14v6" };
  function icono(id) {
    return sv("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "ico", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round" }, [sv("path", { d: ICONOS[id] })]);
  }
  function aviso(t) { var a = document.getElementById("aviso"); a.textContent = t || ""; a.hidden = !t; }
  function txt(v) { return v === null || v === undefined || v === "" ? "—" : String(v); }
  function pct(v) { return v === null || v === undefined ? "—" : (Number(v) * 100).toFixed(1) + " %"; }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function rango() {
    return { desde: (F.desde || iso(new Date(Date.now() - dias * 864e5))) + "T00:00:00Z", hasta: (F.hasta || iso(new Date(Date.now() + 864e5))) + "T00:00:00Z" };
  }
  function esc(s) { return s; }
  function punto(estado) { return el("span", { clase: "punto " + (ESTADO[estado] || "nd"), title: TEXTO[estado] || estado }); }
  function insignia(estado) { return el("span", { clase: "insignia " + (ESTADO[estado] || "nd"), texto: TEXTO[estado] || estado }); }

  async function llamar(fn, args) {
    aviso("");
    var r;
    try { r = await cli.rpc(fn, args || {}); } catch (e) { aviso("Sin conexión con el servidor. Intenta de nuevo."); return null; }
    if (r.error) { aviso("Error del servidor: " + (r.error.message || r.error.code || "desconocido")); return null; }
    var d = r.data;
    if (d && d.error) { aviso(d.error === "no_autorizado" ? "No autorizado: tu cuenta no es administradora." : d.error === "no_existe" ? "No existe ese registro." : "Filtro inválido: " + d.error); return null; }
    return d;
  }
  function ir(v, p) { vista = v; param = p || null; if (location.hash !== "#" + v + (p ? "/" + p : "")) { try { history.pushState(null, "", "#" + v + (p ? "/" + p : "")); } catch (e) { /* sin historial */ } } window.scrollTo(0, 0); pintar(); }
  function enlace(texto, v, p) { return el("a", { href: "#" + v + (p ? "/" + p : ""), clase: "enlace", texto: texto, onclick: function (ev) { ev.preventDefault(); ir(v, p); } }); }

  // ---------- componentes visuales ----------
  function tarjeta(t, extra) {
    var est = t.estado || (t.n !== undefined && t.n !== null && t.n < 30 ? "insuficiente" : null);
    var valor = t.valor === undefined || t.valor === null ? (t.k !== undefined && t.n ? (t.k / t.n) : null) : t.valor;
    var texto = valor === null ? "—" : (t.unidad && t.unidad.indexOf("proporci") === 0 ? pct(valor) : String(valor));
    return el("div", { clase: "tarjeta", "data-clave": t.clave, title: t.definicion || "" }, [
      el("div", { clase: "detalle", texto: t.nombre }),
      el("div", { clase: "valor", texto: texto }),
      el("div", { clase: "detalle", texto: (t.k !== undefined && t.k !== null ? t.k + " / " : "") + (t.n !== undefined && t.n !== null ? "n = " + t.n : "") + (t.unidad && t.unidad.indexOf("proporci") !== 0 ? " · " + t.unidad : "") }),
      est ? el("span", { clase: "etiqueta " + (est === "suficiente" ? "ok" : "aviso"), texto: est === "suficiente" ? "muestra suficiente" : "muestra insuficiente" }) : null,
      t.definicion ? el("div", { clase: "def", texto: t.definicion }) : null].concat(extra || []));
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
    var t0 = sv("text", { x: 2, y: 12, "font-size": "9", fill: "currentColor" }); t0.textContent = String(max) + (unidad || ""); svg.appendChild(t0);
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
    var luces = ["luz-r", "luz-a", "luz-v"].map(function (l) { return el("i", { clase: v[2] === l ? "on " + l : "" }); });
    c.appendChild(barraEstado());
    c.appendChild(el("div", { clase: "encabezado" }, [el("div", { clase: "detalle", texto: "Periodo: " + r.desde.slice(0, 10) + " → " + r.hasta.slice(0, 10) }), selPeriodo(pintar)]));

    // 1 · Veredicto y frase de acción
    var pasos = PASOS.map(function (p) { return pasoEstado(p, d.componentes); });
    var rotos = pasos.filter(function (x) { return x.estado === "fuera_de_servicio" || x.estado === "degradado"; }).length;
    var fraseCadena = rotos ? "Falla " + rotos + (rotos === 1 ? " paso" : " pasos") + " de " + PASOS.length + "." : "Ningún paso de la cadena falla.";
    c.appendChild(el("section", { clase: "hero", id: "estado-general" }, [
      el("div", { clase: "semaforo", "aria-hidden": "true" }, luces),
      el("div", { clase: "hero-texto" }, [el("h1", { texto: v[0] }), el("p", { texto: v[1] }), el("p", { texto: fraseCadena }),
        el("div", { clase: "fila" }, [insignia(d.estado_general), el("span", { clase: "detalle", texto: comprobados + " de " + n + " cosas medidas" })])])]));

    // 2 · Cadena de lectura: un punto por paso; el que falla se abre solo.
    var peor = -1;
    pasos.forEach(function (x, k) { if (GRAVE[x.estado] <= 1 && (peor < 0 || GRAVE[x.estado] < GRAVE[pasos[peor].estado])) peor = k; });
    var sel = peor;
    var cadena = el("section", { clase: "cadena", id: "cadena", "aria-label": "Cadena de lectura" });
    var detalleCadena = el("div", { clase: "paso-detalle", "aria-live": "polite" });
    function pintarCadena() {
      cadena.textContent = "";
      cadena.appendChild(el("div", { clase: "cadena-cab" }, [el("h2", { texto: "Cadena de lectura" }), el("span", { clase: "detalle", texto: rotos ? rotos + (rotos === 1 ? " paso falla" : " pasos fallan") : "sin fallas" })]));
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
        if (x.ultima_comprobacion) detalleCadena.appendChild(el("div", { clase: "detalle", texto: "Última comprobación: " + String(x.ultima_comprobacion).slice(0, 16).replace("T", " ") + " UTC" }));
        if (al) detalleCadena.appendChild(enlace(al.componente === "revision_ia" ? "Abrir Auditoría IA" : al.componente === "revision_humana" ? "Abrir errores" : "Abrir ofertas", al.componente === "revision_ia" ? "ia" : al.componente === "revision_humana" ? "errores" : "ofertas"));
      } else detalleCadena.appendChild(el("div", { clase: "detalle", texto: "Toca un paso para ver qué significa." }));
      cadena.appendChild(detalleCadena);
    }
    pintarCadena();
    c.appendChild(cadena);

    // 3 · Por revisar (máximo 3 a la vista, urgente primero)
    var GR = { alta: 0, media: 1, baja: 2 };
    var atn = d.atencion.slice().sort(function (x, y) { return (GR[x.gravedad] === undefined ? 3 : GR[x.gravedad]) - (GR[y.gravedad] === undefined ? 3 : GR[y.gravedad]); });
    function tarjetaAlerta(a) {
      var aclara = aclaracion(a);
      return el("div", { clase: "alerta " + a.gravedad }, [
        el("div", { clase: "fila" }, [el("span", { clase: "tag " + a.gravedad, texto: GRAVEDAD[a.gravedad] || a.gravedad.toUpperCase() }), el("strong", { texto: a.titulo })]),
        aclara ? el("div", { clase: "aclara", texto: aclara }) : null,
        el("details", {}, [el("summary", { texto: "Detalle técnico" }),
          el("div", { clase: "detalle", texto: a.descripcion + " · componente: " + a.componente }),
          el("div", { clase: "detalle", texto: "Evidencia: " + a.evidencia + " · " + a.estado })]),
        enlace("Abrir", a.componente === "revision_ia" ? "ia" : a.componente === "revision_humana" ? "errores" : "ofertas")]);
    }
    c.appendChild(el("h2", { texto: "Por revisar" + (atn.length ? " (" + atn.length + ")" : "") }));
    c.appendChild(el("div", { id: "alertas", clase: "atencion" }, atn.length ? atn.slice(0, 3).map(tarjetaAlerta).concat(atn.length > 3 ?
      [el("details", { clase: "mas-alertas" }, [el("summary", { texto: "Ver las " + (atn.length - 3) + " restantes" }), el("div", { clase: "atencion" }, atn.slice(3).map(tarjetaAlerta))])] : [])
      : [el("div", { clase: "vacio", texto: "Nada por revisar con los datos de este periodo." })]));

    // 4 · Tres cifras
    var porClave = {}; d.indicadores.forEach(function (i) { porClave[i.clave] = i; });
    var tres = ["lecturas", "tasa_errores", "calidad_interpretacion"].map(function (k) { return porClave[k]; }).filter(Boolean);
    if (tres.length) { c.appendChild(el("h2", { texto: "Lo esencial" })); c.appendChild(el("div", { clase: "tarjetas tres", id: "esencial" }, tres.map(function (i) { return tarjeta(i, []); }))); }

    // 5 · Tendencia
    var h0 = d.historia || [];
    c.appendChild(el("div", { clase: "graficas una", id: "tendencia" }, [grafica("Lecturas y errores por día", [{ nombre: "Lecturas", clase: "a0", puntos: h0.map(function (x) { return { x: x.dia, y: x.lecturas }; }) },
      { nombre: "Errores", clase: "a1", puntos: h0.map(function (x) { return { x: x.dia, y: x.errores }; }) }])]));

    // Todo lo demás, a un toque
    var completo = el("details", { clase: "completo", id: "completo" }, [el("summary", { texto: "Salud completa: componentes, números, procesamiento y gráficas" })]);
    var cuerpo = el("div", { clase: "completo-cuerpo" }); completo.appendChild(cuerpo); c.appendChild(completo); c = cuerpo;
    c.appendChild(el("h2", { texto: "Cada cosa, en una pregunta" }));
    var ordenados = d.componentes.slice().sort(function (a, b) { return (ORDEN[a.estado] === undefined ? 9 : ORDEN[a.estado]) - (ORDEN[b.estado] === undefined ? 9 : ORDEN[b.estado]); });
    c.appendChild(el("div", { clase: "carriles", id: "componentes" }, ordenados.map(function (x) {
      var pq = PREGUNTA[x.clave] || [x.nombre, x.nombre];
      return el("div", { clase: "carril comp " + (ESTADO[x.estado] || "nd"), "data-clave": x.clave }, [
        punto(x.estado),
        el("div", { clase: "carril-texto" }, [
          el("strong", { texto: pq[0] }),
          el("div", { clase: "respuesta", texto: RESPUESTA[x.estado] || TEXTO[x.estado] }),
          el("details", {}, [el("summary", { texto: "¿Qué significa?" }), el("p", { texto: pq[1] }),
            el("div", { clase: "detalle", texto: x.nombre + " · comprobación: " + txt(x.comprobacion) }),
            el("div", { clase: "detalle", texto: "Última comprobación: " + (x.ultima_comprobacion ? String(x.ultima_comprobacion).slice(0, 19).replace("T", " ") : "—") }),
            x.k !== undefined ? el("div", { clase: "detalle", texto: x.k + " / n = " + x.n }) : null,
            x.ms ? el("div", { clase: "detalle", texto: "Tiempo mediano: " + x.ms + " ms" }) : null,
            el("div", { clase: "detalle", texto: "Depende de: " + ((x.depende_de || []).join(", ") || "—") })])]),
        insignia(x.estado)]);
    })));

    c.appendChild(el("h2", { texto: "Los números" }));
    c.appendChild(el("div", { clase: "tarjetas", id: "inicio" }, d.indicadores.map(function (i) {
      return tarjeta(i, [i.clave === "calidad_interpretacion" ? enlace("Ver detalle", "ia") : i.clave === "veredictos_pendientes" ? enlace("Ver errores", "errores") :
        i.clave === "lecturas" || i.clave === "tasa_errores" ? enlace("Ver ofertas", "ofertas") : null]);
    })));
    var p = d.procesamiento;
    c.appendChild(el("h2", { texto: "Qué tan rápido y completo se procesa" }));
    c.appendChild(el("div", { clase: "tarjetas", id: "procesamiento" }, [["Recibidas", p.recibidas], ["Procesadas", p.procesadas], ["Fallidas", p.fallidas],
      ["Pendientes", p.pendientes === null ? "sin dato" : p.pendientes], ["Tiempo mediano (ms)", p.ms_lectura_p50], ["Tiempo p90 (ms)", p.ms_lectura_p90],
      ["Tiempo máximo (ms)", p.ms_lectura_max], ["Reintentos recibidos", p.reintentos]].map(function (x) {
      return el("div", { clase: "tarjeta" }, [el("div", { clase: "detalle", texto: x[0] }), el("div", { clase: "valor", texto: txt(x[1]) })]); })));
    c.appendChild(el("div", { clase: "detalle", texto: p.pendientes_nota }));
    c.appendChild(el("h2", { texto: "Calidad de lo que lee la app" }));
    c.appendChild(el("div", { clase: "tarjetas" }, [["Con respuesta humana", d.calidad.con_referencia], ["Sin confirmar", d.calidad.sin_veredicto], ["Humanos en desacuerdo", d.calidad.conflictos]].map(function (x) {
      return el("div", { clase: "tarjeta" }, [el("div", { clase: "detalle", texto: x[0] }), el("div", { clase: "valor", texto: txt(x[1]) })]); })));
    c.appendChild(el("div", { clase: "detalle", texto: d.calidad.nota }));
    c.appendChild(el("h2", { texto: "Cómo ha ido en los días" }));
    var h = d.historia || [];
    c.appendChild(el("div", { clase: "graficas", id: "graficas" }, [
      grafica("Lecturas y errores por día", [{ nombre: "Lecturas", clase: "a0", puntos: h.map(function (x) { return { x: x.dia, y: x.lecturas }; }) },
                                            { nombre: "Errores", clase: "a1", puntos: h.map(function (x) { return { x: x.dia, y: x.errores }; }) }]),
      grafica("Tiempo mediano de lectura", [{ nombre: "ms", clase: "a2", puntos: h.map(function (x) { return { x: x.dia, y: x.ms_p50 }; }) }], " ms"),
      grafica("Costo de la revisión con IA", [{ nombre: "USD", clase: "a3", puntos: (d.costos_historia || []).map(function (x) { return { x: x.dia, y: Number(x.usd) }; }) }], " USD")]));
  }

  // ---------- 02 Errores ----------
  function filtrosBase(extra) {
    var r = rango();
    var nodo = el("div", { clase: "filtros" }, [
      el("label", {}, ["Desde", el("input", { id: "f-desde", type: "date", value: r.desde.slice(0, 10) })]),
      el("label", {}, ["Hasta", el("input", { id: "f-hasta", type: "date", value: r.hasta.slice(0, 10) })]),
      el("label", {}, ["App", el("select", { id: "f-app" }, [el("option", { value: "", texto: "Todas" }), el("option", { value: "uber", texto: "Uber" }), el("option", { value: "didi", texto: "DiDi" })])]),
      el("label", {}, ["Versión", el("input", { id: "f-version", placeholder: "Ej. 10.81", size: "6", inputmode: "decimal", enterkeyhint: "search", autocomplete: "off" })])].concat(extra || []).concat([
      el("button", { id: "f-aplicar", texto: "Aplicar", onclick: function () {
        ["f-desde", "f-hasta", "f-app", "f-version", "f-tipo", "f-estado", "f-resultado"].forEach(function (id) { var x = document.getElementById(id); if (x) F[id] = x.value; });
        F.desde = F["f-desde"] || null; F.hasta = F["f-hasta"] || null; pag.errores = pag.ofertas = 1; pintar(); } }),
      el("button", { id: "f-limpiar", type: "button", texto: "Limpiar", onclick: function () { F = {}; dias = 7; pag.errores = pag.ofertas = 1; pintar(); } })]));
    ["f-app", "f-version", "f-tipo", "f-estado", "f-resultado"].forEach(function (id) { var x = nodo.querySelector("#" + id); if (x && F[id] !== undefined) x.value = F[id]; });
    var n = Object.keys(F).filter(function (k) { return F[k] && k.indexOf("f-") === 0 && k !== "f-desde" && k !== "f-hasta"; }).length;
    var pleg = el("details", { clase: "filtros-hoja" }, [el("summary", { texto: "Filtros" + (n ? " (" + n + ")" : "") }), nodo]);
    if (!(window.matchMedia && matchMedia("(max-width:760px)").matches)) pleg.open = true;
    return pleg;
  }
  function opciones(id, etiqueta, vals) {
    return el("label", {}, [etiqueta, el("select", { id: id }, vals.map(function (v) { return el("option", { value: v, texto: v || "Todos" }); }))]);
  }
  var VEREDICTOS = ["", "referencia_doble", "referencia_adjudicada", "referencia_humana", "conflicto_humano", "solo_ia", "heredado_no_revisado", "sin_veredicto"];
  function valor(id) { return F[id] ? F[id] : null; }

  // ---------- Errores: tarjetas con la comparación a la vista ----------
  var VER_ET = { solo_ia: ["SOLO IA", "aviso"], conflicto_humano: ["CONFLICTO", "mal"], referencia_doble: ["CON REFERENCIA", "ok"], referencia_adjudicada: ["CON REFERENCIA", "ok"],
                 referencia_humana: ["CON REFERENCIA", "ok"], heredado_no_revisado: ["HEREDADO", "nd"], sin_veredicto: ["SIN VEREDICTO", "nd"] };
  var CHIPS = [["", "Todos"], ["solo_ia", "Solo IA"], ["conflicto_humano", "Conflicto"], ["referencia_humana", "Con referencia"]];
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
    var m = marcas(lec, ia, hu);
    function una(t, l) { return l; }
    return el("article", { clase: "error-tarjeta", "data-id": String(f.id) }, [
      el("div", { clase: "error-cab" }, [el("a", { href: "#errores/" + f.id, clase: "enlace", texto: "#" + f.id, onclick: function (ev) {
          if (!(window.matchMedia && matchMedia("(min-width:1000px) and (orientation:landscape)").matches)) { ev.preventDefault(); ir("errores", String(f.id)); return; }
          ev.preventDefault(); var l = document.getElementById("lado"); if (!l) return; l.textContent = ""; l.hidden = false;
          document.querySelectorAll(".error-tarjeta.sel").forEach(function (x) { x.classList.remove("sel"); }); ev.target.closest(".error-tarjeta").classList.add("sel");
          expediente(l, f.id); l.scrollTop = 0; } }),
        el("span", { clase: "detalle", texto: txt(f.tipo) + " · " + txt(f.app) + " " + txt(f.version) }), el("span", { clase: "detalle fecha", texto: (f.creado || "").slice(0, 16).replace("T", " ") })]),
      comparar3(lec, ia, hu),
      el("div", { clase: "error-pie" }, [etiquetaVeredicto(f.estado_veredicto), el("span", { clase: "detalle", texto: f.tiene_captura ? "con captura" : "sin captura" })])]);
  }
  function pasosSeg(estado) {
    var k = ESTADOS_SEG.indexOf(estado);
    return el("div", { clase: "pasos-seg", role: "img", "aria-label": "Seguimiento: " + String(estado).replace(/_/g, " ") + ", paso " + (k + 1) + " de " + ESTADOS_SEG.length },
      ESTADOS_SEG.map(function (s, i) { return el("i", { clase: i <= k ? "hecho" : "" }); }));
  }
  async function errores(c) {
    if (param) return expediente(c, Number(param));
    c.appendChild(el("div", { clase: "chips", role: "group", "aria-label": "Veredicto" }, CHIPS.map(function (ch) {
      return el("button", { type: "button", clase: "chip", "aria-pressed": String((F["f-estado"] || "") === ch[0]), texto: ch[1], onclick: function () { F["f-estado"] = ch[0]; pag.errores = 1; pintar(); } }); })));
    c.appendChild(filtrosBase([opciones("f-tipo", "Tipo", ["", "diferencia", "rescate", "desacuerdo", "reporte"]), opciones("f-estado", "Veredicto", VEREDICTOS)]));
    skeleton(c);
    var r = rango(), d = await llamar("admin_errores", { desde: r.desde, hasta: r.hasta, app: valor("f-app"), version: valor("f-version"),
      tipo: valor("f-tipo"), estado_veredicto: valor("f-estado"), pagina: pag.errores, por_pagina: 50 });
    var sk = c.querySelector(".skeleton"); if (sk) sk.remove();
    if (!d) return;
    var lista = el("div", { clase: "lista" }), lado = el("aside", { id: "lado", clase: "lado", "aria-label": "Detalle del error", hidden: "" });
    var dividido = el("div", { clase: "dividido" }, [lista, lado]); c.appendChild(dividido); var cpad = c; c = lista;
    c.appendChild(el("div", { clase: "error-lista", id: "errores-lista" }, d.filas.length ? d.filas.map(tarjetaError) : [el("div", { clase: "vacio", texto: "Sin errores con estos filtros." })]));
    c.appendChild(paginas("errores", d));
    c = cpad;
  }
  var ESTADOS_SEG = ["nuevo", "pendiente_de_revision", "en_investigacion", "causa_identificada", "corregido", "verificado", "cerrado"];
  var CAUSAS = ["", "ocr", "interpretacion", "tarjeta_equivocada", "pantalla_cambio", "ia", "dato_ambiguo", "otra"];
  async function expediente(c, id) {
    c.appendChild(el("button", { id: "volver", clase: "volver", "aria-label": "Volver a Errores", texto: "‹ Errores", onclick: function () { ir("errores"); } }));
    var e = await llamar("admin_error", { id: id });
    if (!e) return;
    c.appendChild(el("div", { clase: "exp-cab" }, [el("h1", { id: "exp-titulo", texto: "Error #" + e.id + " · " + e.app + " · " + e.version }), (e.veredicto_humano || {}).estado ? etiquetaVeredicto(e.veredicto_humano.estado) : null]));
    c.appendChild(el("div", { clase: "detalle", texto: "Clasificación: " + e.clasificacion + " · tipo " + e.tipo + " · conductor " + e.conductor + " · " + (e.creado || "").slice(0, 19) }));
    var lec = e.lector || {}, ia = e.ia || {}, hu = e.veredicto_humano || {};
    var refE = hu && hu.clase ? hu : null;
    c.appendChild(el("h2", { texto: "Qué leyó cada quien" }));
    c.appendChild(comparar3(lec, ia, refE));
    var mE = marcas(lec, ia, refE);
    if (!refE && (mE.l || mE.i)) c.appendChild(el("div", { clase: "aviso-cmp", texto: "Lector e IA no coinciden. Falta un veredicto humano para saber cuál acierta." }));
    else if (refE && mE.h) c.appendChild(el("div", { clase: "aviso-cmp", texto: "Ni el lector ni la IA coinciden con la referencia humana." }));
    c.appendChild(el("div", { clase: "detalle", texto: "Veredicto humano: " + txt(hu.estado) + " · heredado: " + txt(e.veredicto_heredado) + " (no es verdad humana)" }));
    c.appendChild(el("h2", { texto: "Evidencia original" }));
    c.appendChild(el("div", { clase: "detalle", id: "evidencia", texto: "Captura: " + (e.evidencia.captura ? "existe" : "no existe") + " (" + e.evidencia.captura_acceso + ") · líneas guardadas: " + e.evidencia.lineas_guardadas + " (no se muestran: traen direcciones)" }));
    var en = e.enlace;
    c.appendChild(el("div", { clase: "detalle", id: "enlace", texto: en
      ? "Enlace: fotograma " + en.fotograma_id + " → lectura " + en.lectura_id + " · captura " + en.captura_vinculo + " · huella sha256 " + txt(en.captura_sha256)
      : "Sin enlace por fotograma (caso anterior a la 10.82 o sin lectura registrada): no se puede comprobar la huella." }));
    c.appendChild(el("h2", { texto: "Relacionados" }));
    c.appendChild(el("div", { clase: "enlaces" }, [enlace("Versión " + e.version + " (" + e.relacionados.misma_version + " errores)", "versiones"), enlace("Conductor " + e.conductor + " (" + e.relacionados.mismo_conductor + ")", "dispositivos"),
      enlace("Auditoría IA", "ia")]));
    c.appendChild(el("h2", { texto: "Seguimiento: " + String(e.estado_seguimiento).replace(/_/g, " ") }));
    c.appendChild(pasosSeg(e.estado_seguimiento));
    c.appendChild(tabla([["Fecha", function (h) { return (h.creado || "").slice(0, 19); }], ["Estado", function (h) { return h.estado; }], ["Causa", function (h) { return h.causa; }],
      ["Nota", function (h) { return h.nota; }], ["Quién", function (h) { return h.admin; }]], e.historial, "Sin cambios registrados todavía."));
    if (yo && yo.rol === "revisor") {
      c.appendChild(el("div", { clase: "filtros barra-accion", id: "seguimiento" }, [opciones("s-estado", "Estado", ESTADOS_SEG.slice(1)), opciones("s-causa", "Causa", CAUSAS),
        el("label", {}, ["Nota", el("input", { id: "s-nota", maxlength: "300", size: "30" })]),
        el("button", { id: "s-guardar", texto: "Registrar", onclick: async function () {
          var r = await llamar("admin_seguimiento", { id: id, estado: document.getElementById("s-estado").value, causa: document.getElementById("s-causa").value || null,
            nota: document.getElementById("s-nota").value || null });
          if (r) pintar(); } })]));
    } else { c.appendChild(el("div", { clase: "detalle", texto: "Tu rol es de solo lectura: no puedes cambiar el seguimiento." })); }

  }

  // ---------- 03 Ofertas ----------
  var RES = { oferta: ["OFERTA", "ok"], no_oferta: ["NO OFERTA", "nd"], descartada: ["DESCARTADA", "nd"], duplicada: ["DUPLICADA", "nd"], varias: ["VARIAS", "aviso"],
              abstencion: ["ABSTENCIÓN", "aviso"], timeout: ["TIMEOUT", "mal"], error: ["ERROR", "mal"] };
  var RES_CHIPS = [["", "Todos"], ["abstencion", "Abstención"], ["error", "Error"], ["duplicada", "Duplicada"]];
  var RES_BARRA = [["Oferta", ["oferta"], "var(--luz-v)"], ["No oferta", ["no_oferta", "descartada"], "var(--gris)"], ["Duplicada", ["duplicada", "varias"], "var(--amarillo)"],
                   ["Abstención", ["abstencion"], "var(--luz-a)"], ["Error o timeout", ["error", "timeout"], "var(--luz-r)"]];
  function etiquetaResultado(r) { var x = RES[r] || [r ? String(r).toUpperCase() : "—", "nd"]; return el("span", { clase: "vb " + x[1], texto: x[0] }); }
  function claseEtapa(s) { s = String(s || "").toLowerCase(); return /err|fall|time|rech|no_/.test(s) ? "x" : /ok|exit|complet|correct|hecho|listo|proces/.test(s) ? "" : "s"; }
  function barraResultados(filas, total) {
    var n = filas.length; if (!n) return null;
    var cuenta = RES_BARRA.map(function (g) { return filas.filter(function (f) { return g[1].indexOf(f.resultado) >= 0; }).length; });
    return el("section", { clase: "barra-res", id: "resultados" }, [
      el("div", { clase: "h-fila" }, [el("h2", { texto: "Qué pasó con las lecturas" }), el("span", { clase: "detalle", texto: total ? total + " en total" : "" })]),
      el("div", { clase: "barra", role: "img", "aria-label": RES_BARRA.map(function (g, k) { return g[0] + " " + Math.round(cuenta[k] / n * 100) + "%"; }).join(", ") },
        RES_BARRA.map(function (g, k) { if (!cuenta[k]) return null; var s = el("i"); s.style.width = (cuenta[k] / n * 100) + "%"; s.style.background = g[2]; return s; })),
      el("div", { clase: "leyenda" }, RES_BARRA.map(function (g, k) { var p = el("i"); p.style.background = g[2]; return el("span", {}, [p, g[0] + " " + Math.round(cuenta[k] / n * 100) + "%"]); })),
      el("div", { clase: "detalle", texto: "Calculado con los " + n + " eventos de esta página." + (total && total > n ? " El total del periodo no está disponible todavía." : "") })]);
  }
  function metricaTarjeta(x) {
    var PROP = ["duplicadas", "abstenciones", "captura_exacta", "con_referencia_humana", "precision_humana", "falsos_positivos_humana", "mezcla_tarjetas_humana", "acuerdo_ia_lector", "banco_heredado"];
    var v = x.valor === null || x.valor === undefined ? "—" : (PROP.indexOf(x.clave) >= 0 ? pct(x.valor) : String(x.valor));
    return el("div", { clase: "tarjeta", "data-clave": x.clave, title: x.formula + " · población: " + x.poblacion + " · fuente: " + x.fuente }, [
      el("div", { clase: "detalle", texto: x.nombre }), el("div", { clase: "valor", texto: v }),
      el("div", { clase: "detalle", texto: (x.k !== null && x.k !== undefined ? x.k + " / " : "") + "n = " + txt(x.n) }),
      el("span", { clase: "etiqueta " + (x.estado === "suficiente" ? "ok" : x.estado === "no_medible" ? "mal" : "aviso"), texto: x.estado.replace("_", " ") }),
      x.motivo ? el("div", { clase: "detalle", texto: x.motivo }) : null]);
  }
  function detalleEvento(f) {
    var ref = f.referencia;
    return el("div", { clase: "evento-detalle" }, [
      el("div", { clase: "etapas-lista" }, (f.etapas || []).map(function (e) { return el("div", { clase: "fila" }, [el("span", { clase: "punto " + (claseEtapa(e.estado) === "x" ? "mal" : claseEtapa(e.estado) === "s" ? "nd" : "ok") }), el("span", { texto: e.etapa + " · " + e.estado })]); })),
      el("div", { clase: "kv" }, [["Lector", f.lector], ["Captura", f.captura_vinculo], ["Veredicto", f.estado_veredicto], ["Referencia humana", ref ? [ref.clase, ref.tarifa, ref.km, ref.min].map(txt).join(" · ") : null], ["Conductor", f.conductor]].reduce(function (acc, p) {
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
        l.appendChild(el("div", { clase: "exp-cab" }, [el("h1", { texto: "Evento · " + (f.ts_evento || "").slice(11, 16) }), etiquetaResultado(f.resultado)])); l.appendChild(detalleEvento(f)); l.scrollTop = 0; return;
      }
      if (cuerpo) { cuerpo.remove(); cuerpo = null; cab.setAttribute("aria-expanded", "false"); art.classList.remove("abierto"); }
      else { cuerpo = detalleEvento(f); art.appendChild(cuerpo); cab.setAttribute("aria-expanded", "true"); art.classList.add("abierto"); } } }, [
      el("div", { clase: "evento-fila" }, [el("b", { texto: (f.ts_evento || "").slice(11, 16) }), etiquetaResultado(f.resultado), el("span", { clase: "detalle der", texto: txt(f.app) + " " + txt(f.version_app) })]),
      el("div", { clase: "evento-valor" }, [punto(f.nivel), el("span", { texto: [f.tarifa, f.km, f.min].every(function (x) { return x === null || x === undefined; }) ? "—" : tkm({ tarifa: f.tarifa, km: f.km, min: f.min }).join(" · ") })]),
      f.motivo ? el("div", { clase: "detalle", texto: f.motivo }) : null,
      el("div", { clase: "mini", "aria-hidden": "true" }, (f.etapas || []).map(function (e) { return el("i", { clase: claseEtapa(e.estado) }); }))]);
    art.appendChild(cab); return art;
  }
  async function ofertas(c) {
    c.appendChild(el("div", { clase: "chips", role: "group", "aria-label": "Resultado" }, RES_CHIPS.map(function (ch) {
      return el("button", { type: "button", clase: "chip", "aria-pressed": String((F["f-resultado"] || "") === ch[0]), texto: ch[1], onclick: function () { F["f-resultado"] = ch[0]; pag.ofertas = 1; pintar(); } }); })));
    c.appendChild(filtrosBase([opciones("f-resultado", "Resultado", ["", "oferta", "duplicada", "varias", "abstencion", "no_oferta", "descartada", "timeout", "error"]), opciones("f-estado", "Veredicto", VEREDICTOS)]));
    skeleton(c);
    var r = rango(), m = await llamar("admin_metricas", { desde: r.desde, hasta: r.hasta, app: valor("f-app"), version: valor("f-version") });
    var d = await llamar("admin_ofertas", { desde: r.desde, hasta: r.hasta, app: valor("f-app"), version: valor("f-version"),
      resultado: valor("f-resultado"), estado_veredicto: valor("f-estado"), pagina: pag.ofertas, por_pagina: 50 });
    var sk = c.querySelector(".skeleton"); if (sk) sk.remove();
    var b = d ? barraResultados(d.filas || [], d.total) : null; if (b) c.appendChild(b);
    if (m) {
      var ms = m.metricas || [];
      var clave = ["precision_humana", "captura_exacta"], destac = clave.map(function (k) { return ms.filter(function (x) { return x.clave === k; })[0]; }).filter(Boolean);
      if (destac.length) { c.appendChild(el("h2", { texto: "Calidad contra humano" })); c.appendChild(el("div", { clase: "tarjetas dos", id: "calidad" }, destac.map(metricaTarjeta))); }
      var grupos = { operacion: "Operación (telemetría)", calidad_humana: "Calidad contra referencia humana", acuerdo_ia: "Acuerdo IA / lector (no es exactitud)", banco_historico: "Banco histórico (etiquetas heredadas)" };
      var mas = el("details", { clase: "mas-metricas", id: "mas-metricas" }, [el("summary", { texto: "Más métricas" })]);
      Object.keys(grupos).forEach(function (g) {
        var gs = ms.filter(function (x) { return x.grupo === g; });
        if (!gs.length) return;
        mas.appendChild(el("h2", { texto: grupos[g] }));
        mas.appendChild(el("div", { clase: "tarjetas" }, gs.map(metricaTarjeta)));
      });
      c.appendChild(mas);
    }
    if (!d) return;
    c.appendChild(el("h2", { texto: "Eventos de lectura" }));
    var lista = el("div", { clase: "lista" }), lado = el("aside", { id: "lado", clase: "lado", "aria-label": "Detalle del evento", hidden: "" });
    c.appendChild(el("div", { clase: "dividido" }, [lista, lado]));
    lista.appendChild(el("div", { clase: "error-lista", id: "eventos" }, (d.filas || []).length ? d.filas.map(tarjetaEvento) : [el("div", { clase: "vacio", texto: "Sin eventos con estos filtros." })]));
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
    ["Error de proceso", function (v) { return tasa(v.errores_proceso, v.lecturas); }, function (v) { return v.lecturas >= 30; }, "menor", function (v) { return pct(tasa(v.errores_proceso, v.lecturas)); }, null],
    ["Error del lector", function (v) { return tasa(v.errores_lector, v.lecturas); }, function (v) { return v.lecturas >= 30; }, "menor", function (v) { return pct(tasa(v.errores_lector, v.lecturas)); }, null],
    ["ms pop-up (mediana)", function (v) { return v.ms_popup_p50; }, null, null, function (v) { return txt(v.ms_popup_p50); }, null],
    ["Casos con referencia", function (v) { return v.con_referencia; }, null, null, function (v) { return txt(v.con_referencia); }, null]];
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
    var g = el("div", { clase: "vcomp", role: "table", "aria-label": "Comparación de versiones" }, cab.concat(celdas));
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
      el("div", { clase: v.con_referencia < 30 ? "aviso-cmp" : "detalle", texto: v.con_referencia < 30 ? "Solo " + v.con_referencia + " casos con referencia: aún sin conclusión." : v.con_referencia + " casos con referencia" }),
      el("div", { clase: "detalle", texto: v.lecturas + " lecturas · " + v.conductores + " conductores · " + v.errores_lector + " errores del lector" })]);
  }
  async function versiones(c) {
    function cabecera() { return el("div", { clase: "encabezado" }, [el("h1", { texto: "Versiones" }), selPeriodo(pintar)]); }
    c.appendChild(cabecera());
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
      if (usar.length < 2) { panel.appendChild(el("div", { clase: "vacio", texto: "Hace falta más de una versión para comparar." })); }
      else {
        panel.appendChild(el("div", { clase: "h-fila" }, [el("h2", { texto: manual ? "Comparando " + usar.length + " versiones" : "Nueva contra anterior" }),
          manual ? el("button", { type: "button", id: "quitar-cmp", texto: "Quitar", onclick: function () { elegidas = {}; pintarTodo(); } }) : el("span", { clase: "detalle", texto: usar[0].version + " · " + usar[1].version })]));
        panel.appendChild(tablaComparar(usar));
        var cortas = usar.filter(function (v) { return v.con_referencia < 30; });
        panel.appendChild(el("div", { id: "aviso-comparacion", clase: cortas.length ? "aviso-cmp" : "detalle",
          texto: cortas.length ? cortas.map(function (v) { return "La " + v.version + " tiene solo " + v.con_referencia + " casos con referencia (< 30): no se puede declarar mejora ni regresión."; }).join(" ")
            : "Todas las versiones tienen n ≥ 30 con referencia. Aun así, los casos no son los mismos en cada versión: confirma la cobertura antes de concluir." }));
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
  var tabEq = "dispositivos", ordenEq = "errores";
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
    c.appendChild(el("div", { clase: "encabezado" }, [el("h1", { texto: "Conductores y dispositivos" }), selPeriodo(pintar)]));
    skeleton(c);
    var r = rango(), d = await llamar("admin_dispositivos", { desde: r.desde, hasta: r.hasta });
    var sk = c.querySelector(".skeleton"); if (sk) sk.remove();
    if (!d) return;
    var disp = d.dispositivos || [], cond = d.conductores || [];
    function suf(x) { return x.muestra_suficiente === undefined ? x.lecturas >= 30 : !!x.muestra_suficiente; }
    function tD(x) { return x.lecturas ? x.errores / x.lecturas : null; }
    function tC(x) { return x.lecturas ? x.errores / x.lecturas : null; }
    function sufC(x) { return x.lecturas >= 30; }
    var cuerpo = el("div", { clase: "equipos-cuerpo" });
    function pintarEq() {
      cuerpo.textContent = "";
      var tabs = el("div", { clase: "tabs2", role: "tablist", "aria-label": "Equipos" }, [["dispositivos", "Dispositivos " + disp.length], ["conductores", "Conductores " + cond.length]].map(function (t) {
        return el("button", { type: "button", role: "tab", id: "tab-" + t[0], "aria-selected": String(tabEq === t[0]), texto: t[1], onclick: function () { tabEq = t[0]; pintarEq(); } }); }));
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
          casilla("Abstenciones", [x.lecturas ? pct(x.abstenciones / x.lecturas) : "—"], false)], suf(x) ? null : "Muestra insuficiente (menos de 30 lecturas)."); })));
      if (!disp.length) pd.appendChild(el("div", { clase: "vacio", texto: "Sin dispositivos en este periodo." }));
      cuerpo.appendChild(pd);
      // Conductores
      var pc = el("section", { clase: "panel-eq" + (tabEq === "conductores" ? " activo" : ""), id: "panel-conductores", "aria-label": "Conductores" });
      pc.appendChild(el("div", { clase: "h-fila" }, [el("h2", { texto: "Conductores" }), el("span", { clase: "detalle", texto: "seudónimos, sin datos personales" })]));
      var sc = cond.filter(sufC), maxC = sc.length ? Math.max.apply(null, sc.map(function (x) { return tC(x) || 0; })) : 0;
      pc.appendChild(el("div", { clase: "equipo-lista" }, ordenarEq(cond, tC, sufC).map(function (x) {
        var hot = sufC(x) && tC(x) === maxC && maxC > 0;
        return tarjetaEq(txt(x.conductor), null, x, [casilla("Lecturas", [String(x.lecturas)], false), casilla("Error proceso", [x.lecturas ? pct(tC(x)) : "—"], hot),
          casilla("Error lector", [x.lecturas ? pct(x.errores_lector / x.lecturas) : "—"], false)], sufC(x) ? null : "Muestra insuficiente (menos de 30 lecturas)."); })));
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
    c.appendChild(el("div", { clase: "encabezado" }, [el("h1", { texto: "Auditoría IA" }), selPeriodo(pintar)]));
    skeleton(c);
    var r = rango(), d = await llamar("admin_ia", { desde: r.desde, hasta: r.hasta });
    var sk = c.querySelector(".skeleton"); if (sk) sk.remove();
    if (!d) return;
    var cols = el("div", { clase: "ia-cols" });
    var izq = el("div", { clase: "ia-col" }), der = el("div", { clase: "ia-col" });
    izq.appendChild(el("div", { clase: "tarjetas dos", id: "ia-casos" }, [["Casos revisados", d.casos], ["Con referencia humana", d.con_referencia_humana]].map(function (x) {
      return el("div", { clase: "tarjeta" }, [el("div", { clase: "detalle", texto: x[0] }), el("div", { clase: "valor", texto: txt(x[1]) })]); })));
    // 1 · Quién acierta contra el humano (sin ganador si falta muestra)
    var comps = d.componentes || [], cortas = comps.filter(function (x) { return x.n < 30; });
    izq.appendChild(el("h2", { texto: "Quién acierta contra el humano" }));
    if (!comps.length) izq.appendChild(el("div", { clase: "vacio", texto: "Sin referencia humana todavía." }));
    else {
      if (cortas.length) izq.appendChild(el("div", { clase: "aviso-cmp", id: "aviso-muestra", texto: "Con " + Math.min.apply(null, comps.map(function (x) { return x.n; })) + " casos con referencia (menos de 30) todavía no se puede decir quién acierta más." }));
      izq.appendChild(el("div", { clase: "quien", id: "ia-componentes" }, comps.map(function (x) {
        var p = x.n ? x.coinciden / x.n : null, b = barraFila(x.componente, p === null ? 0 : p * 100, 100, null, x.n < 30);
        return el("div", { clase: "fila-quien" }, [el("b", { texto: legible(x.componente) + (x.modelo ? " (" + x.modelo + ")" : "") }), b[0],
          el("div", { clase: "valor-q" }, [p === null ? "sin referencia" : pct(p), el("small", { texto: x.coinciden + " / " + x.n })])]); })));
      if (cortas.length) izq.appendChild(el("div", { clase: "detalle", texto: "Gris: muestra insuficiente. Con 30 casos o más las barras pasan a negro." }));
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
    der.appendChild(el("a", { href: "#errores", clase: "boton-enlace", texto: "Revisar los casos en Errores", onclick: function (ev) { ev.preventDefault(); ir("errores"); } }));
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
  async function config(c) {
    c.appendChild(el("div", { clase: "encabezado" }, [el("h1", { texto: "Configuración" }), selPeriodo(pintar)]));
    skeleton(c);
    var r = rango(), g = await llamar("admin_config"), k = await llamar("admin_costos", { desde: r.desde, hasta: r.hasta }), b = await llamar("admin_bitacora", { pagina: 1 });
    var sk = c.querySelector(".skeleton"); if (sk) sk.remove();
    var ancho = !!(window.matchMedia && matchMedia("(min-width:761px)").matches);
    var cont = el("div", { clase: "config-cols" }), izq = el("div", { clase: "config-col" }), der = el("div", { clase: "config-col" });
    // 1 · Costo de la IA
    if (k) {
      var total = (k.por_modelo || []).reduce(function (s, x) { return s + Number(x.usd || 0); }, 0), tok = function (n) { return n === null || n === undefined ? "—" : n >= 1e6 ? (n / 1e6).toFixed(1) + " M" : String(n); };
      var ti = (k.por_modelo || []).reduce(function (s, x) { return s + Number(x.tokens_entrada || 0); }, 0), ts = (k.por_modelo || []).reduce(function (s, x) { return s + Number(x.tokens_salida || 0); }, 0);
      izq.appendChild(acordeon("cfg-costos", "Costo de la IA", "periodo elegido", (k.por_modelo || []).length ? "$" + total.toFixed(2) : "—", [
        (k.por_modelo || []).length ? el("div", {}, (k.por_modelo || []).map(function (x) { return filaKV(x.modelo + " · " + x.consultas + " consultas", "$" + Number(x.usd || 0).toFixed(2)); })) : el("div", { clase: "vacio", texto: "Sin consumo en el periodo." }),
        (k.por_modelo || []).length ? el("div", { clase: "detalle", texto: "Tokens: " + tok(ti) + " entrada · " + tok(ts) + " salida." }) : null,
        el("details", { clase: "sub" }, [el("summary", { texto: "Tarifas por modelo" }), el("div", {}, (k.tarifas || []).map(function (x) { return filaKV(x.modelo, "$" + x.usd_mtok_entrada + " entrada · $" + x.usd_mtok_salida + " salida (por M tokens)"); }))]),
        k.nota ? el("div", { clase: "detalle", texto: k.nota }) : null], ancho));
    }
    if (g) {
      var al = g.almacenamiento || {}, rt = g.retencion || {};
      // 2 · Almacenamiento y retención
      izq.appendChild(acordeon("cfg-almacenamiento", "Almacenamiento", "capturas y lecturas", bytesLeg(al.capturas_bytes), [
        filaKV("Capturas guardadas", txt(al.capturas_objetos) + " · " + bytesLeg(al.capturas_bytes)), filaKV("Lecturas guardadas", al.lecturas_filas),
        filaKV("Lecturas vencidas", rt.lecturas_vencidas, rt.lecturas_vencidas > 0 ? "aviso-t" : ""),
        el("div", { clase: "detalle", texto: "Se conservan " + txt(rt.lecturas_dias) + " días las lecturas y " + txt(rt.capturas_dias) + " días las capturas." }), rt.nota ? el("div", { clase: "detalle", texto: rt.nota }) : null], ancho));
      // 3 · Alertas
      var um = g.umbrales_alertas || [];
      der.appendChild(acordeon("cfg-alertas", "Alertas", "reglas y umbrales", String(um.length), [
        um.length ? el("div", {}, um.map(function (x) { return el("div", { clase: "regla" }, [el("div", {}, [el("span", { texto: x.regla }), el("small", { texto: txt(x.umbral) })]), el("span", { clase: "sev " + x.gravedad, texto: GRAVEDAD[x.gravedad] || String(x.gravedad).toUpperCase() })]); })) : el("div", { clase: "vacio", texto: "Sin reglas." }),
        el("div", { clase: "detalle", texto: "Umbrales editables: " + (g.umbrales_editables ? "sí" : "no (fijos y documentados; cambiarlos requiere una migración)") + " · esquema " + g.esquema })], ancho));
      // 4 · Usuarios y permisos
      var ad = g.administradores || [], pm = g.permisos || {};
      der.appendChild(acordeon("cfg-usuarios", "Usuarios y permisos", "tú eres " + txt((g.yo || {}).rol), String(ad.length), [
        el("div", { clase: "fila" }, [el("b", { texto: "Tú: " + txt((g.yo || {}).admin) }), el("span", { clase: "rol", texto: String((g.yo || {}).rol || "").toUpperCase() })]),
        el("div", {}, ad.map(function (x) { return filaKV(x.admin + " · " + x.rol, "desde " + (x.alta || "").slice(0, 10)); })),
        el("div", { clase: "etiquetas fila" }, ["lector", "revisor"].map(function (rl) { return el("span", { clase: "chipv", texto: rl + ": " + (pm[rl] || []).join(", ") }); })),
        el("div", { clase: "detalle", texto: "Las altas se hacen a mano en el editor SQL." })], ancho));
    }
    // 5 · Historial
    if (b) {
      var fs = b.filas || [];
      var fila = function (f) { return el("div", { clase: "regla" }, [el("div", {}, [el("span", { texto: (f.creado || "").slice(0, 16).replace("T", " ") + " · " + txt(f.admin) }), el("small", { texto: txt(f.accion) })]), el("span", { clase: "sev nd", texto: txt(f.resultado) + (f.filas !== null && f.filas !== undefined ? " · " + f.filas : "") })]); };
      var resto = fs.slice(10);
      der.appendChild(acordeon("cfg-historial", "Historial de acciones", "consultas registradas", String(fs.length), [
        fs.length ? el("div", {}, fs.slice(0, 10).map(fila)) : el("div", { clase: "vacio", texto: "Sin acciones registradas." }),
        resto.length ? el("details", { clase: "sub" }, [el("summary", { texto: "Ver " + resto.length + " más" }), el("div", {}, resto.map(fila))]) : null], false));
    }
    cont.appendChild(izq); cont.appendChild(der); c.appendChild(cont);
  }

  var VISTAS = { inicio: inicio, errores: errores, ofertas: ofertas, versiones: versiones, dispositivos: dispositivos, ia: ia, config: config };
  var TITULOS = {}; MODULOS.forEach(function (m) { TITULOS[m[0]] = m[1]; });

  // Hoja inferior «Más» (solo teléfono): módulos restantes, tema y salir.
  function hoja(abrir) {
    var h = document.getElementById("hoja");
    if (h) h.remove();
    var mas = document.getElementById("t-mas");
    if (mas) mas.setAttribute("aria-expanded", String(!!abrir));
    if (!abrir) return;
    function cerrar() { hoja(false); if (mas) mas.focus(); }
    var items = MODULOS.filter(function (m) { return ["inicio", "errores", "ofertas"].indexOf(m[0]) < 0; }).map(function (m) {
      return el("button", { type: "button", clase: "item", "aria-current": m[0] === vista ? "page" : null, onclick: function () { hoja(false); ir(m[0]); } }, [icono(m[0]), el("span", { texto: m[1] })]); });
    items.push(el("button", { type: "button", clase: "item", onclick: function () { document.getElementById("tema").click(); cerrar(); } }, [el("span", { texto: temaActual() === "dark" ? "Modo claro" : "Modo oscuro" })]));
    items.push(el("button", { type: "button", clase: "item peligro", onclick: function () { document.getElementById("salir").click(); } }, [el("span", { texto: "Salir" })]));
    var hoja_ = el("div", { id: "hoja", role: "dialog", "aria-modal": "true", "aria-label": "Más opciones", onkeydown: function (ev) { if (ev.key === "Escape") cerrar(); } },
      [el("div", { clase: "velo", onclick: cerrar }), el("div", { clase: "panel-hoja" }, [el("div", { clase: "asa", "aria-hidden": "true" })].concat(items))]);
    document.body.appendChild(hoja_);
    var p = hoja_.querySelector(".item"); if (p) p.focus();
  }

  var ultima = Date.now();
  function barraEstado() {
    return el("div", { clase: "estado-barra" }, [el("span", { id: "est-punto", clase: "punto ok", "aria-hidden": "true" }), el("span", { id: "est-texto", "aria-live": "polite" }),
      el("button", { id: "refrescar", type: "button", texto: "Actualizar", onclick: function () { pintar(); } })]);
  }
  function textoEstado() {
    var t = document.getElementById("est-texto"), p = document.getElementById("est-punto"); if (!t) return;
    var off = navigator.onLine === false, m = Math.floor((Date.now() - ultima) / 60000);
    t.textContent = off ? "Sin conexión. Se muestran los últimos datos." : "Actualizado " + (m < 1 ? "hace un momento" : "hace " + m + " min");
    p.className = "punto " + (off ? "mal" : m >= 10 ? "aviso" : "ok");
  }
  setInterval(textoEstado, 30000);
  window.addEventListener("online", function () { textoEstado(); });
  window.addEventListener("offline", textoEstado);

  async function pintar() {
    hoja(false);
    var raiz = document.getElementById("raiz");
    raiz.textContent = "";
    var PRINCIPALES = ["inicio", "errores", "ofertas"];
    var enMas = PRINCIPALES.indexOf(vista) < 0;
    var botones = MODULOS.map(function (m) {
      var activo = m[0] === vista;
      return el("button", { id: "t-" + m[0], type: "button", role: "tab", clase: PRINCIPALES.indexOf(m[0]) < 0 ? "sec" : "", "aria-selected": String(activo), "aria-current": activo ? "page" : null, "aria-label": m[1], onclick: function () { ir(m[0]); } },
        [icono(m[0]), el("span", { clase: "largo", texto: m[1] }), el("span", { clase: "corto", texto: m[2] })]); });
    var masIco = sv("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "ico", fill: "currentColor" }, [sv("circle", { cx: "5", cy: "12", r: "1.6" }), sv("circle", { cx: "12", cy: "12", r: "1.6" }), sv("circle", { cx: "19", cy: "12", r: "1.6" })]);
    botones.push(el("button", { id: "t-mas", type: "button", clase: "mas", "aria-haspopup": "dialog", "aria-expanded": "false", "aria-selected": String(enMas), "aria-label": "Más módulos y cuenta", onclick: function () { hoja(true); } },
      [masIco, el("span", { clase: "corto", texto: "Más" })]));
    var nav = el("nav", { id: "menu", "aria-label": "Módulos" }, [el("div", { role: "tablist", "aria-label": "Módulos", clase: "pestanas" }, botones)]);
    var c = el("section", { id: "vista-" + vista, clase: "contenido" });
    raiz.appendChild(nav); raiz.appendChild(c);
    c.appendChild(barraEstado());
    await VISTAS[vista](c);
    if (!document.querySelector(".estado-barra") && c.isConnected) c.insertBefore(barraEstado(), c.firstChild);
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
    var h = (location.hash || "").replace(/^#/, "").split("/");
    if (VISTAS[h[0]]) { vista = h[0]; param = h[1] || null; }
    document.getElementById("quien").textContent = "Sesión iniciada";
    var salir = document.getElementById("salir");
    salir.hidden = false;
    salir.onclick = async function () { await cli.auth.signOut(); location.reload(); };
    var g = await llamar("admin_config");
    if (g) yo = g.yo;
    await pintar();
  }

  // Tema claro/oscuro: sigue al teléfono; el botón lo cambia a mano y lo recuerda (si el navegador lo permite).
  function temaActual() { var t = document.documentElement.getAttribute("data-theme"); return t || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); }
  function aplicarTema(t) { document.documentElement.setAttribute("data-theme", t); var b = document.getElementById("tema"); if (b) b.textContent = t === "dark" ? "Modo claro" : "Modo oscuro"; }
  try { var gt = localStorage.getItem("checa-tema"); if (gt === "dark" || gt === "light") document.documentElement.setAttribute("data-theme", gt); } catch (e) { /* sin almacenamiento */ }

  window.addEventListener("popstate", function () {
    var h = (location.hash || "").replace(/^#/, "").split("/");
    if (cli && VISTAS[h[0]]) { vista = h[0]; param = h[1] || null; pintar(); }
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
