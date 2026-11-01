"""Tabla resumen de un escenario a partir de sus .jtl (media ± desviación de las repeticiones).

Uso: python scripts/resumen_resultados.py docker
Descarta los primeros 30 s (ramp-up) de cada corrida, igual que el notebook.
"""
import re
import sys
from pathlib import Path

import pandas as pd

RESULTS = Path(__file__).resolve().parent.parent / "results"
RAMP_MS = 30_000


def resumir(escenario):
    filas = []
    for f in sorted((RESULTS / escenario).glob("u*_r*.jtl")):
        u, r = map(int, re.findall(r"u(\d+)_r(\d+)", f.name)[0])
        d = pd.read_csv(f, low_memory=False)
        ok = d["success"].astype(str).str.lower() == "true"
        d, ok = d[d.timeStamp >= d.timeStamp.min() + RAMP_MS], ok[d.timeStamp >= d.timeStamp.min() + RAMP_MS]
        dur = (d.timeStamp.max() - d.timeStamp.min()) / 1000
        filas.append({"usuarios": u, "rep": r, "tps": ok.sum() / dur, "rt": d.elapsed.mean(),
                      "p95": d.elapsed.quantile(0.95), "err": 100 * (1 - ok.mean())})
    res = pd.DataFrame(filas)
    t = res.groupby("usuarios").agg(tps=("tps", "mean"), tps_std=("tps", "std"),
                                    rt=("rt", "mean"), p95=("p95", "mean"), err=("err", "mean"))
    print(f"  Escenario '{escenario}': {len(res)} corridas ({res.rep.nunique()} repeticiones por carga)\n")
    print(f"  {'usuarios':>8} | {'throughput (req/s)':>18} | {'t. medio':>9} | {'p95':>8} | {'errores':>7}")
    print("  " + "-" * 64)
    for u, f in t.iterrows():
        print(f"  {u:>8} | {f.tps:>10.1f} ± {f.tps_std:<5.1f} | {f.rt / 1000:>7.1f} s | "
              f"{f.p95 / 1000:>6.1f} s | {f.err:>6.2f} %")


if __name__ == "__main__":
    resumir(sys.argv[1] if len(sys.argv) > 1 else "docker")
