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
const KLASOR = ["a", "rota-olustur", "guzergahlar", "ulasim", "ucretler-ve-saatler", "ziyaret-adabi", "hesabim", "rotalarim", "yonetim", "gizlilik", "erisilebilirlik"];
// Yönetim panelinin (/yonetim/) değişiklikleri kaydettiği depo ve dallar. Panel ikisini birlikte aynı kayda taşır.
const DEPO_AD = "yunuskecik782-lang/ziyaret-rehberim-harita", DALLAR = ["main", "gh-pages"];
const BUGUN = new Date().toISOString().slice(0, 10);
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const IST = new Date(Date.now() + 3 * 3600000), GUNCEL_ISO = IST.toISOString().slice(0, 10), GUNCEL = `${IST.getUTCDate()} ${AYLAR[IST.getUTCMonth()]} ${IST.getUTCFullYear()}`;

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
ICON.ara = '<circle cx="10.7" cy="10.7" r="6.2"/><path d="M15.3 15.3L20 20"/>';
ICON.kilit = '<rect x="5.5" y="10.5" width="13" height="9.5" rx="1.6"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/><path d="M12 14.3v2"/>';
ICON.erisim = '<circle cx="12" cy="4.8" r="1.8"/><path d="M5 8.6l7 1.4 7-1.4M12 10v4.6M12 14.6l-3.4 6M12 14.6l3.4 6"/>';
ICON.menu = '<path d="M4 6.5h16M4 12h16M4 17.5h10"/>';
ICON.filtre = '<path d="M4 6.5h16M7 12h10M10 17.5h4"/>';
ICON.once = '<path d="M14.5 6l-6 6 6 6"/>';
ICON.liste ='<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r=".9"/><circle cx="4.8" cy="12" r=".9"/><circle cx="4.8" cy="17.5" r=".9"/>';
/* Sol sütunun simgeleri: iki tonlu çizim (24×24). "t" parçaları rengin açık tonuyla dolar, gerisi 1,6 kalınlıkta çizgidir.
   Kategoriler gerçek yapıların sade çizimidir: sarıklı mezar taşı ve servi (sahâbe), kubbeli türbe (padişah), kubbe ve iki minare (cami),
   Galata Kulesi (tarihî mekân), iki burç ve kapı (sur), pusula (hepsi). Bu sözlükte olmayan ad için düz simge kullanılır. */
const ICON2 = {
  sahabe: '<path class="t" d="M8.2 20.5v-8.6h5.6v8.6z"/><path class="t" d="M17.6 19.9c-1.6 0-2.2-2.1-2.2-5.1 0-3.2 1-6.3 2.2-8 1.2 1.7 2.2 4.8 2.2 8 0 3-.6 5.1-2.2 5.1z"/><path d="M8.2 20.5v-8.6h5.6v8.6"/><path d="M7.6 11.9h6.8"/><path d="M8.3 11.9c-.5-2.4.9-4.3 2.7-4.3s3.2 1.9 2.7 4.3"/><path d="M11 7.6V6"/><path d="M9.6 15h2.8M9.6 17.4h2.8"/><path d="M17.6 19.9c-1.6 0-2.2-2.1-2.2-5.1 0-3.2 1-6.3 2.2-8 1.2 1.7 2.2 4.8 2.2 8 0 3-.6 5.1-2.2 5.1z"/><path d="M17.6 19.9v.6"/><path d="M3.5 20.5h17"/>',
  padisah: '<path class="t" d="M6.5 20.5V11h11v9.5z"/><path class="t" d="M7.4 11a4.6 4.6 0 0 1 9.2 0z"/><path d="M6.5 20.5V11h11v9.5"/><path d="M5.8 11h12.4"/><path d="M7.4 11a4.6 4.6 0 0 1 9.2 0"/><path d="M12 6.4V4.2"/><path d="M11.3 4.2h1.4"/><path d="M10.4 20.5v-3a1.6 1.6 0 0 1 3.2 0v3"/><path d="M8.6 13.8v2.2M15.4 13.8v2.2"/><path d="M3.8 20.5h16.4"/>',
  cami: '<path class="t" d="M6.6 20.5V15h10.8v5.5z"/><path class="t" d="M7.6 15a4.4 4.4 0 0 1 8.8 0z"/><path d="M6.6 20.5V15h10.8v5.5"/><path d="M7.6 15a4.4 4.4 0 0 1 8.8 0"/><path d="M12 10.6V9"/><path d="M3.6 20.5V9.8l.9-2.6.9 2.6v10.7"/><path d="M18.6 20.5V9.8l.9-2.6.9 2.6v10.7"/><path d="M3.2 12.4h2.6M18.2 12.4h2.6"/><path d="M10.7 20.5v-2.1a1.3 1.3 0 0 1 2.6 0v2.1"/><path d="M2.6 20.5h18.8"/>',
  mekan: '<path class="t" d="M8.8 20.5v-9.6h6.4v9.6z"/><path class="t" d="M8.4 8.6 12 3.4l3.6 5.2z"/><path d="M8.4 8.6 12 3.4l3.6 5.2z"/><path d="M7.6 8.6h8.8v2.3H7.6z"/><path d="M8.8 10.9v9.6M15.2 10.9v9.6"/><path d="M11 13.6h2M11 16.2h2"/><path d="M10.8 20.5v-1.6a1.2 1.2 0 0 1 2.4 0v1.6"/><path d="M5 20.5h14"/>',
  sur: '<path class="t" d="M3.6 20.5V8.4h4.6v12.1zM15.8 20.5V8.4h4.6v12.1z"/><path class="t" d="M8.2 20.5v-7.6h7.6v7.6z"/><path d="M3.6 20.5V6.6h1.2v1.3h1.1V6.6h1.1v1.3h1.2V6.6h0v13.9"/><path d="M15.8 20.5V6.6h1.2v1.3h1.1V6.6h1.1v1.3h1.2V6.6v13.9"/><path d="M8.2 12.9h1.1v-1.2h1.3v1.2h1.4v-1.2h1.3v1.2h1.3v-1.2h1.2v1.2"/><path d="M10.4 20.5v-3a1.6 1.6 0 0 1 3.2 0v3"/><path d="M2.6 20.5h18.8"/>',
  hepsi: '<circle class="t" cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="8.6"/><path class="k" d="M12 4.9l1.7 5.4L12 12l-1.7-1.7z"/><path d="M12 4.9l1.7 5.4L12 19.1l-1.7-8.8z"/><path d="M4.9 12l5.4-1.7L19.1 12l-8.8 1.7z"/>',
  tram: '<rect class="t" x="5.5" y="5" width="13" height="12" rx="2.4"/><rect x="5.5" y="5" width="13" height="12" rx="2.4"/><path d="M5.5 11h13"/><path d="M9 17l-1.6 3M15 17l1.6 3"/><path d="M9.2 14h.01M14.8 14h.01"/><path d="M10 2.8h4M12 2.8V5"/>',
  clock: '<circle class="t" cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.1 2"/>',
  kalp: '<path class="t" d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  mark: '<path class="t" d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-4-6 4V5.5a1 1 0 0 1 1-1z"/><path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-4-6 4V5.5a1 1 0 0 1 1-1z"/>',
  menu: '<path d="M4.5 7h15M4.5 12h15M4.5 17h9"/>',
  filtre: '<path class="t" d="M4 5.5h16l-6.2 7.2v5.6l-3.6 1.9v-7.5z"/><path d="M4 5.5h16l-6.2 7.2v5.6l-3.6 1.9v-7.5z"/>',
  pin: '<path class="t" d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 1 1 13 0c0 5.4-6.5 11-6.5 11z"/><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 1 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  liste: '<rect class="t" x="4" y="4.5" width="16" height="15" rx="2.4"/><rect x="4" y="4.5" width="16" height="15" rx="2.4"/><path d="M8 9h8M8 12h8M8 15h5"/>',
  bilgi: '<circle class="t" cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="8.6"/><path d="M12 11v5M12 7.9v.01"/>',
  ampul: '<path class="t" d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.3 1 2.2h5.2c0-.9.4-1.7 1-2.2A6 6 0 0 0 12 3z"/><path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.3 1 2.2h5.2c0-.9.4-1.7 1-2.2A6 6 0 0 0 12 3z"/>',
  kilit: '<rect class="t" x="5.5" y="10.5" width="13" height="9.5" rx="1.6"/><rect x="5.5" y="10.5" width="13" height="9.5" rx="1.6"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/><path d="M12 14.3v2"/>',
};
const ic2 = (n) => (ICON2[n] ? `<svg class="ic iki" viewBox="0 0 24 24" aria-hidden="true">${ICON2[n]}</svg>` : ic(n));

