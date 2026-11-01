// Genera docs/presentacion/Presentacion-Proyecto-Final.pptx
// Uso: python datos.py && python diagramas.py && PPTX_SKILL=<carpeta del skill pptx> node diapos.js
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");
const D = require("./datos.json");

const DOCS = path.resolve(__dirname, "..", "..");
const DG = (f) => path.join(DOCS, "presentacion", "diagramas", f);
const RC = (f) => path.join(DOCS, "presentacion", "recortes", f);
const CAP = (f) => path.join(DOCS, "capturas", f);
const OUT = path.join(DOCS, "presentacion", "Presentacion-Proyecto-Final.pptx");

const THEME = {
  name: "Escenarios de despliegue",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1F2A37", lt1: "FFFFFF", dk2: "2B3A4B", lt2: "F3F5F8",
    accent1: "6D28D9", accent2: "2563EB", accent3: "F26B1D", accent4: "16A34A",
    accent5: "DC2626", accent6: "B45309", hlink: "2563EB", folHlink: "6B7280",
  },
};
// Colores en hex para opciones que no aceptan colores del tema
const HEX = { dark: "1F2A37", violet: "6D28D9", tint: "EEE7FD", light: "F3F5F8", muted: "5B6675", code: "17202B",
  docker: "6B7280", r1: "2563EB", r2: "F26B1D", r3: "16A34A", pg: "DC2626", ok: "15803D", grid: "E5E7EB" };
const CHIP = { FastAPI: "059669", PostgreSQL: "336791", Docker: "1D63ED", K3s: "6D28D9", JMeter: "B45309", Prometheus: "C2410C" };

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Comportamiento de una aplicación bajo diferentes escenarios de despliegue";
pres.author = "David Suarez · Thomas Perez · Jesus Santodomingo";
const C = pres.SchemeColor;

// ---------- Layouts ----------
pres.defineSlideMaster({
  title: "PORTADA",
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.05, w: 8.8, h: 2.0, fontSize: 32, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 3.15, w: 8.8, h: 0.45, fontSize: 16, color: "C4B5FD", valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENIDO",
  background: { color: C.background1 },
  slideNumber: { x: 9.2, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: "8A94A3" },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.25, w: 9.0, h: 0.75, fontSize: 28, bold: true, color: C.text1, valign: "middle", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CIERRE",
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.35, w: 9.0, h: 0.8, fontSize: 32, bold: true, color: C.background1, valign: "middle", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.5, y: 1.35, w: 9.0, h: 3.9, fontSize: 17, color: C.background1, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "SECCION",
  background: { color: C.accent1 },
  slideNumber: { x: 9.2, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: "FFFFFF" },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.9, w: 8.8, h: 1.1, fontSize: 40, bold: true, color: C.background1, valign: "middle", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 3.0, w: 8.8, h: 0.8, fontSize: 18, color: C.background1, valign: "top", margin: 0 }, text: "" } },
  ],
});

// ---------- helpers ----------
let sec = "";
function slide(master, title, section) {
  if (section && section !== sec) { pres.addSection({ title: section }); sec = section; }
  const s = pres.addSlide({ masterName: master, sectionTitle: sec });
  if (title) s.addText(title, { placeholder: "title" });
  return s;
}
function seccion(titulo, sub, section) {
  const s = slide("SECCION", titulo, section);
  s.addText(sub, { placeholder: "body" });
  return s;
}
function text(s, t, o) { s.addText(t, { isTextBox: true, fontSize: 14, color: C.text1, valign: "top", ...o }); }
function bullets(s, items, o) {
  s.addText(items.map((it, i) => {
    const runs = typeof it === "string" ? { text: it, options: {} } : it;
    return { text: runs.text, options: { bullet: { indent: 14 }, breakLine: i < items.length - 1, ...runs.options } };
  }), { isTextBox: true, fontSize: 14, color: C.text1, valign: "top", paraSpaceAfter: 6, ...o });
}
function code(s, src, o) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: o.x, y: o.y, w: o.w, h: o.h, fill: { color: HEX.code }, line: { type: "none" }, rectRadius: 0.08, objectName: "fondo-codigo" });
  if (o.label) text(s, o.label, { x: o.x + 0.15, y: o.y + 0.08, w: o.w - 0.3, h: 0.25, fontSize: 10, color: "C4B5FD", bold: true, margin: 0 });
  const top = o.label ? 0.35 : 0.12;
  s.addText(src, { isTextBox: true, x: o.x + 0.15, y: o.y + top, w: o.w - 0.3, h: o.h - top - 0.1, fontFace: "Consolas", fontSize: o.fs || 10, color: "E6EDF3", valign: "top", margin: 0, objectName: "codigo" });
}
function card(s, x, y, w, h, fill, opts = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: opts.line ? { color: opts.line, width: 1 } : { type: "none" }, rectRadius: 0.1,
    shadow: opts.shadow ? { type: "outer", color: "000000", opacity: 0.12, blur: 6, offset: 2, angle: 90 } : undefined, objectName: opts.name || "tarjeta" });
}
function badge(s, x, y, n, color = C.accent1) {
  s.addShape(pres.shapes.OVAL, { x, y, w: 0.42, h: 0.42, fill: { color }, line: { type: "none" }, objectName: "numero" });
  s.addText(String(n), { isTextBox: true, x, y, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0 });
}
function img(s, file, x, y, maxW, maxH, pxW, pxH, alt) {
  const r = Math.min(maxW / pxW, maxH / pxH);
  const w = pxW * r, h = pxH * r;
  s.addImage({ path: file, x: x + (maxW - w) / 2, y: y + (maxH - h) / 2, w, h, altText: alt });
}
function caption(s, t, x, y, w) { text(s, t, { x, y, w, h: 0.3, fontSize: 10, color: HEX.muted, italic: true, align: "center", margin: 0 }); }
function stat(s, x, y, w, big, lbl, color = C.accent1) {
  text(s, big, { x, y, w, h: 0.75, fontSize: 36, bold: true, color, margin: 0 });
  text(s, lbl, { x, y: y + 0.75, w, h: 0.5, fontSize: 12, color: HEX.muted, margin: 0 });
}
const H = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: HEX.dark } } });
const TABLA = { color: HEX.dark, border: { type: "solid", color: "D5DAE1", pt: 0.75 }, fontFace: "Calibri", valign: "middle" };
const fmt = (n, d = 1) => n.toFixed(d).replace(".", ",");
// Estilo común de los gráficos nativos
const GRAF = () => ({
  catAxisLabelColor: HEX.muted, valAxisLabelColor: HEX.muted, catAxisLabelFontSize: 10, valAxisLabelFontSize: 10,
  catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", legendFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt",
  titleFontFace: "+mn-lt", valGridLine: { color: HEX.grid, size: 0.5 }, catGridLine: { style: "none" },
  legendFontSize: 10, legendColor: HEX.muted, titleFontSize: 12, titleColor: HEX.dark,
  catAxisLineShow: false, valAxisLineShow: false,
});
const U = D.usuarios.map(String);
const ESC1N = ["docker", "k8s-1n-1r", "k8s-1n-2r", "k8s-1n-3r"];

