"""Música de marca Checa (v2): dos PROPUESTAS de cama musical para los videos. Se sintetizan con numpy:
cada corrida da exactamente los mismos archivos, sin derechos de terceros. Van en do mayor, igual que los efectos.

  A «Ruta nocturna»   84 BPM, tranquila, estilo lo-fi: acordes suaves, bajo, bombo y kalimba. Para consejos y confianza.
  B «Motor en marcha» 112 BPM, con empuje: bombo constante, palmas, bajo que pulsa y arpegio brillante. Para videos de venta.

Uso:  python3 -I generar_musica.py        (necesita numpy y ffmpeg)
Salida: wav/ (16 bits, 44.1 kHz, estéreo) y mp3/ (192 kbps). Cada pista dura ≈ 34 s y termina con fundido.
Nivel: RMS ≈ −22 dBFS y pico < −6 dBFS, pensado para ir DEBAJO de la voz (en video, volumen 0.25 a 0.4 y «carve» al hablar).
"""
import os, subprocess, wave
import numpy as np

SR = 44100
AQUI = os.path.dirname(os.path.abspath(__file__))


def t(dur):
    return np.arange(int(SR * dur)) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def ma(y, k):
    return np.convolve(y, np.ones(k) / k, mode="same") if k > 1 else y


def poner(buf, senal, t0, gan=1.0):
    i = int(SR * t0)
    if i >= len(buf):
        return
    n = min(len(senal), len(buf) - i)
    buf[i:i + n] += gan * senal[:n]


class Instrumentos:
    def __init__(self, semilla):
        self.rng = np.random.default_rng(semilla)

    def ruido(self, dur, hp, lp):
        r = self.rng.standard_normal(int(SR * dur))
        return ma(r - ma(r, hp), lp)

    def pad(self, nota, dur, detune=0.003, brillo=1.3):
        f = midi(nota)
        x = t(dur + 0.8)
        y = np.zeros_like(x)
        for d in (-detune, 0.0, detune):
            for k in range(1, 6):
                y += np.sin(2 * np.pi * f * (1 + d) * k * x + k) / k ** brillo
        e = np.minimum(1.0, x / 0.35) * np.where(x > dur, np.exp(-(x - dur) / 0.25), 1.0)
        return ma(y * e / 3, 14)

    def bajo(self, nota, dur, tau=0.5):
        f = midi(nota)
        x = t(dur)
        y = np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * 2 * f * x) + 0.12 * np.sin(2 * np.pi * 3 * f * x)
        return y * np.exp(-x / tau) * np.minimum(1.0, x / 0.008)

    def bombo(self, gan=1.0):
        x = t(0.35)
        f = 48 + 95 * np.exp(-x / 0.028)
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.11)
        y += 0.25 * self.ruido(0.35, 4, 3) * np.exp(-x / 0.004)
        return gan * y

    def caja(self, gan=1.0):  # golpe seco apagado
        x = t(0.2)
        return gan * (self.ruido(0.2, 40, 5) * np.exp(-x / 0.05) + 0.5 * np.sin(2 * np.pi * 190 * x) * np.exp(-x / 0.04))

    def palma(self, gan=1.0):
        y = np.zeros(int(SR * 0.3))
        for d in (0.0, 0.011, 0.022):
            r = self.ruido(0.25, 20, 3)
            poner(y, r * np.exp(-t(0.25) / 0.02), d)
        poner(y, self.ruido(0.28, 20, 3) * np.exp(-t(0.28) / 0.07), 0.022, 0.6)
        return gan * y

    def hat(self, abierto=False, gan=1.0):
        d = 0.22 if abierto else 0.07
        x = t(d)
        return gan * self.ruido(d, 3, 1) * np.exp(-x / (0.07 if abierto else 0.018))

    def kalimba(self, nota, dur=0.7, gan=1.0):
        f = midi(nota)
        x = t(dur)
        y = np.sin(2 * np.pi * f * x) * np.exp(-x / 0.28) + 0.22 * np.sin(2 * np.pi * f * 4.0 * x) * np.exp(-x / 0.06)
        return gan * y * np.minimum(1.0, x / 0.003)

    def pluck(self, nota, dur=0.35, gan=1.0):
        f = midi(nota)
        x = t(dur)
        y = np.zeros_like(x)
        for k, a in ((1, 1.0), (2, 0.5), (3, 0.3), (4, 0.15)):
            y += a * np.sin(2 * np.pi * f * k * x)
        return gan * y * np.exp(-x / 0.12) * np.minimum(1.0, x / 0.003)


def cierre(L, R, pico_max=0.5, rms_db=-22.0, fundido=2.5):
    """Nivela a RMS fijo, suaviza picos, pone fundido de entrada y salida y comprueba el pico."""
    m = np.sqrt(np.mean((L ** 2 + R ** 2) / 2))
    g = 10 ** (rms_db / 20) / (m + 1e-9)
    L, R = np.tanh(L * g * 1.4) / 1.4, np.tanh(R * g * 1.4) / 1.4
    p = max(np.max(np.abs(L)), np.max(np.abs(R)))
    if p > pico_max:
        L, R = L * pico_max / p, R * pico_max / p
    n_in, n_out = int(SR * 0.4), int(SR * fundido)
    for c in (L, R):
        c[:n_in] *= np.linspace(0, 1, n_in)
        c[-n_out:] *= np.linspace(1, 0, n_out) ** 1.5
    return L, R