/* ——— Kategori simgeleri (64×64, dolu, tek renk) ———
   Ana sayfadaki kutular ve sol sütun aynı altı simgeyi kullanır. Her biri gerçek bir yapıdan sadeleştirilmiş çizimdir (fotoğraf değil):
   kavuklu Osmanlı mezar taşı ve servi (sahâbe), revaklı sekizgen türbe, Kanuni Türbesi gibi (padişah), merkezî kubbe, yarım kubbeler ve
   dört minare, Süleymaniye gibi (cami), Galata Kulesi ve çevresindeki evler (tarihî mekân), tuğla hatıllı kara surları ve kapı (suriçi), pusula gülü (hepsi).
   Tonlar site.css içindeki sınıflardan gelir: a koyu gri (ana yapı), a2 orta koyu, b açık gri (arkadaki yapılar), b2 orta gri, c soluk daire (üzerine gelince büyür),
   d açık (pencere, kapı), d2 gölgeli açıklık, e ve e2 ince açık çizgi (kubbe dilimi, sarık kıvrımı, tuğla hatıl), e3 ince gri çizgi, f zemin çizgisi,
   g pirinç (alem), h ve h2 pusula halkaları. Simgeler site/build.js içinde düz yazı olarak durur; çizim yardımcıları burada yoktur. */
