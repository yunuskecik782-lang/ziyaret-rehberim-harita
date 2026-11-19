/* Siteyi üretir: "node site/build.js" → depo kökünde index.html, 404.html, sitemap.xml, robots.txt ve aşağıdaki KLASOR listesindeki klasörler.
   Kaynaklar: kaynak/data.js (rotalar, duraklar), site/rota-metin.json (rota açıklamaları), site/icerik.js (Ulaşım, Ücretler, Âdâb metinleri),
   site/site.css ve site/site.js. Üretilen dosyalar elle düzenlenmez; her çalıştırmada baştan yazılır. */
/* Dosya işlemleri "io" üzerinden yapılır (Node'da site/io.js). Aynı betik yönetici panelinde tarayıcıda da çalışır;
   bu yüzden burada Node'a özgü hiçbir şey (fs, path, crypto, Buffer) kullanılmaz. */
function ZR_DERLE_SITE(io) {
/* Adresler. Site alan adının kökünde, harita uygulaması /harita/ altında durur (kaynak/build.js içindeki SITE_YOL ile birlikte).
   18 Kasım 2026'ya kadar site /yeni/ altında önizlemedeydi; o adresler 404.html içinden yeni yerlerine yönlenir. */
const KOK = "/", HARITA = "/harita/", GORSEL = "/onizleme/", ALAN = "ziyaretrehberim.com", TAM = "https://" + ALAN;
const ONIZLEME = false; // true iken bütün sayfalar arama motorlarına kapalıdır (noindex)
// Bu dosyanın ürettiği klasörler. Her çalıştırmada yalnızca bunlar silinip baştan yazılır; depodaki başka hiçbir şeye dokunulmaz.
const KLASOR = ["a", "rota-olustur", "guzergahlar", "ulasim", "ucretler-ve-saatler", "ziyaret-adabi", "hesabim", "rotalarim", "yonetim"];
// Yönetim panelinin (/yonetim/) değişiklikleri kaydettiği depo ve dallar. Panel ikisini birlikte aynı kayda taşır.
const DEPO_AD = "yunuskecik782-lang/ziyaret-rehberim-harita", DALLAR = ["main", "gh-pages"];
const BUGUN = new Date().toISOString().slice(0, 10);

const oku = (f) => io.oku(f);
const g = {}; new Function("globalThis", "module", oku("kaynak/data.js"))(g, undefined);
const D = g.ZR_DATA, METIN = JSON.parse(oku("site/rota-metin.json")), IC = io.modul("site/icerik.js");
// Sürüm damgası için kısa özet (FNV-1a, 32 bit). Yalnızca önbellek kırmak içindir, güvenlik amacı yoktur.
const ozet8 = (m) => { let h = 0x811c9dc5; for (let i = 0; i < m.length; i++) { h ^= m.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, "0"); };

/* ——— Simgeler (24×24, çizgi) ——— */
const ICON = {
  ev: '<path d="M4 11.5 12 4.5l8 7"/><path d="M6.5 10v9.5h11V10"/><path d="M10 19.5v-5h4v5"/>',
  rota: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="5" r="2.2"/><path d="M8.2 18H15a3.25 3.25 0 0 0 0-6.5H9A3.25 3.25 0 0 1 9 5h6.8"/>',
  mark: '<path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-4-6 4V5.5a1 1 0 0 1 1-1z"/>',
  user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.9-3.6 3.7-5.4 7.2-5.4s6.3 1.8 7.2 5.4"/>',
  tram: '<rect x="5.5" y="4.5" width="13" height="12.5" rx="2.2"/><path d="M5.5 11h13M9 17l-1.5 3M15 17l1.5 3M9.5 14h.01M14.5 14h.01M10 2.5h4"/>',
  etiket: '<path d="M4 12.2V5.5A1.5 1.5 0 0 1 5.5 4h6.7l7.9 7.9a1.5 1.5 0 0 1 0 2.1l-6 6a1.5 1.5 0 0 1-2.1 0z"/><path d="M8.5 8.5h.01"/>',
  kalp: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  // Kategori simgeleri: hilal ve yıldız (sahâbe), kubbeli türbe (padişah), kubbe ve minare (cami), kule (tarihî mekân), burçlu sur, pusula gülü (hepsi)
  yildiz: '<path d="M11.5 3.5a6.3 6.3 0 0 0 9 8.6 8.6 8.6 0 1 1-9-8.6z"/><path d="M17.6 3.2l.75 1.75 1.75.75-1.75.75-.75 1.75-.75-1.75-1.75-.75 1.75-.75z"/>',
  tac: '<path d="M12 2.6v2.2"/><path d="M5.8 12.2a6.2 6.2 0 0 1 12.4 0"/><path d="M4.6 12.2h14.8"/><path d="M6.4 12.2v8.3h11.2v-8.3"/><path d="M10 20.5v-3.6a2 2 0 0 1 4 0v3.6"/><path d="M3.5 20.5h17"/>',
  cami: '<path d="M2.8 20.5h18.4"/><path d="M4.2 20.5v-5.8a5.4 5.4 0 0 1 10.8 0v5.8"/><path d="M9.6 9.3V7.2"/><path d="M8 20.5v-2.4a1.6 1.6 0 0 1 3.2 0v2.4"/><path d="M17.6 20.5V8.4l1.3-3.2 1.3 3.2v12.1"/><path d="M17.1 11.6h3.6"/>',
  sutun: '<path d="M8.6 20.5V10.2l3.4-6.4 3.4 6.4v10.3"/><path d="M7.6 10.2h8.8"/><path d="M8.6 14.2h6.8"/><path d="M10.9 20.5v-2.8a1.1 1.1 0 0 1 2.2 0v2.8"/><path d="M5.5 20.5h13"/>',
  sur: '<path d="M3.6 20.5V7.6h3v2.6h2.8V7.6h5.2v2.6h2.8V7.6h3v12.9z"/><path d="M9.8 20.5v-4a2.2 2.2 0 0 1 4.4 0v4"/><path d="M6 13.4h.01M18 13.4h.01"/>',
  hepsi: '<circle cx="12" cy="12" r="8.6"/><path d="M14.9 9.1l-1.7 4.1-4.1 1.7 1.7-4.1z"/><path d="M12 3.4v1.6M12 19v1.6M3.4 12H5M19 12h1.6"/>',
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
const JS_SIMGE = ["fwd", "down", "x", "ext", "trash", "rota", "mark", "user", "loc", "pin", "clock", "walk", "tram", "bilgi", "sag", "sol", "duz", "geri", "basla", "buyut", "kucult", "check", "spark"];
ICON.check = '<path d="M5 12.5l4.5 4.5L19 7.5"/>';
ICON.menu = '<path d="M4 6.5h16M4 12h16M4 17.5h10"/>';
ICON.filtre = '<path d="M4 6.5h16M7 12h10M10 17.5h4"/>';
ICON.once = '<path d="M14.5 6l-6 6 6 6"/>';
ICON.liste ='<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r=".9"/><circle cx="4.8" cy="12" r=".9"/><circle cx="4.8" cy="17.5" r=".9"/>';

/* ——— Kategori resimleri (64×64, dolu) ———
   Ana sayfadaki kutular, sol sütun ve harita uygulaması aynı altı resmi kullanır: kubbeli türbe ve hilal (sahâbe), revaklı büyük türbe (padişah),
   kubbe ve iki minare (cami), Galata Kulesi (tarihî mekân), burçlu sur ve kapı (suriçi), pusula (hepsi). Resimler rotanın rengindeki zeminin üzerinde durur.
   Tonlar site.css içindeki sınıflardan gelir: a beyaz, b yarı saydam beyaz, c soluk ışık, d koyu oyuk (kapı, pencere), e hafif gölge çizgisi, g altın (alem, hilal), h beyaz halka. */
const RESIM = {
  sahabe: '<circle class="c" cx="47" cy="17" r="13"/><path class="g" d="M50.5 7.5a9.5 9.5 0 1 0 7.6 14.9 7.6 7.6 0 0 1-7.6-14.9z"/><path class="b" d="M9 55c-3.6-7-3.8-20.5 0-29 3.8 8.5 3.6 22 0 29z"/><path class="c" d="M55.5 55c-2.8-5.5-3-15.5 0-22 3 6.5 2.8 16.5 0 22z"/><path class="g" d="M31.2 10.5h1.6V17h-1.6z"/><circle class="g" cx="32" cy="9.6" r="2"/><path class="a" d="M17.5 36c0-9.5 6.3-17 14.5-19.5C40.2 19 46.5 26.5 46.5 36z"/><path class="b" d="M16 35.5h32v4H16z"/><path class="a" d="M18.5 39.5h27V56h-27z"/><path class="d" d="M28.5 56V47.5a3.5 3.5 0 0 1 7 0V56z"/><path class="d" d="M21.8 50.5v-4.8a1.9 1.9 0 0 1 3.8 0v4.8zM38.4 50.5v-4.8a1.9 1.9 0 0 1 3.8 0v4.8z"/><path class="b" d="M4 56h56v2.5H4z"/>',
  padisah: '<circle class="c" cx="17" cy="16" r="10"/><path class="g" d="M31.2 5.5h1.6V13h-1.6z"/><path class="g" d="M32 2.2a2.6 2.6 0 1 0 2.3 3.8A2.1 2.1 0 0 1 32 2.2z"/><path class="a" d="M14 33c0-10.5 7.8-18 18-20.5C42.2 15 50 22.5 50 33z"/><path class="e" d="M31.3 13.5h1.4V33h-1.4z"/><path class="e" d="M22.5 33c.3-8.5 3.3-15.5 8-19.7l1 .9c-4.2 4-6.9 10.6-7.2 18.8zM41.5 33c-.3-8.5-3.3-15.5-8-19.7l-1 .9c4.2 4 6.9 10.6 7.2 18.8z"/><path class="b" d="M11.5 32.5h41V37h-41z"/><path class="a" d="M13.5 37h37v19h-37z"/><path class="d" d="M16.8 56V46.8a4 4 0 0 1 8 0V56zM28 56V46.8a4 4 0 0 1 8 0V56zM39.2 56V46.8a4 4 0 0 1 8 0V56z"/><path class="g" d="M13.5 39.5h37V41h-37z"/><path class="b" d="M6 30.5a4.5 4.5 0 0 1 9 0V37H6zM49 30.5a4.5 4.5 0 0 1 9 0V37h-9z"/><path class="b" d="M7 37h7v19H7zM50 37h7v19h-7z"/><path class="b" d="M3 56h58v2.5H3z"/>',
  cami: '<circle class="c" cx="32" cy="20" r="15"/><path class="a" d="M8.2 20.5 10 9l1.8 11.5z"/><path class="a" d="M8.6 20.5h2.8V56H8.6z"/><path class="b" d="M7 26.5h6v2.2H7zM7 37h6v2.2H7z"/><path class="a" d="M52.2 20.5 54 9l1.8 11.5z"/><path class="a" d="M52.6 20.5h2.8V56h-2.8z"/><path class="b" d="M51 26.5h6v2.2h-6zM51 37h6v2.2h-6z"/><path class="g" d="M9.4 5.5h1.2V9H9.4zM53.4 5.5h1.2V9h-1.2z"/><path class="g" d="M31.2 16.5h1.6V22h-1.6z"/><path class="g" d="M32 12.8a2.5 2.5 0 1 0 2.2 3.7A2 2 0 0 1 32 12.8z"/><path class="a" d="M20 38c0-8 5.2-14 12-16 6.8 2 12 8 12 16z"/><path class="b" d="M13.5 46c0-5.5 3.6-9 8.5-9.5V46zM50.5 46c0-5.5-3.6-9-8.5-9.5V46z"/><path class="b" d="M18.5 37.5h27v3h-27z"/><path class="a" d="M14 45.5h36V56H14z"/><path class="a" d="M20 40.5h24v6H20z"/><path class="d" d="M28.8 56v-5.8a3.2 3.2 0 0 1 6.4 0V56z"/><path class="d" d="M18 53v-3.2a1.7 1.7 0 0 1 3.4 0V53zM23.4 53v-3.2a1.7 1.7 0 0 1 3.4 0V53zM37.2 53v-3.2a1.7 1.7 0 0 1 3.4 0V53zM42.6 53v-3.2a1.7 1.7 0 0 1 3.4 0V53z"/><path class="d" d="M24.5 45v-2a1.3 1.3 0 0 1 2.6 0v2zM30.7 45v-2a1.3 1.3 0 0 1 2.6 0v2zM36.9 45v-2a1.3 1.3 0 0 1 2.6 0v2z"/><path class="b" d="M3 56h58v2.5H3z"/>',
  mekan: '<circle class="c" cx="45" cy="18" r="12"/><path class="c" d="M4 56V44h7v-5h8v17zM45 56V41h6v-4h9v19z"/><path class="g" d="M31.3 3.5h1.4V9h-1.4z"/><circle class="g" cx="32" cy="3.5" r="1.5"/><path class="a" d="M24.5 24 32 8l7.5 16z"/><path class="b" d="M22 23.5h20v3.5H22z"/><path class="a" d="M24 27h16v29H24z"/><path class="g" d="M21 31.5h22v2.2H21z"/><path class="d" d="M26.8 30.5v-2a1.2 1.2 0 0 1 2.4 0v2zM30.8 30.5v-2a1.2 1.2 0 0 1 2.4 0v2zM34.8 30.5v-2a1.2 1.2 0 0 1 2.4 0v2z"/><path class="d" d="M27 41.5v-4a1.5 1.5 0 0 1 3 0v4zM34 41.5v-4a1.5 1.5 0 0 1 3 0v4zM27 49.5v-4a1.5 1.5 0 0 1 3 0v4zM34 49.5v-4a1.5 1.5 0 0 1 3 0v4z"/><path class="e" d="M24 27h3v29h-3z"/><path class="b" d="M3 56h58v2.5H3z"/>',
  sur: '<circle class="c" cx="18" cy="17" r="11"/><path class="b" d="M40 56V19h3v3h3.5v-3h3.5v3H53.5v-3H57V56z"/><path class="e" d="M46.5 32v-3.5a2 2 0 0 1 4 0V32z"/><path class="a" d="M7 56V24h3.5v3.5H14V24h3.5v3.5H21V24h3.5v32z"/><path class="d" d="M13.7 38v-4a2 2 0 0 1 4 0v4z"/><path class="a" d="M24.5 56V35.5h3V38.5h3.2v-3h3.2v3h3.2v-3h3.2v3H40V56z"/><path class="g" d="M7 29.5h17.5V31H7z"/><path class="d" d="M28.3 56v-7.5a4 4 0 0 1 8 0V56z"/><path class="b" d="M3 56h58v2.5H3z"/>',
  hepsi: '<circle class="c" cx="32" cy="32" r="26"/><circle class="h" cx="32" cy="32" r="21"/><path class="b" d="M31 8h2v5h-2zM31 51h2v5h-2zM8 31h5v2H8zM51 31h5v2h-5z"/><path class="g" d="M32 13.5 37 32H27z"/><path class="a" d="M32 50.5 27 32h10z"/><path class="b" d="M13.5 32 32 28.5v7zM50.5 32 32 35.5v-7z"/><circle class="d" cx="32" cy="32" r="2.6"/><circle class="g" cx="32" cy="32" r="1.2"/>',
};
const rs = (n) => `<svg class="rs" viewBox="0 0 64 64" aria-hidden="true">${RESIM[n]}</svg>`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const R6 = 6371000, RAD = Math.PI / 180;
const olc = (a, b) => { const x = (b[1] - a[1]) * RAD * Math.cos(((a[0] + b[0]) / 2) * RAD), y = (b[0] - a[0]) * RAD; return Math.hypot(x, y) * R6; };

/* ——— Veri ——— */
// Yürüyüş mesafesi tek yerden gelir: rotanın "km" alanı (sokaktan ölçülen toplam). Rota sayfasındaki bilgi satırı da onu yazar;
// sayfa açılınca harita yolu yeniden ölçer ve satırı ölçtüğü sayıyla eşitler (site.js, tarifYaz).
const KM_HAP = /km yürüyüş$/;
const ROTALAR = D.ROUTES.map((r, i) => {
  const duraklar = D.RAW.filter((a) => a[0] === i).sort((a, b) => a[1] - b[1]).map((a) => ({ n: a[1], ad: a[2], hon: a[3], tur: a[4], yer: a[5], acik: a[6], saat: a[7], yak: !!a[8], lat: a[9], lng: a[10] }));
  // Uzun etaplar taşıtla geçilir (rota sayfalarındaki "taşıt geçişi" sayılarıyla aynı): kuş uçuşu 1,5 km'yi aşan aralar. Sur yürüyüşü (r6) baştan sona yürünür.
  const tasit = [];
  duraklar.forEach((d, k) => { if (k && r.id !== "r6" && olc([duraklar[k - 1].lat, duraklar[k - 1].lng], [d.lat, d.lng]) > 1500) tasit.push(k - 1); });
  const m0 = METIN[r.id], m = { ...m0, pills: m0.pills.map((p) => (/^\d+ durak$/.test(p) ? duraklar.length + " durak" : /^\d+ taşıt geçişi$/.test(p) ? (tasit.length ? tasit.length + " taşıt geçişi" : "") : KM_HAP.test(p) && r.km ? r.km + " yürüyüş" : p)).filter(Boolean) };
  return { ...r, yol: KOK + "guzergahlar/" + r.slug + "/", duraklar, tasit, m };
});
// Durak sayıları veriden hesaplanır; panelden durak eklenip çıkarılınca kendiliğinden güncellenir.
const TOPLAM = ROTALAR.reduce((n, r) => n + r.duraklar.length, 0);
const yol = { ana: KOK, olustur: KOK + "rota-olustur/", guz: KOK + "guzergahlar/", ulasim: KOK + "ulasim/", ucret: KOK + "ucretler-ve-saatler/", adab: KOK + "ziyaret-adabi/", hesap: KOK + "hesabim/", rotalarim: KOK + "rotalarim/" };

/* ——— Zemin ———
   Beyaza yakın sıcak zemin, yavaşça yer değiştiren iki yumuşak ışık ve çok soluk bir desen. Desen küçük bir karo olarak CSS içinde durur,
   tarayıcı onu bir kez çizer ve yan yana dizer; hareket yalnızca transform ile yapılır (işi ekran kartı yapar, sayfa takılmaz).
   Varsayılan desen Selçuklu çinilerindeki sekiz köşeli yıldız ve haç düzenidir (Kubadabad çinilerindeki gibi): yıldızların uçları birbirine
   değer, aradaki boşluk haç biçimini verir; karo 200×200.
   Hesabım › Görünüm’den seçilebilen ikinci desen şemsedir: Osmanlı cilt ve kapı süslemesindeki dilimli madalyon, altında ve üstünde salbek;
   karo 240×380, yarım kaydırmalı tekrar. Üçüncü seçenek desensizdir. Lale kafesi 19 Kasım 2026'da site sahibinin isteğiyle kaldırıldı.
   Desen bir karo boyu (şemsede yarım karo çapraz) kaydığında kendi üzerine oturur; bu yüzden hareket kesintisiz döner. */
const f1 = (v) => v.toFixed(1);
const svgUrl = (s) => `url("data:image/svg+xml,${s.replace(/\s+/g, " ").replace(/"/g, "'").replace(/%/g, "%25").replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E")}")`;
const Z_STIL = (dolgu) => `<style>*{fill:none;stroke:rgba(169,119,58,.62);stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round}.y{fill:rgba(169,119,58,${dolgu})}.i{stroke-width:.8}</style>`;
// Sekiz köşeli yıldız: iç içe iki karenin dış çizgisi (16 köşe).
const zYildiz = (x, y, R, don = 0) => { const r = (R * Math.SQRT1_2) / Math.cos(Math.PI / 8); let d = ""; for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8 + don, q = k % 2 ? r : R; d += `${k ? "L" : "M"}${f1(x + Math.cos(a) * q)} ${f1(y + Math.sin(a) * q)}`; } return d + "Z"; };
// Yapraklı gül: merkezden çıkan n yaprak.
const zGul = (x, y, R, n = 8) => { let d = ""; for (let k = 0; k < n; k++) { const a = (k * 2 * Math.PI) / n, b = a + Math.PI / n, c = a - Math.PI / n; d += `M${f1(x)} ${f1(y)}Q${f1(x + Math.cos(c) * R * 0.62)} ${f1(y + Math.sin(c) * R * 0.62)} ${f1(x + Math.cos(a) * R)} ${f1(y + Math.sin(a) * R)}Q${f1(x + Math.cos(b) * R * 0.62)} ${f1(y + Math.sin(b) * R * 0.62)} ${f1(x)} ${f1(y)}`; } return d; };
const Z_KOSE = (w, h) => [[0, 0], [w, 0], [0, h], [w, h]];
const Z_YILDIZ = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${Z_STIL(".055")}<path class="y" d="${zYildiz(100, 100, 100)}"/><path class="i" d="${zYildiz(100, 100, 88)}"/><path d="${zYildiz(100, 100, 50)}"/><path class="y" d="${zGul(100, 100, 30)}"/><path class="i" d="${Z_KOSE(200, 200).map(([x, y]) => zYildiz(x, y, 17, Math.PI / 8) + zGul(x, y, 9, 4)).join("")}"/></svg>`;
// Dilimli çerçeve: elipsin çevresinde n dilim.
const zDilimli = (x, y, rx, ry, n, tas, don) => { let d = ""; for (let k = 0; k <= n; k++) { const a = (k * 2 * Math.PI) / n + don, px = x + Math.cos(a) * rx, py = y + Math.sin(a) * ry; if (!k) { d += `M${f1(px)} ${f1(py)}`; continue; } const m = a - Math.PI / n; d += `Q${f1(x + Math.cos(m) * rx * tas)} ${f1(y + Math.sin(m) * ry * tas)} ${f1(px)} ${f1(py)}`; } return d + "Z"; };
const zSalbek = (x, y, yon) => `<path class="y" d="M${x} ${y}C${x - 9} ${y + 7 * yon} ${x - 9} ${y + 17 * yon} ${x} ${y + 27 * yon}C${x + 9} ${y + 17 * yon} ${x + 9} ${y + 7 * yon} ${x} ${y}Z"/><path class="i" d="M${x} ${y + 6 * yon}C${x - 4} ${y + 10 * yon} ${x - 4} ${y + 16 * yon} ${x} ${y + 20 * yon}C${x + 4} ${y + 16 * yon} ${x + 4} ${y + 10 * yon} ${x} ${y + 6 * yon}Z"/>`;
const zSemse = (x, y) => `<path class="y" d="${zDilimli(x, y, 30, 44, 16, 1.2, Math.PI / 16)}"/><path class="i" d="${zDilimli(x, y, 22, 34, 12, 1.16, Math.PI / 12)}"/><path d="${zGul(x, y, 13)}"/><path class="i" d="M${x} ${y - 17}v-6M${x} ${y + 17}v6M${x - 12} ${y}h-4M${x + 12} ${y}h4"/><path d="M${x} ${y - 52}v-6M${x} ${y + 52}v6"/>${zSalbek(x, y - 58, -1)}${zSalbek(x, y + 58, 1)}`;
const Z_SEMSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 380">${Z_STIL(".06")}${zSemse(120, 190)}${Z_KOSE(240, 380).map(([x, y]) => zSemse(x, y)).join("")}<path class="i" d="M120 0v20M120 360v20M0 170v40M240 170v40"/><path class="y" d="${zGul(120, 0, 7, 4)}${zGul(120, 380, 7, 4)}${zGul(0, 190, 7, 4)}${zGul(240, 190, 7, 4)}"/></svg>`;
const ZEMIN_CSS = `/* ——— Zemin deseni (site/build.js üretir): Selçuklu yıldızı ve şemse karoları ——— */
.z-desen, .do-yildiz { background-image: ${svgUrl(Z_YILDIZ)}; }
[data-desen="semse"] .z-desen, .g-on.do-semse { background-image: ${svgUrl(Z_SEMSE)}; }
`;
const ZEMIN = `<div class="zemin" aria-hidden="true"><i class="z-desen"></i><i class="z-sis"></i><i class="isik i1"></i><i class="isik i2"></i></div>`;

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
<div class="acilir${s === "guz" ? " secili" : ""}"><button type="button" aria-haspopup="true" aria-expanded="false">Güzergâhlar${ic("down")}</button><div class="acilir-kutu">
<div class="guz-bas"><span><b>Hazır güzergâhlar</b><small>${ROTALAR.length} rota · ${TOPLAM} durak · yürüyerek</small></span><a href="${yol.guz}">Hepsini gör${ic("fwd")}</a></div>
<div class="guz-izgara">${ROTALAR.map((r, ri) => `<a class="guz-k ${r.id}" href="${r.yol}" style="--i:${ri}"><span class="guz-no"><b>${r.no}</b></span><span class="guz-y"><small>${esc(r.kicker)}</small><b>${esc(r.name)}</b><em>${r.duraklar.length} durak · ${r.km} · ${r.sure.replace("≈ ", "")}</em></span></a>`).join("")}</div>
<a class="guz-alt" href="${yol.olustur}">${ic("rota")}<span><b>Kendi rotanı oluştur</b><small>Durakları seç, konumuna göre sırala</small></span>${ic("fwd")}</a></div></div>
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
/* ——— Geniş ekranda sol sütun: açılır listeler (bu sayfanın bölümleri, filtreler, güzergâhlar, pratik bilgi) ve kısa bilgi metni.
   1480 pikselden geniş ekranda sabit durur, daha dar masaüstünde "Menü" düğmesiyle açılır; telefonda yoktur (orada tam ekran menü var). ——— */
/* "Menü" düğmesi üst şeritte değil, sütunun en başındadır. Sütun kapalıyken solda ince bir şerit kalır: en üstte menüyü açan düğme,
   altında gruplara giden kısayollar. Telefonda ikisi de yoktur (orada üstteki düğmeyle açılan tam ekran menü var). */
const yanGrup = (id, ad, simge, icerik, acik, sinif) => `<details class="yan-grup${sinif ? " " + sinif : ""}" id="${id}"${acik ? " open" : ""}><summary>${ic(simge)}<span>${ad}</span>${ic("down")}</summary><div class="yan-ic">${icerik}</div></details>`;
function yanCubuk(s, bu, rid) {
  const filtre = KAT.map((k) => `<a class="${k[1]}" href="${yol.olustur}#kategori=${k[0]}" data-hash="kategori=${k[0]}"><span class="yan-sim res">${rs(k[2])}</span><span>${k[3]}</span><em>${k[4]}</em></a>`).join("");
  const rotalar = ROTALAR.map((r) => `<a class="${r.id}" href="${r.yol}"${r.id === rid ? ' aria-current="page"' : ""}><span class="sira altin">${r.no}</span><span>${esc(r.name)}<small>${r.duraklar.length} durak · ${r.sure}</small></span></a>`).join("")
    + `<a href="${yol.guz}"${s === "guz" && !rid ? ' aria-current="page"' : ""}><span class="sira sade">${ic("fwd")}</span><span>Tüm güzergâhlar</span></a>`;
  const bilgi = [...MENU.slice(3), ["rotalarim", yol.rotalarim, "Rotalarım", "mark", "Kaydettiğin rotalar"]].map((m) => `<a href="${m[1]}"${cur(s, m[0])}><span class="yan-sim sade">${ic(m[3])}</span><span>${m[2]}<small>${m[4]}</small></span></a>`).join("");
  const buSayfa = bu ? yanGrup("yg-bu", bu.ad, bu.simge || "liste", bu.ogeler.map((o) => `<a href="${o[0]}">${o[3] ? `<span class="sira">${o[3]}</span>` : '<span class="yan-nokta"></span>'}<span>${esc(o[1])}${o[4] ? ` <i>${esc(o[4])}</i>` : ""}${o[2] ? `<small>${esc(o[2])}</small>` : ""}</span></a>`).join(""), true, rid) : "";
  const kisa = [...(bu && s !== "ana" ? [["yg-bu", bu.ad, bu.simge || "liste"]] : []), ["yg-filtre", "Ne görmek istersin?", "filtre"], ["yg-guz", "Güzergâhlar", "pin"], ...(bu && s === "ana" ? [["yg-bu", bu.ad, bu.simge || "liste"]] : []), ["yg-bilgi", "Pratik bilgi", "bilgi"]];
  return `<nav class="yan-ray" aria-label="Menü kısayolları"><button class="yan-ac" type="button" aria-controls="yan" aria-expanded="false" title="Menüyü aç">${ic("menu")}<span class="gizli">Menüyü aç</span></button><span class="yan-ray-c"></span>
${kisa.map((k) => `<button type="button" data-grup="${k[0]}" aria-controls="yan" title="${esc(k[1])}">${ic(k[2])}<span class="gizli">${esc(k[1])}</span></button>`).join("")}</nav>
<aside class="yan" id="yan" aria-label="Menü"><div class="yan-kay">
<div class="yan-bas"><button class="yan-kapa" type="button" aria-controls="yan" aria-expanded="true" title="Menüyü kapat">${ic("menu")}<span>Menü</span>${ic("once")}</button></div>
${s === "ana" ? "" : buSayfa}
${yanGrup("yg-filtre", "Ne görmek istersin?", "filtre", filtre, s === "ana" || !bu)}
${yanGrup("yg-guz", "Güzergâhlar", "pin", rotalar, true)}
${s === "ana" ? buSayfa : ""}
${yanGrup("yg-bilgi", "Pratik bilgi", "bilgi", bilgi, true)}
<div class="yan-not">${ic("ampul")}<p><b>Yola çıkmadan önce</b>İstanbulkart tam biniş ${IC.ucret.kart[0][1]} (${IC.ucret.tarih}). Bazı türbeler ve müzeler pazartesi kapalıdır; rotandaki durakların saatine bak.</p></div>
<p class="yan-ince">Konumun yalnızca iznin olursa kullanılır ve hiçbir yere kaydedilmez.</p>
</div></aside><div class="yan-perde"></div>`;
}
const sekme = (s) => `<nav class="sekme" aria-label="Alt menü">${[["ana", yol.ana, "Ana sayfa", "ev"], ["olustur", yol.olustur, "Rota oluştur", "rota"], ["rotalarim", yol.rotalarim, "Rotalarım", "mark"], ["hesap", yol.hesap, "Hesabım", "user"]].map((m) => `<a href="${m[1]}"${cur(s, m[0])}>${ic(m[3])}<b>${m[2]}</b></a>`).join("")}</nav>`;
const alt = `<footer class="alt"><div class="kap alt-ic">${marka}
<p class="ince">İstanbul ziyaret ve gezi rehberi · ${ROTALAR.length} güzergâh, ${TOPLAM} durak</p>
<nav aria-label="Alt bilgi menüsü">${MENU.map((m) => `<a href="${m[1]}">${m[2]}</a>`).join("")}<a href="${yol.rotalarim}">Rotalarım</a><a href="${yol.hesap}">Hesabım</a></nav>
<p class="ince">Haritalar © <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a> katkıda bulunanlar · Uydu görüntüsü: Esri · Yürüyüş yolu: OpenStreetMap yol tarifi (FOSSGIS)<br>Saatler, ücretler ve sefer bilgileri değişebilir; yola çıkmadan önce doğrulayın.</p>
</div></footer>`;

let SURUM = "0";
/* Yazı tipleri sitenin kendi adresinden gelir (Inter ve Plus Jakarta Sans; Türkçe harfleri de içeren tek parça, değişken kalınlık).
   Sayfanın en başında önceden istenir; site.css içindeki @font-face "optional" kullanır: yazı tipi hazırsa ilk çizimde kullanılır,
   değilse o sayfa sistem yazısıyla açılır ve sonradan yazı değişip sayfa kaymaz. Sonraki sayfalar önbellekten gelir. */
const YAZI = ["inter.woff2", "plus-jakarta-sans.woff2"];
const FONT = YAZI.map((f) => `<link rel="preload" href="${KOK}a/${f}" as="font" type="font/woff2" crossorigin>`).join("");
const HARITA_SAYFALARI = []; // sitemap.xml için: arama motorlarına açık sayfaların adresleri
/* http ile gelen ziyaretçi, https adresi çalışıyorsa oraya alınır (konum yalnızca https adreste sorulabilir).
   Önce https adresi denenir: güvenlik sertifikası henüz hazır değilse ziyaretçi hata sayfasına itilmez, http'de kalır. */
const HTTPS = `(function(){var l=location;if(l.protocol==="http:"&&/(^|\\.)${ALAN.replace(/\./g, "\\.")}$/.test(l.hostname)&&window.fetch)fetch("https://"+l.host+"${KOK}robots.txt?"+Date.now(),{mode:"no-cors",cache:"no-store"}).then(function(){l.replace("https://"+l.host+l.pathname+l.search+l.hash)}).catch(function(){})})();`;
function sayfa({ dosya, s, id, baslik, ozet, govde, sinif = "", veri, harita, yolJs, altsiz, gizli, gorsel = "ana-kapak.jpg", onBetik = "", yan }) {
  const a = (f) => `${KOK}a/${f}?v=${SURUM}`;
  const adres = TAM + KOK + dosya.replace(/index\.html$/, ""), kapali = ONIZLEME || gizli;
  const tamBaslik = esc(baslik) + (id === "ana" ? "" : " · Ziyaret Rehberim");
  if (!kapali) HARITA_SAYFALARI.push(adres);
  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${FONT}
<script>${onBetik}${HTTPS}(function(){var d=document.documentElement;d.className="js";d.style.setProperty("--zt",-(Date.now()%3600000)/1000+"s");try{if(localStorage.getItem("zr.yan")==="0")d.className+=" yan-kapali";if(localStorage.getItem("zr.katman.2")==="sokak")d.className+=" h-sokak";if(localStorage.getItem("zr.oturum.v1")){var g=JSON.parse(localStorage.getItem("zr.gorunum.v1")||"{}");for(var k in g)if(/^(rozet|desen|cizgi|stil|isaret|hareket)$/.test(k)&&/^[a-z]{2,12}$/.test(g[k]))d.setAttribute("data-"+k,g[k])}}catch(e){}try{if(!sessionStorage.getItem("zr.ilk")){d.className+=" ilk";sessionStorage.setItem("zr.ilk","1")}}catch(e){}setTimeout(function(){if(!window.ZR_HAZIR)d.classList.remove("js")},3500)})();</script>
<title>${tamBaslik}</title>
<meta name="description" content="${esc(ozet)}">
${kapali ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${adres}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Ziyaret Rehberim"><meta property="og:locale" content="tr_TR">
<meta property="og:title" content="${tamBaslik}"><meta property="og:description" content="${esc(ozet)}"><meta property="og:url" content="${adres}">
<meta property="og:image" content="${TAM}${GORSEL}${gorsel}"><meta name="twitter:card" content="summary_large_image">`}
<meta name="theme-color" content="#FEFCF8">
<link rel="icon" href="${GORSEL}zr-logo.jpg"><link rel="apple-touch-icon" href="${GORSEL}zr-logo.jpg">
${harita ? `<link rel="stylesheet" href="${a("leaflet.css")}">\n` : ""}<link rel="stylesheet" href="${a("site.css")}">
${harita ? `<script defer src="${a("leaflet.js")}"></script>\n` : ""}${yolJs ? `<script defer src="${a("yol.js")}"></script>\n` : ""}<script defer src="${a("hesap.js")}"></script>
<script defer src="${a("site.js")}"></script>
</head>
<body data-sayfa="${id}">
<a class="gizli" href="#icerik">İçeriğe geç</a>
${ZEMIN}
${ust(s)}
${yanCubuk(s, yan, /^r\d$/.test(sinif) ? sinif : "")}
<main id="icerik"${sinif ? ` class="${sinif}"` : ""}>
${govde}
</main>
${altsiz ? "" : alt}
${sekme(s)}
<div class="bildirim" role="status" aria-live="polite"></div>
${veri ? `<script type="application/json" id="veri">${JSON.stringify(veri).replace(/</g, "\\u003c")}</script>\n` : ""}</body>
</html>
`;
  io.yaz(dosya, html);
  return html.length;
}

/* ——— Rota kartları (ana sayfa ve Güzergâhlar) ——— */
const hapSim = (t) => (/durak/.test(t) ? "pin" : /saat|dk/.test(t) ? "clock" : /taşıt/.test(t) ? "tram" : "walk");
const haplar = (r) => `<div class="haplar">${r.m.pills.map((p) => `<span class="hap"${KM_HAP.test(p) ? " data-yuru" : ""}>${ic(hapSim(p))}${esc(p)}</span>`).join("")}</div>`;
const rkart = (r, i) => `<article class="rkart ${r.id}" data-g style="--i:${i % 3}"><div class="rkart-g"><img src="${GORSEL}rota-${r.id}.jpg" alt="${esc(r.name)} güzergâhının harita önizlemesi" width="960" height="540" loading="lazy"><span class="no">${r.no}</span><i>© OpenStreetMap</i></div>
<div class="rkart-y"><span class="kicker">Rota ${r.no} · ${esc(r.kicker)}</span><h3><a href="${r.yol}">${esc(r.name)}</a></h3><p>${esc(r.lede)}</p>${haplar(r)}
<div class="dugmeler"><a class="btn kucuk koyu" href="${r.yol}">Rotayı aç${ic("fwd")}</a><a class="btn kucuk yumusak" href="${yol.olustur}#rota=${r.id}" data-hash="rota=${r.id}">${ic("rota")}Haritada başlat</a></div></div></article>`;

/* ——— Ana sayfa ——— */
const katSay = (liste) => ROTALAR.filter((r) => liste.split(",").includes(r.concept)).reduce((n, r) => n + r.duraklar.length, 0);
const KAT = [["sahabe", "r1", "sahabe", "Sahâbe-i Kirâm"], ["padisah", "r3", "padisah", "Padişah türbeleri"], ["cami", "r4", "cami", "Tarihî camiler"], ["mekan", "r5", "mekan", "Tarihî mekânlar"], ["sur", "r6", "sur", "Suriçi ve surlar"], ["sahabe,padisah,cami,mekan,sur", "tumu", "hepsi", "Tümü"]].map((k) => [...k, katSay(k[0])]);
function anaSayfa() {
  const govde = `<section class="kapak kap"><div class="kapak-ic"><img src="${GORSEL}ana-kapak.jpg" srcset="${GORSEL}ana-kapak-k.jpg 1100w, ${GORSEL}ana-kapak.jpg 2000w" sizes="(max-width: 781px) 100vw, (max-width: 1479px) 96vw, calc(100vw - 368px)" alt="Gün batımında Galata Kulesi, Haliç ve tarihî yarımada, havadan" width="2000" height="1125" fetchpriority="high">
<div class="kapak-kart"><span class="goz">İstanbul · ${ROTALAR.length} rota · ${TOPLAM} durak</span><h1>${["İstanbul", "Ziyaret", "Rehberi"].map((w, i) => `<span style="--i:${i}">${w}</span>`).join(" ")}</h1>
<p>Sahâbe kabirleri, padişah türbeleri, tarihî camiler ve kara surları. Haritada seç, rotanı oluştur, yola çık.</p>
<div class="dugmeler"><a class="btn altin" href="#rota-olustur">${ic("rota")}Rotanı oluştur</a><a class="btn" href="#hazir-rotalar">Hazır rotalar</a></div></div></div></section>

<section class="bolum kap" id="rota-olustur"><div class="bolum-bas" data-g><span class="kicker">Harita</span><h2 class="vurgulu">Ziyaret <em>rotanı</em> oluştur</h2><p>Ne görmek istediğini seç; duraklar gerçek harita üzerinde açılır. En yakın rotayı tek dokunuşla kur ya da durakları kendin seç.</p></div>
<div class="kat" role="group" aria-label="Ne görmek istersin?">${KAT.map((k, i) => `<a class="${k[1]}" data-g style="--i:${i}" href="${yol.olustur}#kategori=${k[0]}" data-hash="kategori=${k[0]}"><span class="kat-sim">${rs(k[2])}</span><span>${k[3]}<small>${k[4]} durak</small></span></a>`).join("")}</div>
<div class="cerceve" data-g="buyu"><iframe title="Rota oluşturma haritası" data-src="${HARITA}?gomulu=1" allow="geolocation"></iframe>
<a class="cerceve-on" href="${yol.olustur}" style="background-image:url(${GORSEL}ana-harita.jpg)"><b>${TOPLAM} durak gerçek harita üzerinde</b><span class="btn altin">${ic("rota")}Haritayı aç</span></a></div>
<ol class="uc-adim"><li data-g style="--i:0"><span><b>Kategorini seç</b>Sahâbe kabirleri, türbeler, camiler ya da hepsi.</span></li><li data-g style="--i:1"><span><b>Rotanı kur</b>En yakın rotayı oluştur ya da durakları tek tek ekle; yol sokaklardan çizilir.</span></li><li data-g style="--i:2"><span><b>Yola çık</b>Rotayı kaydet, dönüş tarifini oku, Google ya da Apple Haritalar’da aç.</span></li></ol>
<p class="ince" style="margin-top:14px">Konumun yalnızca iznin olursa kullanılır ve hiçbir yere kaydedilmez.</p></section>

<section class="bolum kap" id="hazir-rotalar"><div class="bolum-bas" data-g><span class="kicker">Güzergâhlar</span><h2>Hazır rotalar</h2><p>Altı hazır rota. Sayfasını aç, durakları oku ya da doğrudan haritada başlat.</p></div>
<div class="rkartlar">${ROTALAR.map(rkart).join("\n")}</div></section>

<section class="bolum kap" id="yola-cikmadan"><div class="bolum-bas" data-g><span class="kicker">Pratik bilgi</span><h2>Yola çıkmadan önce</h2></div>
<div class="dortlu">
<a class="bkart" data-g style="--i:0" href="${yol.ulasim}"><span class="menu-sim">${ic("tram")}</span><b>Buradan nasıl giderim?</b><span>Konumuna göre hangi tramvaya, hangi duraktan bineceğini haritada gör.</span><em>Ulaşım →</em></a>
<a class="bkart" data-g style="--i:1" href="${yol.ucret}"><span class="menu-sim">${ic("etiket")}</span><b>İstanbulkart</b><span>Tam biniş ${IC.ucret.kart[0][1]}; 120 dakika içindeki aktarmalar indirimli (${IC.ucret.tarih}).</span><em>Ücretler →</em></a>
<a class="bkart" data-g style="--i:2" href="${yol.ucret}#turbeler"><span class="menu-sim">${ic("clock")}</span><b>Pazartesi</b><span>Bazı türbeler ve müzeler kapalıdır; rotandaki durakların saatine bak.</span><em>Saatler →</em></a>
<a class="bkart" data-g style="--i:3" href="${yol.adab}"><span class="menu-sim">${ic("kalp")}</span><b>Ziyaret âdâbı</b><span>Türbede, camide ve mahallede dikkat edilecek ${IC.adab.gruplar.reduce((s, x) => s + x.maddeler.length, 0)} incelik.</span><em>Ziyaret âdâbı →</em></a>
</div>
<p class="ince" style="margin-top:18px">Bilgiler Kasım 2026’da derlenmiştir. Ziyaret saatleri, ücretler ve sefer bilgileri değişebilir; yola çıkmadan önce kontrol et.</p></section>`;
  // Harita uygulaması eskiden kökte duruyordu: /#kategori=…, /#rota=r3, /#kayit=2, /#rotam, /#rotalarim bağlantıları yeni yerlerine alınır.
  const onBetik = `(function(){var h=location.hash;if(/^#(kategori=|rota=r[1-6]$|kayit=\\d|rotam$)/.test(h))location.replace("${yol.olustur}"+h);else if(h==="#rotalarim")location.replace("${yol.rotalarim}")})();`;
  return sayfa({ yan: { ad: "Bu sayfada", ogeler: [["#rota-olustur", "Rotanı oluştur", "Harita ve kategoriler"], ["#hazir-rotalar", "Hazır rotalar", "Altı güzergâh"], ["#yola-cikmadan", "Yola çıkmadan önce", "Ulaşım, ücretler, âdâb"]] }, onBetik, dosya: "index.html", s: "ana", id: "ana", baslik: "Ziyaret Rehberim · İstanbul ziyaret ve gezi rehberi", ozet: `İstanbul’da sahâbe kabirleri, padişah türbeleri, tarihî camiler ve kara surları: altı rota, ${TOPLAM} durak. Haritada seç, rotanı oluştur, yola çık.`, govde });
}

/* ——— Rota oluştur (tam sayfa harita) ——— */
const olusturSayfa = () => sayfa({ dosya: "rota-olustur/index.html", s: "olustur", id: "rota-olustur", baslik: "Rota oluştur", ozet: "Durakları gerçek harita üzerinde seç, konumuna en yakın yürüyüş rotasını kur ve kaydet.", altsiz: true, sinif: "tam",
  govde: `<h1 class="gizli">Rota oluştur</h1><iframe title="Rota oluşturma haritası" data-src="${HARITA}?gomulu=1" allow="geolocation"></iframe>` });

/* ——— Güzergâhlar ——— */
const guzSayfa = () => sayfa({ dosya: "guzergahlar/index.html", s: "guz", id: "guzergahlar", baslik: "Güzergâhlar", ozet: "İstanbul’da altı hazır ziyaret ve gezi rotası: sahâbe kabirleri, padişah türbeleri, tarihî camiler, klasik gezi durakları ve kara surları.",
  govde: `<div class="kap"><header class="sayfa-bas"><span class="goz">${ROTALAR.length} rota · ${TOPLAM} durak</span><h1>Güzergâhlar</h1><p class="ozet">Her rotanın sayfasında geniş bir harita, sırasıyla duraklar ve yürüyüş tarifi var. Dilersen rotayı doğrudan haritada başlat.</p></header>
<section class="bolum" style="padding-top:clamp(20px,3vw,34px)"><div class="rkartlar">${ROTALAR.map(rkart).join("\n")}</div></section>
<section class="bolum"><div class="ipucu" data-g><span class="menu-sim">${ic("ampul")}</span><p><strong>Kendi rotanı mı kurmak istiyorsun?</strong> Durakları karıştırıp konumuna en yakın sırayla dizebilirsin. <a href="${yol.olustur}">Rota oluştur</a> sayfasını aç.</p></div></section></div>` });

/* ——— Rota sayfası ——— */
// Sayfanın sonunda bir önceki ve bir sonraki rotaya geçiş; ilk rotada "önceki", son rotada "sonraki" boş kalır.
const komsu = (r, yon, etiket) => { const k = ROTALAR[ROTALAR.indexOf(r) + yon]; return k ? `<a class="rg ${k.id}${yon > 0 ? " ileri" : ""}" href="${k.yol}"><span class="no">${k.no}</span><span class="rg-y"><small>${etiket}</small><b>${esc(k.name)}</b><i>${esc(k.m.pills.slice(0, 3).join(" · "))}</i></span>${ic("fwd")}</a>` : "<span></span>"; };
function rotaSayfa(r) {
  const m = r.m, n = r.duraklar.length;
  const durak = (d, k) => `<article class="durak" id="durak-${d.n}" data-g style="--i:${k % 2}"><span class="no">${d.n}</span><div class="durak-y"><h3>${esc(d.ad)}${d.hon ? `<em>${esc(d.hon)}</em>` : ""}</h3>
<div class="durak-m">${d.tur ? `<span class="etiket">${esc(d.tur)}</span>` : ""}<span>${esc(d.yer)}</span>${d.yak ? '<span class="etiket yak">Konum yaklaşık</span>' : ""}</div>
<p class="durak-a">${esc(d.acik)}</p>${d.saat ? `<div class="durak-s">${ic("clock")}<span>${esc(d.saat)}</span></div>` : ""}
<div class="dugmeler"><button class="btn kucuk yumusak" type="button" data-goster="${d.n}">${ic("pin")}Haritada göster</button><a class="btn kucuk" href="https://www.google.com/maps/dir/?api=1&amp;destination=${d.lat},${d.lng}&amp;travelmode=walking" target="_blank" rel="noopener">Yol tarifi${ic("ext")}</a></div></div></article>`;
  const govde = `<div class="kap">
<header class="rota-bas"><span class="goz">Rota ${r.no} · ${esc(r.kicker)}</span><h1>${esc(m.h1)}</h1><p class="ozet">${esc(r.lede)}</p>${haplar(r)}
<nav class="atla" aria-label="Bu sayfada"><a href="#nasil">${ic("tram")}Nasıl gidilir?</a><a class="genis" href="#duraklar">${ic("pin")}Duraklar</a><a href="#yuruyus">${ic("walk")}Yürüyüş tarifi</a><a href="${yol.adab}">${ic("kalp")}Ziyaret âdâbı</a></nav></header>
<div class="harita-kart" id="harita-kart"><div class="harita" id="harita" role="application" aria-label="${esc(r.name)} güzergâh haritası"></div>
<div class="h-dugme"><button type="button" data-h="buyut" aria-pressed="false">${ic("buyut")}<span>Büyüt</span></button><button type="button" data-h="uydu" aria-pressed="true">${ic("layers")}<span>Harita</span></button><button type="button" class="kare" data-h="konum" aria-label="Konumumu göster" title="Konumumu göster">${ic("loc")}</button></div>
<div class="h-ipucu" aria-hidden="true">Haritayı kaydırmak için iki parmağını kullan ya da “Büyüt”e dokun</div>
<div class="harita-alt"><span id="h-kaynak">Uydu görüntüsü: Esri, Maxar, Earthstar Geographics</span><span class="sag" id="h-yol">Duraklar sırasıyla numaralı</span></div></div>

<section class="once" id="once" aria-label="Yola çıkmadan">
<div class="ipucu bugun" id="bugun-not" hidden><span class="menu-sim">${ic("clock")}</span><p></p></div>
${m.tip.map((t) => `<div class="ipucu" data-g><span class="menu-sim">${ic("ampul")}</span><p>${t.replace("</strong>", "</strong> ")}</p></div>`).join("")}</section>

<section class="bolum" id="duraklar"><div class="bolum-bas" data-g><span class="kicker">Duraklar</span><h2>${n} durak, sırasıyla</h2></div>
<div class="duraklar">${r.duraklar.map(durak).join("\n")}</div></section>

<section class="bolum bilgi" id="aciklama">
<div class="kart" data-g><h2>Güzergâh hakkında</h2>${m.about.map((p) => `<p>${p}</p>`).join("")}</div>
<div class="kart" id="nasil" data-g><h2>Nasıl gidilir?</h2><div class="uclu"><div class="nasil"><b>${ic("pin")}Başlangıç</b><p>${m.how.start}</p></div><div class="nasil"><b>${ic("walk")}Rota boyunca</b><p>${m.how.along}</p></div><div class="nasil"><b>${ic("tram")}Dönüş</b><p>${m.how.back}</p></div></div>
<p class="ince" style="margin-top:14px">Bulunduğun yerden buraya nasıl gideceğini <a href="${yol.ulasim}#oneri">Ulaşım</a> sayfasındaki harita gösterir.</p></div>
<div class="kart" id="yuruyus" data-g><h2>Duraklar arası yürüyüş</h2><p class="tarif-durum bekle" id="tarif-durum">Sokak sokak yürüyüş yolu hazırlanıyor…</p><div class="tarif" id="tarif"></div>
<p class="ince" style="margin-top:14px">Yürüyüş yolu ve dönüşler OpenStreetMap verisiyle hesaplanır; süreler dakikada 75 metre yürüyüşe göre yaklaşıktır. Sahada tabelalara ve kapalı yollara dikkat et.</p></div>
<div class="dugmeler" data-g><a class="btn altin" href="${yol.olustur}#rota=${r.id}">${ic("rota")}Bu rotayı haritada başlat</a><a class="btn" href="${yol.guz}">Tüm güzergâhlar</a></div>
<nav class="rota-gec" data-g aria-label="Diğer rotalar">${komsu(r, -1, "Önceki rota")}${komsu(r, 1, "Sonraki rota")}</nav>
</section></div>`;
  const yan = { ad: "Bu rotanın durakları", simge: "liste", ogeler: r.duraklar.map((d) => ["#durak-" + d.n, d.ad, d.yer, d.n, d.hon]) };
  return sayfa({ yan, gorsel: `rota-${r.id}.jpg`, dosya: `guzergahlar/${r.slug}/index.html`, s: "guz", id: "rota", sinif: r.id, baslik: m.h1, ozet: r.lede + " " + m.pills.join(", ") + ".", govde, harita: true, yolJs: true,
    veri: { id: r.id, no: r.no, ad: r.name, km: r.km, tasit: r.tasit, ulasim: yol.ulasim, duraklar: r.duraklar.map((d) => ({ n: d.n, ad: d.ad, hon: d.hon, tur: d.tur, lat: d.lat, lng: d.lng })) } });
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
<div class="oneri-h"><div class="harita" id="harita" role="application" aria-label="Ulaşım önerisi haritası"></div><div class="h-dugme"><button type="button" data-h="uydu" aria-pressed="true">${ic("layers")}<span>Harita</span></button></div><div class="harita-alt"><span id="h-kaynak">Uydu görüntüsü: Esri, Maxar, Earthstar Geographics</span><span class="sag">Hat çizgileri şematiktir; duraklar arası düz çizilir</span></div></div>
</div></section>

<section class="bolum" id="nasil"><div class="bolum-bas" data-g><span class="kicker">Rota rota</span><h2>Rotalara nasıl gidilir?</h2></div>
<div class="gidis">${ROTALAR.map((r, i) => `<article class="gidis-k ${r.id}" data-g style="--i:${i % 3}"><header><span class="no">${r.no}</span><h3>${esc(r.name)}</h3></header><dl><div><dt>Başlangıç</dt><dd>${r.m.how.start}</dd></div><div><dt>Rota boyunca</dt><dd>${r.m.how.along}</dd></div><div><dt>Dönüş</dt><dd>${r.m.how.back}</dd></div></dl><a class="btn kucuk yumusak" href="${r.yol}">Rotayı aç${ic("fwd")}</a></article>`).join("\n")}</div>
<div class="ipucu" data-g style="margin-top:18px"><span class="menu-sim">${ic("ampul")}</span><p><strong>En kolay aktarma</strong> ${esc(U.aktarma)}</p></div></section>

<section class="bolum" id="hatlar"><div class="bolum-bas" data-g><span class="kicker">Ayrıntı</span><h2>Hatlar ve önemli duraklar</h2><p>Bir hatta dokun; rehberdeki duraklara yakın istasyonlar açılır.</p></div>
<div class="hatlar" data-g>${U.hatlar.map(hat).join("\n")}</div></section>

<section class="bolum" id="otobus"><div class="ikili">
<div class="kart" data-g><h2>Otobüsler</h2><div class="tablo-sar"><table class="tablo kartla"><thead><tr><th>Hat</th><th>Yön</th><th>Not</th></tr></thead><tbody>${U.otobus.map((o) => `<tr><td>${esc(o[0])}</td><td data-b="Yön">${esc(o[1])}</td><td data-b="Not">${esc(o[2])}</td></tr>`).join("")}</tbody></table></div><p class="ince" style="margin-top:12px">Hat numaraları ve güzergâhlar değişebilir; İETT’nin kendi kanallarından doğrulayın.</p></div>
<div class="kart" data-g><h2>Sefer saatleri</h2><div class="liste">${U.sefer.map((s) => `<div><span>${esc(s[0])}</span><b>${esc(s[1])}</b></div>`).join("")}</div><p class="ince" style="margin-top:12px">${esc(U.seferNot)}</p></div>
</div></section>

<section class="bolum" id="havalimani"><div class="kart" data-g><h2>Havalimanından merkeze</h2><p>${U.hava.metin}</p>
<div class="tablo-sar" style="margin-top:14px"><table class="tablo kartla"><thead><tr><th>Nereden nereye</th><th>Hat</th><th class="sayi">Ücret</th></tr></thead><tbody>${U.hava.tablo.map((o) => `<tr><td>${esc(o[0])}</td><td data-b="Hat">${esc(o[1])}</td><td class="sayi" data-b="Ücret">${esc(o[2])}</td></tr>`).join("")}</tbody></table></div>
<p class="ince" style="margin-top:12px">${esc(U.hava.not)}</p></div></section>
</div>`;
  return sayfa({ yan: { ad: "Bu sayfada", ogeler: [["#oneri", "Buradan nasıl giderim?", "Konumuna göre öneri"], ["#nasil", "Rotalara nasıl gidilir?"], ["#hatlar", "Hatlar ve önemli duraklar"], ["#otobus", "Otobüsler ve sefer saatleri"], ["#havalimani", "Havalimanından merkeze"]] }, dosya: "ulasim/index.html", s: "ulasim", id: "ulasim", baslik: "Ulaşım", ozet: U.ozet + " Konumuna göre hangi hatta, hangi duraktan bineceğini haritada gör.", govde, harita: true,
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
  return sayfa({ yan: { ad: "Bu sayfada", ogeler: [["#kart", "İstanbulkart ve ücretler"], ["#turbeler", "Türbe saatleri"], ["#muzeler", "Müzeler, saraylar ve çarşılar"]] }, dosya: "ucretler-ve-saatler/index.html", s: "ucret", id: "ucretler", baslik: "Ücretler ve Saatler", ozet: C.ozet, govde });
}

/* ——— Ziyaret Âdâbı ——— */
const ADAB_SIM = { niyet: "kalp", su: "damla", ortu: "user", saat: "clock", ayak: "walk", selam: "balon", dua: "spark", sessiz: "sessiz", el: "yasak", mum: "yasak", sira: "kisiler", cami: "cami", hali: "layers", bolum: "tabela", kitap: "kitap", foto: "kamera", mahalle: "ev", cop: "trash", cocuk: "kisiler", yardim: "fincan" };
function adabSayfa() {
  const A = IC.adab; let say = 0;
  const toplam = A.gruplar.reduce((s, x) => s + x.maddeler.length, 0);
  const govde = `<div class="kap">
<header class="sayfa-bas"><span class="goz">${toplam} madde · ${A.gruplar.length} başlık</span><h1>Ziyaret Âdâbı</h1><p class="ozet">${esc(A.ozet)}</p></header>
${A.gruplar.map((gr, gi) => { const bas = say; say += gr.maddeler.length; return `<section class="adab-grup" id="adab-${gi + 1}"><header data-g="sol"><span class="kicker">${String(gi + 1).padStart(2, "0")}</span><h2>${esc(gr.baslik)}</h2><p>${esc(gr.not)}</p></header>
<div class="adab-liste" style="--bas:${bas}">${gr.maddeler.map((m, i) => `<article class="madde" data-g style="--i:${i % 2}"><span class="menu-sim">${ic(ADAB_SIM[m[0]] || "spark")}</span><div><b>${esc(m[1])}</b><p>${esc(m[2])}</p></div></article>`).join("")}</div></section>`; }).join("\n")}
<section class="bolum"><div class="ikili">
<div class="kart" data-g><h2>Kısaltmalar</h2><ul class="kisalt">${A.kisaltmalar.map((k) => `<li><b>${esc(k[0])}</b><span>${esc(k[1])}</span></li>`).join("")}</ul></div>
<div class="kart" data-g style="--i:1" id="hakkinda"><h2>Bu rehber hakkında</h2>${A.hakkinda.map((p) => `<p>${p}</p>`).join("")}<p class="ince" style="margin-top:12px">${esc(A.ince)}</p></div>
</div></section></div>`;
  return sayfa({ yan: { ad: "Bu sayfada", ogeler: [...A.gruplar.map((gr, gi) => ["#adab-" + (gi + 1), gr.baslik, gr.maddeler.length + " madde", String(gi + 1).padStart(2, "0")]), ["#hakkinda", "Bu rehber hakkında"]] }, dosya: "ziyaret-adabi/index.html", s: "adab", id: "adab", baslik: "Ziyaret Âdâbı", ozet: A.ozet, govde });
}

/* ——— Hesabım ve Rotalarım (içerik tarayıcıda, cihazdaki kayıtlardan çizilir) ——— */
const hesapSayfa = () => sayfa({ gizli: true, dosya: "hesabim/index.html", s: "hesap", id: "hesabim", baslik: "Hesabım", ozet: "Giriş yap, kaydettiğin rotaları gör.",
  govde: `<div class="kap"><header class="sayfa-bas dar"><span class="goz">Hesap</span><h1>Hesabım</h1><p class="ozet">Giriş yap; kaydettiğin rotalar burada seni beklesin.</p></header>
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
for (const k of KLASOR) io.sil(k);
const LF = "kaynak/vendor/leaflet/";
const dosyalar = {
  "site.css": oku("site/site.css") + "\n" + ZEMIN_CSS,
  "site.js": `/* Ziyaret Rehberim · sayfa betiği. site/site.js dosyasından üretilir. */\nconst ZR_YER = ${JSON.stringify({ kok: KOK, harita: HARITA, ...yol })};\nconst ZR_IC = ${JSON.stringify(Object.fromEntries(JS_SIMGE.map((k) => [k, ICON[k]])))};\n` + oku("site/site.js"),
  "yol.js": oku("kaynak/yol.js"),
  "hesap.js": oku("kaynak/hesap.js"),
  "leaflet.js": "/* Leaflet 1.9.4 · BSD-2-Clause · (c) Volodymyr Agafonkin */\n" + oku(LF + "leaflet.js").replace(/\/\/# sourceMappingURL=.*$/m, ""),
  "leaflet.css": "/* Leaflet 1.9.4 · BSD-2-Clause · (c) Volodymyr Agafonkin */\n" + oku(LF + "leaflet.css").split("\n").filter((l) => !l.includes("url(")).join("\n"),
};
SURUM = ozet8(Object.values(dosyalar).join("\n"));
for (const [ad, ic2] of Object.entries(dosyalar)) io.yaz("a/" + ad, ic2);
// Yazı tipleri (SIL Open Font License 1.1; lisans metinleri kaynak/vendor/yazi/ içinde). Site ve harita uygulaması aynı iki dosyayı kullanır.
for (const ad of YAZI) io.kopya("kaynak/vendor/yazi/" + ad, "a/" + ad);
/* Yönetim paneli (/yonetim/). Tek başına bir araç sayfasıdır, arama motorlarına kapalıdır; kendi dosyaları site sürüm damgasına katılmaz.
   İçerik güvenlik kuralı sayfanın yalnızca bu siteye ve api.github.com adresine bağlanmasına izin verir (GitHub anahtarı başka yere gidemez).
   'unsafe-eval' gerekir: panel, yayınlarken site/build.js ve kaynak/build.js betiklerini tarayıcıda çalıştırır. */
const YON = { "yonetim.js": `globalThis.ZR_YONETIM = ${JSON.stringify({ depo: DEPO_AD, dallar: DALLAR })};\n` + oku("site/yonetim.js"), "yonetim.css": oku("site/yonetim.css"), "veri-yaz.js": oku("site/veri-yaz.js") };
const YSUR = ozet8(Object.values(YON).join("\n"));
for (const [ad, ic2] of Object.entries(YON)) io.yaz("a/" + ad, ic2);
io.yaz("yonetim/index.html", `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://server.arcgisonline.com https://tile.openstreetmap.org; connect-src 'self' https://api.github.com; base-uri 'none'; form-action 'none'">
<title>Yönetim · Ziyaret Rehberim</title>
<meta name="theme-color" content="#12223F">
<link rel="icon" href="${GORSEL}zr-logo.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Plus+Jakarta+Sans:wght@500..800&display=swap">
<link rel="stylesheet" href="${KOK}a/leaflet.css?v=${SURUM}">
<link rel="stylesheet" href="${KOK}a/yonetim.css?v=${YSUR}">
</head>
<body>
<div id="kok"><noscript><p style="padding:24px">Yönetim paneli için tarayıcıda JavaScript açık olmalı.</p></noscript></div>
<script src="${KOK}a/leaflet.js?v=${SURUM}"></script>
<script src="${KOK}a/veri-yaz.js?v=${YSUR}"></script>
<script src="${KOK}a/yonetim.js?v=${YSUR}"></script>
</body>
</html>
`);
const boy = [anaSayfa(), olusturSayfa(), guzSayfa(), ...ROTALAR.map(rotaSayfa), ulasimSayfa(), ucretSayfa(), adabSayfa(), hesapSayfa(), rotalarimSayfa(), yokSayfa()];
io.yaz("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${HARITA_SAYFALARI.map((u) => `<url><loc>${u}</loc><lastmod>${BUGUN}</lastmod></url>`).join("\n")}\n</urlset>\n`);
io.yaz("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${TAM}${KOK}sitemap.xml\n`);
return `${boy.length} sayfa, ${Math.round(boy.reduce((a, b) => a + b, 0) / 1024)} KB · sürüm ${SURUM} · taşıt geçişleri ${ROTALAR.map((r) => r.id + ":" + r.tasit.length).join(" ")}`;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ZR_DERLE_SITE;
  if (require.main === module) console.log("ok", ZR_DERLE_SITE(require("./io.js")));
}
