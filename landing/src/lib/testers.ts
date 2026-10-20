import { CLAVE_REGISTRO, SUPABASE_ANON_KEY, TESTERS_ENDPOINT } from '../config';
import { dispositivo, origenVisita } from './track';

export interface DatosTester {
  nombre: string;
  correo: string;
}

export type ResultadoRegistro =
  | { ok: true; yaRegistrado: boolean }
  | { ok: false; motivo: 'red' | 'servidor' };

const RE_CORREO = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export function correoValido(correo: string): boolean {
  return correo.length <= 120 && RE_CORREO.test(correo);
}

export function esGmail(correo: string): boolean {
  return /@(gmail|googlemail)\.com$/i.test(correo);
}

/**
 * Guarda al tester en Supabase (tabla `testers`, solo inserción).
 * Un correo repetido (409) cuenta como registrado: la persona ya está en la lista.
 * Nunca devuelve ok:true si el correo no llegó a guardarse.
 */
export async function registrarTester(datos: DatosTester): Promise<ResultadoRegistro> {
  const { fuente, campana } = origenVisita();
  const cuerpo = {
    nombre: datos.nombre.trim().slice(0, 80),
    correo: datos.correo.trim().toLowerCase(),
    fuente: fuente ? fuente.slice(0, 60) : null,
    campana: campana ? campana.slice(0, 60) : null,
    dispositivo: dispositivo(),
  };

  let respuesta: Response;
  try {
    respuesta = await fetch(TESTERS_ENDPOINT, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    return { ok: false, motivo: 'red' };
  }

  if (respuesta.ok) return { ok: true, yaRegistrado: false };
  if (respuesta.status === 409) return { ok: true, yaRegistrado: true };
  return { ok: false, motivo: 'servidor' };
}

/** Este teléfono ya se registró (solo guardamos el nombre, nunca el correo). */
export function leerRegistroLocal(): { nombre: string } | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE_REGISTRO);
    if (!crudo) return null;
    const dato = JSON.parse(crudo) as { nombre?: unknown };
    return { nombre: typeof dato.nombre === 'string' ? dato.nombre : '' };
  } catch {
    return null;
  }
}

export function guardarRegistroLocal(nombre: string): void {
  try {
    window.localStorage.setItem(CLAVE_REGISTRO, JSON.stringify({ nombre, fecha: new Date().toISOString() }));
  } catch {
    /* modo privado: la página sigue mostrando el estado en memoria */
  }
}