const RESIM = {
  sahabe: '<circle class="c" cx="32" cy="30" r="22"/><path fill="#0F2A4F" d="M47 12C44 18 41 28 41 38C41 46 42 51 45 54V56H49V54C52 51 53 46 53 38C53 28 50 18 47 12Z"/><path fill="#1E4A7A" d="M47 17C44 27 43 33 43 39Q43 48 47 52Z"/><path fill="#C9D6E6" d="M46 24C44 31 43.5 37 44 42Q44.3 46 45.5 49Q44.5 39 46 24Z"/><path fill="#0F2A4F" d="M8 56V37Q8 34 11 33V30H17V33Q20 34 20 37V56Z"/><path fill="#C9D6E6" d="M12 31H15V34H12ZM12 35H16L18 56H10Z"/><path fill="#1E4A7A" d="M14 37H18V56H14Z"/><circle cx="14" cy="21" r=".8" fill="#B8954F"/><path fill="#0F2A4F" d="M11 25V23Q11 22 12 22Q12 21 14 22Q16 21 16 22Q17 22 17 23V25ZM8 27Q8 24 14 24Q20 24 20 27V29Q20 33 14 33Q8 33 8 29Z"/><path fill="#C9D6E6" d="M10 27Q10 26 14 26Q18 26 18 27V29Q18 31 14 31Q10 31 10 29Z"/><path fill="#E6EDF5" d="M10 28Q13 25 17 26L18 28Q14 28 11 31Q10 30 10 28Z"/><path fill="#1E4A7A" d="M14 31Q16 28 18 28V29Q18 31 14 31Z"/><path fill="#0F2A4F" d="M21 27H30V34H21ZM18 32H33L34 56H17Z"/><path fill="#E6EDF5" d="M23 29H27V32H23Z"/><path fill="#C9D6E6" d="M21 34H29L31 56H18Z"/><path fill="#1E4A7A" d="M29 34H30L33 56H31Z"/><path fill="#0F2A4F" d="M20 35H31V54H20Z"/><path fill="#E6EDF5" d="M22 37H29V52H22Z"/><path fill="#B8954F" d="M24.5 7H26.5V11H24.5Z"/><circle cx="25.5" cy="6.5" r="1.5" fill="#B8954F"/><path fill="#0F2A4F" d="M19 16V13Q19 10 22 10Q22 8 25.5 9Q29 8 29 10Q32 10 32 13V16Z"/><path fill="#C9D6E6" d="M21 13Q21 11 23 11L24 10V15H21ZM26 10Q28 10 28 12Q30 11 30 14V15H26Z"/><path fill="#0F2A4F" d="M15 19C15 14 19 12 25.5 12C32 12 36 14 36 19V23C36 28 32 30 25.5 30C19 30 15 28 15 23Z"/><path fill="#C9D6E6" d="M17 19C17 15 20 14 25.5 14C31 14 34 15 34 19V23C34 26 31 28 25.5 28C20 28 17 26 17 23Z"/><path fill="#E6EDF5" d="M17 18Q20 14 25 14H27Q22 18 17 22ZM18 25Q24 19 33.5 16Q34 17 34 19Q26 22 22 27Q20 27 18 25Z"/><path fill="#1E4A7A" d="M25 28Q29 24 34 22V24Q33 27 29 28Z"/><path fill="#0F2A4F" d="M8 56H56V58H8Z"/>',
  padisah: '<circle class="c" cx="32" cy="32" r="22"/><path fill="#B8954F" d="M31 7H33V12H31Z"/><circle cx="32" cy="6.5" r="1.5" fill="#B8954F"/><path fill="#0F2A4F" d="M16 29C16 19 23 9 32 9C41 9 48 19 48 29Z"/><path fill="#C9D6E6" d="M18 27C19 18 25 11 32 11Q26 19 26 27Z"/><path fill="#E6EDF5" d="M26 27Q27 18 32 11V27Z"/><path fill="#1E4A7A" d="M32 11C40 12 45 19 46 27H32Z"/><path fill="#0F2A4F" d="M17 27H47V34H17ZM11 36L19 31H45L53 36V54L45 58H19L11 54Z"/><path fill="#C9D6E6" d="M19 29H32V32H19ZM13 37L19 34V55L13 52Z"/><path fill="#1E4A7A" d="M32 29H45V32H32ZM45 34L51 37V52L45 55Z"/><path fill="#E6EDF5" d="M19 34H45V55H19Z"/><path fill="#C9D6E6" d="M11 38L14 37V54L11 52Z"/><path fill="#1E4A7A" d="M50 37L53 38V52L50 54Z"/><path fill="#E6EDF5" d="M14 37H50V55H14Z"/><path fill="#0F2A4F" d="M8 35L16 32H48L56 35V38H8Z"/><path fill="#C9D6E6" d="M16 34H47L51 36H12Z"/><path fill="#0F2A4F" d="M17 55V46Q17 42 20.5 39Q24 42 24 46V55ZM27 55V46Q27 40 32 37Q37 40 37 46V55ZM40 55V46Q40 42 43.5 39Q47 42 47 46V55Z"/><path fill="#1E4A7A" d="M19 55V47Q19 45 21 43Q22 45 22 47V55ZM42 55V47Q42 45 44 43Q45 45 45 47V55ZM30 55V46Q30 44 32 42Q34 44 34 46V55Z"/><path fill="#E6EDF5" d="M14 46H17V55H14ZM24 46H27V55H24Z"/><path fill="#0F2A4F" d="M11 54L19 56H45L53 54L56 58H8Z"/>',
  cami: '<circle class="c" cx="32" cy="31" r="22"/><path fill="#B8954F" d="M9.4 14.5H11.4V17H9.4ZM52.6 14.5H54.6V17H52.6Z"/><circle cx="10.4" cy="14.5" r="1" fill="#B8954F"/><circle cx="53.6" cy="14.5" r="1" fill="#B8954F"/><path fill="#0F2A4F" d="M9.1 56V25L10.4 16L11.7 25V56ZM52.3 56V25L53.6 16L54.9 25V56Z"/><path fill="#C9D6E6" d="M9.1 25L10.4 16V25ZM52.3 25L53.6 16V25Z"/><path fill="#1E4A7A" d="M10.4 16L11.7 25H10.4ZM53.6 16L54.9 25H53.6Z"/><path fill="#C9D6E6" d="M9.1 25H10.5V56H9.1ZM52.3 25H53.7V56H52.3Z"/><path fill="#1E4A7A" d="M10.5 25H11.7V56H10.5ZM53.7 25H54.9V56H53.7Z"/><path fill="#0F2A4F" d="M8 31H12.8V32H8ZM8 42H12.8V43H8ZM51.2 31H56V32H51.2ZM51.2 42H56V43H51.2Z"/><path fill="#0F2A4F" d="M13 44Q13 33 25 31H28V45ZM36 45V31H39Q51 33 51 44Z"/><path fill="#C9D6E6" d="M15 42Q16 35 25 33V42Z"/><path fill="#1E4A7A" d="M39 33Q48 35 49 42H39Z"/><path fill="#0F2A4F" d="M11 49Q11 44 16 44Q21 44 21 49ZM43 49Q43 44 48 44Q53 44 53 49Z"/><path fill="#C9D6E6" d="M12 48Q13 45 16 45Q19 45 20 48Z"/><path fill="#1E4A7A" d="M44 48Q45 45 48 45Q51 45 52 48Z"/><path fill="#B8954F" d="M31 10H33V16H31Z"/><circle cx="32" cy="10" r="1.5" fill="#B8954F"/><path fill="#0F2A4F" d="M18 35C18 24 24 14 32 14C40 14 46 24 46 35V41H18Z"/><path fill="#C9D6E6" d="M20 33C21 24 26 16 32 16Q27 24 27 33Z"/><path fill="#E6EDF5" d="M27 33Q28 23 32 16V33Z"/><path fill="#1E4A7A" d="M32 16C39 17 43 25 44 33H32Z"/><path fill="#C9D6E6" d="M23 39V37Q23 35 24.5 35Q26 35 26 37V39ZM30.5 39V37Q30.5 35 32 35Q33.5 35 33.5 37V39ZM38 39V37Q38 35 39.5 35Q41 35 41 37V39Z"/><path fill="#0F2A4F" d="M12 49H21V41H43V49H52V56H12Z"/><path fill="#C9D6E6" d="M14 51H21V56H14ZM23 43H39V56H23Z"/><path fill="#1E4A7A" d="M39 43H41V56H39ZM43 51H50V56H43Z"/><path fill="#0F2A4F" d="M27 56V48Q27 44 32 42Q37 44 37 48V56Z"/><path fill="#1E4A7A" d="M29 56V49Q29 47 32 45Q35 47 35 49V56Z"/><path fill="#B8954F" d="M16.3 6H18.3V9H16.3ZM45.7 6H47.7V9H45.7Z"/><circle cx="17.3" cy="6" r="1" fill="#B8954F"/><circle cx="46.7" cy="6" r="1" fill="#B8954F"/><path fill="#0F2A4F" d="M16 56V18L17.3 8L18.6 18V56ZM45.4 56V18L46.7 8L48 18V56Z"/><path fill="#C9D6E6" d="M16 18L17.3 8V18ZM45.4 18L46.7 8V18Z"/><path fill="#1E4A7A" d="M17.3 8L18.6 18H17.3ZM46.7 8L48 18H46.7Z"/><path fill="#C9D6E6" d="M16 18H17.4V56H16ZM45.4 18H46.8V56H45.4Z"/><path fill="#1E4A7A" d="M17.4 18H18.6V56H17.4ZM46.8 18H48V56H46.8Z"/><path fill="#0F2A4F" d="M14.9 23H19.7V24H14.9ZM14.9 34H19.7V35H14.9ZM14.9 45H19.7V46H14.9ZM44.3 23H49.1V24H44.3ZM44.3 34H49.1V35H44.3ZM44.3 45H49.1V46H44.3ZM8 56H56V58H8Z"/>',
  mekan: '<defs><linearGradient id="mekan-govde" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#E6EDF5"/><stop offset=".45" stop-color="#C9D6E6"/><stop offset="1" stop-color="#1E4A7A"/></linearGradient></defs><circle class="c" cx="32" cy="31" r="22"/><path fill="#B8954F" d="M31.5 4H32.5V7H31.5Z"/><circle cx="32" cy="4" r="1" fill="#B8954F"/><path fill="#0F2A4F" d="M18 26L32 4L46 26Q32 29 18 26Z"/><path fill="#C9D6E6" d="M20.5 25L32 7V26.5Q25 26.5 20.5 25Z"/><path fill="#1E4A7A" d="M32 7L43.5 25Q39 26.5 32 26.5Z"/><path fill="#0F2A4F" d="M18 27H46V55Q32 59 18 55Z"/><path fill="url(#mekan-govde)" d="M20 28H44V54Q32 58 20 54Z"/><path fill="#E6EDF5" d="M20 28H32V36H20Z"/><path fill="#C9D6E6" d="M32 28H44V36H32Z"/><path fill="#0F2A4F" d="M22 35V32Q22 30 24 29Q26 30 26 32V35ZM30 35V32Q30 30 32 29Q34 30 34 32V35ZM38 35V32Q38 30 40 29Q42 30 42 32V35ZM15 26H49V28H15Z"/><path fill="#1E4A7A" d="M18 37H23L21 41H19ZM41 37H46L45 41H43Z"/><path fill="#0F2A4F" d="M13 34H51V37Q32 41 13 37Z"/><path fill="#C9D6E6" d="M15 34H49V36Q32 39 15 36Z"/><path fill="#0F2A4F" d="M25 49V45Q25 43 27 42Q29 43 29 45V49ZM35 49V45Q35 43 37 42Q39 43 39 45V49Z"/><path fill="#0F2A4F" d="M18 54Q32 57 46 54L49 58H15Z"/><path fill="#C9D6E6" d="M19 54H43L45 56H18Z"/>',
  sur: '<circle class="c" cx="32" cy="32" r="22"/><path fill="#0F2A4F" d="M20 58V24H23V20H27V24H30V20H34V24H37V20H41V24H44V58Z"/><path fill="#C9D6E6" d="M21 26H43V56H21Z"/><path fill="#E6EDF5" d="M23 26H41V34H23Z"/><path fill="#1E4A7A" d="M21 26H43V28H21ZM21 37H43V39H21ZM21 48H43V50H21Z"/><path fill="#0F2A4F" d="M8 58V7H11V12H13V7H16V12H18V7H21V56H22V58ZM42 58V7H45V12H47V7H50V12H52V7L56 10V54L52 58Z"/><path fill="#C9D6E6" d="M10 14H19V56H10ZM44 14H51V56H44Z"/><path fill="#E6EDF5" d="M10 14H16V56H10ZM44 14H47V56H44Z"/><path fill="#1E4A7A" d="M51 14L54 16V54L51 56ZM10 26H19V28H10ZM10 37H19V39H10ZM10 48H19V50H10ZM44 26H54V28H44ZM44 37H54V39H44ZM44 48H54V50H44Z"/><path fill="#0F2A4F" d="M12 23V20Q12 18.5 14 17Q16 18.5 16 20V23ZM45.5 23V20Q45.5 18.5 47.5 17Q49.5 18.5 49.5 20V23ZM23 58V45Q23 37 32 32Q41 37 41 45V58Z"/><path fill="#E6EDF5" d="M25 58V45Q25 38.5 32 34Q39 38.5 39 45V58Z"/><path fill="#0F2A4F" d="M28 58V45Q28 40.5 32 37Q36 40.5 36 45V58Z"/><path fill="#B8954F" d="M28 56V45Q28 41 31 38.5V56ZM33 38.5Q36 41 36 45V56H33Z"/>',
  hepsi: '<circle class="c" cx="32" cy="32" r="24"/><path fill="#1E4A7A" d="M43 21L38 31L32 32L33 26ZM43 43L33 38L32 32L38 33ZM21 43L26 33L32 32L31 38ZM21 21L31 26L32 32L26 31Z"/><path fill="#C9D6E6" d="M31 6H32V32L26 28ZM32 32L36 26L58 32ZM32 32V58L26 36ZM6 32L28 26L32 32Z"/><path fill="#0F2A4F" d="M32 6H33L38 28L32 32ZM6 32H32L28 38Z"/><path fill="#1E4A7A" d="M32 32H58L36 38ZM32 32L38 36L32 58Z"/><circle cx="32" cy="32" r="5.5" fill="#B8954F"/><circle cx="32" cy="32" r="3.5" fill="#E6EDF5"/><circle cx="32" cy="32" r="1.25" fill="#0F2A4F"/>',
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
const yol = { ana: KOK, olustur: KOK + "rota-olustur/", guz: KOK + "guzergahlar/", ulasim: KOK + "ulasim/", ucret: KOK + "ucretler-ve-saatler/", adab: KOK + "ziyaret-adabi/", hesap: KOK + "hesabim/", rotalarim: KOK + "rotalarim/", gizlilik: KOK + "gizlilik/", erisim: KOK + "erisilebilirlik/" };

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
const Z_STIL = (dolgu) => `<style>*{fill:none;stroke:rgba(96,116,146,.42);stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round}.y{fill:rgba(96,116,146,${dolgu})}.i{stroke-width:.8}</style>`;
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
function ust(s, rid) {
  return `<header class="ust"><div class="ust-ic">${marka}
<nav class="gezin" aria-label="Ana menü"><a href="${yol.ana}"${cur(s, "ana")}>Ana Sayfa</a>
<div class="acilir${s === "guz" ? " secili" : ""}"><button type="button" aria-haspopup="true" aria-expanded="false">Güzergâhlar${ic("down")}</button><div class="acilir-kutu">
<div class="guz-bas"><span><b>Hazır güzergâhlar</b><small>${ROTALAR.length} rota · ${TOPLAM} durak · yürüyerek</small></span><a href="${yol.guz}">Hepsini gör${ic("fwd")}</a></div>
<div class="guz-izgara">${ROTALAR.map((r, ri) => `<a class="guz-k ${r.id}" href="${r.yol}" style="--i:${ri}"><span class="guz-no"><b>${r.no}</b></span><span class="guz-y"><small>${esc(r.kicker)}</small><b>${esc(r.name)}</b><em>${r.duraklar.length} durak · ${r.km} · ${r.sure.replace("≈ ", "")}</em></span></a>`).join("")}</div>
<a class="guz-alt" href="${yol.olustur}">${ic("rota")}<span><b>Kendi rotanı oluştur</b><small>Durakları seç, konumuna göre sırala</small></span>${ic("fwd")}</a></div></div>
<a href="${yol.ulasim}"${cur(s, "ulasim")}>Ulaşım</a><a href="${yol.ucret}"${cur(s, "ucret")}>Ücretler ve Saatler</a><a href="${yol.adab}"${cur(s, "adab")}>Ziyaret Âdâbı</a></nav>
<button class="ara-ac" type="button" aria-haspopup="dialog" aria-controls="ara" title="Sitede ara (kısayol: /)">${ic("ara")}<span>Ara</span></button>
<a class="giris" href="${yol.hesap}">${ic("user")}<span data-hesap-ad="Giriş yap">Giriş yap</span></a>
<button class="menu-btn" type="button" aria-label="Menü" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
</div></header>
<div class="menu" id="menu" inert><div class="menu-zemin"></div><nav class="menu-ic" aria-label="Menü">
${MENU.slice(0, 2).map((m, i) => `<a class="m" style="--i:${i}" href="${m[1]}"${cur(s, m[0])}>${m[2]}</a>`).join("")}
<details class="m-grup${s === "guz" ? " secili" : ""}" style="--i:2"><summary>Güzergâhlar${ic("down")}</summary><div class="m-alt">
${ROTALAR.map((r) => `<a href="${r.yol}"${r.id === rid ? ' aria-current="page"' : ""}><span class="m-no">${r.no}</span>${esc(r.name)}</a>`).join("")}<a href="${yol.guz}"${s === "guz" && !rid ? ' aria-current="page"' : ""}>Tüm güzergâhlar</a></div></details>
<p class="menu-k" style="--i:3">Bilgi</p>
${MENU.slice(3).map((m, i) => `<a class="m" style="--i:${4 + i}" href="${m[1]}"${cur(s, m[0])}>${m[2]}</a>`).join("")}
<p class="menu-k" style="--i:7">Hesap</p>
<a class="m" style="--i:8" href="${yol.rotalarim}"${cur(s, "rotalarim")}>Rotalarım</a>
<a class="m" style="--i:9" href="${yol.hesap}"${cur(s, "hesap")}><span data-hesap-ad="Giriş yap ya da hesap oluştur">Giriş yap ya da hesap oluştur</span></a>
</nav></div>`;
}
/* ——— Geniş ekranda sol sütun: açılır listeler (bu sayfanın bölümleri, filtreler, güzergâhlar, pratik bilgi) ve kısa bilgi metni.
   1480 pikselden geniş ekranda sabit durur, daha dar masaüstünde "Menü" düğmesiyle açılır; telefonda yoktur (orada tam ekran menü var). ——— */
/* "Menü" düğmesi üst şeritte değil, sütunun en başındadır. Sütun kapalıyken solda ince bir şerit kalır: en üstte menüyü açan düğme,
   altında gruplara giden kısayollar. Telefonda ikisi de yoktur (orada üstteki düğmeyle açılan tam ekran menü var). */
const yanGrup = (id, ad, simge, icerik, acik, sinif) => `<details class="yan-grup${sinif ? " " + sinif : ""}" id="${id}"${acik ? " open" : ""}><summary>${ic2(simge)}<span>${ad}</span>${ic("down")}</summary><div class="yan-ic">${icerik}</div></details>`;
function yanCubuk(s, bu, rid) {
  const filtre = KAT.map((k) => `<a class="${k[1]}" href="${yol.olustur}#kategori=${k[0]}" data-hash="kategori=${k[0]}"><span class="yan-sim">${ic2(k[2])}</span><span>${k[3]}</span><em>${k[4]}</em></a>`).join("");
  const rotalar = ROTALAR.map((r) => `<a class="${r.id}" href="${r.yol}"${r.id === rid ? ' aria-current="page"' : ""}><span class="sira altin">${r.no}</span><span>${esc(r.name)}<small>${r.duraklar.length} durak · ${r.sure}</small></span></a>`).join("")
    + `<a href="${yol.guz}"${s === "guz" && !rid ? ' aria-current="page"' : ""}><span class="sira sade">${ic("fwd")}</span><span>Tüm güzergâhlar</span></a>`;
  const bilgi = [...MENU.slice(3), ["rotalarim", yol.rotalarim, "Rotalarım", "mark", "Kaydettiğin rotalar"]].map((m) => `<a href="${m[1]}"${cur(s, m[0])}><span class="yan-sim">${ic2(m[3])}</span><span>${m[2]}<small>${m[4]}</small></span></a>`).join("");
  const buSayfa = bu ? yanGrup("yg-bu", bu.ad, bu.simge || "liste", bu.ogeler.map((o) => `<a href="${o[0]}">${o[3] ? `<span class="sira">${o[3]}</span>` : '<span class="yan-nokta"></span>'}<span>${esc(o[1])}${o[4] ? ` <i>${esc(o[4])}</i>` : ""}${o[2] ? `<small>${esc(o[2])}</small>` : ""}</span></a>`).join(""), false, rid) : "";
  const kisa = [...(bu && s !== "ana" ? [["yg-bu", bu.ad, bu.simge || "liste"]] : []), ["yg-filtre", "Ne görmek istersin?", "filtre"], ["yg-guz", "Güzergâhlar", "pin"], ...(bu && s === "ana" ? [["yg-bu", bu.ad, bu.simge || "liste"]] : []), ["yg-bilgi", "Pratik bilgi", "bilgi"]];
  return `<nav class="yan-ray" aria-label="Menü kısayolları"><button class="yan-ac" type="button" aria-controls="yan" aria-expanded="false" title="Menüyü aç">${ic("menu")}<span class="gizli">Menüyü aç</span></button><span class="yan-ray-c"></span>
${kisa.map((k) => `<button type="button" data-grup="${k[0]}" aria-controls="yan" title="${esc(k[1])}">${ic2(k[2])}<span class="gizli">${esc(k[1])}</span></button>`).join("")}</nav>
<aside class="yan" id="yan" aria-label="Menü"><div class="yan-kay">
<div class="yan-bas"><button class="yan-kapa" type="button" aria-controls="yan" aria-expanded="true" title="Menüyü kapat">${ic("menu")}<span>Menü</span>${ic("once")}</button></div>
${s === "ana" ? "" : buSayfa}
${yanGrup("yg-filtre", "Ne görmek istersin?", "filtre", filtre, true)}
${yanGrup("yg-guz", "Güzergâhlar", "pin", rotalar, false)}
${s === "ana" ? buSayfa : ""}
${yanGrup("yg-bilgi", "Pratik bilgi", "bilgi", bilgi, false)}
<p class="yan-ince">Konumun yalnızca iznin olursa kullanılır ve hiçbir yere kaydedilmez.</p>
</div></aside><div class="yan-perde"></div>`;
}
const sekme = (s) => `<nav class="sekme" aria-label="Alt menü">${[["ana", yol.ana, "Ana sayfa", "ev"], ["olustur", yol.olustur, "Rota oluştur", "rota"], ["rotalarim", yol.rotalarim, "Rotalarım", "mark"], ["hesap", yol.hesap, "Hesabım", "user"]].map((m) => `<a href="${m[1]}"${cur(s, m[0])}>${ic(m[3])}<b>${m[2]}</b></a>`).join("")}</nav>`;
/* Alt bilgi (kurumsal sitelerdeki gibi): marka ve kısa tanım, üç sütun bağlantı, en altta kaynaklar ve son güncelleme tarihi. */
const alt = `<footer class="alt"><div class="kap alt-ic">
<div class="alt-marka">${marka}<p>İstanbul’da sahâbe kabirleri, padişah türbeleri, tarihî camiler ve kara surları için ziyaret ve gezi rehberi: ${ROTALAR.length} güzergâh, ${TOPLAM} durak.</p><p class="alt-tarih">Son güncelleme: <time datetime="${GUNCEL_ISO}">${GUNCEL}</time></p></div>
<nav class="alt-sutun" aria-labelledby="alt-g"><h2 id="alt-g">Güzergâhlar</h2>${ROTALAR.map((r) => `<a href="${r.yol}">${esc(r.name)}</a>`).join("")}</nav>
<nav class="alt-sutun" aria-labelledby="alt-p"><h2 id="alt-p">Pratik bilgi</h2><a href="${yol.olustur}">Rota oluştur</a><a href="${yol.ulasim}">Ulaşım</a><a href="${yol.ucret}">Ücretler ve Saatler</a><a href="${yol.adab}">Ziyaret Âdâbı</a></nav>
<nav class="alt-sutun" aria-labelledby="alt-s"><h2 id="alt-s">Site</h2><a href="${yol.rotalarim}">Rotalarım</a><a href="${yol.hesap}">Hesabım</a><a href="${yol.gizlilik}">Gizlilik ve kişisel veriler</a><a href="${yol.erisim}">Erişilebilirlik</a></nav>
</div><div class="alt-taban"><div class="kap"><p>Haritalar © <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a> katkıda bulunanlar · Uydu görüntüsü: Esri · Yürüyüş yolu: OpenStreetMap yol tarifi (FOSSGIS)</p><p>Saatler, ücretler ve sefer bilgileri değişebilir; yola çıkmadan önce doğrulayın.</p></div></div></footer>`;
/* Site içi arama penceresi (site.js açar). Dizin a/ara.json dosyasındadır; aşağıda ARA_S sayfa ve bölüm adlarını toplar. */
const ARA_KUTU = `<dialog class="ara" id="ara" aria-labelledby="ara-b"><div class="ara-ic"><form class="ara-ust" role="search"><h2 class="gizli" id="ara-b">Sitede ara</h2>${ic("ara")}<label class="gizli" for="ara-q">Durak, rota ya da sayfa ara</label><input id="ara-q" type="search" autocomplete="off" spellcheck="false" enterkeyhint="go" placeholder="Durak, cami, türbe ya da semt ara"><button class="ara-kapa" type="button" aria-label="Aramayı kapat">${ic("x")}</button></form><p class="gizli" id="ara-say" role="status" aria-live="polite"></p><div class="ara-sonuc" id="ara-sonuc"></div><p class="ara-alt"><span><kbd>↑</kbd><kbd>↓</kbd> seç</span><span><kbd>Enter</kbd> aç</span><span><kbd>Esc</kbd> kapat</span></p></div></dialog>`;
const ARA_S = [];

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
  // Arama dizini: rota sayfaları dışındaki sayfalar ve sol sütundaki "Bu sayfada" bölümleri (rotalar ve duraklar ayrıca eklenir)
  if (id !== "ana" && id !== "yok" && !/^r\d$/.test(sinif)) {
    const u = KOK + dosya.replace(/index\.html$/, "");
    ARA_S.push([baslik, ozet, u]);
    if (yan) for (const o of yan.ogeler) if (o[0][0] === "#") ARA_S.push([o[1], o[2] || "", u + o[0], baslik]);
  }
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
<meta name="theme-color" content="#FFFFFF">
<link rel="icon" href="${GORSEL}zr-logo.jpg"><link rel="apple-touch-icon" href="${GORSEL}zr-logo.jpg">
${harita ? `<link rel="stylesheet" href="${a("leaflet.css")}">\n` : ""}<link rel="stylesheet" href="${a("site.css")}">
${harita ? `<script defer src="${a("leaflet.js")}"></script>\n` : ""}${yolJs ? `<script defer src="${a("yol.js")}"></script>\n` : ""}<script defer src="${a("hesap.js")}"></script>
<script defer src="${a("site.js")}"></script>
</head>
<body data-sayfa="${id}">
<a class="gizli" href="#icerik">İçeriğe geç</a>
${ZEMIN}
${ust(s, /^r\d$/.test(sinif) ? sinif : "")}
${ARA_KUTU}
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
<form class="kapak-ara" role="search" data-ara><label class="gizli" for="kapak-q">Durak, rota ya da sayfa ara</label>${ic("ara")}<input id="kapak-q" type="search" autocomplete="off" placeholder="Durak, cami, türbe ara"><button type="submit">Ara</button></form>
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

/* ——— Gizlilik ve Erişilebilirlik (40 kurumsal site incelemesinde hemen hepsinin alt bilgisinde bulunan iki sayfa) ———
   Metinler sitenin bugün gerçekte yaptığını anlatır. Yeni bir veri işlemi eklenirse (örneğin e-postayla üyelik) önce bu metin güncellenir. */
// E-postayla üyelik (Firebase) açık mı: kaynak/hesap.js içindeki FB_API değeri doluysa açıktır.
const FB_ACIK = /const FB_API = "[^"]+"/.test(oku("kaynak/hesap.js"));
const metinSayfa = ({ dosya, s, baslik, goz, ozet, bolumler, simge }) => sayfa({ yan: { ad: "Bu sayfada", simge, ogeler: bolumler.map((b) => ["#" + b[0], b[1]]) }, dosya, s, id: s, baslik, ozet,
  govde: `<div class="kap"><header class="sayfa-bas orta"><span class="goz">${goz}</span><h1>${baslik}</h1><p class="ozet">${ozet}</p></header>
<div class="metin orta">${bolumler.map((b, i) => `<section class="kart" id="${b[0]}" data-g style="--i:${i % 2}"><h2>${b[1]}</h2>${b[2]}</section>`).join("\n")}
<p class="ince">Son güncelleme: <time datetime="${GUNCEL_ISO}">${GUNCEL}</time></p></div></div>` });

