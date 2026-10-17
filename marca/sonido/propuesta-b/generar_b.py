"""Sonido de marca Checa, PROPUESTA B: «el tablero del auto» (direccional, ding del cinturón, odómetro).
Mismo método que la propuesta A: síntesis con numpy, notas fijas, resultado idéntico en cada corrida.

Uso:  python3 -I generar_b.py        (necesita numpy y ffmpeg)
Salida: wav/, mp3/ y demo-completa.mp3 dentro de esta carpeta.
"""
import os, subprocess, sys, wave
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, ".."))
from generar_sonidos import SR, t, poner, cerrar, ruido, deslizar  # noqa: E402

rng = np.random.default_rng(11)
G5, D6 = 783.99, 1174.66
DING_A, DING_B = 880.0, 1174.66


def ding(f, dur, amp=1.0, tau=0.3):
    """Ding limpio de tablero: seno + parcial inarmónico suave, ataque de 3 ms."""
    x = t(dur)
    y = np.sin(2 * np.pi * f * x) + 0.18 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x / (tau / 3))
    return amp * y * np.exp(-x / tau) * np.minimum(1.0, x / 0.003)


def clic(f, amp=1.0, dur=0.05):
    """Clic de relé: ráfaga corta de tono + un toque de ruido (el «tic» o el «toc» de la direccional)."""
    x = t(dur)
    y = np.sin(2 * np.pi * f * x) * np.exp(-x / 0.007)
    r = rng.standard_normal(len(x))
    r = r - np.convolve(r, np.ones(6) / 6, mode="same")  # pasa-altos simple
    return amp * (y + 0.35 * r * np.exp(-x / 0.003))


def cuadrada_suave(f0, f1, dur, amp=1.0, tau=0.1):
    x = t(dur)
    f = f0 * (f1 / f0) ** (x / dur)
    y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))
    y = np.convolve(y, np.ones(14) / 14, mode="same")  # quita lo áspero
    return amp * y * np.exp(-x / tau) * np.minimum(1.0, x / 0.004)


def empujar(y, g):
    """Compresión suave (tanh): sube lo flojo de los clics sin pasar el pico, para igualar el volumen con los dings."""
    return np.tanh(g * y / (np.max(np.abs(y)) + 1e-9)) / np.tanh(g)


def sonidos():
    s = {}
    # 1. Logo: tic, toc, tic de direccional (0.1, 0.4, 0.7 s) y el ding de la ✓ a 0.9 s.
    b = np.zeros(int(SR * 1.8))
    for f, t0 in ((1900, 0.10), (1300, 0.40), (1900, 0.70)):
        poner(b, clic(f, 0.8), t0)
    poner(b, ding(G5, 0.9, 0.9, tau=0.3), 0.90)
    poner(b, ding(D6, 0.9, 0.7, tau=0.3), 0.90)  # quinta: ding de tablero «lleno»
    s["logo-direccional"] = cerrar(b)
    # 2. Aceptar: ding-ding que sube (como el aviso del tablero, pero amable).
    b = np.zeros(int(SR * 0.8))
    poner(b, ding(DING_A, 0.30, 0.9, tau=0.10), 0.0)
    poner(b, ding(DING_B, 0.60, 1.0, tau=0.22), 0.13)
    s["aceptar"] = cerrar(b)
    # 3. Considerar: tic-toc de direccional.
    b = np.zeros(int(SR * 0.6))
    poner(b, clic(1900, 1.0), 0.0)
    poner(b, clic(1300, 1.0), 0.22)
    s["considerar"] = cerrar(empujar(b, 4.0))
    # 4. Rechazar: dos pitidos graves que bajan, apagados (nada de alarma).
    b = np.zeros(int(SR * 0.8))
    poner(b, cuadrada_suave(240, 185, 0.22, 0.9, tau=0.14), 0.0)
    poner(b, cuadrada_suave(185, 120, 0.34, 1.0, tau=0.18), 0.20)
    s["rechazar"] = cerrar(b, 0.62)
    # 5. Pop-up que entra: clac de relé con un golpe sordo.
    b = np.zeros(int(SR * 0.3))
    poner(b, clic(1500, 1.0), 0.0)
    poner(b, deslizar(320, 140, 0.12, 0.6, tau=0.04), 0.0)
    s["popup-entra"] = cerrar(empujar(b, 3.0), 0.6)
    # 6. Número que sube: odómetro, clics que se aceleran.
    b = np.zeros(int(SR * 0.9))
    pos, paso = 0.0, 0.12
    for i in range(10):
        poner(b, clic(1700 + 40 * i, 0.7 + 0.03 * i, 0.04), pos)
        pos += paso; paso *= 0.82
    s["numero-sube"] = cerrar(empujar(b, 3.5), 0.6)
    # 7. Sello: «ka-chunk» (clic y golpe sordo).
    b = np.zeros(int(SR * 0.5))
    poner(b, clic(1100, 0.8), 0.0)
    poner(b, deslizar(130, 48, 0.30, 1.0, tau=0.09), 0.06)
    poner(b, ruido(0.05, 0.4, tau=0.01, corte=1200), 0.06)
    s["sello"] = cerrar(b, 0.75)
    return s


def guardar(nombre, y):
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
        w = guardar(nombre, y)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", w, "-b:a", "192k", os.path.join(AQUI, "mp3", nombre + ".mp3")], check=True)
        demo += [y, pausa]
    w = guardar("_demo", np.concatenate(demo))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", w, "-b:a", "192k", os.path.join(AQUI, "demo-completa.mp3")], check=True)
    os.remove(w)
    for nombre, y in s.items():
        print(f"{nombre:17s} {len(y) / SR:.2f} s")


if __name__ == "__main__":
    main()
