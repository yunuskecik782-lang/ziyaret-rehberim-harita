/* Ziyaret Rehberim haritası: şematik harita motoru, konsept seçimi, en yakın rota, kaydetme ve haritalara aktarma. */
(() => {
  "use strict";
  const D = globalThis.ZR_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const app = $("#app"), mapEl = $("#map"), cv = $("#base"), ctx = cv.getContext("2d"), mkEl = $("#mk"), meEl = $("#me"), tipEl = $("#tip");
  const sheet = $("#sheet"), head = $("#sheet-head"), bodyEl = $("#body"), toastEl = $("#toast"), pickEl = $("#pick"), infoEl = $("#info"), scaleEl = $("#scale");
  const P = { kesfet: $("#p-kesfet"), detail: $("#p-detail"), rota: $("#p-rota") };
  const RM = matchMedia("(prefers-reduced-motion: reduce)"), DESK = matchMedia("(min-width: 900px)");
  const HOSTED = !!(window.claude && typeof window.claude.use === "function");
  const REAL = typeof window.L !== "undefined"; // Leaflet sayfaya eklendiyse gerçek harita, yoksa şematik çizim
  const capEl = $(".cap");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const ICON = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    loc: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.6"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 1 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    walk: '<circle cx="13" cy="4.6" r="1.7"/><path d="M10 21l1.8-5.5-2.3-3 1-4.5 3 1 1.8 3 3 1M10.5 8L7.3 9.6 6.5 13M12.3 15.5L15 21"/>',
    back: '<path d="M14.5 6l-6 6 6 6"/>',
    fwd: '<path d="M9.5 6l6 6-6 6"/>',
    up: '<path d="M6 14.5l6-6 6 6"/>',
    down: '<path d="M6 9.5l6 6 6-6"/>',
    x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    minus: '<path d="M5 12h14"/>',
    spark: '<path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    dl: '<path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 19.5h14"/>',
    ext: '<path d="M14 5h5v5M19 5l-8 8M11 6H6.5A1.5 1.5 0 0 0 5 7.5v10A1.5 1.5 0 0 0 6.5 19h10a1.5 1.5 0 0 0 1.5-1.5V13"/>',
    mark: '<path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-4-6 4V5.5a1 1 0 0 1 1-1z"/>',
    trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 12.5h8L17 7"/>',
    swap: '<path d="M4 7h3.5c5 0 4.5 10 9.5 10H20M17 14l3 3-3 3M20 7h-3c-1.4 0-2.3.8-3 1.9M17 4l3 3-3 3M4 17h3.5c1.4 0 2.3-.8 3-1.9"/>',
    layers: '<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 12.5L12 17l8.5-4.5"/><path d="M3.5 16.5L12 21l8.5-4.5"/>',
    hand: '<path d="M12 3v9M12 3l-3 3M12 3l3 3"/><circle cx="12" cy="17" r="3.5"/>',
  };
  const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

  /* ——— Coğrafya ——— */
  const RAD = Math.PI / 180, LAT0 = 41.02, LNG0 = 28.955, MX = 111320 * Math.cos(LAT0 * RAD), MY = 111050;
  const proj = (lat, lng) => [(lng - LNG0) * MX, (LAT0 - lat) * MY];
  const unproj = (x, y) => ({ lat: LAT0 - y / MY, lng: LNG0 + x / MX });
  const dist = (a, b) => leg(a, b).d;
  const WALK = 1.3, SPEED = 75;
  const fmtD = (m) => (m < 1000 ? Math.max(10, Math.round(m / 10) * 10) + " m" : (m / 1000).toFixed(1).replace(".", ",") + " km");
  const mins = (m) => Math.max(1, Math.round(m / SPEED));
  const fmtT = (m) => { const t = mins(m); return t < 60 ? t + " dk" : Math.floor(t / 60) + " sa" + (t % 60 ? " " + (t % 60) + " dk" : ""); };

  const STOPS = D.RAW.map((a, i) => {
    const [x, y] = proj(a[9], a[10]), r = D.ROUTES[a[0]];
    return { id: i, key: r.id + "-" + a[1], r, n: a[1], name: a[2], hon: a[3], tag: a[4], addr: a[5], desc: a[6], hours: a[7], approx: !!a[8], lat: a[9], lng: a[10], x, y, fx: 0, fy: 0 };
  });
  const BYKEY = new Map(STOPS.map((s) => [s.key, s]));
  const CONCEPT = new Map(D.CONCEPTS.map((c) => [c.id, c]));
  // Aynı noktadaki duraklar (ör. aynı yapıdaki kabirler) haritada küçük bir yelpaze hâlinde açılır.
  (() => {
    const seen = new Set();
    for (const s of STOPS) {
      if (seen.has(s.id)) continue;
      const g = STOPS.filter((t) => !seen.has(t.id) && Math.hypot(t.x - s.x, t.y - s.y) < 30);
      g.forEach((t) => seen.add(t.id));
      if (g.length > 1) g.forEach((t, j) => { const a = -Math.PI / 2 + (j * 2 * Math.PI) / g.length; t.fx = Math.cos(a); t.fy = Math.sin(a); });
    }
  })();
  const bbox = (pts) => pts.reduce((b, p) => ({ x0: Math.min(b.x0, p.x), x1: Math.max(b.x1, p.x), y0: Math.min(b.y0, p.y), y1: Math.max(b.y1, p.y) }), { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity });
  const BB = bbox(STOPS);

  const FAR = 150000;
  const EU = D.GEO.europe.map((p) => proj(p[0], p[1])), AS = D.GEO.asia.map((p) => proj(p[0], p[1]));
  const LAND = [
    [[EU[EU.length - 1][0], -FAR], [-FAR, -FAR], [-FAR, EU[1][1]], ...EU.slice(1)],
    [[AS[1][0], -FAR], ...AS.slice(1, -1), [AS[AS.length - 2][0] + 20000, AS[AS.length - 2][1] + 14000], [FAR, AS[AS.length - 2][1] + 14000], [FAR, -FAR]],
  ];
  const WALLS = D.GEO.walls.map((p) => proj(p[0], p[1]));
  const BRIDGES = D.GEO.bridges.map((b) => b.map((p) => proj(p[0], p[1])));
  const ISLE = proj(D.GEO.isle[0], D.GEO.isle[1]);
  const LABELS = D.GEO.labels.map((l) => { const [x, y] = proj(l.lat, l.lng); return { ...l, x, y, up: l.t.toLocaleUpperCase("tr") }; });

  // Haliç'in iki yakası arasındaki yollar düz çizgiyle suyun üstünden değil, en uygun köprüden hesaplanır.
  const orient = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const segX = (a, b, c, d) => orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0;
  const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const HEAD = D.GEO.europe.findIndex((p) => p[0] === 41.0672);
  const NORTH = [...EU.slice(HEAD), proj(41.1, D.GEO.europe[HEAD][1])];
  const HBR = BRIDGES.slice(0, 3), NOVIA = [];
  const side = (p) => (p.sd ??= inPoly(p.x, p.y, NORTH) ? 1 : inPoly(p.x, p.y, LAND[0]) ? 0 : 2);
  const crosses = (a, b) => { for (let i = 1; i < EU.length - 1; i++) if (segX(a, b, EU[i], EU[i + 1])) return true; return false; };
  function leg(a, b) {
    const d = Math.hypot(a.x - b.x, a.y - b.y), sa = side(a), sb = side(b);
    if (sa === sb || sa > 1 || sb > 1 || !crosses([a.x, a.y], [b.x, b.y])) return { via: NOVIA, d };
    let best = null;
    for (const br of HBR) {
      const p = sa ? br[1] : br[0], q = sa ? br[0] : br[1];
      const t = Math.hypot(a.x - p[0], a.y - p[1]) + Math.hypot(p[0] - q[0], p[1] - q[1]) + Math.hypot(q[0] - b.x, q[1] - b.y);
      if (!best || t < best.d) best = { via: [p, q], d: t };
    }
    return best;
  }

  /* ——— Durum ——— */
  const S = { concepts: new Set(), me: null, sel: null, route: [], tab: "kesfet", sheet: "half", picking: false, count: 6, saved: [], from: "kesfet", name: "", sat: false };
  const V = { cx: (BB.x0 + BB.x1) / 2, cy: (BB.y0 + BB.y1) / 2, k: 0.04, w: 0, h: 0, dpr: 1 };
  const KMIN = 0.018, KMAX = 0.8;
  const RT = { pts: [], cum: [], at: [], len: 0, prog: 1 };
  let C = {}, zcls = "", curPanel = "", raf = 0, flyRaf = 0, rtRaf = 0, toastT = 0, fanR = 10;
  let map = null, lyStreet = null, lySat = null, lySatLbl = null, plCase = null, plMain = null, meMk = null, tipMk = null, tileFails = 0;

  const active = () => (S.concepts.size ? STOPS.filter((s) => S.concepts.has(s.r.concept)) : STOPS);
  const conceptLabel = () => (S.concepts.size ? D.CONCEPTS.filter((c) => S.concepts.has(c.id)).map((c) => c.label).join(" + ") : "Tüm duraklar");

  /* ——— Harita çizimi ——— */
  const sx = (x) => (x - V.cx) * V.k + V.w / 2, sy = (y) => (y - V.cy) * V.k + V.h / 2;
  const toWorld = (px, py) => [(px - V.w / 2) / V.k + V.cx, (py - V.h / 2) / V.k + V.cy];
  const draw = () => { if (!raf) raf = requestAnimationFrame(REAL ? renderReal : render); };

  function readColors() {
    const cs = getComputedStyle(document.documentElement), g = (n) => cs.getPropertyValue(n).trim();
    C = { land: g("--map-land"), water: g("--map-water"), shoal: g("--map-shoal"), shore: g("--map-shore"), wall: g("--map-wall"), label: g("--map-label"), wlabel: g("--map-wlabel"), bridge: g("--map-bridge"), route: g("--route"), casing: g("--route-casing"), accent: g("--accent"), fd: g("--f-display") };
    draw();
  }
  function ring(pts) {
    const n = pts.length;
    ctx.beginPath();
    ctx.moveTo((sx(pts[n - 1][0]) + sx(pts[0][0])) / 2, (sy(pts[n - 1][1]) + sy(pts[0][1])) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n], px = sx(p[0]), py = sy(p[1]);
      ctx.quadraticCurveTo(px, py, (px + sx(q[0])) / 2, (py + sy(q[1])) / 2);
    }
    ctx.closePath();
  }
  function spaced(t, sp) { try { ctx.letterSpacing = sp + "px"; } catch (e) {} ctx.fillText(t, 0, 0); }

  function render() {
    raf = 0;
    const { w, h, dpr, k } = V;
    if (!w || !h) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.water; ctx.fillRect(0, 0, w, h);
    ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.setLineDash([]);
    for (const r of LAND) { ring(r); ctx.strokeStyle = C.shoal; ctx.lineWidth = clamp(k * 560, 10, 46); ctx.stroke(); }
    for (const r of LAND) { ring(r); ctx.fillStyle = C.land; ctx.fill(); ctx.strokeStyle = C.shore; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(sx(ISLE[0]), sy(ISLE[1]), clamp(k * 45, 2, 7), 0, 7); ctx.fillStyle = C.land; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.bridge; ctx.lineWidth = clamp(k * 55, 2, 6);
    for (const b of BRIDGES) { ctx.beginPath(); ctx.moveTo(sx(b[0][0]), sy(b[0][1])); ctx.lineTo(sx(b[1][0]), sy(b[1][1])); ctx.stroke(); }
    ctx.beginPath(); WALLS.forEach((p, i) => (i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1]))));
    ctx.strokeStyle = C.wall; ctx.globalAlpha = 0.7; ctx.lineWidth = clamp(k * 26, 1.5, 3.5); ctx.setLineDash([7, 5]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;

    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const ds = clamp(9.5 + k * 34, 10, 14.5);
    for (const l of LABELS) {
      if (l.minK && k < l.minK) continue;
      const X = sx(l.x), Y = sy(l.y);
      if (X < -90 || X > w + 90 || Y < -40 || Y > h + 40) continue;
      ctx.save(); ctx.translate(X, Y); if (l.rot) ctx.rotate(l.rot * RAD);
      if (l.water) { ctx.font = `italic 500 ${ds + 1}px ${C.fd}`; ctx.fillStyle = C.wlabel; spaced(l.t, 2.2); }
      else if (l.wall) { ctx.font = `700 ${ds - 1.5}px ${C.fd}`; ctx.fillStyle = C.wall; ctx.globalAlpha = 0.85; spaced(l.up, 1.8); }
      else { ctx.font = `700 ${ds}px ${C.fd}`; ctx.fillStyle = C.label; spaced(l.up, 2.4); }
      ctx.restore();
    }
    try { ctx.letterSpacing = "0px"; } catch (e) {}
    const zc = k < 0.045 ? "z-lo" : k > 0.14 ? "z-hi" : "z-mid";
    if (zc !== zcls) { if (zcls) mkEl.classList.remove(zcls); mkEl.classList.add(zc); zcls = zc; }
    const fr = (fanR = zc === "z-lo" ? 6 : zc === "z-hi" ? 16 : 10);
    compass();
    route();

    for (const s of STOPS) s.el.style.transform = `translate3d(${(sx(s.x) + s.fx * fr).toFixed(1)}px,${(sy(s.y) + s.fy * fr).toFixed(1)}px,0)`;
    if (S.me) meEl.style.transform = `translate3d(${sx(S.me.x).toFixed(1)}px,${sy(S.me.y).toFixed(1)}px,0)`;
    if (S.sel != null) { const s = STOPS[S.sel]; tipEl.style.transform = `translate3d(${(sx(s.x) + s.fx * fr).toFixed(1)}px,${(sy(s.y) + s.fy * fr).toFixed(1)}px,0)`; }
    scaleBar(k);
  }
  function scaleBar(k) {
    const m = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000].reduce((b, v) => (v * k <= 96 ? v : b), 5);
    scaleEl.style.width = (m * k).toFixed(1) + "px"; scaleEl.firstElementChild.textContent = m < 1000 ? m + " m" : m / 1000 + " km";
  }

  // Sekiz köşeli yıldız biçiminde kuzey göstergesi.
  function compass() {
    const r = 12, X = V.w - (DESK.matches ? 46 : 36), Y = 150;
    ctx.save(); ctx.translate(X, Y); ctx.strokeStyle = C.label; ctx.lineWidth = 1.2;
    for (let i = 0; i < 2; i++) { ctx.rotate((i * Math.PI) / 4); ctx.strokeRect(-r * 0.72, -r * 0.72, r * 1.44, r * 1.44); }
    ctx.rotate(-Math.PI / 4);
    ctx.beginPath(); ctx.moveTo(0, -r - 5); ctx.lineTo(3.6, -1); ctx.lineTo(-3.6, -1); ctx.closePath(); ctx.fillStyle = C.accent; ctx.fill();
    ctx.font = `800 9.5px ${C.fd}`; ctx.fillStyle = C.label; ctx.fillText("K", 0, -r - 12);
    ctx.restore();
  }

  function route() {
    const n = RT.pts.length;
    if (n < 2 || RT.prog <= 0) return;
    const L = RT.len * RT.prog, X = (p) => sx(p[0]) + (p[2] ? p[2].fx * fanR : 0), Y = (p) => sy(p[1]) + (p[2] ? p[2].fy * fanR : 0);
    ctx.beginPath(); ctx.moveTo(X(RT.pts[0]), Y(RT.pts[0]));
    for (let i = 1; i < n; i++) {
      const p = RT.pts[i];
      if (RT.cum[i] <= L) { ctx.lineTo(X(p), Y(p)); continue; }
      const a = RT.pts[i - 1], t = (L - RT.cum[i - 1]) / (RT.cum[i] - RT.cum[i - 1] || 1);
      ctx.lineTo(X(a) + (X(p) - X(a)) * t, Y(a) + (Y(p) - Y(a)) * t); break;
    }
    ctx.strokeStyle = C.casing; ctx.globalAlpha = 0.88; ctx.lineWidth = 8; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.strokeStyle = C.route; ctx.lineWidth = 3.4; ctx.setLineDash([9, 7]); ctx.stroke(); ctx.setLineDash([]);
  }

  /* ——— Gerçek harita (Leaflet): sokak haritası ve uydu görüntüsü ——— */
  const M0 = (40075016.686 * Math.cos(LAT0 * RAD)) / 256;
  const kReal = () => Math.pow(2, map.getZoom()) / M0;
  const zoomForK = (k) => Math.log2(k * M0);
  const FILE = location.protocol === "file:";
  function renderReal() {
    raf = 0;
    const n = RT.pts.length, out = [];
    if (n > 1 && RT.prog > 0) {
      const len = RT.len * RT.prog, g = (x, y) => { const q = unproj(x, y); return [q.lat, q.lng]; };
      out.push(g(RT.pts[0][0], RT.pts[0][1]));
      for (let i = 1; i < n; i++) {
        const p = RT.pts[i];
        if (RT.cum[i] <= len) { out.push(g(p[0], p[1])); continue; }
        const a = RT.pts[i - 1], t = (len - RT.cum[i - 1]) / (RT.cum[i] - RT.cum[i - 1] || 1);
        out.push(g(a[0] + (p[0] - a[0]) * t, a[1] + (p[1] - a[1]) * t)); break;
      }
    }
    plCase.setLatLngs(out); plMain.setLatLngs(out);
  }
  function zoomState() {
    const k = kReal(), zc = k < 0.045 ? "z-lo" : k > 0.14 ? "z-hi" : "z-mid";
    if (zc !== zcls) { if (zcls) mapEl.classList.remove(zcls); mapEl.classList.add(zc); zcls = zc; }
    scaleBar(k);
  }
  function capText(msg) {
    const osm = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> katkıda bulunanlar';
    capEl.innerHTML = msg || (S.sat ? "Uydu görüntüsü: Esri, Maxar, Earthstar Geographics" : FILE ? "Harita: Esri, HERE, Garmin, " + osm : osm);
  }
  function setLayer(sat) {
    S.sat = sat; mapEl.classList.toggle("is-sat", sat);
    for (const l of [lyStreet, lySat, lySatLbl]) map.removeLayer(l);
    if (sat) { lySat.addTo(map); lySatLbl.addTo(map); } else lyStreet.addTo(map);
    const b = $("#layer");
    b.setAttribute("aria-pressed", sat); b.lastElementChild.textContent = sat ? "Harita" : "Uydu"; b.setAttribute("aria-label", sat ? "Sokak haritasına geç" : "Uydu görüntüsüne geç");
    tileFails = 0; capText();
    try { localStorage.setItem("zr.katman", sat ? "uydu" : "harita"); } catch (e) {}
  }
  function initReal() {
    const host = document.createElement("div");
    host.id = "lmap"; mapEl.prepend(host); cv.hidden = true; mkEl.hidden = true; mapEl.classList.add("real");
    map = L.map(host, { zoomControl: false, attributionControl: false, minZoom: 11, maxZoom: 19, zoomSnap: 0.5, wheelPxPerZoomLevel: 90, maxBounds: [[40.88, 28.74], [41.2, 29.22]], maxBoundsViscosity: 0.6 });
    // Sokak haritası: bir web adresinden açıldığında OpenStreetMap'in kendi karoları (sunucu, isteğin hangi siteden geldiğini görmek ister).
    // Bilgisayardan dosya olarak açıldığında tarayıcı bu bilgiyi gönderemez ve OpenStreetMap "Access blocked" döndürür;
    // o durumda anahtar da site bilgisi de istemeyen Esri sokak haritası kullanılır. (CARTO karoları artık API anahtarı istiyor.)
    lyStreet = FILE
      ? L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 })
      : L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, referrerPolicy: "strict-origin-when-cross-origin" });
    // Uydu görüntüsü: yüksek çözünürlüklü ekranlarda bir üst yakınlığın karoları yarı boyutta gösterilir (net görüntü); en son yakınlık düzeyinde büyütülür.
    lySat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", L.Browser.retina ? { detectRetina: true, maxZoom: 20, maxNativeZoom: 18 } : { maxZoom: 19 });
    lySatLbl = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, zIndex: 2 });
    for (const l of [lyStreet, lySat]) {
      l.on("tileerror", () => { if (++tileFails === 6) capText("Harita görüntüsü yüklenemedi. İnternet bağlantını kontrol et."); });
      l.on("tileload", () => { if (tileFails >= 6) { tileFails = 0; capText(); } });
    }
    map.fitBounds(L.latLngBounds(STOPS.map((s) => [s.lat, s.lng])), { animate: false });
    plCase = L.polyline([], { className: "rt-case", interactive: false }).addTo(map);
    plMain = L.polyline([], { className: "rt-main", interactive: false }).addTo(map);
    const icon = (el) => L.divIcon({ className: "lmk", html: el, iconSize: [0, 0] });
    meMk = L.marker([LAT0, LNG0], { icon: icon(meEl), interactive: false, keyboard: false, zIndexOffset: 2000 }).addTo(map);
    tipMk = L.marker([LAT0, LNG0], { icon: icon(tipEl), interactive: false, keyboard: false, zIndexOffset: 5000 }).addTo(map);
    map.on("click", (e) => {
      if (S.picking) { stopPick(); setMe(e.latlng.lat, e.latlng.lng, "secim", "Seçtiğin nokta"); toast("Başlangıç noktası ayarlandı."); }
      else if (S.sel != null) closeDetail();
    });
    map.on("zoomend", zoomState);
    const lb = $("#layer"); lb.hidden = false; lb.addEventListener("click", () => setLayer(!S.sat));
    let sat = false; try { sat = localStorage.getItem("zr.katman") === "uydu"; } catch (e) {}
    setLayer(sat); zoomState();
    $("#info-btn").textContent = "Harita hakkında";
    infoEl.querySelector(".kicker").textContent = "Harita hakkında";
    infoEl.querySelector(".h2").textContent = "Gerçek harita ve uydu görüntüsü";
    const li = infoEl.querySelectorAll("li");
    li[0].innerHTML = "Duraklar <b>gerçek harita</b> üzerinde gösterilir. Sağdaki düğmeyle sokak haritası (" + (FILE ? "Esri" : "OpenStreetMap") + ") ile uydu görüntüsü (Esri) arasında geçersin.";
    li[1].innerHTML = "“Konumumu bul”, tarayıcı izin verirse gerçek konumunu gösterir; konum yalnızca tarayıcında kalır. İzin verilmezse başlangıç noktasını haritadan ya da hazır noktalardan seçersin.";
  }

  /* ——— Kamera ——— */
  function clampView() {
    V.k = clamp(V.k, KMIN, KMAX);
    V.cx = clamp(V.cx, BB.x0 - (0.36 * V.w) / V.k, BB.x1 + (0.36 * V.w) / V.k);
    V.cy = clamp(V.cy, BB.y0 - (0.36 * V.h) / V.k, BB.y1 + (0.36 * V.h) / V.k);
  }
  const stopFly = () => { cancelAnimationFrame(flyRaf); flyRaf = 0; };
  function fly(t, ms = 900) {
    stopFly();
    const b = { cx: t.cx ?? V.cx, cy: t.cy ?? V.cy, k: clamp(t.k ?? V.k, KMIN, KMAX) };
    if (RM.matches || ms <= 0) { Object.assign(V, b); clampView(); draw(); return; }
    const a = { cx: V.cx, cy: V.cy, k: V.k }, t0 = performance.now(), l0 = Math.log(a.k), l1 = Math.log(b.k);
    const step = (now) => {
      const u = Math.min(1, (now - t0) / ms), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      V.k = Math.exp(l0 + (l1 - l0) * e); V.cx = a.cx + (b.cx - a.cx) * e; V.cy = a.cy + (b.cy - a.cy) * e;
      clampView(); draw(); flyRaf = u < 1 ? requestAnimationFrame(step) : 0;
    };
    flyRaf = requestAnimationFrame(step);
  }
  // Panelin ve üst şeridin kapatmadığı harita alanı.
  function pad() {
    if (DESK.matches) return { l: 440, t: 124, r: 84, b: 40 };
    return { l: 26, t: 140, r: 74, b: (S.sheet === "peek" ? 132 : Math.round(V.h * 0.46)) + 26 };
  }
  function fit(pts, ms = 900, maxK = 0.22) {
    if (REAL) {
      const q = pad(), o = { paddingTopLeft: [q.l, q.t], paddingBottomRight: [q.r, q.b], maxZoom: Math.min(17, Math.floor(zoomForK(maxK) + 1.6)) }, bb = L.latLngBounds(pts.map((t) => [t.lat, t.lng]));
      map.stop();
      if (RM.matches || ms <= 0) map.fitBounds(bb, { ...o, animate: false }); else map.flyToBounds(bb, { ...o, duration: ms / 1000 });
      return;
    }
    const p = pad(), aw = Math.max(80, V.w - p.l - p.r), ah = Math.max(80, V.h - p.t - p.b), b = bbox(pts);
    const k = clamp(Math.min(aw / Math.max(b.x1 - b.x0, 1), ah / Math.max(b.y1 - b.y0, 1)) * 0.86, KMIN, maxK);
    fly({ k, cx: (b.x0 + b.x1) / 2 - (p.l + aw / 2 - V.w / 2) / k, cy: (b.y0 + b.y1) / 2 - (p.t + ah / 2 - V.h / 2) / k }, ms);
  }
  const focus = (pt, minK, ms = 800) => {
    if (REAL) {
      const q = pad(), z = Math.max(map.getZoom(), Math.min(18, Math.round(zoomForK(minK) + 2.6))), c = map.unproject(map.project([pt.lat, pt.lng], z).subtract([(q.l - q.r) / 2, (q.t - q.b) / 2]), z);
      map.stop();
      if (RM.matches || ms <= 0) map.setView(c, z, { animate: false }); else map.flyTo(c, z, { duration: ms / 1000 });
      return;
    }
    const p = pad(), k = Math.max(V.k, minK); fly({ k, cx: pt.x - (p.l + (V.w - p.l - p.r) / 2 - V.w / 2) / k, cy: pt.y - (p.t + (V.h - p.t - p.b) / 2 - V.h / 2) / k }, ms); };
  const fitNear = (ms = 1100) => fit([S.me, ...active().slice().sort((a, b) => dist(S.me, a) - dist(S.me, b)).slice(0, 8)], ms, 0.13);
  function zoomAt(px, py, f, ms = 0) {
    const [wx, wy] = toWorld(px, py), k = clamp(V.k * f, KMIN, KMAX);
    fly({ k, cx: wx - (px - V.w / 2) / k, cy: wy - (py - V.h / 2) / k }, ms);
  }

  /* ——— Harita etkileşimi ——— */
  if (!REAL) {
    const ptrs = new Map();
    let ges = null, moved = false;
    const local = (e) => { const r = mapEl.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    mapEl.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      stopFly();
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) { ges = { pan: true, x: e.clientX, y: e.clientY, cx: V.cx, cy: V.cy, on: false }; moved = false; }
      else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], r = mapEl.getBoundingClientRect();
        ges = { pan: false, d: Math.hypot(a.x - b.x, a.y - b.y) || 1, k: V.k, w: toWorld((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top) }; moved = true;
      }
    });
    mapEl.addEventListener("pointermove", (e) => {
      const p = ptrs.get(e.pointerId);
      if (!p || !ges) return;
      p.x = e.clientX; p.y = e.clientY;
      if (ges.pan && ptrs.size === 1) {
        const dx = e.clientX - ges.x, dy = e.clientY - ges.y;
        if (!ges.on) { if (Math.hypot(dx, dy) < 6) return; ges.on = true; moved = true; mapEl.classList.add("drag"); try { mapEl.setPointerCapture(e.pointerId); } catch (err) {} }
        V.cx = ges.cx - dx / V.k; V.cy = ges.cy - dy / V.k; clampView(); draw();
      } else if (!ges.pan && ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()], r = mapEl.getBoundingClientRect();
        V.k = clamp((ges.k * Math.hypot(a.x - b.x, a.y - b.y)) / ges.d, KMIN, KMAX);
        V.cx = ges.w[0] - ((a.x + b.x) / 2 - r.left - V.w / 2) / V.k; V.cy = ges.w[1] - ((a.y + b.y) / 2 - r.top - V.h / 2) / V.k; clampView(); draw();
      }
    });
    const pUp = (e) => {
      ptrs.delete(e.pointerId); mapEl.classList.remove("drag");
      if (ptrs.size === 1) { const [a] = [...ptrs.values()]; ges = { pan: true, x: a.x, y: a.y, cx: V.cx, cy: V.cy, on: true }; }
      else if (!ptrs.size) ges = null;
    };
    mapEl.addEventListener("pointerup", pUp); mapEl.addEventListener("pointercancel", pUp);
    mapEl.addEventListener("wheel", (e) => { e.preventDefault(); const [x, y] = local(e); zoomAt(x, y, Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0018))); }, { passive: false });
    mapEl.addEventListener("dblclick", (e) => { if (e.target.closest(".mk")) return; const [x, y] = local(e); zoomAt(x, y, 2, 420); });
    mapEl.addEventListener("click", (e) => {
      if (moved) { moved = false; return; }
      if (S.picking) { const [x, y] = local(e), w = toWorld(x, y), g = unproj(w[0], w[1]); stopPick(); setMe(g.lat, g.lng, "secim", "Seçtiğin nokta"); toast("Başlangıç noktası ayarlandı."); return; }
      const m = e.target.closest(".mk");
      if (m) selectStop(+m.dataset.stop, "map");
      else if (S.sel != null) closeDetail();
    });
  }
  mapEl.addEventListener("focusin", (e) => {
    const m = e.target.closest(".mk"); if (!m || !m.matches(":focus-visible")) return;
    const s = STOPS[+m.dataset.stop], p = pad(), q = REAL ? map.latLngToContainerPoint([s.lat, s.lng]) : { x: sx(s.x), y: sy(s.y) };
    if (q.x < p.l || q.x > V.w - p.r || q.y < p.t || q.y > V.h - p.b) focus(s, REAL ? 0.02 : V.k, 450);
  });
  const unscroll = (e) => { const t = e.target === document ? document.scrollingElement : e.target; if (t && t !== bodyEl && !bodyEl.contains(t) && t.id !== "chips" && (t.scrollLeft || t.scrollTop)) { t.scrollLeft = 0; t.scrollTop = 0; } };
  document.addEventListener("scroll", unscroll, true);
  $("#zin").addEventListener("click", () => (REAL ? map.zoomIn(1) : zoomAt(V.w / 2, V.h / 2, 1.7, 380)));
  $("#zout").addEventListener("click", () => (REAL ? map.zoomOut(1) : zoomAt(V.w / 2, V.h / 2, 1 / 1.7, 380)));

  /* ——— Panel: alt sayfa ——— */
  const sheetGeom = () => { const H = sheet.offsetHeight; return { H, peek: H - 132, half: H - Math.round(app.clientHeight * 0.46), full: 0 }; };
  function setSheet(st) {
    S.sheet = st; app.dataset.sheet = st;
    if (DESK.matches) { sheet.style.removeProperty("--ty"); sheet.style.removeProperty("--pad"); app.style.setProperty("--sheet-vis", "0px"); return; }
    const g = sheetGeom();
    sheet.style.setProperty("--ty", g[st] + "px"); sheet.style.setProperty("--pad", g[st] + "px");
    app.style.setProperty("--sheet-vis", g.H - (st === "full" ? g.half : g[st]) + "px");
  }
  const raise = () => { if (!DESK.matches && S.sheet === "peek") setSheet("half"); };
  let sd = null, sheetMoved = false;
  const sMove = (e) => {
    if (!sd) return;
    const dy = e.clientY - sd.y;
    if (!sd.on) { if (Math.abs(dy) < 6) return; sd.on = true; sheetMoved = true; sheet.classList.add("dragging"); }
    const now = performance.now(); sd.v = (e.clientY - sd.ly) / Math.max(1, now - sd.t); sd.ly = e.clientY; sd.t = now;
    let ty = sd.ty + dy; ty = ty < 0 ? ty * 0.25 : Math.min(ty, sd.g.peek + 36);
    sd.cur = ty; sheet.style.setProperty("--ty", ty + "px"); app.style.setProperty("--sheet-vis", Math.min(sd.g.H - ty, sd.g.H - sd.g.half) + "px");
  };
  const sUp = () => {
    for (const t of ["pointermove", "pointerup", "pointercancel"]) window.removeEventListener(t, t === "pointermove" ? sMove : sUp);
    if (!sd) return;
    if (sd.on) { sheet.classList.remove("dragging"); const t = sd.cur + sd.v * 170, g = sd.g; setSheet(["full", "half", "peek"].reduce((b, st) => (Math.abs(g[st] - t) < Math.abs(g[b] - t) ? st : b), "half")); }
    sd = null;
  };
  head.addEventListener("pointerdown", (e) => {
    if (DESK.matches || e.button > 0) return;
    sheetMoved = false; const g = sheetGeom();
    sd = { y: e.clientY, ty: g[S.sheet], cur: g[S.sheet], g, on: false, t: performance.now(), ly: e.clientY, v: 0 };
    window.addEventListener("pointermove", sMove); window.addEventListener("pointerup", sUp); window.addEventListener("pointercancel", sUp);
  });
  head.addEventListener("click", (e) => { if (sheetMoved) { e.stopPropagation(); e.preventDefault(); sheetMoved = false; } }, true);
  $("#grab").addEventListener("click", () => setSheet(S.sheet === "peek" ? "half" : S.sheet === "half" ? "full" : "half"));

  function show(name, dir = 1) {
    if (curPanel === name) { bodyEl.scrollTop = 0; return; }
    for (const k in P) if (k !== name) { P[k].classList.remove("is-on"); P[k].hidden = true; }
    const el = P[name]; el.hidden = false; el.style.setProperty("--dir", dir); void el.offsetWidth; el.classList.add("is-on");
    curPanel = name; bodyEl.scrollTop = 0;
  }
  function setTab(tab) {
    if (tab === "kesfet" && S.tab === "kesfet" && S.sel != null) { closeDetail(); return; }
    S.tab = tab; app.dataset.tab = tab;
    $("#tab-kesfet").setAttribute("aria-selected", tab === "kesfet"); $("#tab-rota").setAttribute("aria-selected", tab === "rota");
    if (tab === "rota") { renderRota(); show("rota", 1); } else show(S.sel != null ? "detail" : "kesfet", -1);
    raise();
  }
  $(".seg").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) setTab(b.dataset.tab); });

  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 3200); }

  /* ——— Konsept çipleri ——— */
  function renderChips() {
    const n = (c) => STOPS.filter((s) => s.r.concept === c.id).length;
    $("#chips").innerHTML = `<button class="chip" type="button" data-c="" aria-pressed="${!S.concepts.size}" style="--i:0">Tümü <b>${STOPS.length}</b></button>` +
      D.CONCEPTS.map((c, i) => c.soon
        ? `<button class="chip soon" type="button" data-soon="1" style="--i:${i + 1}"><span class="dot"></span>${esc(c.label)} <em>yakında</em></button>`
        : `<button class="chip c-${c.routes[0]}" type="button" data-c="${c.id}" aria-pressed="${S.concepts.has(c.id)}" style="--i:${i + 1}"><span class="dot${c.routes.length > 1 ? " two" : ""}"></span>${esc(c.label)} <b>${n(c)}</b></button>`).join("");
  }
  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    if (b.dataset.soon) { toast("Sabit ikram noktaları henüz eklenmedi. Liste gelince bu konsept açılacak."); return; }
    const id = b.dataset.c;
    if (!id) S.concepts.clear(); else if (S.concepts.has(id)) S.concepts.delete(id); else S.concepts.add(id);
    for (const c of $("#chips").querySelectorAll("[data-c]")) c.setAttribute("aria-pressed", c.dataset.c ? S.concepts.has(c.dataset.c) : !S.concepts.size);
    if (S.sel != null && !active().includes(STOPS[S.sel])) S.sel = null;
    syncMarkers(); renderKesfet();
    if (S.tab === "rota") renderRota(true); else if (S.sel == null) show("kesfet", -1);
    fit(S.concepts.size ? [...active(), S.me] : STOPS, 950, 0.2);
  });

  /* ——— İşaretler ——— */
  function buildMarkers() {
    const f = document.createDocumentFragment();
    for (const s of STOPS) {
      const b = document.createElement("button");
      b.type = "button"; b.className = `mk c-${s.r.id}${s.approx ? " approx" : ""}`; b.dataset.stop = s.id;
      b.setAttribute("aria-label", `${s.name}${s.hon ? " " + s.hon : ""}, ${s.r.name}`);
      const i = document.createElement("i"); b.append(i); s.el = b; s.dot = i;
      if (!REAL) { f.append(b); continue; }
      b.style.setProperty("--fx", s.fx.toFixed(3)); b.style.setProperty("--fy", s.fy.toFixed(3));
      s.mk = L.marker([s.lat, s.lng], { icon: L.divIcon({ className: "lmk", html: b, iconSize: [0, 0] }), keyboard: false }).addTo(map);
      s.mk.on("click", () => {
        if (S.picking) { stopPick(); setMe(s.lat, s.lng, "secim", s.name); toast("Başlangıç noktası ayarlandı."); } else selectStop(s.id, "map");
      });
    }
    mkEl.append(f);
  }
  function syncMarkers() {
    const act = new Set(active()), ord = new Map(S.route.map((id, i) => [id, i + 1]));
    for (const s of STOPS) {
      const o = ord.get(s.id), c = s.el.classList;
      c.toggle("dim", !act.has(s) && !o && S.sel !== s.id); c.toggle("inr", !!o); c.toggle("sel", S.sel === s.id);
      s.dot.textContent = o || "";
      if (!o) c.remove("wait", "pop");
      if (REAL) s.mk.setZIndexOffset(S.sel === s.id ? 4000 : o ? 1000 : 0);
    }
    const sel = S.sel != null ? STOPS[S.sel] : null;
    tipEl.hidden = !sel;
    if (REAL && sel) tipMk.setLatLng([sel.lat, sel.lng]);
    if (sel) { tipEl.firstElementChild.textContent = sel.name; tipEl.firstElementChild.style.animation = "none"; void tipEl.offsetWidth; tipEl.firstElementChild.style.animation = ""; }
    const rc = $("#rcount"); rc.hidden = !S.route.length;
    if (rc.textContent !== String(S.route.length)) { rc.textContent = S.route.length; rc.classList.remove("bump"); void rc.offsetWidth; rc.classList.add("bump"); }
    draw();
  }

  /* ——— Rota hesabı ——— */
  function computeRT() {
    const pts = [], cum = [], at = [];
    if (S.route.length) {
      let prev = S.me;
      pts.push([prev.x, prev.y]); cum.push(0);
      for (const id of S.route) {
        const s = STOPS[id];
        for (const p of [...leg(prev, s).via, [s.x, s.y, s]]) { const q = pts[pts.length - 1]; cum.push(cum[cum.length - 1] + Math.hypot(p[0] - q[0], p[1] - q[1])); pts.push(p); }
        at.push(cum[cum.length - 1]); prev = s;
      }
    }
    RT.pts = pts; RT.cum = cum; RT.at = at; RT.len = cum[cum.length - 1] || 0;
  }
  const pathLen = (ids) => { let L = 0, p = S.me; for (const id of ids) { L += dist(p, STOPS[id]); p = STOPS[id]; } return L; };
  function twoOpt(ids) {
    ids = ids.slice();
    let best = pathLen(ids), better = true, guard = 0;
    while (better && guard++ < 60) {
      better = false;
      for (let i = 0; i < ids.length - 1; i++) for (let j = i + 1; j < ids.length; j++) {
        const c = ids.slice(0, i).concat(ids.slice(i, j + 1).reverse(), ids.slice(j + 1)), L = pathLen(c);
        if (L < best - 1) { ids = c; best = L; better = true; }
      }
    }
    return ids;
  }
  function animateRoute() {
    cancelAnimationFrame(rtRaf);
    for (const s of STOPS) s.el.classList.remove("wait", "pop");
    if (RM.matches || RT.pts.length < 2) { RT.prog = 1; draw(); return; }
    const ms = clamp(RT.len / 3.2, 1000, 2400), t0 = performance.now();
    S.route.forEach((id) => STOPS[id].el.classList.add("wait"));
    RT.prog = 0;
    const step = (now) => {
      const u = Math.min(1, (now - t0) / ms); RT.prog = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const L = RT.prog * RT.len;
      S.route.forEach((id, i) => { const c = STOPS[id].el.classList; if (c.contains("wait") && RT.at[i] <= L + 1) { c.remove("wait"); c.add("pop"); } });
      draw(); if (u < 1) rtRaf = requestAnimationFrame(step);
    };
    rtRaf = requestAnimationFrame(step);
  }
  function setRoute(ids, { name = "", animate = true, open = true } = {}) {
    S.route = ids; S.name = name; computeRT(); syncMarkers(); syncAdds();
    if (open) { S.sel = null; syncMarkers(); S.tab = ""; setTab("rota"); } else if (S.tab === "rota") renderRota(true);
    if (ids.length && animate) { fit([S.me, ...ids.map((id) => STOPS[id])], 1000, 0.26); animateRoute(); countUp(); } else { RT.prog = 1; draw(); }
  }
  function buildNearest() {
    const pool = active().slice(), n = Math.min(S.count, pool.length), out = [];
    let cur = S.me;
    while (out.length < n) { let bi = 0, bd = Infinity; pool.forEach((s, i) => { const d = dist(cur, s); if (d < bd) { bd = d; bi = i; } }); cur = pool.splice(bi, 1)[0]; out.push(cur.id); }
    const ids = twoOpt(out);
    setRoute(ids, { name: `${conceptLabel()} · ${n} durak` });
    toast(`${n} duraklı rota hazır · ${fmtD(pathLen(ids) * WALK)}, ≈ ${fmtT(pathLen(ids) * WALK)} yürüyüş`);
  }
  function toggleStop(id) {
    const i = S.route.indexOf(id);
    if (i >= 0) S.route.splice(i, 1); else S.route.push(id);
    cancelAnimationFrame(rtRaf); computeRT(); RT.prog = 1; syncMarkers(); syncAdds();
    if (i < 0) { const c = STOPS[id].el.classList; c.remove("pop"); void STOPS[id].el.offsetWidth; c.add("pop"); }
    if (S.tab === "rota") renderRota(true);
    toast(i >= 0 ? "Durak rotadan çıkarıldı." : `${S.route.length}. durak olarak eklendi.`);
  }
  function syncAdds() {
    for (const b of bodyEl.querySelectorAll("[data-add]")) {
      const on = S.route.includes(+b.dataset.add);
      b.setAttribute("aria-pressed", on);
      if (b.classList.contains("add")) { b.innerHTML = ic(on ? "check" : "plus"); b.setAttribute("aria-label", on ? "Rotadan çıkar" : "Rotaya ekle"); }
      else b.innerHTML = on ? ic("check") + "Rotada · çıkar" : ic("plus") + "Rotaya ekle";
    }
  }
  function countUp() {
    const els = [...P.rota.querySelectorAll(".stat b[data-v]")];
    if (RM.matches || !els.length) return;
    const t0 = performance.now(), ms = 1100;
    const step = (now) => {
      const u = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - u, 3);
      for (const el of els) { const v = +el.dataset.v * e; el.textContent = el.dataset.d === "1" ? v.toFixed(1).replace(".", ",") : Math.round(v); }
      if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ——— Konum ——— */
  function setMe(lat, lng, src, label, flyTo = true) {
    const [x, y] = proj(lat, lng);
    S.me = { lat, lng, x, y, src, label };
    meEl.hidden = false; meEl.className = "me " + src;
    if (REAL) meMk.setLatLng([lat, lng]);
    $("#locate").classList.toggle("on", src === "gps");
    computeRT(); renderKesfet(); draw();
    if (S.sel != null) renderDetail();
    if (S.tab === "rota") renderRota(true);
    if (flyTo) { if (S.route.length) fit([S.me, ...S.route.map((id) => STOPS[id])], 1000, 0.26); else fitNear(); }
  }
  function startPick(msg) {
    S.picking = true; mapEl.classList.add("picking"); $("#pick-tx").textContent = msg || "Haritada başlangıç noktana dokun"; pickEl.hidden = false;
    if (!DESK.matches) setSheet("peek");
  }
  function stopPick() { S.picking = false; mapEl.classList.remove("picking"); pickEl.hidden = true; if (!DESK.matches && S.sheet === "peek") setSheet("half"); }
  $("#pick-x").addEventListener("click", stopPick);
  // Konum: izin penceresi açıkken sayaç işlemez (tarayıcının kendi zaman aşımı izin verildikten sonra başlar), geç gelen konum da kabul edilir.
  // Hassas konum gelmezse bir kez de düşük hassasiyetle (Wi-Fi/ağ konumu) denenir. Hata nedeni kullanıcıya ayrı ayrı söylenir.
  function locate() {
    const btn = $("#locate"), geo = navigator.geolocation;
    if (btn.classList.contains("busy")) return;
    if (!geo) { startPick("Bu tarayıcı konum paylaşmıyor. Başlangıç noktana haritada dokun."); return; }
    if (window.isSecureContext === false) { startPick("Konum yalnızca güvenli (https) adreste çalışır. Başlangıç noktana haritada dokun."); return; }
    btn.classList.add("busy");
    let tries = 0;
    const hint = setTimeout(() => toast("Konum bekleniyor. Tarayıcı izin soruyorsa “İzin ver”i seç."), 5000);
    const end = () => { clearTimeout(hint); btn.classList.remove("busy"); };
    const ok = (pos) => {
      end();
      const la = pos.coords.latitude, lo = pos.coords.longitude;
      const inside = REAL ? la >= 40.88 && la <= 41.2 && lo >= 28.74 && lo <= 29.22 : la >= 40.93 && la <= 41.12 && lo >= 28.84 && lo <= 29.12;
      if (!inside) {
        const q = proj(la, lo), km = Math.max(1, Math.round(Math.hypot(q[0], q[1]) / 1000));
        startPick("Konumun bulundu ama harita alanının dışında (yaklaşık " + km + " km). Başlangıç noktana haritada dokun."); return;
      }
      if (S.picking) stopPick();
      setMe(la, lo, "gps", "Konumun"); toast("Konumun bulundu.");
    };
    const bad = (err) => {
      const c = err && err.code;
      if (c !== 1 && tries++ === 0) { try { geo.getCurrentPosition(ok, bad, { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 }); return; } catch (e) {} }
      end();
      startPick(c === 1 ? (FILE ? "Konum izni alınamadı. Dosya olarak açılan sayfada tarayıcı izin vermeyebilir. Başlangıç noktana haritada dokun."
          : "Konum izni verilmedi. Adres çubuğundaki konum izninden açabilirsin. Şimdilik başlangıç noktana haritada dokun.")
        : c === 3 ? "Konum zamanında gelmedi. Yeniden dene ya da başlangıç noktana haritada dokun."
        : "Konum alınamadı. Cihazın konum servisi kapalı olabilir. Başlangıç noktana haritada dokun.");
    };
    try { geo.getCurrentPosition(ok, bad, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }); } catch (err) { bad(null); }
  }
  $("#locate").addEventListener("click", locate);

  /* ——— Keşfet ——— */
  const nameHtml = (s) => esc(s.name) + (s.hon ? `<em>${esc(s.hon)}</em>` : "");
  function renderKesfet() {
    const me = S.me, list = active().slice().sort((a, b) => dist(me, a) - dist(me, b));
    const t = me.src === "ornek" ? [`Örnek konum: ${me.label}`, REAL ? "“Konumumu bul”a dokun ya da başlangıç noktanı aşağıdan veya haritadan seç." : "Önizleme gerçek konumunu okuyamaz. Başlangıç noktanı aşağıdan ya da haritadan seç."]
      : me.src === "gps" ? ["Konumun bulundu", "Mesafeler bulunduğun yere göre hesaplanıyor."] : [`Başlangıç: ${me.label}`, "Mesafeler bu noktaya göre hesaplanıyor."];
    const routes = S.concepts.size ? D.ROUTES.filter((r) => S.concepts.has(r.concept)) : [];
    P.kesfet.innerHTML = `
      <div class="card loc">
        <span class="loc-ic">${ic("loc")}</span>
        <div class="loc-tx"><b>${esc(t[0])}</b><span>${esc(t[1])}</span></div>
        <div class="row scroll">
          <button class="pill blue" type="button" data-act="locate">${ic("loc")}Konumumu bul</button>
          <button class="pill" type="button" data-act="pick">${ic("hand")}Haritadan seç</button>
          <span class="sep"></span>
          ${D.PRESETS.map((p, i) => `<button class="pill" type="button" data-preset="${i}" aria-pressed="${me.src !== "gps" && me.label === p.label}">${esc(p.label)}</button>`).join("")}
        </div>
      </div>
      ${routes.map((r, i) => `
      <div class="rc c-${r.id}" style="--i:${i}">
        <div class="rc-tx"><i>Rota ${r.no} · ${esc(r.kicker)}</i><b>${esc(r.name)}</b><span>${esc(r.lede)}</span><small>${STOPS.filter((s) => s.r === r).length} durak · ${r.km} · ${r.sure}</small></div>
        <button class="btn sm" type="button" data-load="${r.id}">Güzergâhı aç</button>
      </div>`).join("")}
      <div class="sec-head"><h2 class="h2">Sana en yakın duraklar</h2><small>${S.concepts.size ? esc(conceptLabel()) + " · " : ""}${list.length} durak</small></div>
      <ul class="list">${list.map((s, i) => { const d = dist(me, s) * WALK, on = S.route.includes(s.id); return `
        <li class="it c-${s.r.id}" style="--i:${i}">
          <button class="it-main" type="button" data-stop="${s.id}">
            <span class="bdg">${s.n}</span>
            <span class="it-tx"><b>${nameHtml(s)}</b><small>${s.tag ? esc(s.tag) + " · " : ""}${esc(s.addr)}</small></span>
            <span class="it-d">${fmtD(d)}<small>${fmtT(d)}</small></span>
          </button>
          <button class="add" type="button" data-add="${s.id}" aria-pressed="${on}" aria-label="${on ? "Rotadan çıkar" : "Rotaya ekle"}">${ic(on ? "check" : "plus")}</button>
        </li>`; }).join("")}</ul>
      <p class="fine">Mesafe ve süreler kuş uçuşu ölçümden tahmin edilir; sokak sokak yol tarifi için durağı Google ya da Apple Haritalar’da aç.</p>`;
  }

  /* ——— Durak ayrıntısı ——— */
  const gmaps = (pts) => "https://www.google.com/maps/dir/?api=1&origin=" + ll(pts[0]) + "&destination=" + ll(pts[pts.length - 1]) + (pts.length > 2 ? "&waypoints=" + pts.slice(1, -1).map(ll).join("%7C") : "") + "&travelmode=walking";
  const ll = (p) => encodeURIComponent(p.lat.toFixed(5) + "," + p.lng.toFixed(5));
  const apple = (pts) => "https://maps.apple.com/directions?source=" + ll(pts[0]) + "&destination=" + ll(pts[pts.length - 1]) + pts.slice(1, -1).map((p) => "&waypoint=" + ll(p)).join("") + "&mode=walking";
  function renderDetail() {
    const s = STOPS[S.sel], d = dist(S.me, s) * WALK, sib = STOPS.filter((t) => t.r === s.r), i = sib.indexOf(s), on = S.route.includes(s.id);
    P.detail.innerHTML = `
      <button class="pill back" type="button" data-act="back">${ic("back")}${S.from === "rota" ? "Rotama dön" : "Listeye dön"}</button>
      <article class="d-hero c-${s.r.id}" data-n="${String(s.n).padStart(2, "0")}">
        <p class="d-eye">Rota ${s.r.no} · ${esc(s.r.name)}</p>
        <h2 class="d-title">${nameHtml(s)}</h2>
        <p class="d-meta">${s.tag ? `<span class="tag">${esc(s.tag)}</span>` : ""}${s.approx ? '<span class="tag approx">Yaklaşık konum</span>' : ""}<span>${esc(s.addr)}</span></p>
      </article>
      <p class="d-desc">${esc(s.desc)}</p>
      <ul class="facts">
        <li>${ic("walk")}<div><b>${S.me.src === "gps" ? "Senden uzaklık" : "Başlangıç noktasına uzaklık"}</b>${fmtD(d)} · yürüyerek ≈ ${fmtT(d)} (tahmini)</div></li>
        ${s.hours ? `<li>${ic("clock")}<div><b>Ziyaret bilgisi</b>${esc(s.hours)}</div></li>` : ""}
        <li>${ic("pin")}<div><b>Yer</b>${esc(s.addr)}</div></li>
      </ul>
      <div class="acts c-${s.r.id}">
        <button class="btn gold" type="button" data-add="${s.id}" aria-pressed="${on}">${on ? ic("check") + "Rotada · çıkar" : ic("plus") + "Rotaya ekle"}</button>
        <a class="btn" href="${S.me.src === "ornek" ? "https://www.google.com/maps/dir/?api=1&destination=" + ll(s) + "&travelmode=walking" : gmaps([S.me, s])}" target="_blank" rel="noopener">${ic("ext")}Yol tarifi al</a>
      </div>
      <div class="d-nav">
        <button class="pill" type="button" ${i > 0 ? `data-stop="${sib[i - 1].id}"` : "disabled"}>${ic("back")}Önceki durak</button>
        <button class="pill" type="button" ${i < sib.length - 1 ? `data-stop="${sib[i + 1].id}"` : "disabled"}>Sonraki durak${ic("fwd")}</button>
      </div>
      <a class="pill back" href="${s.r.url}#durak-${s.n}" target="_blank" rel="noopener">${ic("ext")}Sitedeki rota sayfasında gör</a>`;
  }
  function selectStop(id, from) {
    if (from === "rota") S.from = "rota"; else if (from === "list" || (from === "map" && S.tab !== "rota")) S.from = "kesfet"; else if (from === "map") S.from = "rota";
    S.sel = id; S.tab = "kesfet"; app.dataset.tab = "kesfet";
    $("#tab-kesfet").setAttribute("aria-selected", true); $("#tab-rota").setAttribute("aria-selected", false);
    syncMarkers(); renderDetail();
    if (curPanel === "detail") { P.detail.classList.remove("is-on"); void P.detail.offsetWidth; P.detail.classList.add("is-on"); bodyEl.scrollTop = 0; } else show("detail", 1);
    if (!DESK.matches && S.sheet !== "half") setSheet("half");
    focus(STOPS[id], from === "map" ? 0.07 : 0.13);
  }
  function closeDetail() {
    S.sel = null; syncMarkers();
    if (S.from === "rota") { S.tab = ""; setTab("rota"); } else { S.tab = "kesfet"; show("kesfet", -1); }
  }

  /* ——— Rotam ——— */
  // Haritalara aktarılacak noktalar: aynı yerdeki ardışık duraklar tek nokta sayılır.
  function xpts() {
    const out = [{ p: S.me, i: 0 }];
    S.route.forEach((id, k) => { const s = STOPS[id], l = out[out.length - 1]; if (out.length > 1 && Math.hypot(l.p.x - s.x, l.p.y - s.y) < 20) l.i = k + 1; else out.push({ p: s, i: k + 1 }); });
    return out;
  }
  function gparts() {
    const pts = xpts(), out = [];
    for (let i = 0; i < pts.length - 1; i += 4) { const seg = pts.slice(i, i + 5); out.push({ from: seg[0].i, to: seg[seg.length - 1].i, url: gmaps(seg.map((x) => x.p)) }); }
    return out;
  }
  const nth = (i) => (i === 0 ? "Başlangıç" : i + ". durak");
  function renderRota(quiet) {
    const me = S.me, ids = S.route, L = pathLen(ids) * WALK, pool = active().length;
    S.count = clamp(S.count, Math.min(3, pool), Math.min(12, pool));
    const builder = `
      <div class="card">
        <p class="kicker">Sana göre rota</p>
        <div class="build-row">
          <span>Kaç durak olsun?<small>${esc(conceptLabel())} içinden, ${esc(me.src === "gps" ? "sana" : me.label + " noktasına")} en yakın olanlar</small></span>
          <div class="step"><button type="button" data-act="dec" aria-label="Azalt">${ic("minus")}</button><output id="cnt">${S.count}</output><button type="button" data-act="inc" aria-label="Artır">${ic("plus")}</button></div>
        </div>
        <button class="btn gold" type="button" data-act="build">${ic("spark")}En yakın rotayı oluştur</button>
      </div>`;
    let cur = "";
    if (ids.length) {
      const parts = gparts(), pts = xpts().map((x) => x.p);
      let prev = me;
      cur = `
      <div class="sec-head"><h2 class="h2">${esc(S.name || "Rotam")}</h2><small>başlangıçtan itibaren · tahmini</small></div>
      <div class="stats">
        <div class="stat"><b data-v="${ids.length}">${ids.length}</b><span>durak</span></div>
        <div class="stat"><b data-v="${(L / 1000).toFixed(1)}" data-d="1">${(L / 1000).toFixed(1).replace(".", ",")}</b><span>km yürüyüş</span></div>
        <div class="stat"><b data-v="${mins(L)}">${mins(L)}</b><span>dakika</span></div>
      </div>
      <ol class="rlist">
        <li class="rstart"><span class="dot"></span><span>Başlangıç: <b>${esc(me.src === "ornek" ? me.label + " (örnek)" : me.label)}</b></span></li>
        ${ids.map((id, i) => { const s = STOPS[id], d = dist(prev, s) * WALK; prev = s; return `
        <li class="ri c-${s.r.id}" style="--i:${i}">
          <span class="bdg">${i + 1}</span>
          <button class="ri-main" type="button" data-stop="${s.id}" data-from="rota"><b>${nameHtml(s)}</b><small>${fmtD(d)} · ${fmtT(d)} yürüyüş</small></button>
          <span class="ops">
            <button type="button" data-mv="-1" data-i="${i}" aria-label="Yukarı taşı" ${i ? "" : "disabled"}>${ic("up")}</button>
            <button type="button" data-mv="1" data-i="${i}" aria-label="Aşağı taşı" ${i < ids.length - 1 ? "" : "disabled"}>${ic("down")}</button>
            <button type="button" data-rm="${i}" aria-label="Rotadan çıkar">${ic("x")}</button>
          </span>
        </li>`; }).join("")}
      </ol>
      <div class="row">
        <button class="pill" type="button" data-act="opt">${ic("swap")}Sırayı kısalt</button>
        <button class="pill" type="button" data-act="clear">${ic("trash")}Temizle</button>
      </div>
      <div class="card exp">
        <p class="kicker">Haritalara aktar</p>
        ${parts.length === 1
          ? `<a class="btn dark" href="${parts[0].url}" target="_blank" rel="noopener">${ic("ext")}Google Haritalar’da aç</a>`
          : `<p class="exp-lbl">Google Haritalar · ${parts.length} bölüm</p><div class="parts">${parts.map((p, i) => `<a class="btn sm dark" href="${p.url}" target="_blank" rel="noopener">${i + 1}. bölüm · ${nth(p.from)} → ${nth(p.to)}</a>`).join("")}</div>`}
        <a class="btn" href="${apple(pts)}" target="_blank" rel="noopener">${ic("ext")}Apple Haritalar’da aç</a>
        <button class="btn" type="button" data-act="dl" id="dl-html">${ic("dl")}Rota sayfasını indir</button>
        ${HOSTED ? "" : `<button class="btn" type="button" data-act="gpx">${ic("dl")}GPX dosyasını indir</button>`}
        <p class="fine">${parts.length > 1 ? "Google Haritalar bir bağlantıda başlangıç, 3 ara durak ve varış açtığı için uzun rota bölümlere ayrılır. " : ""}Haritalar uygulaması yolu sokaklara göre yeniden çizer.</p>
      </div>
      <form class="card" data-form="save">
        <p class="kicker">Bu cihaza kaydet</p>
        <div class="save"><input type="text" name="ad" maxlength="60" aria-label="Rota adı" placeholder="Rotaya bir ad ver" value="${esc(S.name)}"><button class="btn dark" type="submit">${ic("mark")}Kaydet</button></div>
      </form>`;
    } else {
      cur = `<div class="empty"><b>Henüz bir rotan yok</b><span>Üstten bir konsept seçip “En yakın rotayı oluştur”a dokun, hazır bir güzergâhı aç ya da durakları ${ic("plus")} ile tek tek ekle.</span></div>`;
    }
    const saved = S.saved.length ? `
      <div class="sec-head"><h2 class="h2">Kayıtlı rotalarım</h2><small>bu cihazda</small></div>
      ${S.saved.map((r, i) => `<div class="rc c-r2" style="--i:${i}"><div class="rc-tx"><b>${esc(r.name)}</b><small>${r.keys.length} durak · başlangıç ${esc(r.start.label)}</small></div><span class="ops"><button type="button" class="btn sm" data-saved="${i}">Aç</button><button type="button" data-del="${i}" aria-label="Kaydı sil">${ic("trash")}</button></span></div>`).join("")}` : "";
    const near = D.ROUTES.map((r) => ({ r, d: Math.min(...STOPS.filter((s) => s.r === r).map((s) => dist(me, s))) })).sort((a, b) => a.d - b.d);
    const ready = `
      <div class="sec-head"><h2 class="h2">Hazır güzergâhlar</h2><small>yakından uzağa</small></div>
      ${near.map(({ r, d }, i) => `
      <div class="rc c-${r.id}" style="--i:${i}">
        <div class="rc-tx"><i>Rota ${r.no} · ${esc(r.kicker)}</i><b>${esc(r.name)}${i ? "" : '<span class="near">En yakın</span>'}</b><small>${STOPS.filter((s) => s.r === r).length} durak · ${r.km} · ${r.sure} · en yakın durağı ${fmtD(d * WALK)}</small></div>
        <button class="btn sm" type="button" data-load="${r.id}">Aç</button>
      </div>`).join("")}`;
    P.rota.classList.toggle("no-anim", !!quiet);
    P.rota.innerHTML = cur + builder + saved + ready;
    if (HOSTED && ids.length) dlReady.then((d) => { const b = $("#dl-html"); if (b && !d) b.hidden = true; });
  }

  /* ——— Kaydetme ve indirme ——— */
  const KEY = "zr.rotalar.v1";
  const loadSaved = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); S.saved = Array.isArray(v) ? v.filter((r) => r && Array.isArray(r.keys) && r.start) : []; } catch (e) { S.saved = []; } };
  const storeSaved = () => { try { localStorage.setItem(KEY, JSON.stringify(S.saved)); return true; } catch (e) { return false; } };
  const dlReady = HOSTED ? window.claude.use("downloads").catch(() => null) : Promise.resolve(null);

  function sheetHtml() {
    const me = S.me, ids = S.route, L = pathLen(ids) * WALK, parts = gparts(), pts = xpts().map((x) => x.p);
    const day = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(S.name || "Rotam")} · Ziyaret Rehberim</title>
