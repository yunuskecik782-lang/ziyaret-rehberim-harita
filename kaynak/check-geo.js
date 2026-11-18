// Kıyı çizgisi denetimi: her durak Avrupa yakası poligonunun içinde ve kıyıdan yeterince uzakta mı?
const D = require("./data.js");
const R = Math.PI / 180, LAT0 = 41.02, LNG0 = 28.955;
const MX = 111320 * Math.cos(LAT0 * R), MY = 111050;
const P = (lat, lng) => [(lng - LNG0) * MX, (LAT0 - lat) * MY];
const ring = D.GEO.europe.map((p) => P(p[0], p[1]));
const inside = (pt, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const segDist = (p, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
let bad = 0;
const counts = {};
for (const a of D.RAW) {
  counts[a[0]] = (counts[a[0]] || 0) + 1;
  const pt = P(a[9], a[10]);
  let d = 1e9;
  for (let i = 0; i < ring.length; i++) d = Math.min(d, segDist(pt, ring[i], ring[(i + 1) % ring.length]));
  const ok = inside(pt, ring);
  if (!ok || d < 60) { bad++; console.log(ok ? "KIYIYA YAKIN" : "DENİZDE", a[2], Math.round(d) + " m"); }
}
console.log("durak:", D.RAW.length, "rota başına:", JSON.stringify(counts), "sorunlu:", bad);
const asia = D.GEO.asia.map((p) => P(p[0], p[1]));
console.log("Kız Kulesi denizde mi:", !inside(P(...D.GEO.isle), ring) && !inside(P(...D.GEO.isle), asia));
for (const l of D.GEO.labels) {
  const pt = P(l.lat, l.lng), land = inside(pt, ring) || inside(pt, asia);
  if (!!l.water === land) console.log("ETİKET YANLIŞ YERDE:", l.t);
}