// =========================================================
// Portada
let s = slide("PORTADA", "Comportamiento de una aplicación bajo diferentes escenarios de despliegue", "Inicio");
s.addText("Docker Compose vs. Kubernetes (K3s) con 1, 2 y 3 nodos · Proyecto Final", { placeholder: "body" });
Object.keys(CHIP).forEach((l, i) => {
  card(s, 0.6 + i * 1.18, 4.5, 1.08, 0.38, CHIP[l], { name: "chip-tecnologia" });
  text(s, l, { x: 0.6 + i * 1.18, y: 4.5, w: 1.08, h: 0.38, fontSize: 11, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0 });
});
text(s, "Principios y Prácticas de Desarrollo de Software Orientado a Objetos", { x: 0.6, y: 0.45, w: 8.8, h: 0.4, fontSize: 13, color: "AAB4C3", margin: 0 });
text(s, [
  { text: "David Esteban Suarez Lozano · 2221909", options: { breakLine: true } },
  { text: "Thomas Alejandro Perez Rojas · 2221906", options: { breakLine: true } },
  { text: "Jesus David Santodomingo Carrascal · 2221922", options: {} },
], { x: 0.6, y: 3.72, w: 8.8, h: 0.68, fontSize: 11, color: "D5DAE1", align: "left", valign: "top", margin: 0, objectName: "integrantes" });
s.addNotes("Presentamos el proyecto final: desplegamos la misma API de una tienda online de 10 formas distintas, con Docker Compose y con Kubernetes en 1, 2 y 3 nodos, y medimos con JMeter cómo cambian el rendimiento y los errores.");

// Agenda
s = slide("CONTENIDO", "Agenda", "Inicio");
[["Contexto", "Qué pide el proyecto y la matriz de escenarios"],
 ["Aplicación", "La tienda online y sus endpoints"],
 ["Infraestructura", "Google Cloud, Docker Compose y K3s"],
 ["Metodología", "JMeter, 120 corridas y monitoreo"],
 ["Resultados", "Throughput, escalado y cuello de botella"],
 ["Hallazgos y cierre", "Sondas, /dev/shm, conclusiones"]].forEach(([t, d], i) => {
  const col = i % 3, row = Math.floor(i / 3);
  const x = 0.5 + col * 3.05, y = 1.35 + row * 1.85;
  card(s, x, y, 2.85, 1.55, HEX.light, { shadow: true });
  badge(s, x + 0.2, y + 0.22, i + 1);
  text(s, t, { x: x + 0.75, y: y + 0.2, w: 2.0, h: 0.45, fontSize: 17, bold: true, valign: "middle", margin: 0 });
  text(s, d, { x: x + 0.2, y: y + 0.8, w: 2.5, h: 0.6, fontSize: 13, color: HEX.muted, margin: 0 });
});

// =========================================================
seccion("1 · Contexto", "Medir qué cambia al orquestar y escalar una aplicación", "Contexto");

s = slide("CONTENIDO", "Lo que pide el proyecto y cómo lo cumplimos", "Contexto");
s.addTable([
  [H("Requisito"), H("Cómo lo resolvimos")],
  ["Aplicación con BD de ≥ 10.000 registros", "Tienda FastAPI + PostgreSQL con ~920.000 registros"],
  ["Despliegue con Docker", "Docker Compose en nodo1 (línea base)"],
  ["Kubernetes con 1, 2 y 3 nodos", "Clúster K3s en Google Cloud, un nodo más por fase"],
  ["Distinto número de réplicas", "1, 2 y 3 réplicas de la API en cada fase"],
  ["Pruebas de carga desde otra máquina", "JMeter 5.6.3 en vm-jmeter, misma red privada"],
  ["Monitorización (opcional)", "Prometheus + Grafana + cAdvisor + node-exporter"],
  ["Análisis en notebook", "Jupyter / Colab con 8 gráficas y conclusiones"],
], { x: 0.5, y: 1.15, w: 9.0, colW: [3.9, 5.1], fontSize: 13, rowH: 0.47, ...TABLA });

s = slide("CONTENIDO", "Matriz del experimento", "Contexto");
[["10", "escenarios", "Docker + 3 nodos × 3 réplicas"], ["120", "corridas", "4 cargas × 3 repeticiones"], [Math.round(D.peticiones / 1000) + " mil", "peticiones", "enviadas por JMeter"]].forEach(([big, l, d], i) => {
  const x = 0.5 + i * 3.05;
  card(s, x, 1.15, 2.85, 1.55, HEX.tint);
  text(s, big, { x: x + 0.2, y: 1.25, w: 2.45, h: 0.75, fontSize: 38, bold: true, color: HEX.violet, margin: 0 });
  text(s, l, { x: x + 0.2, y: 1.98, w: 2.45, h: 0.3, fontSize: 15, bold: true, margin: 0 });
  text(s, d, { x: x + 0.2, y: 2.3, w: 2.45, h: 0.3, fontSize: 12, color: HEX.muted, margin: 0 });
});
const X = { text: "●", options: { color: HEX.violet, align: "center" } };
s.addTable([
  [H("Escenario"), H("1 réplica"), H("2 réplicas"), H("3 réplicas"), H("Cargas (usuarios)")],
  ["Docker Compose (1 VM)", X, "", "", "10 · 50 · 100 · 200"],
  ["Kubernetes · 1 nodo", X, X, X, "10 · 50 · 100 · 200"],
  ["Kubernetes · 2 nodos", X, X, X, "10 · 50 · 100 · 200"],
  ["Kubernetes · 3 nodos", X, X, X, "10 · 50 · 100 · 200"],
], { x: 0.5, y: 2.95, w: 9.0, colW: [2.8, 1.25, 1.25, 1.25, 2.45], fontSize: 13, rowH: 0.42, ...TABLA });
s.addNotes("Son 10 escenarios: Docker como referencia y 9 combinaciones de Kubernetes. Cada uno con 10, 50, 100 y 200 usuarios y 3 repeticiones de 3 minutos: 120 corridas.");

