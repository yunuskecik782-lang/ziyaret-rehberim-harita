/* Ziyaret Rehberim haritası: şematik harita motoru, konsept seçimi, en yakın rota, kaydetme ve haritalara aktarma. */
(() => {
  "use strict";
  const D = globalThis.ZR_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const app = $("#app"), mapEl = $("#map"), cv = $("#base"), ctx = cv.getContext("2d"), mkEl = $("#mk"), meEl = $("#me"), tipEl = $("#tip");
  const sheet = $("#sheet"), head = $("#sheet-head"), bodyEl = $("#body"), toastEl = $("#toast"), pickEl = $("#pick"), infoEl = $("#info"), scaleEl = $("#scale");
  const P = { hazir: $("#p-hazir"), kesfet: $("#p-kesfet"), detail: $("#p-detail"), rota: $("#p-rota") };
  const goEl = $("#go"), navEl = $("#nav"), sorEl = $("#sor");
  const RM = matchMedia("(prefers-reduced-motion: reduce)"), DESK = matchMedia("(min-width: 900px)");
  const HOSTED = !!(window.claude && typeof window.claude.use === "function");
  const REAL = typeof window.L !== "undefined"; // Leaflet sayfaya eklendiyse gerçek harita, yoksa şematik çizim
  const capEl = $(".cap");
  const EMBED = /[?&]gomulu=1(?:&|$)/.test(location.search); // site sayfasının içine gömülü görünüm
  const SITE = globalThis.ZR_SITE || "https://ziyaretrehberim.com/";
  const YOL = globalThis.ZR_YOL || null, HESAP = globalThis.ZR_HESAP || null;
  // Yeni ön yüz yayındaysa (ZR_SITE tanımlı) rota sayfası bağlantıları oraya gider.
  if (globalThis.ZR_SITE) D.ROUTES.forEach((r) => { r.url = SITE + "guzergahlar/" + r.slug + "/"; });
  if (EMBED) { app.classList.add("gomulu"); document.documentElement.dataset.theme = "light"; }
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
    sag: '<path d="M7 20v-8a3 3 0 0 1 3-3h8M14.5 5l4 4-4 4"/>',
    sol: '<path d="M17 20v-8a3 3 0 0 0-3-3H6M9.5 5l-4 4 4 4"/>',
    duz: '<path d="M12 20V5M6.5 10.5L12 5l5.5 5.5"/>',
    geri: '<path d="M8 20V9a4 4 0 0 1 8 0v3M12.5 9.5L16 13l3.5-3.5"/>',
    basla: '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="8"/>',
    user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.7-5.4 7.2-5.4s6.3 1.8 7.2 5.4"/>',
    rota: '<circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="6" r="2.4"/><path d="M8.4 18H14a3.5 3.5 0 0 0 0-7h-4a3.5 3.5 0 0 1 0-7h5.6"/>',
    nav: '<path d="M12 3l7 17-7-4-7 4z"/>',
    var: '<path d="M6 21V4"/><path d="M6 5h11.5l-2.6 4 2.6 4H6"/>',
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
    return { id: i, key: a[11] || r.id + "-" + a[1], r, n: a[1], name: a[2], hon: a[3], tag: a[4], addr: a[5], desc: a[6], hours: a[7], approx: !!a[8], lat: a[9], lng: a[10], x, y, fx: 0, fy: 0 };
  });
  const BYKEY = new Map(STOPS.map((s) => [s.key, s]));
  const CONCEPT = new Map(D.CONCEPTS.map((c) => [c.id, c]));
  /* Harita işaretleri. Kategoriler yalnızca renkle değil biçimle de ayrılır: kabir ve türbeler ile camiler konum işareti (iğne),
     gezi durakları ve surlar yuvarlak. Sahâbe kabirlerinin ucunda yavaş bir halka atar.
     İşaretler üç boyutlu görünür: parlak, ortası delik konum işareti ve parlak boncuk. Resimleri aşağıdaki iki işlev çizer
     (kendi çizimimiz, dışarıdan dosya yok); her rota rengi için bir kez üretilip CSS’e --mk-pin ve --mk-top olarak verilir.
     Hesabım › Görünüm’den "hepsi konum işareti" ya da "hepsi yuvarlak" seçilebilir (html[data-isaret]). */
  const mkKar = (h, r, t) => { const n = parseInt(h.slice(1), 16); return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v, i) => Math.round(v + (r[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  const mkAcik = (h, t) => mkKar(h, [255, 255, 255], t), mkKoyu = (h, t) => mkKar(h, [10, 14, 26], t);
  const mkCember = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const MK_GOVDE = "M30 78C29 78 28.3 77.2 27.5 75.9C19.5 62.6 3.4 48 3.4 29.6A26.6 26.6 0 0 1 56.6 29.6C56.6 48 40.5 62.6 32.5 75.9C31.7 77.2 31 78 30 78Z";
  const MK_BULANIK = (id, sd) => `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
  // Konum işareti: ışık sol üstten gelir; gövde açıktan koyuya döner, deliğin iç duvarı görünür, üstte parlama vardır.
  function mkPin(c, kenar, kesik) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><defs>` +
      `<radialGradient id="a" cx="19" cy="13" r="66" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${mkAcik(c, .42)}"/><stop offset=".3" stop-color="${mkAcik(c, .08)}"/><stop offset=".62" stop-color="${mkKoyu(c, .2)}"/><stop offset="1" stop-color="${mkKoyu(c, .52)}"/></radialGradient>` +
      `<linearGradient id="w" x1="20" y1="18" x2="41" y2="43" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${mkKoyu(c, .64)}"/><stop offset=".55" stop-color="${mkKoyu(c, .34)}"/><stop offset="1" stop-color="${mkAcik(c, .5)}"/></linearGradient>` +
      MK_BULANIK("f", 1.7) + MK_BULANIK("g", 2.6) + `<clipPath id="k"><path d="${MK_GOVDE}"/></clipPath></defs>` +
      `<path fill-rule="evenodd" fill="url(#a)" d="${MK_GOVDE}${mkCember(30, 29.2, 13.4)}"/>` +
      `<g clip-path="url(#k)"><path d="M9 50C16 62 24 70 30 80L44 66C52 54 58 42 58 28" fill="none" stroke="${mkKoyu(c, .7)}" stroke-width="7" opacity=".34" filter="url(#g)"/>` +
      `<ellipse cx="17" cy="12.6" rx="10.5" ry="4.2" transform="rotate(-40 17 12.6)" fill="#fff" opacity=".74" filter="url(#f)"/>` +
      `<path d="M52 21C55.2 31 53.2 43 46.6 53" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".36" filter="url(#f)"/></g>` +
      `<path fill-rule="evenodd" fill="url(#w)" d="${mkCember(30, 29.2, 13.4)}${mkCember(31.2, 30.8, 10.4)}"/>` +
      `<path d="M40.2 38A13.4 13.4 0 0 1 21.4 39.6" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".5"/>` +
      `<path d="${MK_GOVDE}" fill="none" stroke="${kenar}" stroke-width="${kesik ? 2 : 1.7}"${kesik ? ' stroke-dasharray="4.6 3.4"' : ""}/></svg>`;
  }
  // Yuvarlak işaret: parlak bir boncuk.
  function mkTop(c, kenar, kesik) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><defs>` +
      `<radialGradient id="a" cx="21" cy="17" r="50" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${mkAcik(c, .5)}"/><stop offset=".34" stop-color="${mkAcik(c, .06)}"/><stop offset=".72" stop-color="${mkKoyu(c, .26)}"/><stop offset="1" stop-color="${mkKoyu(c, .56)}"/></radialGradient>` +
      MK_BULANIK("f", 2) + `<clipPath id="k"><circle cx="30" cy="30" r="27"/></clipPath></defs>` +
      `<circle cx="30" cy="30" r="27" fill="url(#a)"/>` +
      `<g clip-path="url(#k)"><ellipse cx="20" cy="15" rx="12" ry="5.6" transform="rotate(-34 20 15)" fill="#fff" opacity=".7" filter="url(#f)"/>` +
      `<path d="M49 40C44 49 36 54 26 54" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".3" filter="url(#f)"/></g>` +
      `<circle cx="30" cy="30" r="27" fill="none" stroke="${kenar}" stroke-width="${kesik ? 2.6 : 2.2}"${kesik ? ' stroke-dasharray="5 3.6"' : ""}/></svg>`;
  }
  const mkUrl = (svg) => `url("data:image/svg+xml,${svg.replace(/"/g, "'").replace(/[%#<>]/g, encodeURIComponent)}")`;
  function mkResimler() {
    let css = "";
    for (const r of D.ROUTES) {
      const t = document.createElement("i"); t.className = "c-" + r.id; mkEl.append(t);
      let c = getComputedStyle(t).getPropertyValue("--c").trim(); t.remove();
      if (!/^#[0-9a-f]{6}$/i.test(c)) c = "#2E5AAC";
      const kenar = r.concept === "padisah" ? "#F6D88F" : "rgba(255,255,255,.9)";   // padişah türbelerinin kenarı altın
      css += `.mk.c-${r.id}{--mk-pin:${mkUrl(mkPin(c, kenar))};--mk-top:${mkUrl(mkTop(c, kenar))}}` +
        `.mk.c-${r.id}.approx{--mk-pin:${mkUrl(mkPin(c, kenar, 1))};--mk-top:${mkUrl(mkTop(c, kenar, 1))}}`;   // yeri yaklaşık olanların kenarı kesikli
    }
    const st = document.createElement("style"); st.textContent = css; document.head.append(st);
  }
  const MK_SEKIL = { sahabe: "igne", padisah: "igne", cami: "igne", mekan: "daire", sur: "daire" };
  const MK_SIMGE = {
    sahabe: '<path d="M14.5 3.2a8.9 8.9 0 1 0 6.9 14.1A7.2 7.2 0 0 1 14.5 3.2z"/>',
    padisah: '<path d="M11.2 2h1.6v3.3h-1.6zM5 12.8c0-4.3 3-7.5 7-8 4 .5 7 3.7 7 8zM3.8 13.6h16.4v2.6H3.8zM5.8 16.2h12.4V22H5.8z"/>',
    cami: '<path d="M2.8 22V9.5L4.3 4l1.5 5.5V22zM13.2 6.2h1.6v3h-1.6zM8 22v-6.2c0-3.6 2.6-6.3 6-6.8 3.4.5 6 3.2 6 6.8V22z"/>',
    mekan: '<path d="M11.3 1.5h1.4v3h-1.4zM7.3 10.5 12 3.5l4.7 7zM8.5 11.5h7V22h-7z"/>',
    sur: '<path fill-rule="evenodd" d="M3 22V7.5h3.6V10h2.8V7.5h5.2V10h2.8V7.5H21V22zM10 22v-4.5a2 2 0 0 1 4 0V22z"/>',
  };
  const mkSekil = (s) => { const g = document.documentElement.dataset.isaret; return g === "igne" || g === "daire" ? g : MK_SEKIL[s.r.concept] || "daire"; };
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
  const S = { concepts: new Set(), me: null, sel: null, route: [], tab: "kesfet", sheet: "half", picking: false, count: 6, saved: [], from: "kesfet", name: "", sat: true, warn: null, startOpen: false };
  const V = { cx: (BB.x0 + BB.x1) / 2, cy: (BB.y0 + BB.y1) / 2, k: 0.04, w: 0, h: 0, dpr: 1 };
  const KMIN = 0.018, KMAX = 0.8;
  const RT = { pts: [], cum: [], at: [], len: 0, prog: 1, duz: true, legD: null, adim: null };
  // Yürüyüş yolu durumu: yok · bekle · tamam · hata · tek (çizilecek ikinci nokta yok). izin: başlangıç noktasını sunucuya gönderme onayı.
  const W = { durum: "yok", izin: null, anim: false, t: 0, q: 0, seq: 0, soruldu: false };
  try { W.izin = localStorage.getItem("zr.yol.izin"); } catch (e) {}
  let C = {}, zcls = "", curPanel = "", raf = 0, flyRaf = 0, rtRaf = 0, toastT = 0, fanR = 10;
  let map = null, lyStreet = null, lySat = null, lySatLbl = null, plCase = null, plMain = null, plAkis = null, meMk = null, tipMk = null, tileFails = 0;

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
    // Sokak yolu yoldayken düz (kuş uçuşu) çizgi çizilmez: önceki yol çizgisi yenisi gelene kadar yerinde kalır, ilk çizimde harita çizgisiz bekler.
    // Kuş uçuşu kesik çizgi yalnızca yol tarifi sunucusuna ulaşılamadığında görünür.
    const bekle = RT.duz && W.durum === "bekle";
    if (bekle && RT.prog > 0) return;
    const n = RT.pts.length, out = [];
    if (n > 1 && RT.prog > 0 && !bekle && !(RT.duz && W.durum === "tek")) {
      const len = RT.len * RT.prog, g = (x, y) => { const q = unproj(x, y); return [q.lat, q.lng]; };
      out.push(g(RT.pts[0][0], RT.pts[0][1]));
      for (let i = 1; i < n; i++) {
        const p = RT.pts[i];
        if (RT.cum[i] <= len) { out.push(g(p[0], p[1])); continue; }
        const a = RT.pts[i - 1], t = (len - RT.cum[i - 1]) / (RT.cum[i] - RT.cum[i - 1] || 1);
        out.push(g(a[0] + (p[0] - a[0]) * t, a[1] + (p[1] - a[1]) * t)); break;
      }
    }
    plCase.setLatLngs(out); plMain.setLatLngs(out); plAkis.setLatLngs(out);
    mapEl.classList.toggle("sokak", !RT.duz);
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
  function setLayer(sat, sakla) {
    S.sat = sat; mapEl.classList.toggle("is-sat", sat);
    for (const l of [lyStreet, lySat, lySatLbl]) map.removeLayer(l);
    if (sat) { lySat.addTo(map); lySatLbl.addTo(map); } else lyStreet.addTo(map);
    const b = $("#layer");
    b.setAttribute("aria-pressed", sat); b.lastElementChild.textContent = sat ? "Harita" : "Uydu"; b.setAttribute("aria-label", sat ? "Sokak haritasına geç" : "Uydu görüntüsüne geç");
    tileFails = 0; capText();
    // Harita uydu görüntüsüyle açılır; tercih yalnızca ziyaretçi düğmeye basınca saklanır (site sayfalarıyla ortak anahtar).
    if (sakla) try { localStorage.setItem("zr.katman.2", sat ? "uydu" : "sokak"); } catch (e) {}
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
    // Çizginin üstünde gidiş yönüne doğru akan küçük noktalar (yalnızca görsel; app.css içindeki "akis" hareketi)
    plAkis = L.polyline([], { className: "rt-akis", interactive: false }).addTo(map);
    const icon = (el) => L.divIcon({ className: "lmk", html: el, iconSize: [0, 0] });
    meMk = L.marker([LAT0, LNG0], { icon: icon(meEl), interactive: false, keyboard: false, zIndexOffset: 2000 }).addTo(map);
    tipMk = L.marker([LAT0, LNG0], { icon: icon(tipEl), interactive: false, keyboard: false, zIndexOffset: 5000 }).addTo(map);
    map.on("click", (e) => {
      if (S.picking) { stopPick(); setMe(e.latlng.lat, e.latlng.lng, "secim", "Seçtiğin nokta"); toast("Başlangıç noktası ayarlandı."); }
      else if (S.sel != null) closeDetail();
    });
    map.on("zoomend", zoomState);
    if (EMBED) map.scrollWheelZoom.disable(), map.on("click", () => map.scrollWheelZoom.enable()), mapEl.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());
    const lb = $("#layer"); lb.hidden = false; lb.addEventListener("click", () => setLayer(!S.sat, true));
    let sat = true; try { sat = localStorage.getItem("zr.katman.2") !== "sokak"; } catch (e) {}
    setLayer(sat); zoomState();
    $("#info-btn").textContent = "Harita hakkında";
    infoEl.querySelector(".kicker").textContent = "Harita hakkında";
    infoEl.querySelector(".h2").textContent = "Gerçek harita ve uydu görüntüsü";
    const li = infoEl.querySelectorAll("li");
    li[0].innerHTML = "Duraklar <b>gerçek uydu görüntüsü</b> (Esri) üzerinde açılır. Sağdaki düğmeyle sokak haritasına (" + (FILE ? "Esri" : "OpenStreetMap") + ") geçebilirsin.";
    li[1].innerHTML = "Harita açılınca tarayıcı izin verirse konumunu bulur ve durakları sana göre sıralar. Konumun bizde saklanmaz. İzin verilmezse başlangıç noktasını haritadan ya da hazır noktalardan seçersin.";
    if (YOL) li[2].innerHTML = "Rotalar <b>sokakları izleyen yürüyüş yoluyla</b> çizilir; “Rotayı başlat” adım adım tarif verir. Yol, OpenStreetMap verisiyle " + YOL.SERVIS.adres + " sunucusunda hesaplanır: durakların konumu, sen onaylarsan kendi konumun da bu sunucuya gönderilir. Sunucuya ulaşılamazsa çizgi kuş uçuşu çizilir ve mesafe tahmin edilir (× 1,3 · dakikada 75 m).";
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
    const e = EMBED ? 52 : 0;
    if (DESK.matches) return { l: 440, t: 124 - e, r: 84, b: 40 };
    return { l: 26, t: 140 - e, r: 74, b: (S.sheet === "peek" ? 132 + goH() : Math.round(V.h * 0.46)) + 26 };
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
  const goH = () => (goEl.hidden ? 0 : goEl.offsetHeight);
  const sheetGeom = () => { const H = sheet.offsetHeight; return { H, peek: H - 132 - goH(), half: H - Math.round(app.clientHeight * 0.46), full: 0 }; };
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
    curPanel = name; bodyEl.scrollTop = 0; syncGo();
  }
  const SEKME = ["hazir", "kesfet", "rota"];
  const sekmeIsaret = (tab) => { app.dataset.tab = tab; for (const k of SEKME) $("#tab-" + k).setAttribute("aria-selected", tab === k); };
  function setTab(tab) {
    if (tab === "kesfet" && S.tab === "kesfet" && S.sel != null) { closeDetail(); return; }
    const once = SEKME.indexOf(S.tab), dir = SEKME.indexOf(tab) >= (once < 0 ? 1 : once) ? 1 : -1;
    S.tab = tab; sekmeIsaret(tab);
    if (tab === "rota") { renderRota(); show("rota", dir); }
    else if (tab === "hazir") { renderHazir(); show("hazir", dir); }
    else show(S.sel != null ? "detail" : "kesfet", dir);
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
    if (!id || (S.concepts.size === 1 && S.concepts.has(id))) S.concepts.clear(); else S.concepts = new Set([id]);
    applyConcepts();
  });
  function applyConcepts(ms = 950) {
    for (const c of $("#chips").querySelectorAll("[data-c]")) c.setAttribute("aria-pressed", c.dataset.c ? S.concepts.has(c.dataset.c) : !S.concepts.size);
    if (S.sel != null && !active().includes(STOPS[S.sel])) S.sel = null;
    if (S.concepts.size === D.CONCEPTS.filter((c) => !c.soon).length) { S.concepts.clear(); return applyConcepts(ms); }
    syncMarkers(); renderKesfet();
    if (S.tab === "rota") renderRota(true); else if (S.tab === "kesfet" && S.sel == null) show("kesfet", -1);
    fit(S.concepts.size ? [...active(), S.me] : STOPS, ms, 0.2);
  }

  /* ——— İşaretler ——— */
  function buildMarkers() {
    mkResimler();
    const f = document.createDocumentFragment();
    for (const s of STOPS) {
      const b = document.createElement("button");
      b.type = "button"; b.className = `mk c-${s.r.id} k-${s.r.concept} s-${mkSekil(s)}${s.approx ? " approx" : ""}`; b.dataset.stop = s.id;
      b.setAttribute("aria-label", `${s.name}${s.hon ? " " + s.hon : ""}, ${s.r.name}`);
      // i: işaretin gövdesi (resmi CSS verir) · mk-s: kategori simgesi (yuvarlak işarette) · b: rotadaki sıra numarası
      b.innerHTML = `<i><svg class="mk-s" viewBox="0 0 24 24" aria-hidden="true">${MK_SIMGE[s.r.concept] || ""}</svg><b></b></i>`;
      s.el = b; s.dot = b.querySelector("b");
      if (!REAL) { f.append(b); continue; }
      b.style.setProperty("--fx", s.fx.toFixed(3)); b.style.setProperty("--fy", s.fy.toFixed(3));
      s.mk = L.marker([s.lat, s.lng], { icon: L.divIcon({ className: "lmk", html: b, iconSize: [0, 0] }), keyboard: false }).addTo(map);
      s.mk.on("click", () => {
        if (S.picking) { stopPick(); setMe(s.lat, s.lng, "secim", s.name, true, true); toast("Başlangıç noktası ayarlandı."); } else selectStop(s.id, "map");
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
    tipEl.hidden = !sel; if (sel) tipEl.dataset.s = mkSekil(sel);
    if (REAL && sel) tipMk.setLatLng([sel.lat, sel.lng]);
    if (sel) { tipEl.firstElementChild.textContent = sel.name; tipEl.firstElementChild.style.animation = "none"; void tipEl.offsetWidth; tipEl.firstElementChild.style.animation = ""; }
    const rc = $("#rcount"); rc.hidden = !S.route.length;
    if (rc.textContent !== String(S.route.length)) { rc.textContent = S.route.length; rc.classList.remove("bump"); void rc.offsetWidth; rc.classList.add("bump"); }
    draw();
  }

  // Hesabım › Görünüm’de işaret biçimi değişince (başka sekmede de olsa) işaretler yeni biçime geçer.
  function mkBicim() { for (const s of STOPS) { if (!s.el) continue; const g = mkSekil(s); s.el.classList.toggle("s-igne", g === "igne"); s.el.classList.toggle("s-daire", g === "daire"); } if (S.sel != null) tipEl.dataset.s = mkSekil(STOPS[S.sel]); }
  if (HESAP) HESAP.dinle(mkBicim);

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
    RT.pts = pts; RT.cum = cum; RT.at = at; RT.len = cum[cum.length - 1] || 0; RT.duz = true; RT.legD = null; RT.adim = null;
    walkSync(); syncGo(); syncOzet(); taslakYaz();
  }

  /* ——— Yürüyüş yolu: sokakları izleyen çizgi ve dönüş tarifi ——— */
  // Başlangıç noktası herkese açık bir yerse (örnek konum, hazır nokta, bir durak) ya da kullanıcı onay verdiyse sunucuya gönderilebilir.
  const startOk = () => S.me.src === "ornek" || !!S.me.acik || W.izin === "evet";
  const walkPts = () => { const st = S.route.map((id) => [STOPS[id].lat, STOPS[id].lng]); return startOk() ? [[S.me.lat, S.me.lng], ...st] : st; };
  function applyWalk(res) {
    const withStart = startOk(), pts = [], cum = [], at = [], legD = [], adim = [];
    const push = (x, y) => { const q = pts[pts.length - 1]; cum.push(q ? cum[cum.length - 1] + Math.hypot(x - q[0], y - q[1]) : 0); pts.push([x, y]); };
    let li = 0;
    if (withStart) push(S.me.x, S.me.y);
    S.route.forEach((id, i) => {
      const s = STOPS[id];
      if (i === 0 && !withStart) { push(s.x, s.y); legD.push(null); adim.push(null); }
      else { const lg = res.legs[li++]; for (const c of lg.pts) { const q = proj(c[0], c[1]); push(q[0], q[1]); } legD.push(lg.d); adim.push(lg.adim); }
      at.push(cum[cum.length - 1]);
    });
    RT.pts = pts; RT.cum = cum; RT.at = at; RT.len = cum[cum.length - 1] || 0; RT.duz = false; RT.legD = legD; RT.adim = adim;
  }
  function walkSync() {
    clearTimeout(W.q);
    if (!YOL || !REAL || !S.route.length) { W.durum = "yok"; W.seq++; return; }
    yolIzniSor();
    const pts = walkPts();
    if (pts.length < 2) { W.durum = "tek"; W.seq++; return; }
    const res = YOL.hazir(pts);
    if (res && res.legs.length === pts.length - 1) { W.durum = "tamam"; W.seq++; applyWalk(res); return; }
    W.durum = "bekle"; const seq = ++W.seq;
    W.q = setTimeout(() => {
      YOL.yol(pts).then(() => {
        if (seq !== W.seq) return;
        cancelAnimationFrame(rtRaf); clearTimeout(W.t); computeRT();
        if (W.anim) { W.anim = false; animateRoute(); } else { RT.prog = 1; draw(); }
        if (S.tab === "rota") renderRota(true);
        syncOzet();
      }, () => {
        if (seq !== W.seq) return;
        W.durum = "hata";
        if (W.anim) { W.anim = false; animateRoute(); } else { RT.prog = 1; draw(); }
        if (S.tab === "rota") renderRota(true);
        syncOzet();
      });
    }, 160);
  }
  // Başlangıç noktası herkese açık bir yer değilse, yolun oradan başlaması için bir kez sorulur. Yanıt bu tarayıcıda saklanır.
  function yolIzniSor() {
    if (W.izin != null || W.soruldu || startOk() || N.on) return;
    W.soruldu = true;
    sor("Yol, bulunduğun yerden başlasın mı?", `Bunun için başlangıç noktanın konumu yol tarifi sunucusuna (${YOL.SERVIS.adres}) gönderilir. Biz saklamıyoruz. “Hayır” dersen yol yalnızca duraklar arasında çizilir.`, "Evet, çiz", "Hayır").then((ok) => {
      if (ok == null) { W.soruldu = false; return; }
      yolIzni(ok);
    });
  }
  function yolIzni(ok) {
    W.izin = ok ? "evet" : "hayir"; try { localStorage.setItem("zr.yol.izin", W.izin); } catch (e) {}
    computeRT(); RT.prog = 1; draw(); if (S.tab === "rota") renderRota(true);
  }
  // Bir bacağın uzunluğu: sokak yolu geldiyse gerçek ölçü, yoksa kuş uçuşu × 1,3 tahmini.
  const legLen = (i, prev, s) => (RT.legD && RT.legD[i] != null ? RT.legD[i] : dist(prev, s) * WALK);
  const routeLen = () => { let L = 0, p = S.me; S.route.forEach((id, i) => { L += legLen(i, p, STOPS[id]); p = STOPS[id]; }); return L; };
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
    if (open) { S.sel = null; syncMarkers(); S.tab = ""; setTab("rota"); } else if (S.tab === "rota") renderRota(true); else if (S.tab === "hazir") renderHazir();
    if (ids.length && animate) {
      fit([S.me, ...ids.map((id) => STOPS[id])], 1000, 0.26); countUp();
      // Sokak yolu yoldaysa çizgi o gelince çizilir; arada düz çizgi gösterilmez.
      if (W.durum === "bekle") { W.anim = true; cancelAnimationFrame(rtRaf); RT.prog = 0; draw(); }
      else animateRoute();
    } else { W.anim = false; RT.prog = 1; draw(); }
  }
  function buildNearest() {
    const pool = active().slice(), n = Math.min(S.count, pool.length), out = [];
    let cur = S.me;
    while (out.length < n) { let bi = 0, bd = Infinity; pool.forEach((s, i) => { const d = dist(cur, s); if (d < bd) { bd = d; bi = i; } }); cur = pool.splice(bi, 1)[0]; out.push(cur.id); }
    const ids = twoOpt(out);
    setRoute(ids, { name: `${conceptLabel()} · ${n} durak` });
    toast(`${n} duraklı rota hazır · yaklaşık ${fmtD(pathLen(ids) * WALK)}, ≈ ${fmtT(pathLen(ids) * WALK)} yürüyüş`);
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
  function setMe(lat, lng, src, label, flyTo = true, acik = false) {
    const [x, y] = proj(lat, lng);
    S.me = { lat, lng, x, y, src, label, acik }; S.startOpen = false;
    meEl.hidden = false; meEl.className = "me " + src;
    if (REAL) meMk.setLatLng([lat, lng]);
    $("#locate").classList.toggle("on", src === "gps");
    computeRT(); renderKesfet(); draw();
    if (S.sel != null) renderDetail();
    if (S.tab === "rota") renderRota(true); else if (S.tab === "hazir") renderHazir();
    if (flyTo) { if (S.route.length) fit([S.me, ...S.route.map((id) => STOPS[id])], 1000, 0.26); else fitNear(); }
  }
  function startPick(msg) {
    S.picking = true; mapEl.classList.add("picking"); $("#pick-tx").textContent = msg || "Haritada başlangıç noktana dokun"; pickEl.hidden = false;
    if (!DESK.matches) setSheet("peek");
  }
  function stopPick() { S.picking = false; mapEl.classList.remove("picking"); pickEl.hidden = true; if (!DESK.matches && S.sheet === "peek") setSheet("half"); }
  $("#pick-x").addEventListener("click", stopPick);
  // Konum: harita açılınca kendiliğinden istenir (auto); izin penceresi açıkken sayaç işlemez, geç gelen konum da kabul edilir.
  // Hassas konum gelmezse bir kez de düşük hassasiyetle (Wi-Fi/ağ konumu) denenir. Konum alınamazsa Keşfet'in üstünde nedenini söyleyen bir uyarı durur.
  const KONUM = {
    yok: ["Bu tarayıcı konum paylaşmıyor", "Başlangıç noktanı haritadan ya da hazır noktalardan seçebilirsin."],
    https: ["Konum yalnızca güvenli adreste çalışır", "Adresin https ile başladığından emin ol ya da başlangıç noktanı haritadan seç."],
    izin: ["Konumun kapalı", "Durakları sana göre sıralamak için konumu aç: adres çubuğundaki kilit ya da ayar simgesinden “Konum”a izin ver, sonra “Konumu aç”a dokun."],
    sure: ["Konum zamanında gelmedi", "Açık havada yeniden dene ya da başlangıç noktanı haritadan seç."],
    servis: ["Konum alınamadı", "Cihazının konum servisi kapalı olabilir. Ayarlardan konumu açıp yeniden dene."],
  };
  function konumUyar(kod, auto, ozel) {
    const k = ozel || KONUM[kod];
    S.warn = { kod, b: k[0], t: k[1] }; renderKesfet();
    if (auto) toast(k[0] + "."); else startPick(k[0] + ". Başlangıç noktana haritada dokun.");
  }
  function locate(auto) {
    auto = auto === true;
    const btn = $("#locate"), geo = navigator.geolocation;
    if (btn.classList.contains("busy")) return;
    if (!geo) return konumUyar("yok", auto);
    if (window.isSecureContext === false) return konumUyar("https", auto);
    btn.classList.add("busy");
    let tries = 0;
    const hint = auto ? 0 : setTimeout(() => toast("Konum bekleniyor. Tarayıcı izin soruyorsa “İzin ver”i seç."), 5000);
    const end = () => { clearTimeout(hint); btn.classList.remove("busy"); };
    const ok = (pos) => {
      end();
      const la = pos.coords.latitude, lo = pos.coords.longitude;
      const inside = REAL ? la >= 40.88 && la <= 41.2 && lo >= 28.74 && lo <= 29.22 : la >= 40.93 && la <= 41.12 && lo >= 28.84 && lo <= 29.12;
      if (!inside) {
        const q = proj(la, lo), km = Math.max(1, Math.round(Math.hypot(q[0], q[1]) / 1000));
        return konumUyar("disarida", auto, ["Harita alanının dışındasın", `Konumun bulundu ama İstanbul’daki duraklara yaklaşık ${km} km uzakta. Başlangıç için haritadan ya da hazır noktalardan bir yer seç.`]);
      }
      if (S.picking) stopPick();
      S.warn = null; setMe(la, lo, "gps", "Konumun"); if (!auto) toast("Konumun bulundu.");
    };
    const bad = (err) => {
      const c = err && err.code;
      if (c !== 1 && tries++ === 0) { try { geo.getCurrentPosition(ok, bad, { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 }); return; } catch (e) {} }
      end(); konumUyar(c === 1 ? "izin" : c === 3 ? "sure" : "servis", auto);
    };
    try { geo.getCurrentPosition(ok, bad, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }); } catch (err) { bad(null); }
  }
  $("#locate").addEventListener("click", () => locate());
  // Harita açılınca konum kendiliğinden istenir. Sayfanın içine gömülüyken, harita ekranda görünür hâle gelince istenir.
  function autoLocate() {
    if (!REAL) return;
    if (!navigator.geolocation) return konumUyar("yok", true);
    if (window.isSecureContext === false) return konumUyar("https", true);
    const basla = () => {
      const git = () => locate(true);
      if (!navigator.permissions || !navigator.permissions.query) return git();
      navigator.permissions.query({ name: "geolocation" }).then((izin) => {
        if (izin.state === "denied") konumUyar("izin", true); else git();
        izin.onchange = () => { if (izin.state === "granted" && S.me.src !== "gps") locate(true); };
      }, git);
    };
    if (!EMBED || !("IntersectionObserver" in window)) return basla();
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.intersectionRatio >= 0.5)) { io.disconnect(); basla(); } }, { threshold: [0.5] });
    io.observe(app);
  }

  /* ——— Keşfet ——— */
  const nameHtml = (s) => esc(s.name) + (s.hon ? `<em>${esc(s.hon)}</em>` : "");
  const basAd = (me) => (me.src === "gps" ? "Konumun" : me.src === "ornek" ? me.label + " (örnek)" : me.label);
  // Rota özeti: Keşfet'in en üstünde tek satır. Durak sayısı, yol ve süre; “Rotama git” Rotam sekmesini açar (“Rotayı başlat” oradadır).
  function ozetHtml() {
    const ids = S.route;
    if (!ids.length) return `<span class="oz-ic">${ic("rota")}</span><span class="oz-tx"><b>Rotan henüz boş</b><small>Durakları ${ic("plus")} ile ekle</small></span><button class="btn sm gold" type="button" data-act="build">${ic("spark")}En yakın rota</button>`;
    const L = routeLen(), not = YOL && REAL && W.durum === "bekle" ? " · yol hesaplanıyor…" : RT.duz ? " · tahmini" : "";
    return `<span class="oz-ic">${ic("rota")}</span><span class="oz-tx"><b>${esc(S.name || "Rotam")}</b><small>${ids.length} durak · ${fmtD(L)} · ≈ ${fmtT(L)}${not}</small></span><button class="btn sm dark" type="button" data-act="rotam">Rotama git${ic("fwd")}</button>`;
  }
  function syncOzet() { const el = $("#k-ozet"); if (el) { el.classList.toggle("bos", !S.route.length); el.innerHTML = ozetHtml(); } }
  function renderKesfet() {
    const me = S.me, list = active().slice().sort((a, b) => dist(me, a) - dist(me, b)), w = S.warn;
    const say = (c) => STOPS.filter((t) => t.r.concept === c.id).length;
    P.kesfet.innerHTML = `
      ${w ? `<div class="uyari" role="status">
        <span class="uyari-ic">${ic("loc")}</span>
        <b>${esc(w.b)}</b>
        ${w.kod === "disarida" || w.kod === "yok" || w.kod === "https" ? `<button class="btn sm dark" type="button" data-act="pick">${ic("hand")}Haritadan seç</button>` : `<button class="btn sm dark" type="button" data-act="locate">${ic("loc")}Konumu aç</button>`}
        <button class="uyari-x" type="button" data-act="warn-x" aria-label="Uyarıyı kapat">${ic("x")}</button>
        <span class="uyari-tx">${esc(w.t)}</span>
      </div>` : ""}
      <div class="kutu">
      <div class="oz${S.route.length ? "" : " bos"}" id="k-ozet">${ozetHtml()}</div>
      <div class="bas${S.startOpen ? " acik" : ""}">
        <span class="bas-ic ${me.src}">${ic(me.src === "gps" ? "loc" : "pin")}</span>
        <span class="bas-tx"><small>Başlangıç</small><b>${esc(basAd(me))}</b></span>
        <button class="pill" type="button" data-act="start-toggle" aria-expanded="${!!S.startOpen}">${S.startOpen ? "Kapat" : "Değiştir"}</button>
        ${S.startOpen ? `<div class="row scroll">
          <button class="pill blue" type="button" data-act="locate">${ic("loc")}Konumumu bul</button>
          <button class="pill" type="button" data-act="pick">${ic("hand")}Haritadan seç</button>
          <span class="sep"></span>
          ${D.PRESETS.map((p, i) => `<button class="pill" type="button" data-preset="${i}" aria-pressed="${me.src !== "gps" && me.label === p.label}">${esc(p.label)}</button>`).join("")}
        </div>` : ""}
      </div>
      </div>
      <div class="sec-head"><h2 class="h2">En yakın duraklar</h2><small>${list.length} durak · yakından uzağa</small></div>
      <div class="kl-grup" role="group" aria-label="Kategoriler">
        <button class="kl" type="button" data-kat="" aria-pressed="${!S.concepts.size}"><span class="tik">${ic("check")}</span>Tümü</button>
        ${D.CONCEPTS.filter((c) => !c.soon).map((c) => `<button class="kl c-${c.routes[0]}" type="button" data-kat="${c.id}" aria-pressed="${S.concepts.has(c.id)}" title="${say(c)} durak"><span class="tik">${ic("check")}</span>${esc(c.label)}</button>`).join("")}
      </div>
      <ul class="list">${list.map((t, i) => { const d = dist(me, t) * WALK, on = S.route.includes(t.id); return `
        <li class="it c-${t.r.id}" style="--i:${Math.min(i, 14)}">
          <button class="it-main" type="button" data-stop="${t.id}">
            <span class="bdg">${t.n}</span>
            <span class="it-tx"><b>${nameHtml(t)}</b><small>${t.tag ? esc(t.tag) + " · " : ""}${esc(t.addr)}</small></span>
            <span class="it-d">${fmtD(d)}<small>${fmtT(d)}</small></span>
          </button>
          <button class="add" type="button" data-add="${t.id}" aria-pressed="${on}" aria-label="${on ? "Rotadan çıkar" : "Rotaya ekle"}">${ic(on ? "check" : "plus")}</button>
        </li>`; }).join("")}</ul>
      <p class="fine">${YOL && REAL ? "Bu listedeki mesafeler kuş uçuşu ölçümden tahmin edilir. Rotana eklediğin duraklar için yol sokak sokak çizilir; “Rotayı başlat” adım adım tarif verir." : "Mesafe ve süreler kuş uçuşu ölçümden tahmin edilir; sokak sokak yol tarifi için durağı Google ya da Apple Haritalar’da aç."}</p>`;
  }

  /* ——— Hazır rotalar: sitedeki altı rota, başlangıç noktasına yakından uzağa ——— */
  function renderHazir() {
    const me = S.me, near = D.ROUTES.map((r) => ({ r, d: Math.min(...STOPS.filter((t) => t.r === r).map((t) => dist(me, t))) })).sort((a, b) => a.d - b.d);
    P.hazir.innerHTML = `
      <div class="sec-head"><h2 class="h2">Hazır rotalar</h2><small>yakından uzağa · dokun, aç</small></div>
      <div class="hz-liste">${near.map(({ r, d }, i) => `
      <div class="hz c-${r.id}" style="--i:${i}">
        <button class="hz-main" type="button" data-load="${r.id}" aria-label="${esc(r.name)} rotasını aç" title="En yakın durağı ${fmtD(d * WALK)} uzakta">
          <span class="bdg">${r.no}</span>
          <span class="hz-tx"><b>${esc(r.name)}${i ? "" : '<span class="near">En yakın</span>'}</b><small>${STOPS.filter((t) => t.r === r).length} durak · ${r.km} · ${r.sure}</small></span>
          <span class="hz-ac">Aç${ic("fwd")}</span>
        </button>
        <a class="hz-link" href="${r.url}" target="${EMBED ? "_top" : "_blank"}" rel="noopener" aria-label="${esc(r.name)} sayfasını oku" title="Sayfasını oku">${ic("ext")}</a>
      </div>`).join("")}</div>
      <p class="fine">Hazır rota kendi sırasıyla “Rotam”da açılır; orada durak ekleyip çıkarabilir, sırayı değiştirebilir ve rotayı başlatabilirsin.</p>`;
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
    S.sel = id; S.tab = "kesfet"; sekmeIsaret("kesfet");
    syncMarkers(); renderDetail();
    if (curPanel === "detail") { P.detail.classList.remove("is-on"); void P.detail.offsetWidth; P.detail.classList.add("is-on"); bodyEl.scrollTop = 0; } else show("detail", 1);
    if (!DESK.matches && S.sheet !== "half") setSheet("half");
    focus(STOPS[id], from === "map" ? 0.07 : 0.13);
  }
  function closeDetail() {
    S.sel = null; syncMarkers();
    if (S.from === "rota") { S.tab = ""; setTab("rota"); } else { S.tab = "kesfet"; syncOzet(); show("kesfet", -1); }
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
    const me = S.me, ids = S.route, L = routeLen(), pool = active().length, sokak = !RT.duz;
    const kim = HESAP ? HESAP.aktif() : null;
    S.count = clamp(S.count, Math.min(3, pool), Math.min(12, pool));
    const tarif = (i) => { const a = RT.adim && RT.adim[i]; return a && a.length ? `<li class="rleg"><details><summary>${ic("walk")}<span>${fmtD(RT.legD[i])} · ${fmtT(RT.legD[i])}</span><i>yol tarifi</i></summary><ol>${a.map((x) => `<li>${ic(x.k)}<span>${esc(x.t)}</span><small>${x.d >= 10 ? fmtD(x.d) : ""}</small></li>`).join("")}</ol></details></li>` : ""; };
    const durum = !YOL || !REAL || !ids.length ? ""
      : W.durum === "bekle" ? `<p class="yol-durum bekle">${ic("walk")}Yürüyüş yolu hesaplanıyor…</p>`
      : W.durum === "hata" ? `<div class="card yol-kart"><b>Sokak yolu şu an alınamadı</b><span>Yol tarifi sunucusuna ulaşılamadı. Çizgi kuş uçuşu çizildi; mesafeler tahmindir.</span><button class="btn sm" type="button" data-act="yol-yeniden">Yeniden dene</button></div>`
      : !startOk() ? `<div class="card yol-kart"><b>Yol, başlangıç noktandan çizilmiyor</b><span>Başlangıçtan ilk durağa da yol çizilmesi için konumun yol tarifi sunucusuna (${esc(YOL.SERVIS.adres)}) gönderilir. Biz saklamıyoruz.</span><span class="row"><button class="btn sm dark" type="button" data-act="yol-evet">Başlangıçtan da çiz</button></span></div>` : "";
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
      <div class="sec-head"><h2 class="h2">${esc(S.name || "Rotam")}</h2><small>${sokak ? "sokaklardan · yürüyüş yolu" : "kuş uçuşu · tahmini"}</small></div>
      <div class="stats">
        <div class="stat"><b data-v="${ids.length}">${ids.length}</b><span>durak</span></div>
        <div class="stat"><b data-v="${(L / 1000).toFixed(1)}" data-d="1">${(L / 1000).toFixed(1).replace(".", ",")}</b><span>km yürüyüş</span></div>
        <div class="stat"><b data-v="${mins(L)}">${mins(L)}</b><span>dakika</span></div>
      </div>
      ${durum}
      <ol class="rlist${sokak ? " yollu" : ""}">
        <li class="rstart"><span class="dot"></span><span>Başlangıç: <b>${esc(basAd(me))}</b></span></li>
        ${ids.map((id, i) => { const s = STOPS[id], d = legLen(i, prev, s), kus = !RT.legD || RT.legD[i] == null; prev = s; return `${tarif(i)}
        <li class="ri c-${s.r.id}" style="--i:${i}">
          <span class="bdg">${i + 1}</span>
          <button class="ri-main" type="button" data-stop="${s.id}" data-from="rota"><b>${nameHtml(s)}</b><small>${fmtD(d)} · ${fmtT(d)} yürüyüş${kus && sokak ? " · kuş uçuşu" : ""}</small></button>
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
      ${!HESAP || kim ? `
      <form class="card" data-form="save">
        <p class="kicker">${kim ? "Hesabıma kaydet" : "Kaydet"}</p>
        <div class="save"><input type="text" name="ad" maxlength="60" aria-label="Rota adı" placeholder="Rotaya bir ad ver" value="${esc(S.name)}"><button class="btn dark" type="submit">${ic("mark")}Kaydet</button></div>
      </form>` : `
      <div class="card acct">
        <p class="kicker">Rotayı kaydet</p>
        <b>Kaydetmek için giriş yap</b>
        <span>Rotalar hesabına kaydedilir. Giriş yapıp bu sayfaya döndüğünde rotan seni burada bekler.</span>
        <a class="btn sm dark" href="${SITE}hesabim/" target="_top">${ic("user")}Giriş yap ya da hesap oluştur</a>
      </div>`}
      <div class="card exp">
        <p class="kicker">Haritalara aktar ve indir</p>
        ${parts.length === 1
          ? `<a class="btn dark" href="${parts[0].url}" target="_blank" rel="noopener">${ic("ext")}Google Haritalar’da aç</a>`
          : `<p class="exp-lbl">Google Haritalar · ${parts.length} bölüm</p><div class="parts">${parts.map((p, i) => `<a class="btn sm dark" href="${p.url}" target="_blank" rel="noopener">${i + 1}. bölüm · ${nth(p.from)} → ${nth(p.to)}</a>`).join("")}</div>`}
        <a class="btn" href="${apple(pts)}" target="_blank" rel="noopener">${ic("ext")}Apple Haritalar’da aç</a>
        <button class="btn" type="button" data-act="dl" id="dl-html">${ic("dl")}Rota sayfasını indir</button>
        ${HOSTED ? "" : `<button class="btn" type="button" data-act="gpx">${ic("dl")}GPX dosyasını indir</button>`}
        <p class="fine">${parts.length > 1 ? "Google Haritalar bir bağlantıda başlangıç, 3 ara durak ve varış açtığı için uzun rota bölümlere ayrılır. " : ""}Haritalar uygulaması yolu kendi verisine göre yeniden çizer.${sokak ? " Buradaki yürüyüş yolu: © OpenStreetMap katkıda bulunanlar · " + esc(YOL.SERVIS.ad) + "." : ""}</p>
      </div>`;
    } else {
      cur = `<div class="empty"><b>Henüz bir rotan yok</b><span>Aşağıdan en yakın rotayı oluştur, “Hazır rotalar”dan birini aç ya da “Keşfet”te durakları ${ic("plus")} ile tek tek ekle.</span></div>`;
    }
    const saved = S.saved.length ? `
      <div class="sec-head"><h2 class="h2">Kayıtlı rotalarım</h2><small>${kim ? esc(kim.ad) : "giriş yapılmadan kaydedilenler"}</small></div>
      ${S.saved.map((r, i) => `<div class="rc c-r2" style="--i:${i}"><div class="rc-tx"><b>${esc(r.name)}</b><small>${r.keys.length} durak · başlangıç ${esc(r.start.label)}</small></div><span class="ops"><button type="button" class="btn sm" data-saved="${i}">Aç</button><button type="button" data-del="${i}" aria-label="Kaydı sil">${ic("trash")}</button></span></div>`).join("")}` : "";
    P.rota.classList.toggle("no-anim", !!quiet);
    P.rota.innerHTML = cur + builder + saved;
    if (HOSTED && ids.length) dlReady.then((d) => { const b = $("#dl-html"); if (b && !d) b.hidden = true; });
  }

  /* ——— Kaydetme ve indirme ——— */
  const KEY = "zr.rotalar.v1";
  const loadSaved = () => { if (HESAP) { S.saved = HESAP.rotalar(); return; } try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); S.saved = Array.isArray(v) ? v.filter((r) => r && Array.isArray(r.keys) && r.start) : []; } catch (e) { S.saved = []; } };
  const storeSaved = () => { if (HESAP) return HESAP.rotalariYaz(S.saved); try { localStorage.setItem(KEY, JSON.stringify(S.saved)); return true; } catch (e) { return false; } };
  if (HESAP) HESAP.dinle(() => { loadSaved(); if (S.tab === "rota") renderRota(true); });
  const openSaved = (r) => { const ids = r.keys.map((k) => BYKEY.get(k)).filter(Boolean).map((s) => s.id); setMe(r.start.lat, r.start.lng, "secim", r.start.label, false, !!r.start.acik); setRoute(ids, { name: r.name }); };
  const dlReady = HOSTED ? window.claude.use("downloads").catch(() => null) : Promise.resolve(null);

  function sheetHtml() {
    const me = S.me, ids = S.route, L = routeLen(), parts = gparts(), pts = xpts().map((x) => x.p);
    const day = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(S.name || "Rotam")} · Ziyaret Rehberim</title>
