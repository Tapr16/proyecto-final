#!/usr/bin/env bash
# Corre los escenarios de una fase de Kubernetes, uno tras otro, desde vm-jmeter:
# por cada número de réplicas resetea la BD (Job seed), escala la API, guarda la captura de
# `kubectl get pods -o wide` y lanza run_scenario.sh contra el NodePort de nodo1.
# Requiere SSH sin clave de vm-jmeter a nodo1 (pf@10.0.1.10).
# Uso: ./orquestar_fase.sh <nodos> ["1 2 3"]      ej.: ./orquestar_fase.sh 1
set -u
N=${1:?Falta el número de nodos}; REPLICAS="${2:-1 2 3}"
DIR=$(cd "$(dirname "$0")" && pwd)
RES=$DIR/../results
k() { ssh -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 pf@10.0.1.10 \
        "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml; $*" < /dev/null; }

for R in $REPLICAS; do
  ESC=k8s-${N}n-${R}r
  echo ">> [$ESC] reseteando la BD y escalando a $R réplica(s) · $(date '+%F %T')"
  k "kubectl -n proyecto delete job seed --ignore-not-found --wait=true >/dev/null &&
     kubectl apply -f proyecto-final/k8s/06-seed-job.yaml >/dev/null &&
     kubectl -n proyecto wait --for=condition=complete job/seed --timeout=15m >/dev/null &&
     kubectl -n proyecto scale deployment api --replicas=$R >/dev/null &&
     kubectl -n proyecto rollout status deployment/api --timeout=5m" \
    || { echo "!! falló la preparación de $ESC"; exit 1; }
  sleep 20   # pods Ready y estables antes de medir
  mkdir -p "$RES/$ESC"
  k "kubectl get nodes -o wide; echo; kubectl -n proyecto get pods -o wide" > "$RES/$ESC/pods.txt"
  echo ">> [$ESC] pods:"; sed -n '/^NAME .*READY/,$p' "$RES/$ESC/pods.txt"
  "$DIR/run_scenario.sh" "$ESC" 10.0.1.10 30080
done
echo ">> Fase de $N nodo(s) terminada · $(date '+%F %T')"