// =========================================================
seccion("2 · La aplicación", "Una tienda online con lecturas, búsquedas, escrituras y reportes", "Aplicación");

s = slide("CONTENIDO", "Tienda online: FastAPI + PostgreSQL", "Aplicación");
s.addTable([
  [H("Endpoint"), H("Tipo de carga"), H("Peso")],
  ["GET /productos/{id}", "Lectura por clave primaria", "50 %"],
  ["GET /productos?categoria=X", "Lectura paginada con filtro", "25 %"],
  ["GET /productos/buscar?q=", "ILIKE + conteo (toda la tabla)", "10 %"],
  ["POST /pedidos", "Escritura transaccional", "10 %"],
  ["GET /reportes/ventas-por-categoria", "JOIN + GROUP BY sobre 600 mil items", "5 %"],
], { x: 0.5, y: 1.15, w: 5.9, colW: [2.7, 2.45, 0.75], fontSize: 12, rowH: 0.5, ...TABLA });
card(s, 6.7, 1.15, 2.8, 3.0, HEX.light);
[["100.000", "productos"], ["20.000", "clientes"], ["200.000", "pedidos"], ["599.346", "items de pedido"]].forEach(([n, l], i) => {
  text(s, n, { x: 6.9, y: 1.28 + i * 0.7, w: 1.35, h: 0.45, fontSize: 18, bold: true, color: HEX.violet, margin: 0, valign: "middle" });
  text(s, l, { x: 8.25, y: 1.28 + i * 0.7, w: 1.2, h: 0.45, fontSize: 12, color: HEX.muted, margin: 0, valign: "middle" });
});
text(s, "Datos generados con Faker y semilla fija: idénticos en todos los escenarios, y la BD se resetea antes de cada uno", { x: 0.5, y: 4.3, w: 9.0, h: 0.6, fontSize: 13, color: HEX.muted, italic: true, margin: 0 });

s = slide("CONTENIDO", "Decisiones para una comparación justa", "Aplicación");
[["1 worker por contenedor", "La unidad de escalado es la réplica, no el proceso"],
 ["Mismos límites en todo", "API: 1 CPU / 512 MB · PostgreSQL: 1 CPU / 2 GB"],
 ["Pool acotado", "10 + 5 conexiones por réplica: máximo 45 con 3"],
 ["Una sola PostgreSQL", "Fija en nodo1: solo se escala la API, como pide la guía"]].forEach(([t, d], i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const x = 0.5 + col * 2.6, y = 1.2 + row * 1.85;
  card(s, x, y, 2.4, 1.6, HEX.light, { shadow: true });
  badge(s, x + 0.2, y + 0.2, i + 1);
  text(s, t, { x: x + 0.72, y: y + 0.16, w: 1.6, h: 0.55, fontSize: 14, bold: true, valign: "middle", margin: 0 });
  text(s, d, { x: x + 0.2, y: y + 0.8, w: 2.05, h: 0.7, fontSize: 12, color: HEX.muted, margin: 0 });
});
code(s, `@app.get("/productos/buscar")
async def buscar(q: str, ...):
  p = f"%{q}%"
  filtro = (nombre.ilike(p)
            | descripcion.ilike(p))
  # cuenta TODA la tabla:
  total = await s.scalar(
    select(count()).where(filtro))
  filas = await s.scalars(
    select(Producto).where(filtro)
    .limit(20))
  return {"total": total, ...}`, { x: 5.85, y: 1.2, w: 3.65, h: 3.45, fs: 10, label: "app/main.py · endpoint costoso (resumido)" });

// =========================================================
seccion("3 · Infraestructura", "Google Cloud, Docker Compose y Kubernetes (K3s)", "Infraestructura");

s = slide("CONTENIDO", "4 VMs en la misma red privada", "Infraestructura");
img(s, DG("infraestructura.png"), 0.5, 1.05, 9.0, 3.05, 1933, 656, "vm-jmeter envía HTTP a nodo1; nodo1, nodo2 y nodo3 forman el clúster K3s");
[["n2d-standard-2", "2 vCPU AMD · 8 GB · no burstable (como D2as_v5)"],
 ["JMeter aparte", "Otra VM de la misma red: latencia baja y estable"],
 ["De Azure a Google Cloud", "Azure for Students no tenía cuota (6 vCPU, DASv5 = 0)"]].forEach(([t, d], i) => {
  const x = 0.5 + i * 3.05;
  card(s, x, 4.15, 2.85, 0.95, HEX.light);
  text(s, t, { x: x + 0.15, y: 4.2, w: 2.55, h: 0.3, fontSize: 13, bold: true, color: HEX.violet, margin: 0 });
  text(s, d, { x: x + 0.15, y: 4.5, w: 2.6, h: 0.55, fontSize: 11, color: HEX.dark, margin: 0 });
});
s.addNotes("Usamos 4 VMs n2d-standard-2 en Google Cloud, todas en la misma red privada. nodo1 hizo la Fase 1 con Docker y luego fue el servidor de K3s; nodo2 y nodo3 se unieron en las fases de 2 y 3 nodos. JMeter corre aparte. Empezamos en Azure, pero la cuota de estudiante no alcanzaba.");

s = slide("CONTENIDO", "Fase 1: Docker Compose", "Infraestructura");
code(s, `services:
  db:
    image: postgres:16
    cpus: "1.0"
    mem_limit: 2g
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d tienda"]
  api:
    image: ghcr.io/tapr16/pf-api:1.0
    environment:
      DATABASE_URL: postgresql+asyncpg://app:...@db:5432/tienda
      DB_POOL_SIZE: "10"
    ports: ["8000:8000"]
    depends_on: { db: { condition: service_healthy } }
    cpus: "1.0"
    mem_limit: 512m`, { x: 0.5, y: 1.15, w: 5.4, h: 3.85, fs: 10.5, label: "docker-compose.yml (resumido)" });
