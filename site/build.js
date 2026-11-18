/* Siteyi üretir: "node site/build.js" → depo kökünde index.html, 404.html, sitemap.xml, robots.txt ve aşağıdaki KLASOR listesindeki klasörler.
   Kaynaklar: kaynak/data.js (rotalar, duraklar), site/rota-metin.json (rota açıklamaları), site/icerik.js (Ulaşım, Ücretler, Âdâb metinleri),
   site/site.css ve site/site.js. Üretilen dosyalar elle düzenlenmez; her çalıştırmada baştan yazılır. */
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const DEPO = path.join(__dirname, ".."), CIKTI = DEPO;
/* Adresler. Site alan adının kökünde, harita uygulaması /harita/ altında durur (kaynak/build.js içindeki SITE_YOL ile birlikte).
   18 Kasım 2026'ya kadar site /yeni/ altında önizlemedeydi; o adresler 404.html içinden yeni yerlerine yönlenir. */
const KOK = "/", HARITA = "/harita/", GORSEL = "/onizleme/", ALAN = "ziyaretrehberim.com", TAM = "https://" + ALAN;
const ONIZLEME = false; // true iken bütün sayfalar arama motorlarına kapalıdır (noindex)
// Bu dosyanın ürettiği klasörler. Her çalıştırmada yalnızca bunlar silinip baştan yazılır; depodaki başka hiçbir şeye dokunulmaz.
const KLASOR = ["a", "rota-olustur", "guzergahlar", "ulasim", "ucretler-ve-saatler", "ziyaret-adabi", "hesabim", "rotalarim"];
const BUGUN = new Date().toISOString().slice(0, 10);

const oku = (f) => fs.readFileSync(path.join(DEPO, f), "utf8");
const g = {}; new Function("globalThis", oku("kaynak/data.js"))(g);
const D = g.ZR_DATA, METIN = JSON.parse(oku("site/rota-metin.json")), IC = require("./icerik.js");

/* ——— Simgeler (24×24, çizgi) ——— */
const ICON = {
  ev: '<path d="M4 11.5 12 4.5l8 7"/><path d="M6.5 10v9.5h11V10"/><path d="M10 19.5v-5h4v5"/>',
  rota: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="5" r="2.2"/><path d="M8.2 18H15a3.25 3.25 0 0 0 0-6.5H9A3.25 3.25 0 0 1 9 5h6.8"/>',
  mark: '<path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-4-6 4V5.5a1 1 0 0 1 1-1z"/>',
  user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.7-5.4 7.2-5.4s6.3 1.8 7.2 5.4"/>',
  tram: '<rect x="5.5" y="4.5" width="13" height="12.5" rx="2.2"/><path d="M5.5 11h13M9 17l-1.5 3M15 17l1.5 3M9.5 14h.01M14.5 14h.01M10 2.5h4"/>',
  etiket: '<path d="M4 12.2V5.5A1.5 1.5 0 0 1 5.5 4h6.7l7.9 7.9a1.5 1.5 0 0 1 0 2.1l-6 6a1.5 1.5 0 0 1-2.1 0z"/><path d="M8.5 8.5h.01"/>',
  kalp: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  yildiz: '<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4 6.9 19.2 8 13.5l-4.3-4 5.8-.7z"/>',
  tac: '<path d="M4 18.5h16"/><path d="M4.5 15l-1-8 5 4L12 5l3.5 6 5-4-1 8z"/>',
  cami: '<path d="M6 20v-5.5c0-3.3 2.7-5 6-7.5 3.3 2.5 6 4.2 6 7.5V20"/><path d="M3.5 20h17M12 7V4.5M10.5 20v-3a1.5 1.5 0 0 1 3 0v3"/>',
  sutun: '<path d="M4 20h16M5.5 17h13M7 17v-6M12 17v-6M17 17v-6M4.5 11h15L12 4.5z"/>',
  sur: '<path d="M4 20V8h3v2.5h3V8h4v2.5h3V8h3v12z"/><path d="M10 20v-4a2 2 0 0 1 4 0v4"/>',
  hepsi: '<rect x="4.5" y="4.5" width="6" height="6" rx="1.6"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.6"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.6"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.6"/>',
  fincan: '<path d="M6 9h10v5a5 5 0 0 1-10 0z"/><path d="M16 10.5h1.5a2.2 2.2 0 0 1 0 4.4H16M5 20h12M9 3.5v2M12.5 3.5v2"/>',
  damla: '<path d="M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0c0-4.3 6-10.5 6-10.5z"/>',
  balon: '<path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v8a1.5 1.5 0 0 1-1.5 1.5H11l-4 3.5V16H6.5A1.5 1.5 0 0 1 5 14.5z"/>',
  sessiz: '<path d="M5 9.5h3l4-3.5v12l-4-3.5H5z"/><path d="M16 9.5l4 5M20 9.5l-4 5"/>',
  yasak: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
  kisiler: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3 2.7-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><path d="M15.5 5.3a3 3 0 0 1 0 5.4M17.5 14.7c1.6.6 2.6 2 3 4.3"/>',
  tabela: '<path d="M12 3v18M12 5h6l2 2.5-2 2.5h-6M12 12H6l-2 2.5L6 17h6"/>',
  kitap: '<path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v14H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/>',
  kamera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2.5h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.2"/>',
  ampul: '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.3 1 2.2h5.2c0-.9.4-1.7 1-2.2A6 6 0 0 0 12 3z"/>',
  bilgi: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.8v.01"/>',
  buyut: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  kucult: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  spark: '<path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  loc: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.6"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 1 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  walk: '<circle cx="13" cy="4.6" r="1.7"/><path d="M10 21l1.8-5.5-2.3-3 1-4.5 3 1 1.8 3 3 1M10.5 8L7.3 9.6 6.5 13M12.3 15.5L15 21"/>',
  fwd: '<path d="M9.5 6l6 6-6 6"/>',
  down: '<path d="M6 9.5l6 6 6-6"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  ext: '<path d="M14 5h5v5M19 5l-8 8M11 6H6.5A1.5 1.5 0 0 0 5 7.5v10A1.5 1.5 0 0 0 6.5 19h10a1.5 1.5 0 0 0 1.5-1.5V13"/>',
  trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 12.5h8L17 7"/>',
  layers: '<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 12.5L12 17l8.5-4.5"/><path d="M3.5 16.5L12 21l8.5-4.5"/>',
  sag: '<path d="M7 20v-8a3 3 0 0 1 3-3h8M14.5 5l4 4-4 4"/>',
  sol: '<path d="M17 20v-8a3 3 0 0 0-3-3H6M9.5 5l-4 4 4 4"/>',
  duz: '<path d="M12 20V5M6.5 10.5L12 5l5.5 5.5"/>',
  geri: '<path d="M8 20V9a4 4 0 0 1 8 0v3M12.5 9.5L16 13l3.5-3.5"/>',
  basla: '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="8"/>',
};
const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
// Sayfa betiğinin (site.js) çalışırken ürettiği parçalarda kullandığı simgeler
const JS_SIMGE = ["fwd", "down", "x", "ext", "trash", "rota", "mark", "user", "loc", "pin", "clock", "walk", "tram", "bilgi", "sag", "sol", "duz", "geri", "basla", "buyut", "kucult", "check"];
ICON.check = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const R6 = 6371000, RAD = Math.PI / 180;
const olc = (a, b) => { const x = (b[1] - a[1]) * RAD * Math.cos(((a[0] + b[0]) / 2) * RAD), y = (b[0] - a[0]) * RAD; return Math.hypot(x, y) * R6; };