<style>body{margin:0;background:#FBF8F2;color:#1C2533;font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:720px;margin:0 auto;padding:28px 18px 48px}header{border-bottom:2px solid #C9973A;padding-bottom:14px;margin-bottom:18px}small,.m{color:#5A6578;font-size:14px}h1{margin:4px 0;font-size:26px;line-height:1.2;color:#0E1B2E}h2{margin:0;font-size:18px;color:#0E1B2E}ol{list-style:none;margin:0;padding:0}li{display:grid;grid-template-columns:38px 1fr;gap:12px;padding:14px 0;border-bottom:1px solid #E6DFD0}li>b{width:34px;height:34px;border-radius:50%;background:#0E1B2E;color:#fff;display:grid;place-items:center;font-size:15px}p{margin:4px 0}a{color:#8A6219}.btns{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.btns a{padding:10px 14px;border-radius:12px;background:#0E1B2E;color:#fff;text-decoration:none;font-weight:600;font-size:14px}.btns a.o{background:#fff;color:#0E1B2E;border:1px solid #D9D0BC}</style></head><body><main>
<header><small>ZİYARET REHBERİM · ${esc(day)}</small><h1>${esc(S.name || "Rotam")}</h1><p class="m">${ids.length} durak · yaklaşık ${fmtD(L)} · ≈ ${fmtT(L)} yürüyüş (kuş uçuşu ölçümden tahmin, ziyaret süresi hariç)</p><p class="m">Başlangıç: ${esc(me.label)} (${me.lat.toFixed(5)}, ${me.lng.toFixed(5)})</p>
<div class="btns">${parts.map((p, i) => `<a href="${p.url}">Google Haritalar${parts.length > 1 ? ` · ${i + 1}. bölüm` : ""}</a>`).join("")}<a class="o" href="${apple(pts)}">Apple Haritalar</a></div></header>
<ol>${ids.map((id, i) => { const s = STOPS[id]; return `<li><b>${i + 1}</b><div><h2>${esc(s.name)}${s.hon ? " " + esc(s.hon) : ""}</h2><p class="m">${esc(s.r.name)}${s.tag ? " · " + esc(s.tag) : ""} · ${esc(s.addr)}${s.approx ? " · konum yaklaşık" : ""}</p><p>${esc(s.desc)}</p>${s.hours ? `<p class="m">${esc(s.hours)}</p>` : ""}<p><a href="https://www.google.com/maps/search/?api=1&query=${ll(s)}">Haritada aç</a> · <a href="${s.r.url}#durak-${s.n}">Rehberde oku</a></p></div></li>`; }).join("")}</ol>
<p class="m">ziyaretrehberim.com</p></main></body></html>`;
  }
  function gpx() {
    const x = (s) => esc(s).replace(/'/g, "&apos;");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="ziyaretrehberim.com" xmlns="http://www.topografix.com/GPX/1/1">\n<metadata><name>${x(S.name || "Rotam")}</name></metadata>\n` +
      S.route.map((id) => { const s = STOPS[id]; return `<wpt lat="${s.lat}" lon="${s.lng}"><name>${x(s.name)}</name><desc>${x(s.addr)}</desc></wpt>`; }).join("\n") +
      `\n<rte><name>${x(S.name || "Rotam")}</name>\n<rtept lat="${S.me.lat.toFixed(5)}" lon="${S.me.lng.toFixed(5)}"><name>Başlangıç</name></rtept>\n` +
      S.route.map((id) => { const s = STOPS[id]; return `<rtept lat="${s.lat}" lon="${s.lng}"><name>${x(s.name)}</name></rtept>`; }).join("\n") + "\n</rte>\n</gpx>\n";
  }
  async function download(filename, data, type) {
    if (HOSTED) {
      const d = await dlReady;
      if (!d) { toast("Bu görünümde indirme kullanılamıyor."); return; }
      try { await d.save({ filename, data }); toast("Dosya indirildi."); }
      catch (err) { toast(err && err.code === "declined" ? "İndirme iptal edildi." : "Dosya indirilemedi."); }
      return;
    }
    const a = document.createElement("a"), url = URL.createObjectURL(new Blob([data], { type }));
    a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("Dosya indiriliyor.");
  }

  /* ——— Panel tıklamaları ——— */
  bodyEl.addEventListener("click", (e) => {
    const t = e.target.closest("[data-stop],[data-add],[data-act],[data-preset],[data-load],[data-saved],[data-del],[data-mv],[data-rm]");
    if (!t || !bodyEl.contains(t)) return;
    const d = t.dataset;
    if (d.stop != null) return selectStop(+d.stop, d.from || (curPanel === "detail" ? "" : "list"));
    if (d.add != null) return toggleStop(+d.add);
    if (d.preset != null) { const p = D.PRESETS[+d.preset]; if (S.picking) stopPick(); return setMe(p.lat, p.lng, "secim", p.label); }
    if (d.load) { const r = D.ROUTES.find((x) => x.id === d.load); setRoute(STOPS.filter((s) => s.r === r).sort((a, b) => a.n - b.n).map((s) => s.id), { name: r.name }); toast(`${r.name} güzergâhı kendi sırasıyla açıldı.`); return; }
    if (d.saved != null) { const r = S.saved[+d.saved], ids = r.keys.map((k) => BYKEY.get(k)).filter(Boolean).map((s) => s.id); setMe(r.start.lat, r.start.lng, "secim", r.start.label, false); setRoute(ids, { name: r.name }); return; }
    if (d.del != null) { S.saved.splice(+d.del, 1); storeSaved(); renderRota(true); toast("Kayıt silindi."); return; }
    if (d.mv) { const i = +d.i, j = i + +d.mv; [S.route[i], S.route[j]] = [S.route[j], S.route[i]]; return setRoute(S.route, { name: S.name, animate: false, open: false }); }
    if (d.rm != null) { S.route.splice(+d.rm, 1); return setRoute(S.route, { name: S.name, animate: false, open: false }); }
    switch (d.act) {
      case "locate": return locate();
      case "pick": return S.picking ? stopPick() : startPick();
      case "back": return closeDetail();
      case "inc": case "dec": { const n = active().length; S.count = clamp(S.count + (d.act === "inc" ? 1 : -1), Math.min(3, n), Math.min(12, n)); $("#cnt").textContent = S.count; return; }
      case "build": return buildNearest();
      case "clear": setRoute([], { animate: false, open: false }); return toast("Rota temizlendi.");
      case "opt": { const a = pathLen(S.route), ids = twoOpt(S.route), b = pathLen(ids); if (a - b < 5) return toast("Sıra zaten en kısa hâlinde."); setRoute(ids, { name: S.name, open: false }); return toast(`Sıra kısaltıldı: ${fmtD((a - b) * WALK)} daha az yürüyüş.`); }
      case "dl": return download("ziyaret-rotam.html", sheetHtml(), "text/html");
      case "gpx": return download("ziyaret-rotam.gpx", gpx(), "application/gpx+xml");
    }
  });
  bodyEl.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!S.route.length) return;
    const name = (new FormData(e.target).get("ad") || "").toString().trim() || `Rotam · ${S.route.length} durak`;
    S.name = name;
    S.saved = S.saved.filter((r) => r.name !== name);
    S.saved.unshift({ name, keys: S.route.map((id) => STOPS[id].key), start: { lat: S.me.lat, lng: S.me.lng, label: S.me.label }, t: Date.now() });
    const ok = storeSaved(); renderRota(true);
    toast(ok ? "Rota bu cihaza kaydedildi." : "Tarayıcı kayda izin vermedi; rota yalnızca bu oturumda duruyor.");
  });

  /* ——— Bilgi kutusu ——— */
  const infoBtn = $("#info-btn");
  const setInfo = (on) => { infoEl.hidden = !on; infoBtn.setAttribute("aria-expanded", on); };
  infoBtn.addEventListener("click", (e) => { e.stopPropagation(); setInfo(infoEl.hidden); });
  $("#info-x").addEventListener("click", () => setInfo(false));
  document.addEventListener("click", (e) => { if (!infoEl.hidden && !infoEl.contains(e.target)) setInfo(false); });
  document.addEventListener("keydown", (e) => { if (e.key !== "Escape") return; if (!infoEl.hidden) setInfo(false); else if (S.picking) stopPick(); else if (S.sel != null) closeDetail(); });

  /* ——— Başlangıç ——— */
  function resize() {
    const w = mapEl.clientWidth, h = mapEl.clientHeight;
    if (!w || !h) return;
    V.w = w; V.h = h; V.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    if (REAL) { map.invalidateSize({ animate: false }); setSheet(S.sheet); return; }
    cv.width = Math.round(V.w * V.dpr); cv.height = Math.round(V.h * V.dpr);
    setSheet(S.sheet); clampView(); cancelAnimationFrame(raf); raf = 0; render();
  }
  function init() {
    V.w = mapEl.clientWidth; V.h = mapEl.clientHeight;
    loadSaved(); renderChips();
    if (REAL) initReal();
    buildMarkers();
    const p0 = D.PRESETS[0], [x0, y0] = proj(p0.lat, p0.lng);
    S.me = { lat: p0.lat, lng: p0.lng, x: x0, y: y0, src: "ornek", label: p0.label };
    meEl.hidden = false; meEl.className = "me ornek";
    if (REAL) meMk.setLatLng([p0.lat, p0.lng]);
    for (const s of STOPS) s.dot.style.animationDelay = Math.round(380 + Math.min(1100, dist(S.me, s) / 7)) + "ms";
    readColors();
    V.w = mapEl.clientWidth; V.h = mapEl.clientHeight;
    fit(STOPS, 0, 0.12);
    resize();
    new ResizeObserver(resize).observe(mapEl);
    DESK.addEventListener("change", () => { setSheet(S.sheet); draw(); });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors);
    new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    syncMarkers(); renderKesfet(); show("kesfet", 1);
    if (!DESK.matches && !RM.matches) { sheet.classList.add("dragging"); sheet.style.setProperty("--ty", sheet.offsetHeight + "px"); void sheet.offsetWidth; sheet.classList.remove("dragging"); requestAnimationFrame(() => setSheet("half")); }
    setTimeout(() => fitNear(1700), 750);
  }
  init();
})();
