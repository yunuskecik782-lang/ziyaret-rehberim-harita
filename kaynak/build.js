// Parçaları tek sayfada birleştirir:
//  dist/ziyaret-rehberim-haritasi.html  → yayın parçası (şematik harita; önizleme ortamı dış harita görseli yükleyemediği için)
//  dist/gercek-harita.html              → gerçek haritalı tam belge (Leaflet gömülü; sokak haritası + uydu görüntüsü)
//  dist/sematik.html                    → şematik haritalı tam belge (yalnızca deneme için)
//  dist/index.html                      → web adresinde yayınlanan sürüm (gerçek harita; başlık ve açıklama <head> içinde)
//  Depo düzeninde (üst klasörde .nojekyll varsa) dist/index.html ayrıca depoda harita/index.html olarak yazılır
//  (sitede /harita/ adresi; kökteki index.html sitenin ana sayfasıdır ve site/build.js tarafından üretilir).
//  Dosya işlemleri "io" üzerinden yapılır (Node'da site/io.js). Aynı betik yönetici panelinde tarayıcıda da çalışır.
function ZR_DERLE_HARITA(io) {
const rd = (f) => io.oku("kaynak/" + f);
const LF = "kaynak/vendor/leaflet/";
const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Plus+Jakarta+Sans:wght@500..800&display=swap">';
// Gerçek haritalı sürümlerde, betik çalışmadan önce görünen varsayılan metinler şematik çizimden söz etmesin.
const SITE = "https://ziyaretrehberim.com/";
// Sitenin (site/ klasöründen üretilir) bu alan adındaki yolu. Hesap, "Rotalarım" ve rota sayfası bağlantıları buraya gider.
const SITE_YOL = "/";
// "Rotayı başlat" ekranındaki eğik harita MapLibre GL ile çizilir. Dosyalar kaynak/vendor/maplibre içinde durur, site/build.js onları /a/ altına kopyalar;
// sayfa bu dosyaları yalnızca rota başlatılınca yükler.
const GL_SURUM = "4.7.1";
// web sürümünde site bağlantıları aynı alan adına görelidir ve gömülü görünümde üst pencerede açılır.
const realBody = (h, web) => h
  .replace('<span class="brand">Ziyaret Rehberim</span>', `<a class="brand" href="${web ? SITE_YOL : SITE}"${web ? ' target="_top"' : ""} title="Ziyaret Rehberim sitesine dön">Ziyaret Rehberim</a>`)
  .replace('<button class="btn sm dark" type="button" id="info-x">Anladım</button>', `<span class="info-acts"><button class="btn sm dark" type="button" id="info-x">Anladım</button><a class="btn sm" href="${web ? SITE_YOL : SITE}"${web ? ' target="_top"' : ""}>Siteye dön</a></span>`)
  .replace("Şematik çizim · uydu ya da sokak haritası değil", "Harita yükleniyor…")
  .split("Önizleme hakkında").join("Harita hakkında")
  .replace("Bu, yeni düzenin çalışan bir örneği", "Gerçek harita ve uydu görüntüsü")
  .replace(/<li>Harita <b>şematik bir çizimdir<\/b>;[^\n]*<\/li>/, "<li>Duraklar <b>gerçek harita</b> üzerinde gösterilir. Sağdaki düğmeyle sokak haritası ile uydu görüntüsü arasında geçersin.</li>")
  .replace(/<li>Önizleme gerçek konumunu okuyamaz\.[^\n]*<\/li>/, "<li>“Konumumu bul”, tarayıcı izin verirse gerçek konumunu gösterir. Konumun bizde saklanmaz.</li>");
const page = (real, web) => `${web ? "" : `<title>Ziyaret Rehberim Haritası</title>
<meta name="claude:viewport-fit-sides" content="cover">
${fonts}
`}<style>
${real ? "/* Leaflet 1.9.4 · BSD-2-Clause · (c) Volodymyr Agafonkin */\n" + io.oku(LF + "leaflet.css").split("\n").filter((l) => !l.includes("url(")).join("\n") + "\n" : ""}${rd("app.css")}</style>
${real ? realBody(rd("body.html"), web) : rd("body.html")}
${real ? "<script>\n/* Leaflet 1.9.4 · BSD-2-Clause · (c) Volodymyr Agafonkin */\n" + io.oku(LF + "leaflet.js").replace(/\/\/# sourceMappingURL=.*$/m, "") + "</script>\n" : ""}<script>
${rd("data.js")}</script>
${real ? "<script>\n" + (web ? 'globalThis.ZR_SITE = location.origin + "' + SITE_YOL + '";\nglobalThis.ZR_GL = { js: "' + SITE_YOL + 'a/maplibre-gl.js?v=' + GL_SURUM + '", css: "' + SITE_YOL + 'a/maplibre-gl.css?v=' + GL_SURUM + '" };\n' : "") + rd("yol.js") + rd("hesap.js") + "</script>\n" : ""}<script>
${rd("app.js")}</script>
`;
const reset = ":root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}";
const full = (real) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${reset}</style></head><body>${page(real)}</body></html>`;
// Yayın sürümü (sitede /harita/). Tek başına bir araç sayfası olduğu için arama motorlarına kapalıdır (noindex); arananlar site sayfalarıdır.
const web = () => `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<script>/* Konum yalnızca güvenli (https) adreste çalışır; http ile gelen ziyaretçi, https adresi çalışıyorsa oraya alınır. */
(function(){var l=location;if(l.protocol==="http:"&&/(^|\\.)ziyaretrehberim\\.com$/.test(l.hostname)&&window.fetch)fetch("https://"+l.host+"/robots.txt?"+Date.now(),{mode:"no-cors",cache:"no-store"}).then(function(){l.replace("https://"+l.host+l.pathname+l.search+l.hash)}).catch(function(){})})();</script>
<title>Ziyaret Rehberim Haritası</title>
<meta name="description" content="İstanbul'da manevî ve tarihî ziyaret durakları gerçek harita ve uydu görüntüsü üzerinde: konumuna en yakın rotayı kur, kaydet, Google ya da Apple Haritalar'da aç.">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0E1B2E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts}
<style>${reset}</style>
</head>
<body>
${page(true, true)}</body>
</html>
`;
io.yaz("kaynak/dist/ziyaret-rehberim-haritasi.html", page(false));
io.yaz("kaynak/dist/gercek-harita.html", full(true));
io.yaz("kaynak/dist/sematik.html", full(false));
io.yaz("kaynak/dist/index.html", web());
if (io.var(".nojekyll")) io.yaz("harita/index.html", web());
return [page(false).length, full(true).length, web().length];
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = ZR_DERLE_HARITA;
  if (require.main === module) console.log("ok", ...ZR_DERLE_HARITA(require("../site/io.js")));
}