/* ——— Veri ——— */
const ROTALAR = D.ROUTES.map((r, i) => {
  const duraklar = D.RAW.filter((a) => a[0] === i).sort((a, b) => a[1] - b[1]).map((a) => ({ n: a[1], ad: a[2], hon: a[3], tur: a[4], yer: a[5], acik: a[6], saat: a[7], yak: !!a[8], lat: a[9], lng: a[10] }));
  // Uzun etaplar taşıtla geçilir (rota sayfalarındaki "taşıt geçişi" sayılarıyla aynı): kuş uçuşu 1,5 km'yi aşan aralar. Sur yürüyüşü (r6) baştan sona yürünür.
  const tasit = [];
  duraklar.forEach((d, k) => { if (k && r.id !== "r6" && olc([duraklar[k - 1].lat, duraklar[k - 1].lng], [d.lat, d.lng]) > 1500) tasit.push(k - 1); });
  return { ...r, yol: KOK + "guzergahlar/" + r.slug + "/", duraklar, tasit, m: METIN[r.id] };
});
const yol = { ana: KOK, olustur: KOK + "rota-olustur/", guz: KOK + "guzergahlar/", ulasim: KOK + "ulasim/", ucret: KOK + "ucretler-ve-saatler/", adab: KOK + "ziyaret-adabi/", hesap: KOK + "hesabim/", rotalarim: KOK + "rotalarim/" };

/* ——— Zemin: çok soluk İstanbul çizgi haritası (kaynak/data.js içindeki kıyı, sur ve köprü çizgilerinden) ——— */
const zx = (lng) => (500 + ((lng - 28.958) * 0.7547 / 0.124) * 1000).toFixed(1), zy = (lat) => (500 - ((lat - 41.022) / 0.124) * 1000).toFixed(1);
const zd = (pts, kapat) => "M" + pts.map((p) => zx(p[1]) + " " + zy(p[0])).join("L") + (kapat ? "Z" : "");
const ZEMIN = `<div class="zemin" aria-hidden="true"><svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice"><path class="kara" d="${zd(D.GEO.europe, 1)}"/><path class="kara" d="${zd(D.GEO.asia, 1)}"/><path class="sur" d="${zd(D.GEO.walls)}"/>${D.GEO.bridges.map((b) => `<path class="kopru" d="${zd(b)}"/>`).join("")}${ROTALAR.map((r, i) => `<path class="iz ${r.id}" style="--i:${i}" pathLength="1" d="${zd(r.duraklar.map((d) => [d.lat, d.lng]))}"/>`).join("")}${ROTALAR.map((r) => r.duraklar.filter((d, k) => k % 2 === 0).map((d) => `<circle class="nokta ${r.id}" cx="${zx(d.lng)}" cy="${zy(d.lat)}" r="2.4"/>`).join("")).join("")}</svg></div>`;

/* ——— Ortak parçalar ——— */
const marka = `<a class="marka" href="${KOK}" aria-label="Ziyaret Rehberim ana sayfa"><img src="${GORSEL}zr-logo.jpg" alt="" width="46" height="46"><span class="marka-y">Ziyaret<b>Rehberim</b></span></a>`;
const MENU = [
  ["ana", yol.ana, "Ana Sayfa", "ev", "Rehberin girişi"],
  ["olustur", yol.olustur, "Rota oluştur", "rota", "Haritada kendi rotanı kur"],
  ["guz", yol.guz, "Güzergâhlar", "pin", "Altı hazır rota"],
  ["ulasim", yol.ulasim, "Ulaşım", "tram", "Buradan nasıl giderim?"],
  ["ucret", yol.ucret, "Ücretler ve Saatler", "clock", "İstanbulkart, türbe ve müze saatleri"],
  ["adab", yol.adab, "Ziyaret Âdâbı", "kalp", "Ziyaretin incelikleri"],
];
const cur = (a, b) => (a === b ? ' aria-current="page"' : "");
function ust(s) {
  return `<header class="ust"><div class="ust-ic">${marka}
<nav class="gezin" aria-label="Ana menü"><a href="${yol.ana}"${cur(s, "ana")}>Ana Sayfa</a>
<div class="acilir${s === "guz" ? " secili" : ""}"><button type="button" aria-haspopup="true">Güzergâhlar${ic("down")}</button><div class="acilir-kutu">${ROTALAR.map((r) => `<a class="${r.id}" href="${r.yol}"><span class="no">${r.no}</span><span>${esc(r.name)}<small>${r.duraklar.length} durak · ${r.sure}</small></span></a>`).join("")}<a href="${yol.guz}"><span class="no">${ic("fwd")}</span><span>Tüm güzergâhlar<small>Altı rotayı yan yana gör</small></span></a></div></div>
<a href="${yol.ulasim}"${cur(s, "ulasim")}>Ulaşım</a><a href="${yol.ucret}"${cur(s, "ucret")}>Ücretler ve Saatler</a><a href="${yol.adab}"${cur(s, "adab")}>Ziyaret Âdâbı</a></nav>
<a class="giris" href="${yol.hesap}">${ic("user")}<span data-hesap-ad="Giriş yap">Giriş yap</span></a>
<button class="menu-btn" type="button" aria-label="Menü" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
</div></header>
<div class="menu" id="menu" inert><div class="menu-zemin"></div><nav class="menu-ic" aria-label="Menü">
${MENU.slice(0, 3).map((m, i) => `<a class="m" style="--i:${i}" href="${m[1]}"${cur(s, m[0])}><span class="menu-sim">${ic(m[3])}</span><span>${m[2]}<small>${m[4]}</small></span>${ic("fwd")}</a>`).join("")}
<div class="menu-rotalar">${ROTALAR.map((r, i) => `<a class="${r.id}" style="--i:${3 + i * 0.5}" href="${r.yol}"><span class="no">${r.no}</span>${esc(r.name)}</a>`).join("")}</div>
<p class="menu-k">Bilgi</p>
${MENU.slice(3).map((m, i) => `<a class="m" style="--i:${6 + i}" href="${m[1]}"${cur(s, m[0])}><span class="menu-sim">${ic(m[3])}</span><span>${m[2]}<small>${m[4]}</small></span>${ic("fwd")}</a>`).join("")}
<p class="menu-k">Hesap</p>
<a class="m" style="--i:9" href="${yol.rotalarim}"${cur(s, "rotalarim")}><span class="menu-sim">${ic("mark")}</span><span>Rotalarım<small>Kaydettiğin rotalar</small></span>${ic("fwd")}</a>
<a class="m" style="--i:10" href="${yol.hesap}"${cur(s, "hesap")}><span class="menu-sim">${ic("user")}</span><span><span data-hesap-ad="Giriş yap ya da hesap oluştur">Giriş yap ya da hesap oluştur</span><small>Kullanıcı adı ve şifreyle</small></span>${ic("fwd")}</a>
</nav></div>`;
}
const sekme = (s) => `<nav class="sekme" aria-label="Alt menü">${[["ana", yol.ana, "Ana sayfa", "ev"], ["olustur", yol.olustur, "Rota oluştur", "rota"], ["rotalarim", yol.rotalarim, "Rotalarım", "mark"], ["hesap", yol.hesap, "Hesabım", "user"]].map((m) => `<a href="${m[1]}"${cur(s, m[0])}>${ic(m[3])}<b>${m[2]}</b></a>`).join("")}</nav>`;
const alt = `<footer class="alt"><div class="kap alt-ic">${marka}
<p class="ince">İstanbul ziyaret ve gezi rehberi · 6 güzergâh, 75 durak</p>
<nav aria-label="Alt bilgi menüsü">${MENU.map((m) => `<a href="${m[1]}">${m[2]}</a>`).join("")}<a href="${yol.rotalarim}">Rotalarım</a><a href="${yol.hesap}">Hesabım</a></nav>
<p class="ince">Haritalar © <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a> katkıda bulunanlar · Uydu görüntüsü: Esri · Yürüyüş yolu: OpenStreetMap yol tarifi (FOSSGIS)<br>Saatler, ücretler ve sefer bilgileri değişebilir; yola çıkmadan önce doğrulayın.</p>
</div></footer>`;