def pista_a():
    """A · Ruta nocturna: 84 BPM, Cmaj7 – Am7 – Fmaj7 – G6, 12 compases (≈ 34.3 s)."""
    bpm, compases = 84, 12
    beat = 60 / bpm
    dur = compases * 4 * beat
    ins = Instrumentos(21)
    M = np.zeros(int(SR * dur) + SR); PL = np.zeros_like(M); PR = np.zeros_like(M)
    acordes = [  # (tonos del pad, raíz del bajo, tonos del arpegio)
        ([48, 52, 55, 59, 64], 36, [72, 76, 79, 83]),   # Cmaj7
        ([45, 48, 52, 55, 60], 33, [69, 72, 76, 79]),   # Am7
        ([41, 45, 48, 52, 57], 41, [69, 72, 77, 81]),   # Fmaj7
        ([43, 47, 50, 52, 59], 43, [71, 74, 79, 83]),   # G6
    ]
    arp = [0, 2, 1, 3, 2, 1, 3, 1]
    for c in range(compases):
        pad, raiz, arpn = acordes[c % 4]
        t0 = c * 4 * beat
        for i, n in enumerate(pad):
            poner(PL, ins.pad(n, 4 * beat - 0.1, 0.003 + 0.001 * i), t0, 0.16)
            poner(PR, ins.pad(n, 4 * beat - 0.1, 0.004 - 0.001 * i), t0, 0.16)
        base = c >= 2
        if base:
            poner(M, ins.bajo(raiz, 2.0 * beat, 0.7), t0, 0.55)
            poner(M, ins.bajo(raiz + 7, 0.9 * beat, 0.3), t0 + 2.5 * beat, 0.30)
            for b in (0, 2):
                poner(M, ins.bombo(), t0 + b * beat, 0.60)
            poner(M, ins.bombo(), t0 + 2.75 * beat, 0.25)
            for b in (1, 3):
                poner(M, ins.caja(), t0 + b * beat, 0.22)
            for k in range(8):
                swing = 0.08 * beat if k % 2 else 0.0
                poner(M, ins.hat(False), t0 + k * beat / 2 + swing, 0.07 if k % 2 == 0 else 0.11)
            for k in range(8):
                if k in (3, 7) and c % 2 == 0:
                    continue
                nota = arpn[arp[k] % 4]
                poner(M, ins.kalimba(nota), t0 + k * beat / 2 + (0.05 * beat if k % 2 else 0), 0.11 + 0.03 * (k % 3 == 0))
        else:
            for k in range(8):
                poner(M, ins.hat(False), t0 + k * beat / 2, 0.04)
            poner(M, ins.bajo(raiz, 3.0 * beat, 0.9), t0, 0.35)
    n = int(SR * dur)
    return cierre(M[:n] + PL[:n], M[:n] + PR[:n])


def pista_b():
    """B · Motor en marcha: 112 BPM, Am – F – C – G, 16 compases (≈ 34.3 s)."""
    bpm, compases = 112, 16
    beat = 60 / bpm
    dur = compases * 4 * beat
    ins = Instrumentos(33)
    M = np.zeros(int(SR * dur) + SR); PL = np.zeros_like(M); PR = np.zeros_like(M)
    acordes = [  # (tonos del pad, raíz del bajo, tonos del arpegio)
        ([57, 60, 64, 69], 45, [69, 72, 76, 81]),   # Am
        ([53, 57, 60, 65], 41, [65, 69, 72, 77]),   # F
        ([48, 52, 55, 60], 48, [72, 76, 79, 84]),   # C
        ([55, 59, 62, 67], 43, [67, 71, 74, 79]),   # G
    ]
    arp = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 3, 2, 1, 2]
    for c in range(compases):
        pad, raiz, arpn = acordes[c % 4]
        t0 = c * 4 * beat
        for i, n in enumerate(pad):
            poner(PL, ins.pad(n, 4 * beat - 0.05, 0.002 + 0.0007 * i, 1.0), t0, 0.12)
            poner(PR, ins.pad(n, 4 * beat - 0.05, 0.003 - 0.0007 * i, 1.0), t0, 0.12)
        for b in range(4):
            poner(M, ins.bombo(), t0 + b * beat, 0.62)
        for k in range(16):
            abierto = k % 4 == 2
            poner(M, ins.hat(abierto), t0 + k * beat / 4, (0.10 if abierto else 0.05) + (0.03 if k % 4 == 0 else 0))
        if c >= 2:
            for k in range(8):
                oct_ = 12 if k % 4 == 3 else 0
                poner(M, ins.bajo(raiz + oct_, 0.9 * beat / 2, 0.16), t0 + k * beat / 2, 0.42)
            for b in (1, 3):
                poner(M, ins.palma(), t0 + b * beat, 0.30)
        if c >= 4:
            for k in range(16):
                poner(M, ins.pluck(arpn[arp[k] % 4]), t0 + k * beat / 4, 0.10 + 0.04 * (k % 4 == 0))
    n = int(SR * dur)
    return cierre(M[:n] + PL[:n], M[:n] + PR[:n])


PISTAS = {"musica-a-ruta-nocturna": pista_a, "musica-b-motor-en-marcha": pista_b}


def guardar(nombre, L, R):
    ruta = os.path.join(AQUI, "wav", nombre + ".wav")
    est = np.stack([L, R], axis=1)
    with wave.open(ruta, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(est, -1, 1) * 32767).astype(np.int16).tobytes())
    return ruta


def main():
    os.makedirs(os.path.join(AQUI, "wav"), exist_ok=True)
    os.makedirs(os.path.join(AQUI, "mp3"), exist_ok=True)
    for nombre, f in PISTAS.items():
        L, R = f()
        w = guardar(nombre, L, R)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", w, "-b:a", "192k", os.path.join(AQUI, "mp3", nombre + ".mp3")], check=True)
        print(f"{nombre:28s} {len(L) / SR:.1f} s")


if __name__ == "__main__":
    main()