bullets(s, [
  "Imagen publicada en GHCR por un GitHub Action: la misma en todas las fases",
  "Monitoreo aparte: Prometheus, Grafana, cAdvisor y node-exporter",
  { text: "Docker 29 + cAdvisor: hubo que volver al almacenamiento overlay2 para ver los contenedores", options: { bold: true, color: HEX.violet } },
], { x: 6.2, y: 1.25, w: 3.3, h: 3.7, fontSize: 14 });

s = slide("CONTENIDO", "Fases 2-4: Kubernetes con K3s", "Infraestructura");
code(s, `kind: Deployment
metadata: { name: api, namespace: proyecto }
spec:
  replicas: 1          # se escala a 2 y 3
  template:
    spec:
      topologySpreadConstraints:
        - { maxSkew: 1, topologyKey: kubernetes.io/hostname,
            whenUnsatisfiable: ScheduleAnyway }
      containers:
        - name: api
          image: ghcr.io/tapr16/pf-api:1.0
          resources:
            requests: { cpu: 250m, memory: 512Mi }
            limits:   { cpu: "1",  memory: 512Mi }
          readinessProbe: { httpGet: { path: /health },
                            timeoutSeconds: 30 }
          livenessProbe:  { tcpSocket: { port: 8000 } }`, { x: 0.5, y: 1.15, w: 5.6, h: 3.85, fs: 10, label: "k8s/04-api-deployment.yaml (resumido)" });
[["StatefulSet PostgreSQL", "Fijo en nodo1 con nodeSelector rol=db"],
 ["NodePort 30080", "Entrada única por nodo1; kube-proxy reparte"],
 ["Job seed", "Resetea la BD antes de cada escenario"],
 ["Unión de nodos", "k3s agent con el token de nodo1 + rollout restart"]].forEach(([t, d], i) => {
  const y = 1.2 + i * 0.95;
  badge(s, 6.35, y, i + 1);
  text(s, t, { x: 6.9, y: y - 0.04, w: 2.6, h: 0.32, fontSize: 13, bold: true, margin: 0 });
  text(s, d, { x: 6.9, y: y + 0.28, w: 2.6, h: 0.55, fontSize: 11, color: HEX.muted, margin: 0 });
});

s = slide("CONTENIDO", "Monitorización con Prometheus y Grafana", "Infraestructura");
img(s, CAP("fase2-k8s-1n-3r-grafana.jpg"), 0.5, 1.1, 5.6, 3.5, 800, 500, "Grafana: CPU por pod con 3 réplicas; PostgreSQL arriba y las réplicas casi en cero");
caption(s, "Grafana · 1 nodo, 3 réplicas, 200 usuarios: CPU por pod", 0.5, 4.65, 5.6);
bullets(s, [
  "kube-prometheus-stack con Helm, fijo en nodo1",
  "node-exporter en cada nodo y ServiceMonitor para /metrics de la API",
  "Métricas exportadas a CSV por corrida para el notebook",
  { text: "Grafana en solo lectura y por túnel SSH: nada expuesto a internet", options: { bold: true, color: HEX.violet } },
], { x: 6.4, y: 1.2, w: 3.1, h: 3.8, fontSize: 14 });

// =========================================================
seccion("4 · Metodología", "Las mismas pruebas, con las mismas reglas, en cada escenario", "Metodología");

s = slide("CONTENIDO", "Plan de carga con JMeter", "Metodología");
s.addChart(pres.charts.DOUGHNUT, [{ name: "Mezcla", labels: ["Por id", "Por categoría", "Búsqueda", "Pedidos (POST)", "Reporte"], values: [50, 25, 10, 10, 5] }], {
  x: 0.4, y: 1.05, w: 4.2, h: 3.9, holeSize: 55, chartColors: [HEX.r1, "60A5FA", HEX.r2, HEX.r3, HEX.pg],
  showPercent: true, showValue: false, dataLabelColor: "FFFFFF", dataLabelFontSize: 11, dataLabelFontFace: "+mn-lt",
  showLegend: true, legendPos: "b", legendFontSize: 10, legendFontFace: "+mn-lt", legendColor: HEX.muted,
  showTitle: true, title: "Mezcla de peticiones", titleFontSize: 12, titleColor: HEX.dark, titleFontFace: "+mn-lt",
});
s.addTable([
  [H("Parámetro"), H("Valor")],
  ["Usuarios concurrentes", "10 · 50 · 100 · 200"],
  ["Duración por corrida", "180 s (30 s de ramp-up)"],
  ["Repeticiones", "3 por nivel de carga"],
  ["Calentamiento", "60 s, descartado"],
  ["Pausa entre corridas", "30 s"],
  ["Al analizar", "Se quitan los primeros 30 s"],
  ["Aserción", "Código 200 o 201"],
], { x: 4.9, y: 1.15, w: 4.6, colW: [2.2, 2.4], fontSize: 12, rowH: 0.45, ...TABLA });

s = slide("CONTENIDO", "Una fase de Kubernetes, automatizada", "Metodología");
[["Resetear BD", "Job seed: mismos datos"], ["Escalar", "1, 2 o 3 réplicas"], ["Capturar", "kubectl get pods -o wide"], ["Medir", "run_scenario.sh: 12 corridas"], ["Exportar", "Prometheus → CSV"]].forEach(([t, d], i) => {
  const x = 0.5 + i * 1.84;
  card(s, x, 1.3, 1.66, 1.6, HEX.light, { shadow: true });
  badge(s, x + 0.62, 1.12, i + 1);
  text(s, t, { x: x + 0.1, y: 1.65, w: 1.46, h: 0.4, fontSize: 14, bold: true, align: "center", margin: 0 });
  text(s, d, { x: x + 0.12, y: 2.08, w: 1.42, h: 0.75, fontSize: 11, color: HEX.muted, align: "center", margin: 0 });
});
code(s, `./orquestar_fase.sh 1      # k8s-1n-1r, k8s-1n-2r, k8s-1n-3r  (~2 h 20 min)
# unir nodo2 al clúster + kubectl rollout restart deployment/api
./orquestar_fase.sh 2      # k8s-2n-1r, k8s-2n-2r, k8s-2n-3r
./orquestar_fase.sh 3      # k8s-3n-1r, k8s-3n-2r, k8s-3n-3r`, { x: 0.5, y: 3.15, w: 9.0, h: 1.2, fs: 11.5, label: "vm-jmeter · jmeter/orquestar_fase.sh" });
text(s, "Validez: la CPU de vm-jmeter nunca pasó del 5 %, así que el generador de carga no limitó ninguna medición", { x: 0.5, y: 4.5, w: 9.0, h: 0.5, fontSize: 14, bold: true, color: HEX.violet, margin: 0 });