let SURUM = "0";
const FONT = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Plus+Jakarta+Sans:wght@500..800&display=swap">';
const HARITA_SAYFALARI = []; // sitemap.xml için: arama motorlarına açık sayfaların adresleri
/* http ile gelen ziyaretçi, https adresi çalışıyorsa oraya alınır (konum yalnızca https adreste sorulabilir).
   Önce https adresi denenir: güvenlik sertifikası henüz hazır değilse ziyaretçi hata sayfasına itilmez, http'de kalır. */
const HTTPS = `(function(){var l=location;if(l.protocol==="http:"&&/(^|\\.)${ALAN.replace(/\./g, "\\.")}$/.test(l.hostname)&&window.fetch)fetch("https://"+l.host+"${KOK}robots.txt?"+Date.now(),{mode:"no-cors",cache:"no-store"}).then(function(){l.replace("https://"+l.host+l.pathname+l.search+l.hash)}).catch(function(){})})();`;
function sayfa({ dosya, s, id, baslik, ozet, govde, sinif = "", veri, harita, yolJs, altsiz, gizli, gorsel = "ana-kapak.jpg", onBetik = "" }) {
  const a = (f) => `${KOK}a/${f}?v=${SURUM}`;
  const adres = TAM + KOK + dosya.replace(/index\.html$/, ""), kapali = ONIZLEME || gizli;
  const tamBaslik = esc(baslik) + (id === "ana" ? "" : " · Ziyaret Rehberim");
  if (!kapali) HARITA_SAYFALARI.push(adres);
  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<script>${onBetik}${HTTPS}document.documentElement.className="js";setTimeout(function(){if(!window.ZR_HAZIR)document.documentElement.className=""},3500);</script>
<title>${tamBaslik}</title>
<meta name="description" content="${esc(ozet)}">
${kapali ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${adres}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Ziyaret Rehberim"><meta property="og:locale" content="tr_TR">
<meta property="og:title" content="${tamBaslik}"><meta property="og:description" content="${esc(ozet)}"><meta property="og:url" content="${adres}">
<meta property="og:image" content="${TAM}${GORSEL}${gorsel}"><meta name="twitter:card" content="summary_large_image">`}
<meta name="theme-color" content="#FBF7EF">
<link rel="icon" href="${GORSEL}zr-logo.jpg"><link rel="apple-touch-icon" href="${GORSEL}zr-logo.jpg">
${FONT}
${harita ? `<link rel="stylesheet" href="${a("leaflet.css")}">\n` : ""}<link rel="stylesheet" href="${a("site.css")}">
${harita ? `<script defer src="${a("leaflet.js")}"></script>\n` : ""}${yolJs ? `<script defer src="${a("yol.js")}"></script>\n` : ""}<script defer src="${a("hesap.js")}"></script>
<script defer src="${a("site.js")}"></script>
</head>
<body data-sayfa="${id}">
<a class="gizli" href="#icerik">İçeriğe geç</a>
${ZEMIN}
${ust(s)}
<main id="icerik"${sinif ? ` class="${sinif}"` : ""}>
${govde}
</main>
${altsiz ? "" : alt}
${sekme(s)}
<div class="bildirim" role="status" aria-live="polite"></div>
${veri ? `<script type="application/json" id="veri">${JSON.stringify(veri).replace(/</g, "\\u003c")}</script>\n` : ""}</body>
</html>
`;
  const hedef = path.join(CIKTI, dosya);
  fs.mkdirSync(path.dirname(hedef), { recursive: true });
  fs.writeFileSync(hedef, html);
  return html.length;
}

/* ——— Rota kartları (ana sayfa ve Güzergâhlar) ——— */
const hapSim = (t) => (/durak/.test(t) ? "pin" : /saat|dk/.test(t) ? "clock" : /taşıt/.test(t) ? "tram" : "walk");
const haplar = (r) => `<div class="haplar">${r.m.pills.map((p) => `<span class="hap">${ic(hapSim(p))}${esc(p)}</span>`).join("")}</div>`;
const rkart = (r, i) => `<article class="rkart ${r.id}" data-g style="--i:${i % 3}"><div class="rkart-g"><img src="${GORSEL}rota-${r.id}.jpg" alt="${esc(r.name)} güzergâhının harita önizlemesi" width="960" height="540" loading="lazy"><span class="no">${r.no}</span><i>© OpenStreetMap</i></div>
<div class="rkart-y"><span class="kicker">Rota ${r.no} · ${esc(r.kicker)}</span><h3><a href="${r.yol}">${esc(r.name)}</a></h3><p>${esc(r.lede)}</p>${haplar(r)}
<div class="dugmeler"><a class="btn kucuk koyu" href="${r.yol}">Rotayı aç${ic("fwd")}</a><a class="btn kucuk yumusak" href="${yol.olustur}#rota=${r.id}" data-hash="rota=${r.id}">${ic("rota")}Haritada başlat</a></div></div></article>`;

/* ——— Ana sayfa ——— */
const KAT = [["sahabe", "r1", "yildiz", "Sahâbe-i Kirâm", 29], ["padisah", "r3", "tac", "Padişah türbeleri", 13], ["cami", "r4", "cami", "Tarihî camiler", 13], ["mekan", "r5", "sutun", "Tarihî mekânlar", 13], ["sur", "r6", "sur", "Suriçi ve surlar", 7], ["sahabe,padisah,cami,mekan,sur", "", "hepsi", "Hepsi", 75]];
function anaSayfa() {
  const govde = `<section class="kapak kap"><div class="kapak-ic"><img src="${GORSEL}ana-kapak.jpg" alt="İstanbul: Haliç, tarihî yarımada ve Boğaz’ın çizimi" width="1254" height="600" fetchpriority="high">
<div class="kapak-kart"><span class="goz">İstanbul · 6 rota · 75 durak</span><h1>${["İstanbul", "Ziyaret", "Rehberi"].map((w, i) => `<span style="--i:${i}">${w}</span>`).join(" ")}</h1>
<p>Sahâbe kabirleri, padişah türbeleri, tarihî camiler ve kara surları. Haritada seç, rotanı oluştur, yola çık.</p>
<div class="dugmeler"><a class="btn altin" href="#rota-olustur">${ic("rota")}Rotanı oluştur</a><a class="btn" href="#hazir-rotalar">Hazır rotalar</a></div></div></div></section>

<section class="bolum kap" id="rota-olustur"><div class="bolum-bas" data-g><span class="kicker">Harita</span><h2>Ziyaret rotanı oluştur</h2><p>Ne görmek istediğini seç; duraklar gerçek harita üzerinde açılır. En yakın rotayı tek dokunuşla kur ya da durakları kendin seç.</p></div>
<div class="kat" role="group" aria-label="Ne görmek istersin?">${KAT.map((k, i) => `<a class="${k[1]}" data-g style="--i:${i}" href="${yol.olustur}#kategori=${k[0]}" data-hash="kategori=${k[0]}"><span class="kat-sim">${ic(k[2])}</span><span>${k[3]}<small>${k[4]} durak</small></span></a>`).join("")}</div>
<div class="cerceve" data-g="buyu"><iframe title="Rota oluşturma haritası" data-src="${HARITA}?gomulu=1" allow="geolocation"></iframe>
<a class="cerceve-on" href="${yol.olustur}" style="background-image:url(${GORSEL}ana-harita.jpg)"><b>75 durak gerçek harita üzerinde</b><span class="btn altin">${ic("rota")}Haritayı aç</span></a></div>
<ol class="uc-adim"><li data-g style="--i:0"><span><b>Kategorini seç</b>Sahâbe kabirleri, türbeler, camiler ya da hepsi.</span></li><li data-g style="--i:1"><span><b>Rotanı kur</b>En yakın rotayı oluştur ya da durakları tek tek ekle; yol sokaklardan çizilir.</span></li><li data-g style="--i:2"><span><b>Yola çık</b>Rotayı kaydet, dönüş tarifini oku, Google ya da Apple Haritalar’da aç.</span></li></ol>
<p class="ince" style="margin-top:14px">Konumun yalnızca iznin olursa kullanılır ve hiçbir yere kaydedilmez.</p></section>

<section class="bolum kap" id="hazir-rotalar"><div class="bolum-bas" data-g><span class="kicker">Güzergâhlar</span><h2>Hazır rotalar</h2><p>Altı hazır rota. Sayfasını aç, durakları oku ya da doğrudan haritada başlat.</p></div>
<div class="rkartlar">${ROTALAR.map(rkart).join("\n")}</div></section>

<section class="bolum kap"><div class="bolum-bas" data-g><span class="kicker">Pratik bilgi</span><h2>Yola çıkmadan önce</h2></div>
<div class="dortlu">
<a class="bkart" data-g style="--i:0" href="${yol.ulasim}"><span class="menu-sim">${ic("tram")}</span><b>Buradan nasıl giderim?</b><span>Konumuna göre hangi tramvaya, hangi duraktan bineceğini haritada gör.</span><em>Ulaşım →</em></a>
<a class="bkart" data-g style="--i:1" href="${yol.ucret}"><span class="menu-sim">${ic("etiket")}</span><b>İstanbulkart</b><span>Tam biniş ${IC.ucret.kart[0][1]}; 120 dakika içindeki aktarmalar indirimli (${IC.ucret.tarih}).</span><em>Ücretler →</em></a>
<a class="bkart" data-g style="--i:2" href="${yol.ucret}#turbeler"><span class="menu-sim">${ic("clock")}</span><b>Pazartesi</b><span>Bazı türbeler ve müzeler kapalıdır; rotandaki durakların saatine bak.</span><em>Saatler →</em></a>
<a class="bkart" data-g style="--i:3" href="${yol.adab}"><span class="menu-sim">${ic("kalp")}</span><b>Ziyaret âdâbı</b><span>Türbede, camide ve mahallede dikkat edilecek ${IC.adab.gruplar.reduce((s, x) => s + x.maddeler.length, 0)} incelik.</span><em>Ziyaret âdâbı →</em></a>
</div>
<p class="ince" style="margin-top:18px">Bilgiler Kasım 2026’da derlenmiştir. Ziyaret saatleri, ücretler ve sefer bilgileri değişebilir; yola çıkmadan önce kontrol et.</p></section>`;
  // Harita uygulaması eskiden kökte duruyordu: /#kategori=…, /#rota=r3, /#kayit=2, /#rotam, /#rotalarim bağlantıları yeni yerlerine alınır.
  const onBetik = `(function(){var h=location.hash;if(/^#(kategori=|rota=r[1-6]$|kayit=\\d|rotam$)/.test(h))location.replace("${yol.olustur}"+h);else if(h==="#rotalarim")location.replace("${yol.rotalarim}")})();`;
  return sayfa({ onBetik, dosya: "index.html", s: "ana", id: "ana", baslik: "Ziyaret Rehberim · İstanbul ziyaret ve gezi rehberi", ozet: "İstanbul’da sahâbe kabirleri, padişah türbeleri, tarihî camiler ve kara surları: altı rota, 75 durak. Haritada seç, rotanı oluştur, yola çık.", govde });
}

/* ——— Rota oluştur (tam sayfa harita) ——— */
const olusturSayfa = () => sayfa({ dosya: "rota-olustur/index.html", s: "olustur", id: "rota-olustur", baslik: "Rota oluştur", ozet: "Durakları gerçek harita üzerinde seç, konumuna en yakın yürüyüş rotasını kur ve kaydet.", altsiz: true, sinif: "tam",
  govde: `<h1 class="gizli">Rota oluştur</h1><iframe title="Rota oluşturma haritası" data-src="${HARITA}?gomulu=1" allow="geolocation"></iframe>` });

/* ——— Güzergâhlar ——— */
const guzSayfa = () => sayfa({ dosya: "guzergahlar/index.html", s: "guz", id: "guzergahlar", baslik: "Güzergâhlar", ozet: "İstanbul’da altı hazır ziyaret ve gezi rotası: sahâbe kabirleri, padişah türbeleri, tarihî camiler, klasik gezi durakları ve kara surları.",
  govde: `<div class="kap"><header class="sayfa-bas"><span class="goz">6 rota · 75 durak</span><h1>Güzergâhlar</h1><p class="ozet">Her rotanın sayfasında geniş bir harita, sırasıyla duraklar ve yürüyüş tarifi var. Dilersen rotayı doğrudan haritada başlat.</p></header>
<section class="bolum" style="padding-top:clamp(20px,3vw,34px)"><div class="rkartlar">${ROTALAR.map(rkart).join("\n")}</div></section>
<section class="bolum"><div class="ipucu" data-g><span class="menu-sim">${ic("ampul")}</span><p><strong>Kendi rotanı mı kurmak istiyorsun?</strong> Durakları karıştırıp konumuna en yakın sırayla dizebilirsin. <a href="${yol.olustur}">Rota oluştur</a> sayfasını aç.</p></div></section></div>` });

/* ——— Rota sayfası ——— */
function rotaSayfa(r) {
  const m = r.m, n = r.duraklar.length;
  const durak = (d, k) => `<article class="durak" id="durak-${d.n}" data-g style="--i:${k % 2}"><span class="no">${d.n}</span><div class="durak-y"><h3>${esc(d.ad)}${d.hon ? `<em>${esc(d.hon)}</em>` : ""}</h3>
<div class="durak-m">${d.tur ? `<span class="etiket">${esc(d.tur)}</span>` : ""}<span>${esc(d.yer)}</span>${d.yak ? '<span class="etiket yak">Konum yaklaşık</span>' : ""}</div>
<p class="durak-a">${esc(d.acik)}</p>${d.saat ? `<div class="durak-s">${ic("clock")}<span>${esc(d.saat)}</span></div>` : ""}
<div class="dugmeler"><button class="btn kucuk yumusak" type="button" data-goster="${d.n}">${ic("pin")}Haritada göster</button><a class="btn kucuk" href="https://www.google.com/maps/dir/?api=1&amp;destination=${d.lat},${d.lng}&amp;travelmode=walking" target="_blank" rel="noopener">Yol tarifi${ic("ext")}</a></div></div></article>`;
  const govde = `<div class="kap">
<header class="rota-bas"><span class="goz">Rota ${r.no} · ${esc(r.kicker)}</span><h1>${esc(m.h1)}</h1><p class="ozet">${esc(r.lede)}</p>${haplar(r)}</header>
<div class="harita-kart" id="harita-kart"><div class="harita" id="harita" role="application" aria-label="${esc(r.name)} güzergâh haritası"></div>
<div class="h-dugme"><button type="button" data-h="buyut" aria-pressed="false">${ic("buyut")}<span>Büyüt</span></button><button type="button" data-h="uydu" aria-pressed="false">${ic("layers")}<span>Uydu</span></button><button type="button" class="kare" data-h="konum" aria-label="Konumumu göster" title="Konumumu göster">${ic("loc")}</button></div>
<div class="h-ipucu" aria-hidden="true">Haritayı kaydırmak için iki parmağını kullan ya da “Büyüt”e dokun</div>
<div class="harita-alt"><span id="h-kaynak">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> katkıda bulunanlar</span><span class="sag" id="h-yol">Duraklar sırasıyla numaralı</span></div></div>

<section class="bolum" id="duraklar"><div class="bolum-bas" data-g><span class="kicker">Duraklar</span><h2>${n} durak, sırasıyla</h2></div>
<div class="duraklar">${r.duraklar.map(durak).join("\n")}</div></section>

<section class="bolum bilgi" id="aciklama">
<div class="kart" data-g><h2>Güzergâh hakkında</h2>${m.about.map((p) => `<p>${p}</p>`).join("")}</div>
<div class="kart" data-g><h2>Nasıl gidilir?</h2><div class="uclu"><div class="nasil"><b>${ic("pin")}Başlangıç</b><p>${m.how.start}</p></div><div class="nasil"><b>${ic("walk")}Rota boyunca</b><p>${m.how.along}</p></div><div class="nasil"><b>${ic("tram")}Dönüş</b><p>${m.how.back}</p></div></div>
<p class="ince" style="margin-top:14px">Bulunduğun yerden buraya nasıl gideceğini <a href="${yol.ulasim}#oneri">Ulaşım</a> sayfasındaki harita gösterir.</p></div>
${m.tip.map((t) => `<div class="ipucu" data-g><span class="menu-sim">${ic("ampul")}</span><p>${t.replace("</strong>", "</strong> ")}</p></div>`).join("")}
<div class="kart" data-g><h2>Duraklar arası yürüyüş</h2><p class="tarif-durum bekle" id="tarif-durum">Sokak sokak yürüyüş yolu hazırlanıyor…</p><div class="tarif" id="tarif"></div>
<p class="ince" style="margin-top:14px">Yürüyüş yolu ve dönüşler OpenStreetMap verisiyle hesaplanır; süreler dakikada 75 metre yürüyüşe göre yaklaşıktır. Sahada tabelalara ve kapalı yollara dikkat et.</p></div>
<div class="dugmeler" data-g><a class="btn altin" href="${yol.olustur}#rota=${r.id}">${ic("rota")}Bu rotayı haritada başlat</a><a class="btn" href="${yol.guz}">Tüm güzergâhlar</a></div>
</section></div>`;
  return sayfa({ gorsel: `rota-${r.id}.jpg`, dosya: `guzergahlar/${r.slug}/index.html`, s: "guz", id: "rota", sinif: r.id, baslik: m.h1, ozet: r.lede + " " + m.pills.join(", ") + ".", govde, harita: true, yolJs: true,
    veri: { id: r.id, no: r.no, ad: r.name, tasit: r.tasit, ulasim: yol.ulasim, duraklar: r.duraklar.map((d) => ({ n: d.n, ad: d.ad, hon: d.hon, tur: d.tur, lat: d.lat, lng: d.lng })) } });
}

/* ——— Ulaşım ——— */
function ulasimSayfa() {
  const U = IC.ulasim;
  const hat = (h) => `<details style="--hc:${h.renk}"><summary><span class="hatr">${esc(h.kod)}</span><span>${esc(h.ad)}</span>${ic("down")}</summary><div class="ic-govde"><p>${esc(h.acik)}</p>${h.duraklar.length ? `<ul>${h.duraklar.map((d) => `<li><strong>${esc(d[0])}</strong> · ${esc(d[1])}</li>`).join("")}</ul>` : ""}</div></details>`;
  const duraklar = Object.keys(U.ag.durak).sort((a, b) => a.localeCompare(b, "tr"));
  const govde = `<div class="kap">
<header class="sayfa-bas"><span class="goz">Tramvay · metro · Marmaray · vapur</span><h1>Ulaşım</h1><p class="ozet">${esc(U.ozet)}</p></header>

<section class="bolum" id="oneri" style="padding-top:clamp(20px,3vw,34px)"><div class="oneri" data-g="buyu">
<div class="oneri-y"><span class="kicker">Buradan nasıl giderim?</span><h3>Konumuna göre öneri</h3>
<div class="alan"><label for="o-rota">Hangi rotaya gideceksin?</label><select id="o-rota">${ROTALAR.map((r) => `<option value="${r.id}">${r.no} · ${esc(r.name)}</option>`).join("")}</select></div>
<div class="dugmeler"><button class="btn altin" type="button" id="o-konum">${ic("loc")}Konumumu kullan</button></div>
<div class="alan"><label for="o-durak">ya da bulunduğun durağı seç</label><select id="o-durak"><option value="">Durak seç…</option>${duraklar.map((d) => `<option>${esc(d)}</option>`).join("")}</select></div>
<div class="oneri-sonuc" id="o-sonuc" aria-live="polite"><p class="ince">Konumun yalnızca bu sayfada, tarayıcında kullanılır; hiçbir yere gönderilmez ve saklanmaz. Öneri, rehberdeki raylı hatlara göre kabaca hesaplanır.</p></div></div>
<div><div class="harita" id="harita" role="application" aria-label="Ulaşım önerisi haritası"></div><div class="harita-alt"><span>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> katkıda bulunanlar</span><span class="sag">Hat çizgileri şematiktir; duraklar arası düz çizilir</span></div></div>
</div></section>

<section class="bolum" id="nasil"><div class="bolum-bas" data-g><span class="kicker">Rota rota</span><h2>Rotalara nasıl gidilir?</h2></div>
<div class="gidis">${ROTALAR.map((r, i) => `<article class="gidis-k ${r.id}" data-g style="--i:${i % 3}"><header><span class="no">${r.no}</span><h3>${esc(r.name)}</h3></header><dl><div><dt>Başlangıç</dt><dd>${r.m.how.start}</dd></div><div><dt>Rota boyunca</dt><dd>${r.m.how.along}</dd></div><div><dt>Dönüş</dt><dd>${r.m.how.back}</dd></div></dl><a class="btn kucuk yumusak" href="${r.yol}">Rotayı aç${ic("fwd")}</a></article>`).join("\n")}</div>
<div class="ipucu" data-g style="margin-top:18px"><span class="menu-sim">${ic("ampul")}</span><p><strong>En kolay aktarma</strong> ${esc(U.aktarma)}</p></div></section>

<section class="bolum" id="hatlar"><div class="bolum-bas" data-g><span class="kicker">Ayrıntı</span><h2>Hatlar ve önemli duraklar</h2><p>Bir hatta dokun; rehberdeki duraklara yakın istasyonlar açılır.</p></div>
<div class="hatlar" data-g>${U.hatlar.map(hat).join("\n")}</div></section>

<section class="bolum"><div class="ikili">
<div class="kart" data-g><h2>Otobüsler</h2><div class="tablo-sar"><table class="tablo kartla"><thead><tr><th>Hat</th><th>Yön</th><th>Not</th></tr></thead><tbody>${U.otobus.map((o) => `<tr><td>${esc(o[0])}</td><td data-b="Yön">${esc(o[1])}</td><td data-b="Not">${esc(o[2])}</td></tr>`).join("")}</tbody></table></div><p class="ince" style="margin-top:12px">Hat numaraları ve güzergâhlar değişebilir; İETT’nin kendi kanallarından doğrulayın.</p></div>
<div class="kart" data-g><h2>Sefer saatleri</h2><div class="liste">${U.sefer.map((s) => `<div><span>${esc(s[0])}</span><b>${esc(s[1])}</b></div>`).join("")}</div><p class="ince" style="margin-top:12px">${esc(U.seferNot)}</p></div>
</div></section>

<section class="bolum"><div class="kart" data-g><h2>Havalimanından merkeze</h2><p>${U.hava.metin}</p>
<div class="tablo-sar" style="margin-top:14px"><table class="tablo kartla"><thead><tr><th>Nereden nereye</th><th>Hat</th><th class="sayi">Ücret</th></tr></thead><tbody>${U.hava.tablo.map((o) => `<tr><td>${esc(o[0])}</td><td data-b="Hat">${esc(o[1])}</td><td class="sayi" data-b="Ücret">${esc(o[2])}</td></tr>`).join("")}</tbody></table></div>
<p class="ince" style="margin-top:12px">${esc(U.hava.not)}</p></div></section>
</div>`;
  return sayfa({ dosya: "ulasim/index.html", s: "ulasim", id: "ulasim", baslik: "Ulaşım", ozet: U.ozet + " Konumuna göre hangi hatta, hangi duraktan bineceğini haritada gör.", govde, harita: true,
    veri: { ag: U.ag, rotalar: ROTALAR.map((r) => ({ id: r.id, no: r.no, ad: r.name, yol: r.yol, lat: r.duraklar[0].lat, lng: r.duraklar[0].lng, ilk: r.duraklar[0].ad, varis: U.varis[r.id] })) } });
}

/* ——— Ücretler ve Saatler ——— */
function ucretSayfa() {
  const C = IC.ucret;
  const notlar = (l) => `<div class="notlar">${l.map((n) => `<div class="not">${ic("bilgi")}<p><strong>${esc(n[0])}</strong> · ${esc(n[1])}</p></div>`).join("")}</div>`;
  const saat = (l) => `<div class="liste"><div class="bas"><span>Türbe</span><i>Yaz</i><i>Kış</i></div>${l.map((t) => `<div><span>${esc(t[0])}</span><i>${esc(t[1])}</i><i>${esc(t[2])}</i></div>`).join("")}</div>`;
  const govde = `<div class="kap">
<header class="sayfa-bas"><span class="goz">${esc(C.tarih)}</span><h1>Ücretler ve Saatler</h1><p class="ozet">${esc(C.ozet)}</p></header>
<div class="ozet-sira" style="margin-top:clamp(18px,2.6vw,28px)">${C.one.map((o, i) => `<div class="ozet-k" data-g style="--i:${i}"><small>${esc(o[0])}</small><b>${esc(o[1])}</b><span>${esc(o[2])}</span></div>`).join("")}</div>
<nav class="capa" aria-label="Sayfa içi"><a href="#kart">İstanbulkart</a><a href="#turbeler">Türbe saatleri</a><a href="#muzeler">Müzeler ve çarşılar</a></nav>

<section class="bolum" id="kart" style="padding-top:clamp(22px,3vw,36px)"><div class="ikili">
<div class="kart" data-g><h2>İstanbulkart ve ulaşım ücretleri</h2><div class="liste">${C.kart.map((k) => `<div><span>${esc(k[0])}</span><b>${esc(k[1])}</b></div>`).join("")}</div><p class="ince" style="margin-top:12px">${esc(C.kartNot)}</p></div>
<div class="kart" data-g style="--i:1"><h2>Bilmeniz gerekenler</h2>${notlar(C.kartIpucu)}<div class="dugmeler" style="margin-top:16px"><a class="btn kucuk yumusak r1" href="${yol.ulasim}">${ic("tram")}Ulaşım sayfası</a></div></div>
</div></section>

<section class="bolum" id="turbeler"><div class="bolum-bas" data-g><span class="kicker">Ziyaret saatleri</span><h2>Türbeler</h2><p>${esc(C.turbeNot)}</p></div><div class="ikili">
<div class="kart" data-g><h3>Her gün açık <span class="rozet">her gün</span></h3>${saat(C.turbeAcik)}</div>
<div class="kart" data-g style="--i:1"><h3>Pazartesi kapalı <span class="rozet kapali">pazartesi</span></h3>${saat(C.turbePzt)}</div>
</div></section>

<section class="bolum" id="muzeler"><div class="bolum-bas" data-g><span class="kicker">Gezi durakları</span><h2>Müzeler, saraylar ve çarşılar</h2></div>
<div class="kart" data-g><div class="tablo-sar"><table class="tablo kartla"><thead><tr><th>Yer</th><th>Kapalı gün</th><th>Saatler</th><th class="sayi">Yerli</th><th class="sayi">Yabancı</th></tr></thead><tbody>${C.muze.map((z) => `<tr><td>${esc(z[0])}</td><td data-b="Kapalı gün">${z[1] === "—" ? '<span class="rozet">her gün</span>' : `<span class="rozet kapali">${esc(z[1])}</span>`}</td><td data-b="Saatler">${esc(z[2])}</td><td class="sayi" data-b="Yerli">${esc(z[3])}</td><td class="sayi" data-b="Yabancı">${esc(z[4])}</td></tr>`).join("")}</tbody></table></div></div>
<div class="kart" data-g style="margin-top:clamp(14px,1.8vw,20px)"><h2>Bilmeniz gerekenler</h2>${notlar(C.muzeIpucu)}</div>
<p class="ince" style="margin-top:16px">${esc(C.dip)}</p></section>
</div>`;
  return sayfa({ dosya: "ucretler-ve-saatler/index.html", s: "ucret", id: "ucretler", baslik: "Ücretler ve Saatler", ozet: C.ozet, govde });
}

/* ——— Ziyaret Âdâbı ——— */
const ADAB_SIM = { niyet: "kalp", su: "damla", ortu: "user", saat: "clock", ayak: "walk", selam: "balon", dua: "spark", sessiz: "sessiz", el: "yasak", mum: "yasak", sira: "kisiler", cami: "cami", hali: "layers", bolum: "tabela", kitap: "kitap", foto: "kamera", mahalle: "ev", cop: "trash", cocuk: "kisiler", yardim: "fincan" };
function adabSayfa() {
  const A = IC.adab; let say = 0;
  const toplam = A.gruplar.reduce((s, x) => s + x.maddeler.length, 0);
  const govde = `<div class="kap">
<header class="sayfa-bas"><span class="goz">${toplam} madde · ${A.gruplar.length} başlık</span><h1>Ziyaret Âdâbı</h1><p class="ozet">${esc(A.ozet)}</p></header>
${A.gruplar.map((gr, gi) => { const bas = say; say += gr.maddeler.length; return `<section class="adab-grup"><header data-g="sol"><span class="kicker">${String(gi + 1).padStart(2, "0")}</span><h2>${esc(gr.baslik)}</h2><p>${esc(gr.not)}</p></header>
<div class="adab-liste" style="--bas:${bas}">${gr.maddeler.map((m, i) => `<article class="madde" data-g style="--i:${i % 2}"><span class="menu-sim">${ic(ADAB_SIM[m[0]] || "spark")}</span><div><b>${esc(m[1])}</b><p>${esc(m[2])}</p></div></article>`).join("")}</div></section>`; }).join("\n")}
<section class="bolum"><div class="ikili">
<div class="kart" data-g><h2>Kısaltmalar</h2><ul class="kisalt">${A.kisaltmalar.map((k) => `<li><b>${esc(k[0])}</b><span>${esc(k[1])}</span></li>`).join("")}</ul></div>
<div class="kart" data-g style="--i:1" id="hakkinda"><h2>Bu rehber hakkında</h2>${A.hakkinda.map((p) => `<p>${p}</p>`).join("")}<p class="ince" style="margin-top:12px">${esc(A.ince)}</p></div>
</div></section></div>`;
  return sayfa({ dosya: "ziyaret-adabi/index.html", s: "adab", id: "adab", baslik: "Ziyaret Âdâbı", ozet: A.ozet, govde });
}

/* ——— Hesabım ve Rotalarım (içerik tarayıcıda, cihazdaki kayıtlardan çizilir) ——— */
const hesapSayfa = () => sayfa({ gizli: true, dosya: "hesabim/index.html", s: "hesap", id: "hesabim", baslik: "Hesabım", ozet: "Kullanıcı adı ve şifreyle giriş yap, kaydettiğin rotaları gör.",
  govde: `<div class="kap"><header class="sayfa-bas dar"><span class="goz">Hesap</span><h1>Hesabım</h1><p class="ozet">Kullanıcı adı ve şifreyle giriş yap; kaydettiğin rotalar burada seni beklesin.</p></header>
<section class="bolum" style="padding-top:clamp(18px,2.6vw,28px)"><div id="hesap" class="dar"><noscript><p class="kart">Hesap sayfası için tarayıcında JavaScript açık olmalı.</p></noscript></div>
<div id="hesap-rotalar" class="orta" style="margin-top:clamp(22px,3vw,34px)" hidden><div class="bolum-bas"><span class="kicker">Kayıtlı</span><h2>Rotalarım</h2></div><div id="kayitlar"></div></div></section></div>` });
const rotalarimSayfa = () => sayfa({ gizli: true, dosya: "rotalarim/index.html", s: "rotalarim", id: "rotalarim", baslik: "Rotalarım", ozet: "Haritada kurup kaydettiğin ziyaret rotaları.",
  govde: `<div class="kap"><header class="sayfa-bas orta"><span class="goz">Kayıtlı rotalar</span><h1>Rotalarım</h1><p class="ozet">Haritada kurup kaydettiğin rotalar. Birine dokun, haritada kaldığın yerden aç.</p></header>
<section class="bolum orta" style="padding-top:clamp(18px,2.6vw,28px)"><div id="misafir"></div><div id="kayitlar"><noscript><p class="kart">Bu sayfa için tarayıcında JavaScript açık olmalı.</p></noscript></div>
<div class="dugmeler" style="margin-top:18px"><a class="btn altin" href="${yol.olustur}">${ic("rota")}Yeni rota oluştur</a><a class="btn" href="${yol.guz}">Hazır rotalar</a></div></section></div>` });

/* ——— Bulunamayan adresler (GitHub Pages olmayan her adreste 404.html dosyasını gösterir) ———
   Önizleme adresleri (/yeni/…), eski WordPress "Hakkında" sayfası ve WordPress paneli adresleri doğru yere yönlenir; kalanı için kısa bir yol gösterici çıkar. */
const yokSayfa = () => sayfa({ gizli: true, dosya: "404.html", s: "", id: "yok", baslik: "Sayfa bulunamadı", ozet: "Aradığın sayfa burada değil.",
  onBetik: `(function(){var l=location,p=l.pathname,e=l.search+l.hash;if(p==="/yeni"||p.indexOf("/yeni/")===0){l.replace((p.slice(5)||"/")+e);return}var q=p.replace(/\\/+$/,"");if(q==="/hakkinda")l.replace("${yol.adab}#hakkinda");else if(q==="/anasayfa"||q==="/index.php")l.replace("${yol.ana}");else if(q==="/harita.html"||q==="/rota")l.replace("${yol.olustur}"+l.hash);else if(q.indexOf("/wp-admin")===0||q==="/wp-login.php")l.replace("https://wordpress.com/home/${ALAN}")})();`,
  govde: `<div class="kap"><header class="sayfa-bas dar"><span class="goz">404</span><h1>Sayfa bulunamadı</h1><p class="ozet">Aradığın sayfa taşınmış ya da hiç olmamış olabilir. Aşağıdan devam edebilirsin.</p></header>
<section class="bolum dar" style="padding-top:clamp(18px,2.6vw,28px)"><div class="dugmeler"><a class="btn altin" href="${yol.ana}">${ic("ev")}Ana sayfa</a><a class="btn" href="${yol.guz}">${ic("pin")}Güzergâhlar</a><a class="btn" href="${yol.olustur}">${ic("rota")}Rota oluştur</a></div></section></div>` });

/* ——— Dosyalar ——— */
for (const k of KLASOR) fs.rmSync(path.join(CIKTI, k), { recursive: true, force: true });
fs.mkdirSync(path.join(CIKTI, "a"), { recursive: true });
const LF = "kaynak/vendor/leaflet/";
const dosyalar = {
  "site.css": oku("site/site.css"),
  "site.js": `/* Ziyaret Rehberim · sayfa betiği. site/site.js dosyasından üretilir. */\nconst ZR_YER = ${JSON.stringify({ kok: KOK, harita: HARITA, ...yol })};\nconst ZR_IC = ${JSON.stringify(Object.fromEntries(JS_SIMGE.map((k) => [k, ICON[k]])))};\n` + oku("site/site.js"),
  "yol.js": oku("kaynak/yol.js"),
  "hesap.js": oku("kaynak/hesap.js"),
  "leaflet.js": "/* Leaflet 1.9.4 · BSD-2-Clause · (c) Volodymyr Agafonkin */\n" + oku(LF + "leaflet.js").replace(/\/\/# sourceMappingURL=.*$/m, ""),
  "leaflet.css": "/* Leaflet 1.9.4 · BSD-2-Clause · (c) Volodymyr Agafonkin */\n" + oku(LF + "leaflet.css").split("\n").filter((l) => !l.includes("url(")).join("\n"),
};
SURUM = crypto.createHash("sha1").update(Object.values(dosyalar).join("\n")).digest("hex").slice(0, 8);
for (const [ad, ic2] of Object.entries(dosyalar)) fs.writeFileSync(path.join(CIKTI, "a", ad), ic2);
const boy = [anaSayfa(), olusturSayfa(), guzSayfa(), ...ROTALAR.map(rotaSayfa), ulasimSayfa(), ucretSayfa(), adabSayfa(), hesapSayfa(), rotalarimSayfa(), yokSayfa()];
fs.writeFileSync(path.join(CIKTI, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${HARITA_SAYFALARI.map((u) => `<url><loc>${u}</loc><lastmod>${BUGUN}</lastmod></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(CIKTI, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${TAM}${KOK}sitemap.xml\n`);
console.log("ok", boy.length, "sayfa,", Math.round(boy.reduce((a, b) => a + b, 0) / 1024), "KB · sürüm", SURUM, "· taşıt geçişleri", ROTALAR.map((r) => r.id + ":" + r.tasit.length).join(" "));
