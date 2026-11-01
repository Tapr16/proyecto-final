"""Graba una parte del video de demostración con OBS (WebSocket v5) y deja OBS como estaba.

Uso:
  python tools/grabar_video.py prueba A [carpeta]   # arma la escena, toma capturas de prueba y restaura
  python tools/grabar_video.py grabar A [factor]    # graba scripts/demo-video-fase1.sh y copia el MP4

La demo corre en una ventana mintty a pantalla completa en el monitor principal. Cuando la demo
crea el archivo marca "pf-dash-on", OBS superpone las páginas de PAGINAS (fuentes de navegador)
unos segundos cada una y luego avisa con "pf-dash-done".
Basado en tools/grabar_video.py del Reto 4.
"""
import base64
import pathlib
import shutil
import subprocess
import sys
import tempfile
import time
from urllib.parse import quote

import obsws_python as obs

RAIZ = pathlib.Path(__file__).resolve().parent.parent
TMP = pathlib.Path(tempfile.gettempdir())
MINTTY = r"C:\Program Files\Git\usr\bin\mintty.exe"
MONITOR_PRINCIPAL = "HKC2431"  # 24E3, 1920x1080 en 0,0
SEG_POR_PAGINA = 12


def prometheus(*consultas, rango="15m"):
    partes = [f"g{i}.expr={quote(q)}&g{i}.tab=0&g{i}.range_input={rango}" for i, q in enumerate(consultas)]
    return "http://localhost:9090/graph?" + "&".join(partes)


PARTES = {
    "A": {
        "demo": "scripts/demo-video-fase1.sh",
        "salida": "Video-ParteA-Docker.mp4",
        "paginas": [
            ("PF-Prom-CPU", prometheus(
                'sum by (name) (rate(container_cpu_usage_seconds_total{name=~"proyecto-final-(api|db)-1"}[1m]))',
                '100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[1m])))')),
            ("PF-Prom-Throttling", prometheus(
                'sum by (name) (rate(container_cpu_cfs_throttled_periods_total{name=~"proyecto-final-(api|db)-1"}[1m]))',
                'sum(rate(http_requests_total[1m]))')),
        ],
    },
}
ESCENA, FUENTE = "PF-Demo", "PF-Pantalla"


def monitor_id(c):
    entradas = [i["inputName"] for i in c.get_input_list().inputs if i["inputKind"] == "monitor_capture"]
    if not entradas:
        raise SystemExit("OBS no tiene ninguna captura de monitor para leer la lista de monitores")
    r = c.send("GetInputPropertiesListPropertyItems",
               {"inputName": entradas[0], "propertyName": "monitor_id"}, raw=True)
    for it in r["propertyItems"]:
        if MONITOR_PRINCIPAL in it["itemValue"]:
            return it["itemValue"]
    raise SystemExit("No encontré el monitor principal en OBS")


def ajustar(c, nombre):
    item = c.get_scene_item_id(ESCENA, nombre).scene_item_id
    c.set_scene_item_transform(ESCENA, item, {
        "boundsType": "OBS_BOUNDS_SCALE_INNER", "boundsWidth": 1920.0, "boundsHeight": 1080.0,
        "positionX": 0.0, "positionY": 0.0})
    return item


def preparar(c, paginas):
    estado = {"escena": c.get_current_program_scene().current_program_scene_name, "mute": {}, "items": {}}
    for i in c.get_input_list().inputs:
        if i["inputKind"].startswith("wasapi"):
            estado["mute"][i["inputName"]] = c.get_input_mute(i["inputName"]).input_muted
    if ESCENA in [s["sceneName"] for s in c.get_scene_list().scenes]:
        c.remove_scene(ESCENA)
    c.create_scene(ESCENA)
    c.create_input(ESCENA, FUENTE, "monitor_capture", {"monitor_id": monitor_id(c), "capture_cursor": False}, True)
    ajustar(c, FUENTE)
    for nombre, url in paginas:  # ocultas; se recargan al mostrarlas para ver la carga actual
        c.create_input(ESCENA, nombre, "browser_source",
                       {"url": url, "width": 1920, "height": 1080, "shutdown": False,
                        "restart_when_active": True}, False)
        estado["items"][nombre] = ajustar(c, nombre)
    c.set_current_program_scene(ESCENA)
    for nombre in estado["mute"]:
        c.set_input_mute(nombre, True)
    return estado