// =========================================================
seccion("5 · Resultados", "120 corridas: qué mejora y qué no", "Resultados");

s = slide("CONTENIDO", "Throughput con 200 usuarios: los 10 escenarios", "Resultados");
s.addChart(pres.charts.BAR, [
  { name: "1 réplica", labels: ["1 nodo", "2 nodos", "3 nodos"], values: [1, 2, 3].map((n) => D.tps200[`k8s-${n}n-1r`]) },
  { name: "2 réplicas", labels: ["1 nodo", "2 nodos", "3 nodos"], values: [1, 2, 3].map((n) => D.tps200[`k8s-${n}n-2r`]) },
  { name: "3 réplicas", labels: ["1 nodo", "2 nodos", "3 nodos"], values: [1, 2, 3].map((n) => D.tps200[`k8s-${n}n-3r`]) },
], { ...GRAF(), x: 0.4, y: 1.05, w: 6.0, h: 3.95, barDir: "col", barGapWidthPct: 60, chartColors: [HEX.r1, HEX.r2, HEX.r3],
  showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 10, dataLabelColor: HEX.dark, dataLabelFormatCode: "0.0",
  valAxisMinVal: 0, valAxisMaxVal: 27, valAxisLabelFormatCode: "0", showLegend: true, legendPos: "b",
  showTitle: true, title: "req/s exitosas (media de 3 repeticiones)" });
card(s, 6.7, 1.15, 2.8, 3.8, HEX.tint);
text(s, "Docker Compose", { x: 6.9, y: 1.3, w: 2.4, h: 0.3, fontSize: 13, bold: true, color: HEX.muted, margin: 0 });
text(s, fmt(D.tps200.docker) + " req/s", { x: 6.9, y: 1.6, w: 2.4, h: 0.55, fontSize: 26, bold: true, color: HEX.docker, margin: 0 });
text(s, "Mejor escenario", { x: 6.9, y: 2.4, w: 2.4, h: 0.3, fontSize: 13, bold: true, color: HEX.muted, margin: 0 });
text(s, fmt(D.tps200["k8s-3n-3r"]) + " req/s", { x: 6.9, y: 2.7, w: 2.4, h: 0.55, fontSize: 26, bold: true, color: HEX.r3, margin: 0 });
text(s, "3 nodos · 3 réplicas · +" + Math.round(100 * (D.tps200["k8s-3n-3r"] / D.tps200.docker - 1)) + " % vs. Docker", { x: 6.9, y: 3.25, w: 2.4, h: 0.5, fontSize: 12, color: HEX.dark, margin: 0 });
text(s, "Las réplicas mueven el resultado; los nodos casi no", { x: 6.9, y: 3.95, w: 2.4, h: 0.85, fontSize: 14, bold: true, color: HEX.violet, margin: 0 });

s = slide("CONTENIDO", "Saturación: el throughput se aplana pronto", "Resultados");
s.addChart(pres.charts.LINE, ESC1N.map((e, i) => ({ name: ["Docker", "1 réplica", "2 réplicas", "3 réplicas"][i], labels: U, values: D.tps[e] })), {
  ...GRAF(), x: 0.4, y: 1.05, w: 4.6, h: 3.95, chartColors: [HEX.docker, HEX.r1, HEX.r2, HEX.r3], lineSize: 2, lineDataSymbolSize: 7,
  valAxisMinVal: 10, valAxisMaxVal: 25, valAxisLabelFormatCode: "0", showLegend: true, legendPos: "b",
  showTitle: true, title: "Throughput (req/s) · K8s 1 nodo", catAxisTitle: "usuarios", showCatAxisTitle: true, catAxisTitleFontSize: 10, catAxisTitleColor: HEX.muted });
s.addChart(pres.charts.LINE, ESC1N.map((e, i) => ({ name: ["Docker", "1 réplica", "2 réplicas", "3 réplicas"][i], labels: U, values: D.rt[e] })), {
  ...GRAF(), x: 5.1, y: 1.05, w: 4.5, h: 3.95, chartColors: [HEX.docker, HEX.r1, HEX.r2, HEX.r3], lineSize: 2, lineDataSymbolSize: 7,
  valAxisMinVal: 0, valAxisLabelFormatCode: "0", showLegend: true, legendPos: "b",
  showTitle: true, title: "Tiempo medio de respuesta (s)", catAxisTitle: "usuarios", showCatAxisTitle: true, catAxisTitleFontSize: 10, catAxisTitleColor: HEX.muted });
s.addNotes("Con 1 réplica el sistema ya está saturado con 10 usuarios: el throughput no pasa de unas 14,5 peticiones por segundo y el tiempo de respuesta crece en proporción a los usuarios. Con 2 y 3 réplicas la meseta llega con 50 usuarios.");

s = slide("CONTENIDO", "Escalar réplicas: ~1,5× en vez de 3×", "Resultados");
s.addChart(pres.charts.LINE, [
  { name: "Ideal lineal", labels: ["1", "2", "3"], values: [1, 2, 3] },
  { name: "1 nodo", labels: ["1", "2", "3"], values: D.speedup["1"] },
  { name: "2 nodos", labels: ["1", "2", "3"], values: D.speedup["2"] },
  { name: "3 nodos", labels: ["1", "2", "3"], values: D.speedup["3"] },
], { ...GRAF(), x: 0.4, y: 1.05, w: 5.2, h: 3.95, chartColors: ["9CA3AF", HEX.r1, HEX.r2, HEX.r3], lineSize: 2, lineDataSymbolSize: 7,
  valAxisMinVal: 0.5, valAxisMaxVal: 3.2, valAxisLabelFormatCode: "0.0", showLegend: true, legendPos: "b",
  showTitle: true, title: "Speedup = TPS(N réplicas) / TPS(1 réplica) · 200 usuarios", catAxisTitle: "réplicas", showCatAxisTitle: true, catAxisTitleFontSize: 10, catAxisTitleColor: HEX.muted });
