"""Calcula, desde results/, los datos de los gráficos nativos de la presentación (datos.json)."""
import json
import re
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parents[3]
RES = RAIZ / "results"
RAMP_MS = 30_000
ESC = ["docker"] + [f"k8s-{n}n-{r}r" for n in (1, 2, 3) for r in (1, 2, 3)]

filas, rep = [], []
for e in ESC:
    for f in sorted((RES / e).glob("u*_r*.jtl")):
        u, r = map(int, re.findall(r"u(\d+)_r(\d+)", f.name)[0])
        d = pd.read_csv(f, low_memory=False, usecols=["timeStamp", "elapsed", "label", "success"])
        d = d[d.timeStamp >= d.timeStamp.min() + RAMP_MS]
        ok = d.success.astype(str).str.lower() == "true"
        dur = (d.timeStamp.max() - d.timeStamp.min()) / 1000
        filas.append({"esc": e, "u": u, "r": r, "tps": ok.sum() / dur, "rt": d.elapsed.mean() / 1000,
                      "err": 100 * (1 - ok.mean())})
        if u >= 100:
            rr = d.label.str.contains("reportes")
            rep.append({"esc": e, "rep_fallidos": 100 * (1 - ok[rr].mean())})
res = pd.DataFrame(filas)
m = res.groupby(["esc", "u"]).agg(tps=("tps", "mean"), rt=("rt", "mean"), err=("err", "mean")).reset_index()

def serie(e, col):
    return [round(float(v), 2) for v in m[m.esc == e].sort_values("u")[col]]

# Métricas de Prometheus con 200 usuarios (media de las 3 repeticiones)
cpu_pg, cpu_api, nodos = {}, {}, {}
for e in ESC:
    pg, api, nd = [], [], {}
    for r in (1, 2, 3):
        c = pd.read_csv(RES / "prometheus" / f"{e}_u200_r{r}_cpu_pod.csv")
        c = c[c.ts >= c.ts.min() + 30].groupby("serie").valor.mean()
        pg.append(sum(v for s, v in c.items() if "postgres" in s or "-db-" in s))
        api.append(sum(v for s, v in c.items() if s.startswith("api") or "-api-" in s))
        n = pd.read_csv(RES / "prometheus" / f"{e}_u200_r{r}_cpu_nodo.csv")
        n = n[n.ts >= n.ts.min() + 30].groupby("serie").valor.mean()
        for s, v in n.items():
            nombre = {"10.0.1.11:9100": "nodo2", "10.0.1.12:9100": "nodo3"}.get(s, "nodo1")
            nd.setdefault(nombre, []).append(100 * v)
    cpu_pg[e] = round(sum(pg) / 3, 2)
    cpu_api[e] = round(sum(api) / 3, 3)
    nodos[e] = {k: round(sum(v) / len(v), 1) for k, v in nd.items()}

t200 = {e: round(float(m[(m.esc == e) & (m.u == 200)].tps.iloc[0]), 1) for e in ESC}
datos = {
    "usuarios": [10, 50, 100, 200],
    "tps": {e: serie(e, "tps") for e in ESC},
    "rt": {e: serie(e, "rt") for e in ESC},
    "err": {e: serie(e, "err") for e in ESC},
    "tps200": t200,
    "speedup": {n: [round(t200[f"k8s-{n}n-{r}r"] / t200[f"k8s-{n}n-1r"], 2) for r in (1, 2, 3)] for n in (1, 2, 3)},
    "cpu_pg": cpu_pg, "cpu_api": cpu_api, "cpu_nodos": nodos,
    "reportes_fallidos": pd.DataFrame(rep).groupby("esc").rep_fallidos.mean().round(1).to_dict(),
    "peticiones": int(sum(len(pd.read_csv(f, usecols=["timeStamp"])) for e in ESC for f in (RES / e).glob("u*_r*.jtl"))),
}
(Path(__file__).parent / "datos.json").write_text(json.dumps(datos, indent=1, ensure_ascii=False), encoding="utf-8")
print(json.dumps({k: datos[k] for k in ("tps200", "speedup", "cpu_pg", "cpu_api", "reportes_fallidos", "peticiones")}, indent=1))
print("nodos 3n-3r:", nodos["k8s-3n-3r"])
