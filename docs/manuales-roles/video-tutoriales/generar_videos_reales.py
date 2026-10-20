# -*- coding: utf-8 -*-
"""
Generador de VIDEO TUTORIALES REALES (MP4 narrados) para los roles
del Sistema Logistica.

Pipeline por escena:
  1. TTS (edge-tts, voz neural en espanol) -> audio mp3 de la locucion.
  2. Composicion del frame 1280x720 con PIL (captura real + titulo + pasos + subtitulo).
  3. ffmpeg -> segmento mp4 (imagen en loop + audio).
  4. Concatena segmentos -> VIDEO_TUTORIAL_<ROL>.mp4

Uso:  python generar_videos_reales.py [ROL ...]
      (sin args genera los 11)

Requiere: ffmpeg en PATH, pip install edge-tts pillow
Sin internet para TTS -> genera video silencioso con duracion estimada.
"""

import asyncio
import os
import re
import subprocess
import sys
import textwrap

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from generar_videos import ROLES  # reutiliza escenas/locuciones/capturas

BASE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.dirname(os.path.dirname(BASE))           # .../docs
CAPTURAS = os.path.join(DOCS, "capturas_manual")
OUT = os.path.join(BASE, "mp4")
TMP = os.path.join(BASE, "_tmp")
os.makedirs(OUT, exist_ok=True)
os.makedirs(TMP, exist_ok=True)

W, H = 1280, 720
VOZ = "es-MX-JorgeNeural"   # voz neural LATAM masculina
FONT_DIR = r"C:\Windows\Fonts"


def font(size, bold=False):
    name = "segoeuib.ttf" if bold else "segoeui.ttf"
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def wrap(draw, text, fnt, max_w):
    """Envuelve texto segun ancho real en pixeles."""
    lines, cur = [], ""
    for word in text.split():
        test = (cur + " " + word).strip()
        if draw.textlength(test, font=fnt) <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def draw_frame(rol, idx, total, escena, locucion, pasos, imagen, accent, path):
    """Compone el frame 1280x720 de la escena."""
    img = Image.new("RGB", (W, H), (15, 23, 42))
    d = ImageDraw.Draw(img)
    ac = hex_rgb(accent)
    muted = (148, 163, 184)
    white = (226, 232, 240)

    # Barra superior
    d.rectangle([0, 0, W, 6], fill=ac)
    d.text((48, 28), f"{rol}  ·  ESCENA {idx}/{total}", font=font(20, True), fill=ac)
    for i, line in enumerate(wrap(d, escena, font(38, True), W - 96)[:2]):
        d.text((48, 58 + i * 46), line, font=font(38, True), fill=white)

    # Franja inferior: subtitulo de locucion
    f_sub = font(21)
    sub_lines = wrap(d, locucion, f_sub, W - 160)
    sub_lines = sub_lines[:4]
    y_sub = H - 40 - len(sub_lines) * 30
    d.rectangle([0, y_sub - 18, W, H], fill=(10, 15, 30))
    d.rectangle([0, y_sub - 18, 6, H], fill=ac)
    for i, line in enumerate(sub_lines):
        d.text((48, y_sub + i * 30), line, font=f_sub, fill=(203, 213, 225))

    zona_y, zona_h = 150, y_sub - 170
    cap = None
    if imagen:
        p = os.path.join(CAPTURAS, imagen)
        if os.path.exists(p):
            cap = Image.open(p).convert("RGB")

    if cap:
        # Screenshot a la izquierda, pasos a la derecha
        max_w, max_h = 720, zona_h - 20
        ratio = min(max_w / cap.width, max_h / cap.height)
        cw, ch = int(cap.width * ratio), int(cap.height * ratio)
        cap = cap.resize((cw, ch), Image.LANCZOS)
        cx, cy = 36, zona_y + 10
        d.rectangle([cx - 3, cy - 3, cx + cw + 3, cy + ch + 3], outline=(51, 65, 85), width=2)
        img.paste(cap, (cx, cy))
        # Pasos
        x_p = 36 + max_w + 40
        d.text((x_p, zona_y + 6), "EN PANTALLA", font=font(17, True), fill=muted)
        yy = zona_y + 40
        f_p = font(19)
        for n, paso in enumerate(pasos[:9], 1):
            for j, line in enumerate(wrap(d, paso, f_p, W - x_p - 60)):
                if j == 0:
                    d.ellipse([x_p, yy + 4, x_p + 24, yy + 28], fill=ac)
                    d.text((x_p + 6, yy + 3), str(n), font=font(15, True), fill=(255, 255, 255))
                d.text((x_p + 36, yy), line, font=f_p, fill=white)
                yy += 28
            yy += 10
            if yy > y_sub - 40:
                break
    else:
        # Tarjeta de titulo centrada + pasos
        yy = zona_y + 30
        if pasos:
            d.text((80, yy), "EN PANTALLA", font=font(18, True), fill=muted)
            yy += 44
            f_p = font(22)
            for n, paso in enumerate(pasos[:8], 1):
                for j, line in enumerate(wrap(d, paso, f_p, W - 260)):
                    if j == 0:
                        d.ellipse([80, yy + 2, 80 + 30, yy + 32], fill=ac)
                        d.text((80 + 8, yy + 4), str(n), font=font(17, True), fill=(255, 255, 255))
                    d.text((124, yy), line, font=f_p, fill=white)
                    yy += 34
                yy += 12
        else:
            for i, line in enumerate(wrap(d, escena, font(48, True), W - 200)):
                w = d.textlength(line, font=font(48, True))
                d.text(((W - w) / 2, zona_y + 60 + i * 60), line, font=font(48, True), fill=ac)
    img.save(path)


