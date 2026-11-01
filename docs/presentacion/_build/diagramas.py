"""Genera los diagramas (Graphviz) de la presentación del proyecto final."""
import pathlib
import subprocess

OUT = pathlib.Path(__file__).resolve().parent.parent / "diagramas"
OUT.mkdir(exist_ok=True)

OSCURO = "#1F2A37"
VIOLETA = "#6D28D9"   # Kubernetes / nodos
API = "#2563EB"
BD = "#DC2626"        # PostgreSQL (cuello de botella)
JMETER = "#B45309"
MON = "#0F766E"

COMUN = f'''
  graph [fontname="Arial", fontsize=13, bgcolor="white", pad=0.3, nodesep=0.35, ranksep=0.6, compound=true];
  node  [fontname="Arial", fontsize=12, shape=box, style="rounded,filled", color="{OSCURO}", penwidth=1.2];
  edge  [fontname="Arial", fontsize=10, color="#555555", penwidth=1.3];
'''


def render(nombre, dot):
    src = OUT / f"{nombre}.dot"
    src.write_text(dot, encoding="utf-8")
    subprocess.run(["dot", "-Tpng", "-Gdpi=200", str(src), "-o", str(OUT / f"{nombre}.png")], check=True)
    src.unlink()


# 1. Infraestructura en Google Cloud
render("infraestructura", f'''digraph G {{ {COMUN} rankdir=LR;
  subgraph cluster_vpc {{
    label="Google Cloud · us-central1-c · red privada vpc-pf 10.0.1.0/24"; labeljust="l"; fontsize=14;
    style="rounded,filled"; color="{OSCURO}"; fillcolor="#F3F5F8"; penwidth=1.5;
    jm [label="vm-jmeter\\n10.0.1.20\\nJMeter 5.6.3 (CLI)", fillcolor="{JMETER}", fontcolor="white", color="{JMETER}"];
    subgraph cluster_k3s {{
      label="clúster K3s"; labeljust="l"; fontsize=13; fontcolor="{VIOLETA}";
      style="rounded,filled"; color="{VIOLETA}"; fillcolor="#F1EAFE"; penwidth=2;
      n1 [label="nodo1 · 10.0.1.10\\nservidor K3s\\nPostgreSQL · Prometheus · Grafana\\n(Fase 1: Docker Compose)", fillcolor="white", color="{VIOLETA}"];
      n2 [label="nodo2 · 10.0.1.11\\nagente K3s", fillcolor="white", color="{VIOLETA}"];
      n3 [label="nodo3 · 10.0.1.12\\nagente K3s", fillcolor="white", color="{VIOLETA}"];
    }}
  }}
  jm -> n1 [label="HTTP  :8000 (Docker)\\n:30080 (NodePort)", color="{JMETER}", fontcolor="{JMETER}"];
  n1 -> n2 [dir=none, style=dashed, color="{VIOLETA}"];
  n1 -> n3 [dir=none, style=dashed, color="{VIOLETA}"];
}}''')

# 2. Camino de una petición en Kubernetes (3 nodos, 3 réplicas)
render("camino-peticion", f'''digraph G {{ {COMUN} rankdir=LR; nodesep=0.25;
  jm [label="JMeter\\n100-200 usuarios", fillcolor="{JMETER}", fontcolor="white", color="{JMETER}"];
  np [label="NodePort 30080\\nnodo1 (kube-proxy)", fillcolor="white"];
  subgraph cluster_api {{
    label="Deployment api (sin estado)"; labeljust="l"; style="rounded,filled"; color="{API}"; fillcolor="#E8F0FE"; fontcolor="{API}";
    a1 [label="api · nodo1\\npool 10+5", fillcolor="{API}", fontcolor="white", color="{API}"];
    a2 [label="api · nodo2\\npool 10+5", fillcolor="{API}", fontcolor="white", color="{API}"];
    a3 [label="api · nodo3\\npool 10+5", fillcolor="{API}", fontcolor="white", color="{API}"];
  }}
  pg [label="PostgreSQL · nodo1\\n1 instancia · límite 1 CPU\\n≈0,9 núcleos en uso", fillcolor="{BD}", fontcolor="white", color="{BD}", penwidth=2];
  jm -> np;
  np -> a1; np -> a2; np -> a3;
  a1 -> pg [label="≤15 conex."]; a2 -> pg [label="≤15"]; a3 -> pg [label="≤15"];
}}''')
print("diagramas en", OUT)
