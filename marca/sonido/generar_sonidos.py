"""Efectos de sonido oficiales de Checa (marca v2). Se sintetizan, no se graban ni se piden a un generador:
cada corrida da exactamente los mismos archivos, sin derechos de terceros.

Uso:  python3 -I generar_sonidos.py        (necesita numpy y ffmpeg)
Salida: wav/ (16 bits, 44.1 kHz, mono), mp3/ (192 kbps) y demo-completa.mp3 (todos con pausas, para escucharlos de corrido).

Idea sonora: el semáforo. Tres notas que suben (rojo, ámbar, verde) y un «ping» de campana al final (la ✓).
Todo en do mayor, sin graves pesados, para oírse bien en el altavoz de un teléfono y por debajo de la voz.
"""
import os, subprocess, wave
import numpy as np

SR = 44100
AQUI = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(7)

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


def triangulo(f, dur, amp=1.0, tau=None):
    x = t(dur)
    tau = tau or dur / 3
    y = (2 / np.pi) * np.arcsin(np.sin(2 * np.pi * f * x))
    return amp * y * np.exp(-x / tau) * np.minimum(1.0, x / 0.004)


def deslizar(f0, f1, dur, amp=1.0, tau=None):
    """Seno con frecuencia que baja (o sube) de f0 a f1."""
    x = t(dur)
    f = f0 * (f1 / f0) ** (x / dur)
    fase = 2 * np.pi * np.cumsum(f) / SR
    tau = tau or dur / 3
    return amp * np.sin(fase) * np.exp(-x / tau) * np.minimum(1.0, x / 0.003)


def ruido(dur, amp=1.0, tau=0.01, corte=2000):
    x = t(dur)
    r = rng.standard_normal(len(x))
    k = max(1, int(SR / corte))
    r = np.convolve(r, np.ones(k) / k, mode="same")  # filtro simple pasa-bajos
    return amp * r * np.exp(-x / tau)


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
    # 1. Logo: rojo 0.1 s, ámbar 0.4 s, verde 0.7 s (iguales a la animación) y ping de la ✓ a 0.9 s.
    b = np.zeros(int(SR * 1.8))
    for nota, t0 in ((C5, 0.10), (E5, 0.40), (G5, 0.70)):
        poner(b, campana(nota, 0.40, 0.7), t0)
    poner(b, campana(C6, 0.90, 1.0, tau=0.35), 0.90)
    poner(b, campana(C6 * 1.5, 0.60, 0.25, tau=0.22), 0.90)  # quinta arriba: brillo del ✓
    s["logo-semaforo"] = cerrar(b)
    # 2. Aceptar: dos notas que suben (sol → do), cortas.
    b = np.zeros(int(SR * 0.7))
    poner(b, campana(G5, 0.25, 0.8), 0.0)
    poner(b, campana(C6, 0.55, 1.0, tau=0.2), 0.10)
    s["aceptar"] = cerrar(b)
    # 3. Considerar: dos toques iguales (como las dos vibraciones cortas).
    b = np.zeros(int(SR * 0.6))
    poner(b, triangulo(E5, 0.18, 0.9, tau=0.07), 0.0)
    poner(b, triangulo(E5, 0.30, 0.9, tau=0.10), 0.18)
    s["considerar"] = cerrar(b)
    # 4. Rechazar: nota grave que baja, sin ser agresiva.
    b = np.zeros(int(SR * 0.8))
    poner(b, deslizar(C4 * 0.85, G3 * 0.8, 0.7, 1.0, tau=0.22), 0.0)
    poner(b, deslizar(C4 * 1.7, G3 * 1.6, 0.5, 0.25, tau=0.14), 0.0)
    s["rechazar"] = cerrar(b)
    # 5. Pop-up que entra: «pop» corto.
    b = np.zeros(int(SR * 0.3))
    poner(b, deslizar(760, 360, 0.16, 1.0, tau=0.05), 0.0)
    poner(b, ruido(0.03, 0.25, tau=0.006, corte=4000), 0.0)
    s["popup-entra"] = cerrar(b, 0.6)
    # 6. Número que sube: seis toques cada vez más agudos.
    b = np.zeros(int(SR * 0.8))
    for i, f in enumerate(np.geomspace(600, 1250, 6)):
        poner(b, campana(f, 0.12, 0.6 + 0.08 * i, tau=0.04), 0.09 * i)
    s["numero-sube"] = cerrar(b, 0.6)
    # 7. Sello: golpe sordo.
    b = np.zeros(int(SR * 0.5))
    poner(b, deslizar(150, 52, 0.30, 1.0, tau=0.09), 0.0)
    poner(b, ruido(0.06, 0.5, tau=0.012, corte=1500), 0.0)
    s["sello"] = cerrar(b, 0.75)
    return s


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