async def tts(texto, mp3_path):
    """Genera audio TTS. Devuelve True si OK."""
    import edge_tts
    try:
        await edge_tts.Communicate(texto, VOZ).save(mp3_path)
        return os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 1000
    except Exception as e:
        print(f"    [TTS fallo: {e}] -> escena silenciosa")
        return False


def audio_dur(mp3):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", mp3],
        capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 8.0


def run_ffmpeg(args):
    r = subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"] + args,
                       capture_output=True, text=True)
    if r.returncode != 0:
        print("    ffmpeg:", r.stderr.strip()[:300])
    return r.returncode == 0


def generar_rol(idrol, data):
    print(f"\n== {idrol} — {data['titulo']} ==")
    accent = data["accent"]
    escenas = data["slides"]
    segmentos = []

    for i, (escena, locucion, pasos, imagen) in enumerate(escenas, 1):
        tag = f"{idrol}_{i:02d}"
        png = os.path.join(TMP, tag + ".png")
        mp3 = os.path.join(TMP, tag + ".mp3")
        seg = os.path.join(TMP, tag + ".mp4")

        draw_frame(idrol, i, len(escenas), escena, locucion, pasos, imagen, accent, png)

        texto_tts = locucion
        if pasos:
            texto_tts += " En pantalla: " + ". ".join(
                re.sub(r"\*\*", "", p) for p in pasos) + "."
        ok_audio = asyncio.run(tts(texto_tts, mp3))

        if ok_audio:
            args = ["-loop", "1", "-framerate", "1", "-i", png, "-i", mp3,
                    "-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac",
                    "-b:a", "128k", "-pix_fmt", "yuv420p", "-shortest", seg]
        else:
            dur = max(7, 5 + len(locucion.split()) * 0.45)
            args = ["-loop", "1", "-framerate", "1", "-t", str(dur), "-i", png,
                    "-f", "lavfi", "-t", str(dur), "-i", "anullsrc=r=44100:cl=mono",
                    "-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac",
                    "-pix_fmt", "yuv420p", "-shortest", seg]
        if run_ffmpeg(args):
            segmentos.append(seg)
            print(f"  escena {i}/{len(escenas)} OK — {escena}")

    if not segmentos:
        print("  Sin segmentos generados")
        return None

    lista = os.path.join(TMP, f"{idrol}_lista.txt")
    with open(lista, "w", encoding="utf-8") as f:
        for s in segmentos:
            f.write(f"file '{s.replace(os.sep, '/')}'\n")

    final = os.path.join(OUT, f"VIDEO_TUTORIAL_{idrol}.mp4")
    if run_ffmpeg(["-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", final]):
        print(f"  >> {final} ({os.path.getsize(final)//1024} KB)")
        return final
    return None


if __name__ == "__main__":
    sel = [a.upper() for a in sys.argv[1:]] or list(ROLES)
    for rol in sel:
        if rol in ROLES:
            generar_rol(rol, ROLES[rol])
        else:
            print(f"Rol desconocido: {rol}")
    print("\nVideos en:", OUT)