stat(s, 5.95, 1.2, 3.5, "×" + fmt(D.speedup["3"][1], 2) + " / ×" + fmt(D.speedup["3"][2], 2), "con 2 y 3 réplicas (ideal: ×2 y ×3)");
card(s, 5.95, 2.6, 3.55, 2.35, HEX.tint);
text(s, [
  { text: "¿Por qué sube algo?", options: { bold: true, color: HEX.violet, breakLine: true } },
  { text: "Más réplicas = más conexiones simultáneas a PostgreSQL (15 → 30 → 45).", options: { breakLine: true } },
  { text: " ", options: { breakLine: true, fontSize: 6 } },
  { text: "Pero con 2-3 réplicas falla el " + Math.round(D.reportes_fallidos["k8s-1n-2r"]) + "-" + Math.round(D.reportes_fallidos["k8s-2n-3r"]) + " % de los reportes: parte de la mejora es trabajo pesado que la BD deja de hacer.", options: { bold: true } },
], { x: 6.12, y: 2.7, w: 3.25, h: 2.2, fontSize: 13, color: HEX.dark, valign: "top", margin: 0 });

s = slide("CONTENIDO", "Agregar nodos no ayuda", "Resultados");
s.addChart(pres.charts.BAR, [{ name: "CPU del nodo (%)", labels: ["nodo1 (PostgreSQL)", "nodo2", "nodo3"], values: ["nodo1", "nodo2", "nodo3"].map((n) => D.cpu_nodos["k8s-3n-3r"][n]) }], {
  ...GRAF(), x: 0.4, y: 1.05, w: 4.4, h: 3.95, barDir: "col", barGapWidthPct: 70, chartColors: [HEX.pg, HEX.r1, HEX.r1],
  showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 11, dataLabelColor: HEX.dark, dataLabelFormatCode: "0.0",
  valAxisMinVal: 0, valAxisMaxVal: 70, valAxisLabelFormatCode: "0", showLegend: false,
  showTitle: true, title: "% de CPU por nodo · 3 nodos, 3 réplicas" });
img(s, CAP("fase4-k8s-3n-3r-cpu-por-nodo.jpg"), 5.0, 1.05, 4.5, 2.75, 800, 571, "Prometheus: nodo1 cerca del 60 % de CPU y nodo2 y nodo3 por debajo del 5 % durante toda la fase");
caption(s, "Prometheus · toda la fase de 3 réplicas", 5.0, 3.82, 4.5);
text(s, "Con las mismas réplicas, pasar de 1 a 3 nodos cambia el throughput ≤ 5 %: la capacidad nueva queda ociosa", { x: 5.0, y: 4.2, w: 4.5, h: 0.8, fontSize: 14, bold: true, color: HEX.violet, margin: 0 });

s = slide("CONTENIDO", "El cuello de botella es PostgreSQL", "Resultados");
const ESCS = ["docker", "k8s-1n-1r", "k8s-1n-3r", "k8s-2n-3r", "k8s-3n-3r"];
const NOM = { docker: "Docker", "k8s-1n-1r": "1n-1r", "k8s-1n-3r": "1n-3r", "k8s-2n-3r": "2n-3r", "k8s-3n-3r": "3n-3r" };
s.addChart(pres.charts.BAR, [
  { name: "PostgreSQL", labels: ESCS.map((e) => NOM[e]), values: ESCS.map((e) => D.cpu_pg[e]) },
  { name: "API (todas las réplicas)", labels: ESCS.map((e) => NOM[e]), values: ESCS.map((e) => D.cpu_api[e]) },
], { ...GRAF(), x: 0.4, y: 1.05, w: 5.6, h: 3.95, barDir: "col", barGapWidthPct: 50, chartColors: [HEX.pg, HEX.r1],
  showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 9, dataLabelColor: HEX.dark, dataLabelFormatCode: "0.00",
  valAxisMinVal: 0, valAxisMaxVal: 1.1, valAxisLabelFormatCode: "0.0", showLegend: true, legendPos: "b",
  showTitle: true, title: "Núcleos de CPU usados con 200 usuarios (límite: 1)" });
stat(s, 6.3, 1.15, 3.2, "~0,9", "núcleos usa PostgreSQL en todos los escenarios", HEX.pg);
stat(s, 6.3, 2.4, 3.2, "< 0,11", "núcleos usan todas las réplicas de la API juntas", HEX.r1);
text(s, "PostgreSQL además sufre throttling constante (~9 periodos limitados/s): choca con su límite todo el tiempo", { x: 6.3, y: 3.75, w: 3.2, h: 1.2, fontSize: 13, bold: true, color: HEX.dark, margin: 0 });
s.addNotes("Esta es la clave del análisis. PostgreSQL usa unos 0,9 núcleos de su límite de 1 en todos los escenarios y tiene throttling constante. Todas las réplicas de la API juntas no llegan a 0,11 núcleos: la API espera a la base de datos.");

s = slide("CONTENIDO", "Docker vs. Kubernetes: casi sin costo", "Resultados");
s.addChart(pres.charts.BAR, [
  { name: "Docker Compose", labels: U, values: D.tps.docker },
  { name: "K8s 1 nodo · 1 réplica", labels: U, values: D.tps["k8s-1n-1r"] },
], { ...GRAF(), x: 0.4, y: 1.05, w: 5.6, h: 3.95, barDir: "col", barGapWidthPct: 60, chartColors: [HEX.docker, HEX.violet],
  showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 10, dataLabelColor: HEX.dark, dataLabelFormatCode: "0.0",
  valAxisMinVal: 0, valAxisMaxVal: 18, valAxisLabelFormatCode: "0", showLegend: true, legendPos: "b",
  showTitle: true, title: "Throughput (req/s) por número de usuarios", catAxisTitle: "usuarios", showCatAxisTitle: true, catAxisTitleFontSize: 10, catAxisTitleColor: HEX.muted });
stat(s, 6.3, 1.25, 3.2, "−1,5 a −3,5 %", "de throughput en Kubernetes respecto a Docker, con el mismo hardware", HEX.violet);
bullets(s, ["Mismos tiempos de respuesta", "Errores < 1 % en ambos", "A cambio: escalado, autorreparación y reparto de carga"], { x: 6.3, y: 2.75, w: 3.2, h: 2.2, fontSize: 14 });

