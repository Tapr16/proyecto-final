"""Compara todos los escenarios medidos: throughput medio (req/s) por nivel de carga y errores.

Uso: python scripts/comparar_escenarios.py
Descarta los primeros 30 s (ramp-up) de cada corrida, igual que el notebook.
"""
import re
from pathlib import Path

import pandas as pd

RESULTS = Path(__file__).resolve().parent.parent / "results"
ORDEN = ["docker"] + [f"k8s-{n}n-{r}r" for n in (1, 2, 3) for r in (1, 2, 3)]
RAMP_MS = 30_000


def corridas(escenario):
    for f in sorted((RESULTS / escenario).glob("u*_r*.jtl")):
        u, r = map(int, re.findall(r"u(\d+)_r(\d+)", f.name)[0])
        d = pd.read_csv(f, low_memory=False, usecols=["timeStamp", "success"])
        d = d[d.timeStamp >= d.timeStamp.min() + RAMP_MS]
        ok = d["success"].astype(str).str.lower() == "true"
        dur = (d.timeStamp.max() - d.timeStamp.min()) / 1000
        yield {"escenario": escenario, "usuarios": u, "tps": ok.sum() / dur, "err": 100 * (1 - ok.mean())}


filas = [c for e in ORDEN if (RESULTS / e).is_dir() for c in corridas(e)]
res = pd.DataFrame(filas)
tps = res.pivot_table(index="escenario", columns="usuarios", values="tps").reindex(
    [e for e in ORDEN if e in set(res.escenario)])
err = res[res.usuarios >= 100].groupby("escenario").err.mean()
base = tps.loc["docker"].max() if "docker" in tps.index else None

print(f"  {'escenario':<11} |" + "".join(f" {u:>5} us" for u in tps.columns) + " | errores (100-200) | vs. Docker")
print("  " + "-" * (14 + 9 * len(tps.columns) + 33))
for esc, fila in tps.iterrows():
    rel = f"{100 * (fila.max() / base - 1):+5.0f} %" if base else ""
    print(f"  {esc:<11} |" + "".join(f" {v:>8.1f}" for v in fila) + f" | {err[esc]:>13.1f} %   | {rel:>8}")
print("\n  Throughput medio en req/s (3 repeticiones por celda). Columna = usuarios concurrentes.")