def restaurar(c, estado, paginas):
    try:
        c.set_current_program_scene(estado["escena"])
    finally:
        for nombre, muted in estado["mute"].items():
            c.set_input_mute(nombre, muted)
        for nombre in [FUENTE] + [p[0] for p in paginas]:
            try:
                c.remove_input(nombre)
            except Exception:
                pass
        try:
            c.remove_scene(ESCENA)
        except Exception:
            pass


def mostrar_paginas(c, estado, paginas):
    for nombre, _ in paginas:
        c.set_scene_item_enabled(ESCENA, estado["items"][nombre], True)
        time.sleep(SEG_POR_PAGINA)
        c.set_scene_item_enabled(ESCENA, estado["items"][nombre], False)


def captura(c, fuente, destino):
    r = c.send("GetSourceScreenshot", {"sourceName": fuente, "imageFormat": "png", "imageWidth": 960}, raw=True)
    destino.write_bytes(base64.b64decode(r["imageData"].split(",", 1)[1]))
    print("captura:", destino)


def main(modo, parte):
    cfg = PARTES[parte]
    c = obs.ReqClient(host="localhost", port=4455, timeout=10)
    estado = preparar(c, cfg["paginas"])
    try:
        time.sleep(4)
        if modo == "prueba":
            carpeta = pathlib.Path(sys.argv[3]) if len(sys.argv) > 3 else TMP
            captura(c, ESCENA, carpeta / "obs-prueba-pantalla.png")
            for nombre, _ in cfg["paginas"]:
                c.set_scene_item_enabled(ESCENA, estado["items"][nombre], True)
                time.sleep(5)
                captura(c, ESCENA, carpeta / f"obs-prueba-{nombre}.png")
                c.set_scene_item_enabled(ESCENA, estado["items"][nombre], False)
            return
        factor = sys.argv[3] if len(sys.argv) > 3 else "1"
        c.start_record()
        time.sleep(1.5)
        # mintty puede devolver el control de inmediato: el fin se detecta con archivos marca
        lanzador, fin = TMP / "pf-demo-lanzador.sh", TMP / "pf-demo-fin"
        dash_on, dash_done = TMP / "pf-dash-on", TMP / "pf-dash-done"
        for m in (fin, dash_on, dash_done):
            m.unlink(missing_ok=True)
        lanzador.write_text(f'export DEMO_MARCAS="{TMP.as_posix()}"\n'
                            f'cd "{RAIZ.as_posix()}" && {cfg["demo"]} {factor}; touch "{fin.as_posix()}"\n',
                            encoding="utf-8")
        subprocess.Popen([MINTTY, "-p", "0,0", "-w", "full", "-o", "Font=Consolas", "-o", "FontHeight=17",
                          "-o", "BackgroundColour=24,26,34", "-o", "Charset=UTF-8", "-t", "PF-demo",
                          "-e", "/usr/bin/bash", "-l", lanzador.as_posix()], cwd=pathlib.Path.home())
        limite = time.time() + 1200
        while not fin.exists():
            if time.time() > limite:
                raise SystemExit("La demo no terminó en 20 minutos")
            if dash_on.exists():
                dash_on.unlink()
                mostrar_paginas(c, estado, cfg["paginas"])
                dash_done.touch()
            time.sleep(0.5)
        lanzador.unlink(missing_ok=True)
        fin.unlink(missing_ok=True)
        time.sleep(1)
        salida = c.stop_record().output_path
        print("grabación de OBS:", salida)
        time.sleep(3)
        destino = RAIZ / "docs" / "video" / cfg["salida"]
        destino.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(salida, destino)
        print("video final:", destino)
    finally:
        if c.get_record_status().output_active:
            c.stop_record()
        restaurar(c, estado, cfg["paginas"])
        print("OBS restaurado: escena", estado["escena"], "· audio como estaba")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "prueba", sys.argv[2] if len(sys.argv) > 2 else "A")