s = slide("CONTENIDO", "Demostración: escalado y carga en vivo", "Resultados");
img(s, RC("escalado.png"), 0.5, 1.05, 5.3, 1.9, 1480, 520, "kubectl scale de 1 a 3 réplicas: los pods quedan en nodo2, nodo3 y nodo1");
caption(s, "kubectl scale --replicas=3: una réplica en cada nodo", 0.5, 2.98, 5.3);
img(s, RC("k-top.png"), 0.5, 3.3, 5.3, 1.6, 1180, 440, "kubectl top durante la carga: nodo1 al 57 % y postgres-0 con 999m");
caption(s, "kubectl top con 100 usuarios: postgres-0 usa 999m (1 núcleo)", 0.5, 4.92, 5.3);
card(s, 6.1, 1.05, 3.4, 3.9, HEX.tint);
text(s, [
  { text: "Video del proyecto", options: { bold: true, color: HEX.violet, breakLine: true } },
  { text: "10 min, sin audio, generado con OBS y una demo automática:", options: { breakLine: true } },
  { text: " ", options: { breakLine: true, fontSize: 6 } },
  { text: "Parte A · Docker Compose, API y JMeter", options: { bullet: true, breakLine: true } },
  { text: "Parte B · K3s con 3 nodos, escalado, kubectl top, Grafana y resultados", options: { bullet: true, breakLine: true } },
  { text: " ", options: { breakLine: true, fontSize: 6 } },
  { text: "docs/video/Video-Proyecto-Final.mp4", options: { bold: true, fontSize: 12 } },
], { x: 6.3, y: 1.2, w: 3.0, h: 3.6, fontSize: 14, color: HEX.dark, valign: "top", margin: 0 });
s.addNotes("En el video se ve todo funcionando. Aquí dos momentos: al escalar de 1 a 3 réplicas, Kubernetes pone una en cada nodo; y durante la carga, kubectl top muestra a PostgreSQL usando un núcleo completo mientras las réplicas casi no trabajan.");

// =========================================================
seccion("6 · Hallazgos", "Lo que aprendimos al medir de verdad", "Hallazgos");

s = slide("CONTENIDO", "Las sondas por defecto tumbaban el servicio", "Hallazgos");
s.addTable([
  [H("Configuración (k8s-1n-1r)"), H("50 us."), H("100 us."), H("200 us.")],
  ["Sondas por defecto (timeout 1 s)", { text: "19,2 %", options: { color: HEX.pg, bold: true } }, { text: "87,2 %", options: { color: HEX.pg, bold: true } }, { text: "68,9 %", options: { color: HEX.pg, bold: true } }],
  ["Readiness con 10 s", "0,5 %", "0,6 %", { text: "6,0 %", options: { color: HEX.r2, bold: true } }],
  ["Sondas finales (usadas)", { text: "0,5 %", options: { color: HEX.ok, bold: true } }, { text: "0,4 %", options: { color: HEX.ok, bold: true } }, { text: "0,9 %", options: { color: HEX.ok, bold: true } }],
], { x: 0.5, y: 1.15, w: 5.6, colW: [2.9, 0.9, 0.9, 0.9], fontSize: 12.5, rowH: 0.5, ...TABLA });
caption(s, "% de peticiones con error. Las corridas descartadas se guardan en results_descartados/", 0.5, 3.25, 5.6);
code(s, `readinessProbe:            # ¿recibe tráfico?
  httpGet: { path: /health }
  timeoutSeconds: 30
  failureThreshold: 8
livenessProbe:             # ¿está vivo?
  tcpSocket: { port: 8000 }`, { x: 0.5, y: 3.6, w: 5.6, h: 1.45, fs: 10.5, label: "Corrección" });
[["Qué pasaba", "Bajo carga /health tardaba > 1 s (espera a la BD)"], ["Efecto", "Kubernetes reiniciaba la API en plena prueba: CrashLoopBackOff, 9 reinicios"], ["Lección", "La sonda debe medir si el proceso vive, no si está rápido"]].forEach(([t, d], i) => {
  const y = 1.2 + i * 1.28;
  badge(s, 6.4, y, i + 1, i === 2 ? HEX.ok : HEX.pg);
  text(s, t, { x: 6.95, y: y - 0.02, w: 2.55, h: 0.32, fontSize: 14, bold: true, margin: 0 });
  text(s, d, { x: 6.95, y: y + 0.32, w: 2.55, h: 0.8, fontSize: 12, color: HEX.muted, margin: 0 });
});
s.addNotes("El primer intento de Kubernetes daba hasta 87 por ciento de errores. La causa: las sondas por defecto dan 1 segundo para responder. Bajo carga, el health check espera a la base de datos y tarda más, así que Kubernetes creía que el pod estaba muerto y lo reiniciaba en plena prueba. Lo corregimos y descartamos esas corridas para que la comparación fuera justa.");

s = slide("CONTENIDO", "Más réplicas agotan /dev/shm en PostgreSQL", "Hallazgos");
s.addChart(pres.charts.BAR, [{ name: "Reportes fallidos (%)", labels: ["Docker", "1 réplica", "2 réplicas", "3 réplicas"],
  values: [D.reportes_fallidos.docker, D.reportes_fallidos["k8s-1n-1r"], D.reportes_fallidos["k8s-1n-2r"], D.reportes_fallidos["k8s-1n-3r"]] }], {
  ...GRAF(), x: 0.4, y: 1.05, w: 4.6, h: 3.95, barDir: "col", barGapWidthPct: 60, chartColors: [HEX.docker, HEX.r1, HEX.r2, HEX.r3],
  showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 11, dataLabelColor: HEX.dark, dataLabelFormatCode: "0",
  valAxisMinVal: 0, valAxisMaxVal: 100, valAxisLabelFormatCode: "0", showLegend: false,
  showTitle: true, title: "% de reportes fallidos (100-200 usuarios, 1 nodo)" });
code(s, `ERROR: could not resize shared memory segment
       "/PostgreSQL.976963026" to 4194304 bytes:
       No space left on device`, { x: 5.3, y: 1.15, w: 4.2, h: 1.15, fs: 9.5, label: "log de PostgreSQL" });
bullets(s, [
  "El reporte usa parallel workers, que reservan memoria en /dev/shm (64 MB por defecto)",
  "1 réplica: ≤ 15 conexiones, pocos reportes a la vez",
  "3 réplicas: ≤ 45 conexiones y la memoria se agota → 500",
  { text: "Escalar la API traslada la presión a la base de datos", options: { bold: true, color: HEX.violet } },
], { x: 5.3, y: 2.45, w: 4.2, h: 2.55, fontSize: 13 });

