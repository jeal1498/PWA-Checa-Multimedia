# Propuesta de estructura del Admin

## Crítica de la estructura actual

**Funciona:** 3 módulos principales en el teléfono, "Más" para el resto, lenguaje claro y detalle progresivo.

**Problemas:**
1. **Un mismo flujo, tres lugares.** La revisión humana vive en *Errores*, en *Ofertas › Revisar* y en *IA › "Revisar los casos en Errores"*.
2. **Nombres que no coinciden.** `dispositivos` = "Conductores y dispositivos" / "Equipos"; `inicio` = "Inicio · Salud" / "Salud"; `config` = "Configuración" / "Ajustes".
3. **"Ofertas" mezcla tres cosas:** lista de lecturas, calidad contra humano y cola de revisión.
4. **"Calidad contra humano" repartida** en Inicio, Ofertas, Versiones e IA.
5. **Costos en dos módulos** (Inicio y Ajustes).
6. **Ajustes mezcla lectura y control.** Solo el interruptor de IA actúa.
7. **Alertas separadas de su origen.** "Por revisar" en Inicio, reglas enterradas en Ajustes.
8. **Inicio se queda corto como portada;** su "Todo el detalle" duplica otros módulos.
9. **Versiones, Equipos e IA son cortes de los mismos datos,** cada uno con su módulo.
10. **Sin jerarquía por tarea:** 7 destinos al mismo nivel.

## Propuesta: 5 destinos por tarea

```
Checa Admin
├── /hoy                       (antes: Inicio · Salud)
│   ├── Estado del sistema (pasos de la lectura)
│   ├── Por revisar (alertas + cola de capturas con conteo)
│   ├── Lo esencial (tarjetas + Lecturas y errores por día)
│   └── Accesos rápidos → Revisar, Errores
│
├── /revisar                   (antes: Errores + Ofertas › Revisar)
│   ├── Cola (pendientes primero)
│   │   ├── Errores
│   │   └── Capturas de ofertas
│   ├── Filtros: Versión / Estado / Tipo / Plataforma
│   └── /revisar/<id>
│       ├── Captura + Lector | IA | Humano
│       ├── Veredicto / Seguimiento / Deshacer
│       └── Anterior / siguiente
│
├── /calidad                   (antes: Ofertas, Versiones, IA, Inicio-detalle)
│   ├── Resumen: ¿qué tanto acierta la app?
│   ├── Por versión (comparar hasta 3)
│   ├── Por IA (acuerdo con el humano, fallas, discrepancias)
│   ├── Lecturas (tabla)
│   └── Tiempos y gráficas
│
├── /equipos                   (antes: Equipos)
│   ├── Conductores
│   └── Dispositivos
│
└── /ajustes                   (antes: Configuración)
    ├── Costos (IA + por usuario)       ← solo lectura
    ├── Alertas y reglas
    ├── IA con imagen (interruptor)
    ├── Usuarios y permisos
    ├── Almacenamiento
    └── Bitácora

Navegación
├── Teléfono: Hoy / Revisar / Calidad / Más (Equipos, Ajustes, Tema)
└── Tableta y escritorio: barra lateral con los 5
```

## Por qué

- **Por tarea:** *Hoy* ver qué pasa, *Revisar* actuar, *Calidad* analizar, *Equipos* y *Ajustes* consultar y administrar.
- **Un solo lugar para revisar:** se une la cola de errores y de capturas; la revisión humana alimenta a *Calidad*.
- **Un solo lugar para la calidad:** Ofertas, Versiones e IA son tres vistas de la misma pregunta.
- **7 → 5 destinos:** en el teléfono quedan 4 botones (3 + "Más"), por debajo del límite de 5.
- **Lo diario a un toque:** *Hoy* y *Revisar* al frente; *Ajustes* al fondo.
- **Nombres únicos** en todos los lugares.
- **Costos junto a los demás ajustes,** en solo lectura; en *Hoy* queda solo un indicador.

**Costo de migrar:** cambian las rutas `#errores`, `#ofertas`, `#versiones` e `#ia`; hay que mantener redirecciones por un tiempo. Las llamadas `admin_*` casi no cambian, solo su agrupación en pantalla.