<style>body{margin:0;background:#FBF8F2;color:#1C2533;font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}main{max-width:720px;margin:0 auto;padding:28px 18px 48px}header{border-bottom:2px solid #C9973A;padding-bottom:14px;margin-bottom:18px}small,.m{color:#5A6578;font-size:14px}h1{margin:4px 0;font-size:26px;line-height:1.2;color:#0E1B2E}h2{margin:0;font-size:18px;color:#0E1B2E}ol{list-style:none;margin:0;padding:0}li{display:grid;grid-template-columns:38px 1fr;gap:12px;padding:14px 0;border-bottom:1px solid #E6DFD0}li>b{width:34px;height:34px;border-radius:50%;background:#0E1B2E;color:#fff;display:grid;place-items:center;font-size:15px}p{margin:4px 0}a{color:#8A6219}.btns{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.btns a{padding:10px 14px;border-radius:12px;background:#0E1B2E;color:#fff;text-decoration:none;font-weight:600;font-size:14px}.btns a.o{background:#fff;color:#0E1B2E;border:1px solid #D9D0BC}</style></head><body><main>
<header><small>ZİYARET REHBERİM · ${esc(day)}</small><h1>${esc(S.name || "Rotam")}</h1><p class="m">${ids.length} durak · yaklaşık ${fmtD(L)} · ≈ ${fmtT(L)} yürüyüş (${RT.duz ? "kuş uçuşu ölçümden tahmin" : "sokakları izleyen yürüyüş yolu; © OpenStreetMap katkıda bulunanlar"}, ziyaret süresi hariç)</p><p class="m">Başlangıç: ${esc(me.label)} (${me.lat.toFixed(5)}, ${me.lng.toFixed(5)})</p>
<div class="btns">${parts.map((p, i) => `<a href="${p.url}">Google Haritalar${parts.length > 1 ? ` · ${i + 1}. bölüm` : ""}</a>`).join("")}<a class="o" href="${apple(pts)}">Apple Haritalar</a></div></header>
<ol>${ids.map((id, i) => { const s = STOPS[id], a = RT.adim && RT.adim[i]; return `<li><b>${i + 1}</b><div>${a && a.length ? `<p class="m">Yürüyüş · ${fmtD(RT.legD[i])}: ${a.map((x) => esc(x.t) + (x.d >= 10 ? " (" + fmtD(x.d) + ")" : "")).join(" → ")}</p>` : ""}<h2>${esc(s.name)}${s.hon ? " " + esc(s.hon) : ""}</h2><p class="m">${esc(s.r.name)}${s.tag ? " · " + esc(s.tag) : ""} · ${esc(s.addr)}${s.approx ? " · konum yaklaşık" : ""}</p><p>${esc(s.desc)}</p>${s.hours ? `<p class="m">${esc(s.hours)}</p>` : ""}<p><a href="https://www.google.com/maps/search/?api=1&query=${ll(s)}">Haritada aç</a> · <a href="${s.r.url}#durak-${s.n}">Rehberde oku</a></p></div></li>`; }).join("")}</ol>
<p class="m">ziyaretrehberim.com</p></main></body></html>`;
  }
  function gpx() {
    const x = (s) => esc(s).replace(/'/g, "&apos;");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="ziyaretrehberim.com" xmlns="http://www.topografix.com/GPX/1/1">\n<metadata><name>${x(S.name || "Rotam")}</name></metadata>\n` +
      S.route.map((id) => { const s = STOPS[id]; return `<wpt lat="${s.lat}" lon="${s.lng}"><name>${x(s.name)}</name><desc>${x(s.addr)}</desc></wpt>`; }).join("\n") +
      `\n<rte><name>${x(S.name || "Rotam")}</name>\n<rtept lat="${S.me.lat.toFixed(5)}" lon="${S.me.lng.toFixed(5)}"><name>Başlangıç</name></rtept>\n` +
      S.route.map((id) => { const s = STOPS[id]; return `<rtept lat="${s.lat}" lon="${s.lng}"><name>${x(s.name)}</name></rtept>`; }).join("\n") + "\n</rte>\n" +
      (RT.duz ? "" : `<trk><name>${x(S.name || "Rotam")} · yürüyüş yolu</name><trkseg>\n` + RT.pts.map((p) => { const q = unproj(p[0], p[1]); return `<trkpt lat="${q.lat.toFixed(6)}" lon="${q.lng.toFixed(6)}"/>`; }).join("\n") + "\n</trkseg></trk>\n") + "</gpx>\n";
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

  function loadRoute(id) {
    const r = D.ROUTES.find((x) => x.id === id); if (!r) return false;
    setRoute(STOPS.filter((s) => s.r === r).sort((a, b) => a.n - b.n).map((s) => s.id), { name: r.name });
    toast(`${r.name} güzergâhı kendi sırasıyla açıldı.`); return true;
  }

  /* ——— Siteden gelen bağlantılar: #kategori=sahabe,cami · #rota=r3 · #rotalarim ——— */
  function fromHash() {
    let h = ""; try { h = decodeURIComponent((location.hash || "").slice(1)); } catch (e) {}
    let m;
    if ((m = /^kategori=([a-z,]+)$/.exec(h))) {
      const ids = m[1].split(",").filter((id) => D.CONCEPTS.some((c) => c.id === id && !c.soon));
      if (!ids.length) return false;
      S.concepts = new Set(ids); if (S.tab !== "kesfet") setTab("kesfet"); applyConcepts(1200); return true;
    }
    if ((m = /^rota=(r[0-9]+)$/.exec(h))) return loadRoute(m[1]);
    if (h === "rotalarim") { setTab("rota"); if (!DESK.matches) setSheet("full"); return true; }
    if (h === "hazir") { setTab("hazir"); return true; }
    if ((m = /^kayit=([0-9]+)$/.exec(h))) { loadSaved(); const r = S.saved[+m[1]]; if (!r) return false; openSaved(r); return true; }
    if (h === "rotam") { setTab("rota"); return true; }
    return false;
  }
  window.addEventListener("hashchange", fromHash);

  /* ——— Panel tıklamaları ——— */
  bodyEl.addEventListener("click", (e) => {
    const t = e.target.closest("[data-stop],[data-add],[data-act],[data-preset],[data-load],[data-saved],[data-del],[data-mv],[data-rm],[data-kat],[data-soon]");
    if (!t || !bodyEl.contains(t)) return;
    const d = t.dataset;
    if (d.stop != null) return selectStop(+d.stop, d.from || (curPanel === "detail" ? "" : "list"));
    if (d.add != null) return toggleStop(+d.add);
    if (d.soon) return toast("Sabit ikram noktaları henüz eklenmedi. Liste gelince bu kategori açılacak.");
    if (d.kat != null) { if (!d.kat) S.concepts.clear(); else if (S.concepts.has(d.kat)) S.concepts.delete(d.kat); else S.concepts.add(d.kat); return applyConcepts(); }
    if (d.preset != null) { const p = D.PRESETS[+d.preset]; if (S.picking) stopPick(); return setMe(p.lat, p.lng, "secim", p.label, true, true); }
    if (d.load) return loadRoute(d.load);
    if (d.saved != null) return openSaved(S.saved[+d.saved]);
    if (d.del != null) { S.saved.splice(+d.del, 1); storeSaved(); renderRota(true); toast("Kayıt silindi."); return; }
    if (d.mv) { const i = +d.i, j = i + +d.mv; [S.route[i], S.route[j]] = [S.route[j], S.route[i]]; return setRoute(S.route, { name: S.name, animate: false, open: false }); }
    if (d.rm != null) { S.route.splice(+d.rm, 1); return setRoute(S.route, { name: S.name, animate: false, open: false }); }
    switch (d.act) {
      case "locate": return locate();
      case "pick": return S.picking ? stopPick() : startPick();
      case "back": return closeDetail();
      case "rotam": S.tab = ""; return setTab("rota");
      case "start-toggle": S.startOpen = !S.startOpen; return renderKesfet();
      case "warn-x": S.warn = null; return renderKesfet();
      case "inc": case "dec": { const n = active().length; S.count = clamp(S.count + (d.act === "inc" ? 1 : -1), Math.min(3, n), Math.min(12, n)); $("#cnt").textContent = S.count; return; }
      case "build": return buildNearest();
      case "clear": setRoute([], { animate: false, open: false }); return toast("Rota temizlendi.");
      case "opt": { const a = pathLen(S.route), ids = twoOpt(S.route), b = pathLen(ids); if (a - b < 5) return toast("Sıra zaten en kısa hâlinde."); setRoute(ids, { name: S.name, open: false }); return toast(`Sıra kısaltıldı: ${fmtD((a - b) * WALK)} daha az yürüyüş.`); }
      case "dl": return download("ziyaret-rotam.html", sheetHtml(), "text/html");
      case "gpx": return download("ziyaret-rotam.gpx", gpx(), "application/gpx+xml");
      case "yol-evet": if (sorCoz) sorCoz(null); return yolIzni(true);
      case "yol-yeniden": computeRT(); RT.prog = 1; draw(); return renderRota(true);
    }
  });
  bodyEl.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!S.route.length) return;
    if (HESAP && !HESAP.aktif()) return toast("Rota kaydetmek için giriş yapman gerekir.");
    const name = (new FormData(e.target).get("ad") || "").toString().trim() || `Rotam · ${S.route.length} durak`;
    S.name = name;
    S.saved = S.saved.filter((r) => r.name !== name);
    S.saved.unshift({ name, keys: S.route.map((id) => STOPS[id].key), start: { lat: S.me.lat, lng: S.me.lng, label: S.me.label, acik: S.me.src === "ornek" || !!S.me.acik }, km: +(routeLen() / 1000).toFixed(2), sokak: !RT.duz, t: Date.now() });
    const ok = storeSaved(); renderRota(true);
    toast(ok ? (HESAP ? "Rota hesabına kaydedildi." : "Rota kaydedildi.") : "Tarayıcı kayda izin vermedi; rota yalnızca bu oturumda duruyor.");
  });

  /* ——— Küçük soru kutusu (tarayıcı penceresi yerine sayfanın içinde) ——— */
  let sorCoz = null;
  function sor(b, t, evet = "Evet", hayir = "Hayır") {
    if (sorCoz) sorCoz(null);
    $("#sor-b").textContent = b; $("#sor-t").textContent = t; $("#sor-e").textContent = evet; $("#sor-h").textContent = hayir; sorEl.hidden = false;
    return new Promise((res) => { sorCoz = (v) => { sorCoz = null; sorEl.hidden = true; res(v); }; });
  }
  $("#sor-e").addEventListener("click", () => sorCoz && sorCoz(true));
  $("#sor-h").addEventListener("click", () => sorCoz && sorCoz(false));

  /* ——— Alt çubuk: "Rotayı başlat" ve haritalara aktarma ——— */
  function syncGo() {
    // “Rotayı başlat” çubuğu yalnızca Rotam sekmesinde görünür; Keşfet ve Hazır rotalar listelerine yer kalsın.
    const on = S.route.length > 0 && !N.on && curPanel === "rota", once = !goEl.hidden;
    goEl.hidden = !on; app.classList.toggle("has-go", on);
    if (on && S.me) { const parts = gparts(), g = $("#go-g"); g.href = parts[0].url; g.dataset.cok = parts.length > 1 ? "1" : ""; $("#go-a").href = apple(xpts().map((x) => x.p)); }
    if (on !== once) setSheet(S.sheet);
  }
  $("#go-start").addEventListener("click", () => navStart());
  $("#go-g").addEventListener("click", (e) => {
    if (!e.currentTarget.dataset.cok) return;
    // Google Haritalar tek bağlantıda en çok beş nokta açar; uzun rotada bölümler "Rotam"daki listeden seçilir.
    e.preventDefault(); S.sel = null; syncMarkers(); S.tab = ""; setTab("rota"); if (!DESK.matches) setSheet("full");
    const x = P.rota.querySelector(".exp"); if (x) x.scrollIntoView({ block: "center" });
    toast("Rota uzun olduğu için Google Haritalar’da bölüm bölüm açılır.");
  });

  /* ——— Taslak: kurulan rota bu sekmede saklanır; giriş yapıp dönünce ya da sayfa değişince kaybolmaz ———
     Gerçek konum saklanmaz; yalnızca elle seçilmiş başlangıç noktası ve durakların sırası tutulur. Sekme kapanınca silinir. */
  const TASLAK = "zr.taslak.1";
  function taslakYaz() {
    try {
      if (!S.route.length) return sessionStorage.removeItem(TASLAK);
      const me = S.me;
      sessionStorage.setItem(TASLAK, JSON.stringify({ k: S.route.map((id) => STOPS[id].key), n: S.name, b: me.src === "secim" ? { lat: me.lat, lng: me.lng, label: me.label, acik: !!me.acik } : null, t: Date.now() }));
    } catch (e) {}
  }
  function taslakAc() {
    try {
      const v = JSON.parse(sessionStorage.getItem(TASLAK) || "null");
      if (!v || !Array.isArray(v.k) || Date.now() - v.t > 12 * 3600e3) return false;
      const ids = v.k.map((k) => BYKEY.get(k)).filter(Boolean).map((t) => t.id);
      if (!ids.length) return false;
      if (v.b) setMe(v.b.lat, v.b.lng, "secim", v.b.label, false, !!v.b.acik);
      setRoute(ids, { name: v.n || "", animate: false, open: false });
      fit([S.me, ...ids.map((id) => STOPS[id])], 0, 0.26);
      return v.b ? "baslangic" : true;
    } catch (e) { return false; }
  }

  /* ——— Rotayı başlat: uygulama içinde adım adım yol tarifi ———
     Tarif, zaten açık olan düz haritada (kuzey yukarıda) sürer: ek bir harita yüklenmez, düğmeye basınca hemen başlar.
     Konum noktası gidiş yönünü gösterir; hedef durağa giden yol altın renkli çizgiyle çizilir, harita konumu izler.
     Konum alınamıyorsa ya da rota çok uzaktaysa aynı ekran önizleme olarak çalışır: "Sonraki durak" ile duraktan durağa ilerlenir. */
  const N = { on: false, watch: null, pos: null, real: false, i: 0, leg: null, legOk: false, along: 0, offN: 0, tRe: 0, busy: false, follow: true, wake: null, vardi: false, brg: 0, zoom: 0, seq: 0, oto: false, lyr: null, yolK: null, yol: null, akis: null, hedef: null, pk: null, msgT: 0 };
  const fmtN = (m) => (m < 1000 ? Math.max(5, Math.round(m / 5) * 5) + " m" : (m / 1000).toFixed(1).replace(".", ",") + " km");
  const brgOf = (a, b) => (Math.atan2(b[0] - a[0], a[1] - b[1]) / RAD + 360) % 360;
  // Bir bacağı hesap için hazırlar: metre cinsinden noktalar, birikimli uzunluk ve her dönüşün çizgi üzerindeki yeri.
  function navLeg(lg) {
    const pts = lg.pts.length > 1 ? lg.pts : [lg.pts[0], lg.pts[0]], Pm = pts.map((c) => proj(c[0], c[1])), cum = [0];
    for (let j = 1; j < Pm.length; j++) cum.push(cum[j - 1] + Math.hypot(Pm[j][0] - Pm[j - 1][0], Pm[j][1] - Pm[j - 1][1]));
    return { P: Pm, cum, len: cum[cum.length - 1] || 0, ll: pts.map((c) => [c[0], c[1]]), steps: (lg.adim || []).filter((a) => a.i != null).map((a) => ({ ...a, at: cum[Math.min(a.i, cum.length - 1)] })) };
  }
  // Konumu yol çizgisine oturtur: çizgi boyunca kaç metre gidildi (along) ve çizgiden ne kadar uzakta (ham).
  function navSnap(Lg, x, y) {
    let b = { d: Infinity, along: 0, ham: Infinity };
    for (let j = 0; j < Lg.P.length - 1; j++) {
      const p = Lg.P[j], q = Lg.P[j + 1], dx = q[0] - p[0], dy = q[1] - p[1], l2 = dx * dx + dy * dy, t = l2 ? clamp(((x - p[0]) * dx + (y - p[1]) * dy) / l2, 0, 1) : 0;
      const ham = Math.hypot(x - p[0] - dx * t, y - p[1] - dy * t), al = Lg.cum[j] + Math.sqrt(l2) * t;
      // Aynı sokaktan gidip dönen yollarda geride kalan parçaya yapışmamak için geriye sıçramaya küçük bir ceza verilir.
      const d = ham + (al < N.along - 30 ? 12 : 0);
      if (d < b.d) b = { d, along: al, ham };
    }
    return b;
  }
  function navAt(Lg, m) {
    m = clamp(m, 0, Lg.len); let j = 1; while (j < Lg.cum.length - 1 && Lg.cum[j] < m) j++;
    const p = Lg.P[j - 1], q = Lg.P[j], t = (m - Lg.cum[j - 1]) / (Lg.cum[j] - Lg.cum[j - 1] || 1);
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, j];
  }
  function navMsg(t, kal) {
    const el = $("#nav-msg"); clearTimeout(N.msgT);
    if (!t) { el.hidden = true; return; }
    el.textContent = t; el.hidden = false; if (!kal) N.msgT = setTimeout(() => { el.hidden = true; }, 6500);
  }
  function navCap() { $("#nav-cap").innerHTML = (S.sat ? "Uydu: Esri, Maxar, Earthstar Geographics" : "© OpenStreetMap katkıda bulunanlar") + (YOL ? " · Yol: © OpenStreetMap" : ""); }

  // Haritadaki tarif katmanı: hedefe giden yol (altın), hedef durak etiketi ve yön gösteren konum noktası.
  function navKatman() {
    if (N.lyr) return;
    if (!N.dinle) { // elle kaydırınca harita konumu izlemeyi bırakır ("Konumuma ortala" düğmesi çıkar); elle yakınlaştırma korunur
      N.dinle = true;
      map.on("moveend", () => { N.oto = false; });
      map.on("dragstart", () => { if (N.on) navFollow(false); });
      map.on("zoomend", () => { if (N.on && !N.oto) N.zoom = map.getZoom(); });
    }
    N.lyr = L.layerGroup().addTo(map);
    N.yolK = L.polyline([], { color: "#0E1B2E", weight: 11, opacity: 0.85, lineCap: "round", lineJoin: "round", interactive: false }).addTo(N.lyr);
    N.yol = L.polyline([], { color: "#F5C451", weight: 6, opacity: 1, lineCap: "round", lineJoin: "round", interactive: false }).addTo(N.lyr);
    N.akis = L.polyline([], { className: "rt-akis nav", interactive: false }).addTo(N.lyr);
    N.pk = L.marker([N.pos.lat, N.pos.lng], { icon: L.divIcon({ className: "lmk", html: '<div class="npuck"><span></span></div>', iconSize: [0, 0] }), interactive: false, keyboard: false, zIndexOffset: 3000 }).addTo(N.lyr);
  }
  function navHedef() {
    if (N.hedef) { N.hedef.remove(); N.hedef = null; }
    const t = STOPS[S.route[N.i]]; if (!t) return;
    const el = `<div class="nmk hedef c-${t.r.id}"><b>${esc(t.name)}</b><i><s>${N.i + 1}</s></i></div>`;
    N.hedef = L.marker([t.lat, t.lng], { icon: L.divIcon({ className: "lmk nmk-k", html: el, iconSize: [0, 0] }), interactive: false, keyboard: false, zIndexOffset: 2500 }).addTo(N.lyr);
  }
  function navDraw() {
    if (!N.on || !N.lyr) return;
    const Lg = N.leg, a = navAt(Lg, N.along), q = unproj(a[0], a[1]), cizgi = N.vardi ? [] : [[q.lat, q.lng], ...Lg.ll.slice(a[2])];
    N.yolK.setLatLngs(cizgi); N.yol.setLatLngs(cizgi); N.akis.setLatLngs(cizgi);
  }
  // Harita konumu izler; konum noktası üstteki tarif şeridiyle alttaki kartın arasında, ortada durur.
  function navCam(jump) {
    const p = N.pos; if (!p || !N.pk) return;
    N.pk.setLatLng([p.lat, p.lng]);
    const ok = N.pk.getElement() && N.pk.getElement().querySelector(".npuck span"); if (ok) ok.style.transform = `rotate(${Math.round(p.head != null ? p.head : N.brg)}deg)`;
    if (!N.follow) return;
    const z = N.zoom || 17.5, ust = $(".nav-top").offsetHeight + 10, alt = DESK.matches ? 0 : $(".nav-bot").offsetHeight + 10;
    const c = map.unproject(map.project([p.lat, p.lng], z).add([0, (alt - ust) / 2]), z);
    N.oto = true; map.setView(c, z, { animate: !jump && !RM.matches, duration: 0.8 });
    if (jump || RM.matches) N.oto = false;
  }
  function navFollow(on) { N.follow = on; $("#nav-c").hidden = on; if (on) { N.zoom = 0; navCam(); } }

  // Üstteki tarif şeridi ve alttaki durak kartı.
  function navPaint() {
    if (!N.on) return;
    const Lg = N.leg, n = S.route.length, hedef = STOPS[S.route[N.i]], kalan = Math.max(0, Lg.len - N.along) * (N.legOk ? 1 : WALK);
    let rest = 0, prev = hedef;
    for (let k = N.i + 1; k < n; k++) { const t = STOPS[S.route[k]]; rest += legLen(k, prev, t); prev = t; }
    let k = "duz", d = fmtN(kalan), t = "";
    if (N.vardi) { k = "var"; d = "Vardın"; t = hedef.name; }
    else if (!N.legOk) { k = N.busy ? "walk" : "duz"; t = N.busy ? "Yol hesaplanıyor…" : hedef.name + " yönünde ilerle"; }
    else {
      const nx = Lg.steps.find((a) => a.k !== "basla" && a.at > N.along + 4), ilk = Lg.steps[0];
      if (nx) { k = nx.k; d = fmtN(nx.at - N.along); t = nx.t; }
      else { k = "var"; t = "Durağa varıyorsun: " + hedef.name; }
      if (N.along < 8 && ilk && ilk.k === "basla" && (!nx || nx.at - N.along > 80)) { k = "basla"; t = ilk.t; }
    }
    $("#nav-ic").innerHTML = ic(k); $("#nav-ic").dataset.k = k; $("#nav-d").textContent = d; $("#nav-t").textContent = t;
    $("#nav-k").textContent = `Durak ${N.i + 1} / ${n}` + (N.real ? "" : " · önizleme");
    $("#nav-n").textContent = hedef.name + (hedef.hon ? " " + hedef.hon : "");
    $("#nav-r").textContent = N.vardi ? (N.i < n - 1 ? "Hazır olunca sonraki durağa geç." : "Rotanın son durağındasın.") : `${fmtN(kalan)} · ${fmtT(kalan)}` + (rest > 0 ? ` · rotada ${fmtD(kalan + rest)} kaldı` : "");
    const ds = $("#nav-desc"); ds.hidden = !N.vardi; if (N.vardi) ds.textContent = hedef.desc;
    const son = N.i >= n - 1, sb = $("#nav-s");
    sb.hidden = son && N.real && !N.vardi; sb.textContent = son ? "Rotayı bitir" : N.vardi || !N.real ? "Sonraki durak" : "Bu durağı atla";
    const nb = $(".nav-bot").offsetHeight; if (nb) navEl.style.setProperty("--nb", nb + "px");
  }
  // Bulunulan noktadan hedef durağa yol: önce düz çizgiyle yön gösterilir, sokak yolu gelince yerini alır.
  function navLoadLeg() {
    const hedef = STOPS[S.route[N.i]], p = N.pos, seq = ++N.seq, uc = [[p.lat, p.lng], [hedef.lat, hedef.lng]];
    N.leg = navLeg({ pts: uc, adim: [] }); N.legOk = false; N.along = 0; N.offN = 0; N.tRe = Date.now(); N.busy = !!YOL;
    navPaint(); navDraw();
    if (!YOL) return;
    YOL.yol(uc).then((res) => {
      if (seq !== N.seq || !N.on) return;
      N.busy = false; if (res.legs[0]) { N.leg = navLeg(res.legs[0]); N.legOk = true; N.along = 0; }
      navTick(true);
    }, () => { if (seq !== N.seq || !N.on) return; N.busy = false; navMsg("Sokak tarifi alınamadı; durağın yönü gösteriliyor."); navPaint(); });
  }
  function navTick(jump) {
    if (!N.on) return;
    const Lg = N.leg, p = N.pos, hedef = STOPS[S.route[N.i]], sn = navSnap(Lg, p.x, p.y);
    N.along = N.real ? sn.along : 0;
    const dH = Math.hypot(p.x - hedef.x, p.y - hedef.y);
    if (N.real && !N.vardi && (dH < 28 || (N.legOk && Lg.len - N.along < 12 && sn.ham < 30))) {
      N.vardi = true; navMsg(`${N.i + 1}. durağa vardın: ${hedef.name}`);
      try { if (navigator.vibrate) navigator.vibrate(120); } catch (e) {}
    }
    // Rotadan 45 metreden fazla uzaklaşılırsa yol bulunulan yerden yeniden hesaplanır (en sık 20 saniyede bir).
    if (N.real && !N.vardi && N.legOk && sn.ham > 45 && p.acc < 70) { if (++N.offN >= 3 && !N.busy && Date.now() - N.tRe > 20000) { navMsg("Rotadan ayrıldın; yol yeniden hesaplanıyor…"); return navLoadLeg(); } } else N.offN = 0;
    const a = navAt(Lg, N.along), b = navAt(Lg, N.along + 16);
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 1.5) N.brg = brgOf(a, b);
    if (p.head != null && sn.ham > 25) N.brg = p.head;
    navPaint(); navDraw(); navCam(jump);
  }
  function navFix(pos) {
    if (!N.on) return;
    const c = pos.coords, [x, y] = proj(c.latitude, c.longitude);
    const uzak = Math.min(Math.hypot(x - S.me.x, y - S.me.y), ...S.route.map((id) => Math.hypot(x - STOPS[id].x, y - STOPS[id].y)));
    if (uzak > 6000) { if (!N.real) navMsg(`Rotaya yaklaşık ${Math.round(uzak / 1000)} km uzaktasın. Rota önizleme olarak gösteriliyor; “Sonraki durak” ile ilerleyebilirsin.`, true); return; }
    const ilk = !N.real; N.real = true;
    N.pos = { lat: c.latitude, lng: c.longitude, x, y, acc: c.accuracy || 0, head: Number.isFinite(c.heading) && (c.speed || 0) > 0.5 ? c.heading : null };
    if (ilk) { navMsg(""); if (Math.hypot(x - N.leg.P[0][0], y - N.leg.P[0][1]) > 25) return navLoadLeg(); }
    navTick();
  }
  function navWatch() {
    const geo = navigator.geolocation;
    if (!geo || window.isSecureContext === false) return navMsg("Bu tarayıcı konum paylaşmıyor. Rota önizleme olarak gösteriliyor.", true);
    navMsg("Konumun bekleniyor…", true);
    try { N.watch = geo.watchPosition(navFix, (e) => { if (!N.real) navMsg(e && e.code === 1 ? "Konum izni kapalı. Konumu açarsan rotadaki yerin gösterilir; şimdilik önizleme." : "Konumun bekleniyor…", true); }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }); } catch (e) {}
  }
  function navWake() { if (N.on && navigator.wakeLock) navigator.wakeLock.request("screen").then((w) => { N.wake = w; }, () => {}); }
  document.addEventListener("visibilitychange", () => { if (N.on && document.visibilityState === "visible") navWake(); });
  function navNext() {
    if (!N.on) return;
    if (N.i >= S.route.length - 1) return navStop(true);
    const t = STOPS[S.route[N.i]];
    if (!N.real) N.pos = { lat: t.lat, lng: t.lng, x: t.x, y: t.y, acc: 0, head: null }; // önizlemede duraktan durağa ilerlenir
    N.i++; N.vardi = false; navMsg(N.real ? "" : $("#nav-msg").textContent, true); if (N.real) navMsg("");
    const h = STOPS[S.route[N.i]]; if (Math.hypot(h.x - N.pos.x, h.y - N.pos.y) > 2) N.brg = brgOf([N.pos.x, N.pos.y], [h.x, h.y]);
    navHedef(); navLoadLeg(); navTick(true);
  }
  function navStop(bitti) {
    if (!N.on) return;
    N.on = false; N.seq++; N.busy = false;
    if (N.watch != null) { try { navigator.geolocation.clearWatch(N.watch); } catch (e) {} N.watch = null; }
    if (N.wake) { try { N.wake.release(); } catch (e) {} N.wake = null; }
    if (N.lyr) { N.lyr.remove(); N.lyr = N.yolK = N.yol = N.akis = N.hedef = N.pk = null; }
    navEl.hidden = true; app.classList.remove("navda"); navMsg("");
    if (meMk) meMk.setOpacity(1);
    const p = N.pos; if (N.real && p) setMe(p.lat, p.lng, "gps", "Konumun", false);
    syncGo();
    if (REAL) { map.invalidateSize({ animate: false }); if (S.route.length) fit([S.me, ...S.route.map((id) => STOPS[id])], 600, 0.26); }
    if (bitti === true) toast("Rotanın sonuna geldin.");
  }
  async function navStart() {
    if (!S.route.length || N.on) return;
    if (!REAL) return toast("Adım adım yol tarifi gerçek haritada çalışır.");
    if (YOL && W.izin !== "evet") {
      const ok = await sor("Yol tarifi için konumun kullanılsın mı?", `Adım adım tarif için bulunduğun nokta yol tarifi sunucusuna (${YOL.SERVIS.adres}) gönderilir. Biz saklamıyoruz.`, "Kabul et ve başlat", "Vazgeç");
      if (!ok) return;
      W.soruldu = true; yolIzni(true);
    }
    Object.assign(N, { on: true, i: 0, vardi: false, real: false, follow: true, zoom: 0, along: 0, offN: 0 });
    N.pos = { lat: S.me.lat, lng: S.me.lng, x: S.me.x, y: S.me.y, acc: 0, head: null };
    const t0 = STOPS[S.route[0]]; N.brg = Math.hypot(t0.x - S.me.x, t0.y - S.me.y) > 2 ? brgOf([S.me.x, S.me.y], [t0.x, t0.y]) : 0;
    if (S.picking) stopPick();
    if (S.sel != null) closeDetail();
    navEl.hidden = false; app.classList.add("navda"); syncGo(); $("#nav-c").hidden = true;
    if (meMk) meMk.setOpacity(0);
    map.stop(); navCap(); navKatman(); navHedef(); navLoadLeg(); navCam(true);
    navWatch(); navWake();
  }
  $("#nav-x").addEventListener("click", () => navStop());
  $("#nav-s").addEventListener("click", navNext);
  $("#nav-c").addEventListener("click", () => navFollow(true));

  /* ——— Bilgi kutusu ——— */
  const infoBtn = $("#info-btn");
  const setInfo = (on) => { infoEl.hidden = !on; infoBtn.setAttribute("aria-expanded", on); };
  infoBtn.addEventListener("click", (e) => { e.stopPropagation(); setInfo(infoEl.hidden); });
  $("#info-x").addEventListener("click", () => setInfo(false));
  document.addEventListener("click", (e) => { if (!infoEl.hidden && !infoEl.contains(e.target)) setInfo(false); });
  document.addEventListener("keydown", (e) => { if (e.key !== "Escape") return; if (sorCoz) sorCoz(false); else if (N.on) navStop(); else if (!infoEl.hidden) setInfo(false); else if (S.picking) stopPick(); else if (S.sel != null) closeDetail(); });

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
    for (const s of STOPS) s.el.firstElementChild.style.animationDelay = Math.round(380 + Math.min(1100, dist(S.me, s) / 7)) + "ms";
    readColors();
    V.w = mapEl.clientWidth; V.h = mapEl.clientHeight;
    fit(STOPS, 0, 0.12);
    resize();
    new ResizeObserver(resize).observe(mapEl);
    DESK.addEventListener("change", () => { setSheet(S.sheet); draw(); });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors);
    new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    syncMarkers(); renderKesfet(); show("kesfet", 1); syncGo();
    if (!DESK.matches && !RM.matches) { sheet.classList.add("dragging"); sheet.style.setProperty("--ty", sheet.offsetHeight + "px"); void sheet.offsetWidth; sheet.classList.remove("dragging"); requestAnimationFrame(() => setSheet("half")); }
    setTimeout(() => {
      const h = fromHash(), t = h ? false : taslakAc();
      if (!h && !t) fitNear(1700);
      // Kayıtlı bir rota ya da başlangıcı elle seçilmiş bir taslak açıldıysa başlangıç noktasına dokunulmaz; yoksa konum kendiliğinden istenir.
      if (!/^#kayit=/.test(location.hash) && t !== "baslangic") autoLocate();
    }, 750);
  }
  init();
})();