const gizlilikSayfa = () => metinSayfa({ dosya: "gizlilik/index.html", s: "gizlilik", simge: "kilit", baslik: "Gizlilik ve kişisel veriler", goz: "Kişisel veriler",
  ozet: "Bu rehber seni tanımak için yapılmadı. Çerez, reklam ya da ziyaretçi izleme kullanmıyoruz; kaydettiğin rotalar senin cihazında durur.",
  bolumler: [
    ["kisaca", "Kısaca", `<ul class="yalin-liste">
<li>Sitede çerez, reklam ya da ziyaretçi sayacı (izleme) yoktur.</li>
<li>Kaydettiğin rotalar ve ayarların bu tarayıcıda, cihazının hafızasında durur; bize gelmez.</li>
<li>Konumun yalnızca sen izin verirsen ve yalnızca o sayfada kullanılır; saklanmaz.</li>
${FB_ACIK ? "<li>E-postayla üye olursan e-posta adresin ve şifren Google’ın Firebase hizmetinde tutulur (aşağıda).</li>" : ""}</ul>`],
    ["cihazda", "Cihazında tutulanlar", `<p>Aşağıdakiler yalnızca bu tarayıcıda, tarayıcının yerel hafızasında (localStorage) durur. Başka bir telefonda ya da tarayıcıda görünmezler.</p>
<ul class="yalin-liste">
<li>Kaydettiğin rotalar ve yarım kalan rota taslağın.</li>
<li>Bu cihazda açtığın hesap: kullanıcı adın ve şifrenin geri çevrilemeyen özeti. Şifrenin kendisi saklanmaz.</li>
<li>Görünüm ayarların, harita katmanı seçimin ve sol menünün açık ya da kapalı olması.</li>
</ul>
<p>Hepsini silmek için tarayıcının ayarlarında bu sitenin verilerini silmen yeterli.</p>`],
    ["konum", "Konum", `<ul class="yalin-liste">
<li>Konumun yalnızca “Konumumu kullan” gibi bir düğmeye bastığında ve tarayıcının sorusuna izin verdiğinde alınır.</li>
<li>Ulaşım sayfasındaki öneri konumunu yalnızca tarayıcında hesaplar, hiçbir yere göndermez.</li>
<li>Haritada yürüyüş yolunu konumundan başlatırsan, başlangıç noktasının enlem ve boylamı yol tarifi sunucusuna gider. Bunu ilk seferde ayrıca sorarız.</li>
</ul>`],
    ["hizmetler", "Kullandığımız hizmetler", `<ul class="yalin-liste">
<li><b>Harita:</b> sokak haritası OpenStreetMap’ten (tile.openstreetmap.org), uydu görüntüsü Esri’den (server.arcgisonline.com) gelir. Harita açıldığında tarayıcın bu sunuculara bağlanır; IP adresin ve istediğin harita parçaları onlara görünür.</li>
<li><b>Yürüyüş yolu:</b> FOSSGIS’in OpenStreetMap yol tarifi sunucusunda (routing.openstreetmap.de) hesaplanır. Oraya yalnızca noktaların enlem ve boylamı gider.</li>
<li><b>Yayın:</b> site GitHub Pages üzerinde yayınlanır. GitHub, sunucu kayıtlarında IP adresini tutabilir.</li>
<li><b>Yazı tipleri</b> sitenin kendi adresinden gelir; başka bir yazı tipi hizmeti kullanılmaz.</li>
</ul>`],
    ["giris", "Hesap ve giriş", `<ul class="yalin-liste">
${FB_ACIK ? "<li><b>E-postayla üyelik:</b> e-posta adresin ve şifren Google’ın Firebase Authentication hizmetinde tutulur. Doğrulama ve şifre yenileme e-postalarını bu hizmet gönderir. Şifren bize görünmez; Firebase onu özet olarak saklar.</li>" : ""}
<li><b>WordPress.com ile giriş:</b> giriş WordPress.com’un kendi sayfasında yapılır. Bize yalnızca görünen adın ve kullanıcı adın gelir; e-posta adresin ve giriş anahtarı saklanmaz.</li>
<li><b>Bu cihazda hesap:</b> kullanıcı adın ve şifrenin özeti yalnızca bu tarayıcıda durur (yukarıda).</li>
</ul>
<p>Hangi yolla girersen gir, kaydettiğin rotalar bu cihazda kalır; başka cihaza taşınmaz.</p>`],
  ] });

