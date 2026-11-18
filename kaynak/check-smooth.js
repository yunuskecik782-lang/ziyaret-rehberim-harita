// Çizimde kıyılar yumuşatılıyor (ikinci derece eğri). Yumuşatılmış kıyıya göre de her durak karada mı?
const D = require("./data.js");
const R = Math.PI / 180, LAT0 = 41.02, LNG0 = 28.955, MX = 111320 * Math.cos(LAT0 * R), MY = 111050;
const P = (lat, lng) => [(lng - LNG0) * MX, (LAT0 - lat) * MY];
const EU = D.GEO.europe.map((p) => P(p[0], p[1])), FAR = 150000;
const pts = [[EU[EU.length - 1][0], -FAR], [-FAR, -FAR], [-FAR, EU[1][1]], ...EU.slice(1)], n = pts.length, sm = [];
for (let i = 0; i < n; i++) {
  const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n], m1 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m2 = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
  for (let k = 0; k < 10; k++) { const t = k / 10, u = 1 - t; sm.push([u * u * m1[0] + 2 * u * t * b[0] + t * t * m2[0], u * u * m1[1] + 2 * u * t * b[1] + t * t * m2[1]]); }
}
const inside = (pt) => { let c = false; for (let i = 0, j = sm.length - 1; i < sm.length; j = i++) { const [xi, yi] = sm[i], [xj, yj] = sm[j]; if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c; } return c; };
const segDist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
let bad = 0, min = 1e9;
for (const a of [...D.RAW, ...D.PRESETS.map((p) => [0, 0, "hazır nokta " + p.label, 0, 0, 0, 0, 0, 0, p.lat, p.lng])]) {
  const pt = P(a[9], a[10]); let d = 1e9;
  for (let i = 0; i < sm.length; i++) d = Math.min(d, segDist(pt, sm[i], sm[(i + 1) % sm.length]));
  min = Math.min(min, d);
  if (!inside(pt) || d < 30) { bad++; console.log(inside(pt) ? "KIYIYA YAKIN" : "DENİZDE", a[2], Math.round(d) + " m"); }
}
console.log("yumuşatılmış kıyı: sorunlu", bad, "· kıyıya en yakın durak", Math.round(min), "m");
