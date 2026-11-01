#!/usr/bin/env bash
# Demo automática para el video, parte A: despliegue con Docker Compose (Fase 1). Sin audio:
# cada paso tiene un título en pantalla, los comandos se "escriben" y hay pausas para leer.
# Requisitos: nodo1 y vm-jmeter encendidas con la Fase 1 levantada, ~/.ssh/pf_config con sus IPs
# y un túnel a Prometheus en localhost:9090 (lo usa OBS para las gráficas del paso 4).
# Uso: scripts/demo-video-fase1.sh [factor-de-pausa]   (1 = normal, 0.2 = ensayo rápido)
set +e
cd "$(dirname "$0")/.."
F="${1:-1}"
export PATH="$PATH:/c/Users/Thomas/AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin"
export PYTHONIOENCODING=utf-8
MARCAS="${DEMO_MARCAS:-/tmp}"

C='\033[1;36m'; V='\033[1;32m'; A='\033[1;33m'; G='\033[0;37m'; N='\033[0m'
pausa() { sleep "$(awk "BEGIN{print $1*$F}")"; }

# Atajos que se ven en pantalla: ejecutan el comando en la VM por SSH
nodo1() { ssh -F ~/.ssh/pf_config nodo1 "$*" < /dev/null; }
vm_jmeter() { ssh -F ~/.ssh/pf_config vm-jmeter "$*" < /dev/null; }
python() { .venv/Scripts/python "$@"; }   # Python del proyecto (con pandas)

titulo() {  # $1 = "Paso N", $2 = qué se demuestra
  clear; echo
  printf "${C}  ══════════════════════════════════════════════════════════════════════════════${N}\n"
  printf "${C}   %s${N}\n" "$1"
  printf "${A}   %s${N}\n" "$2"
  printf "${C}  ══════════════════════════════════════════════════════════════════════════════${N}\n\n"
  pausa 3
}

nota() { printf "${G}  # %s${N}\n" "$1"; }

escribir() {  # simula que se escribe el comando y luego lo ejecuta
  printf "${V}\$ ${N}"
  local i; for ((i = 0; i < ${#1}; i++)); do printf '%s' "${1:i:1}"; sleep 0.02; done
  echo; pausa 0.6
  eval "$1"
  echo
}

titulo "Proyecto Final — Principios y Prácticas de Desarrollo de Software OO" \
       "Parte A: la tienda online (FastAPI + PostgreSQL) desplegada con Docker Compose"
nota "Integrantes: Thomas Perez · David Suarez · Jesus Santodomingo"
nota "Repositorio: github.com/Tapr16/Proyecto-Final-Principios"
pausa 5

titulo "Paso 1 · Infraestructura en Google Cloud" \
       "4 VMs n2d-standard-2 (2 vCPU, 8 GB) en la misma red privada 10.0.1.0/24"
nota "nodo2 y nodo3 están apagadas: se unen al clúster en las fases de Kubernetes"
escribir "./infra/gcp-create.sh ips"
pausa 6

titulo "Paso 2 · Fase 1: la aplicación corre en nodo1 con Docker Compose" \
       "API y PostgreSQL con los mismos límites que en Kubernetes + monitoreo"
nota "API: 1 CPU / 512 MB · PostgreSQL: 1 CPU / 2 GB · Prometheus, Grafana, cAdvisor, node-exporter"
escribir "nodo1 'cd proyecto-final && docker compose -f docker-compose.yml -f docker-compose.monitoring.yml ps --format \"table {{.Service}}\t{{.Image}}\t{{.Status}}\"'"
escribir "nodo1 'cd proyecto-final && docker compose exec -T db psql -U app -d tienda -c \"select (select count(*) from productos) productos, (select count(*) from clientes) clientes, (select count(*) from pedidos) pedidos, (select count(*) from items_pedido) items\"'"
pausa 6

titulo "Paso 3 · La API responde (desde vm-jmeter, por la red privada)" \
       "Lectura por id, búsqueda ILIKE, escritura transaccional y reporte con GROUP BY"
escribir "vm_jmeter 'curl -s http://10.0.1.10:8000/health'"
escribir "vm_jmeter 'curl -s http://10.0.1.10:8000/productos/42 | python3 -m json.tool'"
pausa 3
escribir "vm_jmeter 'curl -s \"http://10.0.1.10:8000/productos/buscar?q=andina\" | python3 -c \"import json,sys; r=json.load(sys.stdin); print(\\\"coincidencias:\\\", r[\\\"total\\\"])\"'"
escribir "vm_jmeter 'curl -s -X POST http://10.0.1.10:8000/pedidos -H \"Content-Type: application/json\" -d \"{\\\"cliente_id\\\": 7, \\\"items\\\": [{\\\"producto_id\\\": 42, \\\"cantidad\\\": 2}]}\"'"
escribir "vm_jmeter 'curl -s http://10.0.1.10:8000/reportes/ventas-por-categoria | python3 -m json.tool | head -14'"
pausa 5

titulo "Paso 4 · Prueba de carga con JMeter (50 usuarios, 100 s)" \
       "Mezcla: 50% por id · 25% por categoría · 10% búsqueda · 10% pedidos · 5% reporte"
nota "JMeter corre en vm-jmeter, una máquina distinta a la de la aplicación"
escribir "vm_jmeter 'cd proyecto-final/jmeter; nohup ~/apache-jmeter-5.6.3/bin/jmeter -n -t plan.jmx -Jhost=10.0.1.10 -Jport=8000 -Jcsv=ids.csv -Jthreads=50 -Jrampup=10 -Jduration=100 -l /tmp/demo.jtl -j /tmp/demo.log > /tmp/demo.out 2>&1 < /dev/null &'"
sleep 30   # fijo: esperar a que JMeter termine el ramp-up y la carga sea estable
nota "Uso de CPU por contenedor durante la carga:"
escribir "nodo1 'docker stats --no-stream --format \"table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\" proyecto-final-api-1 proyecto-final-db-1'"
pausa 6
nota "PostgreSQL está al 100% de su límite de 1 CPU; la API casi no trabaja (espera a la base de datos)"
pausa 4
nota "Progreso de JMeter (resumen cada 30 s):"
escribir "vm_jmeter 'grep \"summary +\" /tmp/demo.out | tail -2'"
pausa 5
nota "Gráficas de Prometheus (cAdvisor) durante la carga..."
if [ -n "$DEMO_MARCAS" ]; then   # lo pone tools/grabar_video.py: OBS muestra las gráficas
  touch "$MARCAS/pf-dash-on"
  while [ ! -f "$MARCAS/pf-dash-done" ]; do sleep 0.5; done
  rm -f "$MARCAS/pf-dash-done"
fi
nota "Esperando a que JMeter termine..."
vm_jmeter 'while pgrep -f "[A]pacheJMeter" >/dev/null; do sleep 2; done'
escribir "vm_jmeter 'grep \"summary =\" /tmp/demo.out | tail -1'"
pausa 6

titulo "Paso 5 · Resultados de la Fase 1 (12 corridas medidas)" \
       "10, 50, 100 y 200 usuarios × 3 repeticiones de 180 s (sin los 30 s de ramp-up)"
escribir "python scripts/resumen_resultados.py docker"
pausa 4
nota "El throughput se estanca en ~14,7 req/s desde 10 usuarios y el tiempo de respuesta crece"
nota "con la carga: el cuello de botella es PostgreSQL (1 CPU), no la API."
pausa 10

titulo "Fin de la parte A" "Siguiente: Kubernetes (K3s) con 1, 2 y 3 nodos y 1, 2 y 3 réplicas de la API"
pausa 5
