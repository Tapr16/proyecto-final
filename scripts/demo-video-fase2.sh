#!/usr/bin/env bash
# Demo automática para el video, parte B: Kubernetes (K3s) con 3 nodos. Sin audio:
# cada paso tiene un título en pantalla, los comandos se "escriben" y hay pausas para leer.
# Requisitos: clúster de 3 nodos encendido, ~/.ssh/pf_config con las IPs, túnel a Grafana
# (localhost:3300) y Prometheus (localhost:9090) para las gráficas del paso 4, y results/ completo.
# Uso: scripts/demo-video-fase2.sh [factor-de-pausa]   (1 = normal, 0.2 = ensayo rápido)
set +e
cd "$(dirname "$0")/.."
F="${1:-1}"
export PYTHONIOENCODING=utf-8
MARCAS="${DEMO_MARCAS:-/tmp}"

C='\033[1;36m'; V='\033[1;32m'; A='\033[1;33m'; G='\033[0;37m'; N='\033[0m'
pausa() { sleep "$(awk "BEGIN{print $1*$F}")"; }

# Atajos que se ven en pantalla: kubectl corre en nodo1 (servidor K3s) y JMeter en vm-jmeter
k() { ssh -F ~/.ssh/pf_config nodo1 "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml; kubectl $*" < /dev/null; }
vm_jmeter() { ssh -F ~/.ssh/pf_config vm-jmeter "$*" < /dev/null; }
python() { .venv/Scripts/python "$@"; }   # Python del proyecto (con pandas)

titulo() {
  clear; echo
  printf "${C}  ══════════════════════════════════════════════════════════════════════════════${N}\n"
  printf "${C}   %s${N}\n" "$1"
  printf "${A}   %s${N}\n" "$2"
  printf "${C}  ══════════════════════════════════════════════════════════════════════════════${N}\n\n"
  pausa 3
}

nota() { printf "${G}  # %s${N}\n" "$1"; }

escribir() {
  printf "${V}\$ ${N}"
  local i; for ((i = 0; i < ${#1}; i++)); do printf '%s' "${1:i:1}"; sleep 0.02; done
  echo; pausa 0.6
  eval "$1"
  echo
}

titulo "Proyecto Final — Principios y Prácticas de Desarrollo de Software OO" \
       "Parte B: la misma tienda online desplegada en Kubernetes (K3s) con 1, 2 y 3 nodos"
nota "Integrantes: Thomas Perez · David Suarez · Jesus Santodomingo"
pausa 4

titulo "Paso 1 · Clúster K3s con 3 nodos en Google Cloud" \
       "nodo1 = servidor (control-plane) + PostgreSQL + monitoreo · nodo2 y nodo3 = agentes"
escribir "k get nodes -L rol -o custom-columns=NODO:.metadata.name,ESTADO:.status.conditions[-1].type,IP:.status.addresses[0].address,VERSION:.status.nodeInfo.kubeletVersion,ROL:.metadata.labels.rol"
nota "nodo2 se unió para la fase de 2 nodos y nodo3 para la de 3 (k3s agent con el token de nodo1)"
pausa 6

titulo "Paso 2 · Despliegue de la aplicación (namespace proyecto)" \
       "Deployment de la API, StatefulSet de PostgreSQL, NodePort 30080 y monitoreo con Helm"
escribir "k -n proyecto get deployment,statefulset,service"
escribir "k -n proyecto get deployment api -o jsonpath='{.spec.template.spec.containers[0].resources}'; echo"
nota "Mismos límites que en Docker: API 1 CPU / 512 MB · PostgreSQL 1 CPU / 2 GB (fijo en nodo1)"
escribir "k -n monitoring get pods -o custom-columns=POD:.metadata.name,ESTADO:.status.phase,NODO:.spec.nodeName"
pausa 5

titulo "Paso 3 · Escalado horizontal en vivo" \
       "De 1 a 3 réplicas: Kubernetes reparte los pods entre los nodos (topologySpreadConstraints)"
escribir "k -n proyecto scale deployment api --replicas=1 && k -n proyecto rollout status deployment/api"
escribir "k -n proyecto get pods -l app=api -o wide"
pausa 3
escribir "k -n proyecto scale deployment api --replicas=3 && k -n proyecto rollout status deployment/api"
escribir "k -n proyecto get pods -o wide"
nota "Kubernetes reparte las réplicas entre los nodos; PostgreSQL sigue fijo en nodo1"
pausa 6

titulo "Paso 4 · Prueba de carga contra el NodePort (100 usuarios, 150 s)" \
       "JMeter en vm-jmeter → http://10.0.1.10:30080 → kube-proxy reparte entre las 3 réplicas"
escribir "vm_jmeter 'cd proyecto-final/jmeter; nohup ~/apache-jmeter-5.6.3/bin/jmeter -n -t plan.jmx -Jhost=10.0.1.10 -Jport=30080 -Jcsv=ids.csv -Jthreads=100 -Jrampup=10 -Jduration=150 -l /tmp/demo.jtl -j /tmp/demo.log > /tmp/demo.out 2>&1 < /dev/null &'"
sleep 70   # fijo: carga estable y métricas de 1 min ya actualizadas
nota "Uso de CPU por nodo y por pod durante la carga (metrics-server):"
escribir "k top nodes"
escribir "k -n proyecto top pods"
nota "PostgreSQL usa ~1 núcleo (su límite) y satura nodo1; nodo2 y nodo3 casi no trabajan:"
nota "agregar nodos no ayuda mientras la base de datos sea una sola instancia"
pausa 6
nota "Gráficas de Grafana y Prometheus durante la carga..."
if [ -n "$DEMO_MARCAS" ]; then   # lo pone tools/grabar_video.py: OBS muestra las gráficas
  touch "$MARCAS/pf-dash-on"
  while [ ! -f "$MARCAS/pf-dash-done" ]; do sleep 0.5; done
  rm -f "$MARCAS/pf-dash-done"
fi
nota "Esperando a que JMeter termine..."
vm_jmeter 'while pgrep -f "[A]pacheJMeter" >/dev/null; do sleep 2; done'
escribir "vm_jmeter 'grep \"summary =\" /tmp/demo.out | tail -1'"
pausa 5

titulo "Paso 5 · Resultados: 10 escenarios × 4 cargas × 3 repeticiones (120 corridas)" \
       "Docker y Kubernetes con 1, 2 y 3 nodos × 1, 2 y 3 réplicas de la API"
escribir "python scripts/comparar_escenarios.py"
pausa 4
nota "1) Docker ≈ Kubernetes con 1 réplica: la orquestación casi no añade costo (~1-2 %)."
pausa 3
nota "2) Más réplicas suben el throughput (2: +35-40 %, 3: +55-60 %): más conexiones simultáneas a PostgreSQL."
pausa 3
nota "3) Más nodos casi no cambian el resultado (~+5 % con 3): el cuello de botella es PostgreSQL (1 CPU, nodo1)."
pausa 3
nota "4) Hallazgos: las sondas por defecto (1 s) reiniciaban la API bajo carga, y con 2-3 réplicas"
nota "   el /dev/shm de 64 MB de PostgreSQL se agota (errores 6-8 % en el reporte)."
pausa 12

titulo "Fin de la demostración" "Repositorio: github.com/Tapr16/Proyecto-Final-Principios"
pausa 5
