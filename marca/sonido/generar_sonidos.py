"""Efectos de sonido OFICIALES de Checa (marca v2): la mezcla aprobada por Eduardo el 17 oct 2026.
Se sintetizan, no se graban ni se piden a un generador: cada corrida da exactamente los mismos archivos,
sin derechos de terceros.

  Logo y ACEPTAR  → «el semáforo»: campanas en do mayor.
  Todo lo demás   → «el tablero del auto»: direccional, relé, odómetro y golpes secos.

Uso:  python3 -I generar_sonidos.py        (necesita numpy y ffmpeg)
Salida: wav/ (16 bits, 44.1 kHz, mono), mp3/ (192 kbps) y demo-completa.mp3 (todos con pausas, para escucharlos de corrido).
"""
import os, subprocess, wave
import numpy as np

SR = 44100
AQUI = os.path.dirname(os.path.abspath(__file__))
rng_ruido = np.random.default_rng(7)   # ruido de los golpes
rng_clic = np.random.default_rng(11)   # ruido de los clics

# Notas fijas (Hz). Do mayor.
G3, C4 = 196.00, 261.63
C5, E5, G5, C6 = 523.25, 659.25, 783.99, 1046.50


def t(dur):
    return np.arange(int(SR * dur)) / SR


def campana(f, dur, amp=1.0, tau=None):
    """Campana suave: fundamental + 2.0x + 3.01x con caída exponencial. Ataque de 4 ms."""
    x = t(dur)
    tau = tau or dur / 4.5
    y = np.zeros_like(x)
    for r, a, k in ((1.0, 1.0, 1.0), (2.0, 0.35, 1.6), (3.01, 0.12, 2.4)):
        y += a * np.sin(2 * np.pi * f * r * x) * np.exp(-x / (tau / k))
    y *= np.minimum(1.0, x / 0.004)
    return amp * y


def deslizar(f0, f1, dur, amp=1.0, tau=None):
    """Seno con frecuencia que baja (o sube) de f0 a f1."""
    x = t(dur)
    f = f0 * (f1 / f0) ** (x / dur)
    fase = 2 * np.pi * np.cumsum(f) / SR
    tau = tau or dur / 3
    return amp * np.sin(fase) * np.exp(-x / tau) * np.minimum(1.0, x / 0.003)


def ruido(dur, amp=1.0, tau=0.01, corte=2000):
    x = t(dur)
    r = rng_ruido.standard_normal(len(x))
    k = max(1, int(SR / corte))
    r = np.convolve(r, np.ones(k) / k, mode="same")  # filtro simple pasa-bajos
    return amp * r * np.exp(-x / tau)


def clic(f, amp=1.0, dur=0.05):
    """Clic de relé: ráfaga corta de tono + un toque de ruido (el «tic» o el «toc» de la direccional)."""
    x = t(dur)
    y = np.sin(2 * np.pi * f * x) * np.exp(-x / 0.007)
    r = rng_clic.standard_normal(len(x))
    r = r - np.convolve(r, np.ones(6) / 6, mode="same")  # pasa-altos simple
    return amp * (y + 0.35 * r * np.exp(-x / 0.003))


def cuadrada_suave(f0, f1, dur, amp=1.0, tau=0.1):
    x = t(dur)
    f = f0 * (f1 / f0) ** (x / dur)
    y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))
    y = np.convolve(y, np.ones(14) / 14, mode="same")  # quita lo áspero
    return amp * y * np.exp(-x / tau) * np.minimum(1.0, x / 0.004)


def empujar(y, g):
    """Compresión suave (tanh): sube lo flojo de los clics sin pasar el pico, para igualar el volumen."""
    return np.tanh(g * y / (np.max(np.abs(y)) + 1e-9)) / np.tanh(g)


def poner(buf, senal, t0):
    i = int(SR * t0)
    buf[i:i + len(senal)] += senal[: len(buf) - i]


def cerrar(y, pico=0.7):
    """Normaliza a un pico fijo y aplica 12 ms de salida para evitar clics."""
    y = y / (np.max(np.abs(y)) + 1e-9) * pico
    n = int(SR * 0.012)
    y[-n:] *= np.linspace(1, 0, n)
    return y