const erisimSayfa = () => metinSayfa({ dosya: "erisilebilirlik/index.html", s: "erisim", simge: "erisim", baslik: "Erişilebilirlik", goz: "Erişilebilirlik beyanı",
  ozet: "Rehberin herkesçe kullanılabilmesini istiyoruz. Hedefimiz Web İçeriği Erişilebilirlik Yönergeleri (WCAG) 2.2’nin AA düzeyi; site bugün bu düzeye kısmen uyumlu.",
  bolumler: [
    ["yapilan", "Neler yapıldı", `<ul class="yalin-liste">
<li>Her sayfanın başında “İçeriğe geç” bağlantısı var; Tab tuşuna basınca görünür.</li>
<li>Menüler, düğmeler ve arama klavyeyle kullanılabilir. Odaklanan öğe kalın lacivert bir çerçeveyle belirir.</li>
<li>Yazı ve zemin renkleri en az 4,5:1 kontrast oranını sağlayacak şekilde seçildi.</li>
<li>Telefonda sayfalar tek sütuna iner, yazılar yakınlaştırılabilir.</li>
<li>Cihazında “hareketi azalt” ayarı açıksa kayan ve beliren animasyonlar durur.</li>
<li>Haritadaki her durak, rota sayfalarında sırasıyla yazılı olarak da var.</li>
<li>Arama Türkçe harfleri ve şapkaları eşit sayar: “eyup” yazınca “Eyüp” bulunur.</li>
</ul>`],
    ["eksikler", "Bilinen eksikler", `<ul class="yalin-liste">
<li>Harita ekran okuyucuyla tam kullanılamıyor. Aynı bilgiler rota sayfalarındaki durak listelerinde var.</li>
<li>Bazı durakların konumu yaklaşık; bunlar “Konum yaklaşık” etiketiyle gösterilir.</li>
<li>Bağımsız bir erişilebilirlik denetimi henüz yapılmadı. Bu beyan kendi denemelerimize dayanıyor.</li>
</ul>`],
    ["nasil", "Nasıl denedik", `<p>Sayfalar telefon ve bilgisayar genişliğinde, klavyeyle ve hareketi azaltma ayarıyla denendi; renk kontrast oranları hesaplandı. Yeni bir bölüm eklendiğinde aynı denemeler tekrarlanır.</p>`],
  ] });

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
const boy = [anaSayfa(), olusturSayfa(), guzSayfa(), ...ROTALAR.map(rotaSayfa), ulasimSayfa(), ucretSayfa(), adabSayfa(), gizlilikSayfa(), erisimSayfa(), hesapSayfa(), rotalarimSayfa(), yokSayfa()];
io.yaz("a/ara.json", JSON.stringify({ r: ROTALAR.map((r) => [r.id, r.no, r.name, r.yol, r.kicker, r.duraklar.length]), d: ROTALAR.flatMap((r, ri) => r.duraklar.map((d) => [ri, d.n, d.ad, d.hon || "", d.tur || "", d.yer || ""])), s: ARA_S }));
io.yaz("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${HARITA_SAYFALARI.map((u) => `<url><loc>${u}</loc><lastmod>${BUGUN}</lastmod></url>`).join("\n")}\n</urlset>\n`);
io.yaz("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${TAM}${KOK}sitemap.xml\n`);
return `${boy.length} sayfa, ${Math.round(boy.reduce((a, b) => a + b, 0) / 1024)} KB · sürüm ${SURUM} · taşıt geçişleri ${ROTALAR.map((r) => r.id + ":" + r.tasit.length).join(" ")}`;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ZR_DERLE_SITE;
  if (require.main === module) console.log("ok", ZR_DERLE_SITE(require("./io.js")));
}