s = slide("CONTENIDO", "Otros retos técnicos", "Hallazgos");
[["Cuota de Azure for Students", "6 vCPU y 0 para DASv5: migramos a Google Cloud con apagado automático de facturación"],
 ["cAdvisor no veía los contenedores", "Docker 29 usa el almacén de containerd: volvimos a overlay2"],
 ["Sin capacidad en la zona a", "Stockout de n2d en us-central1-a: script reintentable en la zona c"],
 ["IPs públicas que cambian", "Llaves SSH por nombre de VM y JMeter atacando la IP privada fija"]].forEach(([t, d], i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const x = 0.5 + col * 4.6, y = 1.2 + row * 1.85;
  card(s, x, y, 4.4, 1.6, HEX.light, { shadow: true });
  badge(s, x + 0.2, y + 0.2, i + 1);
  text(s, t, { x: x + 0.8, y: y + 0.18, w: 3.45, h: 0.45, fontSize: 15, bold: true, valign: "middle", margin: 0 });
  text(s, d, { x: x + 0.8, y: y + 0.7, w: 3.45, h: 0.8, fontSize: 13, color: HEX.muted, margin: 0 });
});

// =========================================================
s = slide("CONTENIDO", "Respuestas a las preguntas del proyecto", "Cierre");
s.addTable([
  [H("Pregunta"), H("Respuesta")],
  ["¿Crece el throughput con más réplicas?", "Sí, pero no lineal: ×1,36 y ×1,55 (ideal ×2 y ×3)"],
  ["¿Cuándo se satura?", "1 réplica: desde 10 usuarios · 2-3 réplicas: desde 50"],
  ["¿3 réplicas en 1 nodo = en 3 nodos?", "Casi: 22,7 vs. 23,6 req/s (+4 %)"],
  ["¿La BD es el cuello de botella?", "Sí: ~0,9 de 1 núcleo con throttling; API < 0,11"],
  ["¿Overhead de K8s vs. Docker?", "Mínimo: entre −1,5 % y −3,5 %"],
  ["¿Agregar nodos ayuda?", "No con una sola BD: ≤ 5 % y nodos ociosos"],
  ["¿Qué endpoint se degrada más?", "Lecturas simples: de ~20 ms a ~12,7 s (×600)"],
], { x: 0.5, y: 1.15, w: 9.0, colW: [3.8, 5.2], fontSize: 13, rowH: 0.47, ...TABLA });

s = slide("CONTENIDO", "Recomendaciones", "Cierre");
[["Optimizar la BD", "Índice pg_trgm para la búsqueda; vista materializada o Redis para el reporte", HEX.pg],
 ["Escalar la BD", "Más CPU o réplicas de lectura; PgBouncer para controlar las conexiones", HEX.pg],
 ["/dev/shm más grande", "emptyDir con medium: Memory (K8s) o shm_size (Compose)", HEX.r2],
 ["Sondas tolerantes", "Liveness por TCP y readiness con timeouts de la latencia real", HEX.violet],
 ["HPA solo si la API limita", "Con la API en < 0,11 núcleos no tiene sentido autoescalar", HEX.r1],
 ["Ingress / balanceador", "No depender del NodePort de un solo nodo", HEX.docker]].forEach(([t, d, col], i) => {
  const c = i % 2, r = Math.floor(i / 2);
  const x = 0.5 + c * 4.6, y = 1.15 + r * 1.3;
  card(s, x, y, 4.4, 1.15, HEX.light);
  badge(s, x + 0.18, y + 0.36, i + 1, col);
  text(s, t, { x: x + 0.75, y: y + 0.1, w: 3.5, h: 0.35, fontSize: 14, bold: true, margin: 0 });
  text(s, d, { x: x + 0.75, y: y + 0.46, w: 3.5, h: 0.62, fontSize: 12, color: HEX.muted, margin: 0 });
});

s = slide("CONTENIDO", "Entregables", "Cierre");
[["Repositorio", "github.com/Tapr16/Proyecto-Final-Principios", "Código, manifiestos, scripts, resultados y README"],
 ["Notebook", "notebook/analisis.ipynb (abre en Colab)", "Carga de las 120 corridas, 8 gráficas y análisis"],
 ["Video", "docs/video/Video-Proyecto-Final.mp4", "10 min: Docker y Kubernetes funcionando en vivo"],
 ["Informe", "PDF con instrucciones de ejecución", "Requisitos, pasos y cómo ver el notebook"]].forEach(([t, l, d], i) => {
  const y = 1.15 + i * 0.95;
  card(s, 0.5, y, 9.0, 0.82, HEX.light);
  badge(s, 0.68, y + 0.2, i + 1);
  text(s, t, { x: 1.25, y: y + 0.08, w: 1.7, h: 0.66, fontSize: 15, bold: true, valign: "middle", margin: 0 });
  text(s, l, { x: 3.0, y: y + 0.08, w: 3.4, h: 0.66, fontSize: 12, color: HEX.violet, bold: true, valign: "middle", margin: 0 });
  text(s, d, { x: 6.45, y: y + 0.08, w: 2.95, h: 0.66, fontSize: 12, color: HEX.muted, valign: "middle", margin: 0 });
});

s = slide("CIERRE", "Conclusiones", "Cierre");
s.addText([
  { text: "El cuello de botella es la base de datos, no la aplicación: ni Docker ni Kubernetes lo cambian", options: { bullet: true, breakLine: true } },
  { text: "Kubernetes casi no añade costo sobre el mismo hardware (−1,5 % a −3,5 %)", options: { bullet: true, breakLine: true } },
  { text: "Escalar una capa sin estado ayuda poco si el estado está centralizado: ×1,55 con 3 réplicas", options: { bullet: true, breakLine: true } },
  { text: "Agregar nodos no sirve si lo que limita no se replica: dos nodos quedaron < 7 % de CPU", options: { bullet: true, breakLine: true } },
  { text: "Los valores por defecto de K8s pueden empeorar un sistema saturado: sondas de 1 segundo", options: { bullet: true, breakLine: true } },
  { text: "Sin métricas internas solo veíamos que no escalaba; Prometheus mostró por qué", options: { bullet: true } },
], { placeholder: "body", paraSpaceAfter: 10 });

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log(OUT);
})();