def sonidos():
    s = {}
    # --- «tablero del auto» (el ruido de cada clic sale de un generador con semilla; se conserva el orden original) ---
    for f in (1900, 1300, 1900):   # el logo de la propuesta B usaba estos tres clics; se descartan para no cambiar el ruido aprobado
        clic(f, 0.8)
    b = np.zeros(int(SR * 0.6))
    poner(b, clic(1900, 1.0), 0.0)
    poner(b, clic(1300, 1.0), 0.22)
    s["considerar"] = cerrar(empujar(b, 4.0))               # tic-toc de direccional
    b = np.zeros(int(SR * 0.8))
    poner(b, cuadrada_suave(240, 185, 0.22, 0.9, tau=0.14), 0.0)
    poner(b, cuadrada_suave(185, 120, 0.34, 1.0, tau=0.18), 0.20)
    s["rechazar"] = cerrar(b, 0.62)                         # dos pitidos graves que bajan, apagados
    b = np.zeros(int(SR * 0.3))
    poner(b, clic(1500, 1.0), 0.0)
    poner(b, deslizar(320, 140, 0.12, 0.6, tau=0.04), 0.0)
    s["popup-entra"] = cerrar(empujar(b, 3.0), 0.6)         # clac de relé con golpe sordo
    b = np.zeros(int(SR * 0.9))
    pos, paso = 0.0, 0.12
    for i in range(10):
        poner(b, clic(1700 + 40 * i, 0.7 + 0.03 * i, 0.04), pos)
        pos += paso; paso *= 0.82
    s["numero-sube"] = cerrar(empujar(b, 3.5), 0.6)         # odómetro: clics que se aceleran
    b = np.zeros(int(SR * 0.5))
    poner(b, clic(1100, 0.8), 0.0)
    poner(b, deslizar(130, 48, 0.30, 1.0, tau=0.09), 0.06)
    poner(b, ruido(0.05, 0.4, tau=0.01, corte=1200), 0.06)
    s["sello"] = cerrar(b, 0.75)                            # ka-chunk
    # --- «semáforo»: campanas ---
    # Logo: rojo 0.1 s, ámbar 0.4 s, verde 0.7 s (iguales a la animación) y ping de la ✓ a 0.9 s.
    b = np.zeros(int(SR * 1.8))
    for nota, t0 in ((C5, 0.10), (E5, 0.40), (G5, 0.70)):
        poner(b, campana(nota, 0.40, 0.7), t0)
    poner(b, campana(C6, 0.90, 1.0, tau=0.35), 0.90)
    poner(b, campana(C6 * 1.5, 0.60, 0.25, tau=0.22), 0.90)  # quinta arriba: brillo del ✓
    s["logo-semaforo"] = cerrar(b)
    # Aceptar: dos notas que suben (sol → do), cortas.
    b = np.zeros(int(SR * 0.7))
    poner(b, campana(G5, 0.25, 0.8), 0.0)
    poner(b, campana(C6, 0.55, 1.0, tau=0.2), 0.10)
    s["aceptar"] = cerrar(b)
    orden = ["logo-semaforo", "aceptar", "considerar", "rechazar", "popup-entra", "numero-sube", "sello"]
    return {k: s[k] for k in orden}


def guardar_wav(nombre, y):
    ruta = os.path.join(AQUI, "wav", nombre + ".wav")
    with wave.open(ruta, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
    return ruta


def main():
    os.makedirs(os.path.join(AQUI, "wav"), exist_ok=True)
    os.makedirs(os.path.join(AQUI, "mp3"), exist_ok=True)
    s = sonidos()
    pausa = np.zeros(int(SR * 0.6))
    demo = []
    for nombre, y in s.items():
        w = guardar_wav(nombre, y)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", w, "-b:a", "192k", os.path.join(AQUI, "mp3", nombre + ".mp3")], check=True)
        demo += [y, pausa]
    w = guardar_wav("_demo", np.concatenate(demo))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", w, "-b:a", "192k", os.path.join(AQUI, "demo-completa.mp3")], check=True)
    os.remove(w)
    for nombre, y in s.items():
        print(f"{nombre:15s} {len(y) / SR:.2f} s")


if __name__ == "__main__":
    main()
