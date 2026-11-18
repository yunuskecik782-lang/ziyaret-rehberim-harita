// Parçaları tek sayfada birleştirir:
//  dist/ziyaret-rehberim-haritasi.html  → yayın parçası (şematik harita; önizleme ortamı dış harita görseli yükleyemediği için)
//  dist/gercek-harita.html              → gerçek haritalı tam belge (Leaflet gömülü; sokak haritası + uydu görüntüsü)
//  dist/sematik.html                    → şematik haritalı tam belge (yalnızca deneme için)
//  dist/index.html                      → web adresinde yayınlanan sürüm (gerçek harita; başlık ve açıklama <head> içinde)
//  Depo düzeninde (üst klasörde .nojekyll varsa) dist/index.html ayrıca depo köküne index.html olarak yazılır.
const fs = require("fs"), path = require("path");
const rd = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const LF = path.join(__dirname, "vendor/leaflet/");
const fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Plus+Jakarta+Sans:wght@500..800&display=swap">';
// Gerçek haritalı sürümlerde, betik çalışmadan önce görünen varsayılan metinler şematik çizimden söz etmesin.
const realBody = (h) => h
  .replace("Şematik çizim · uydu ya da sokak haritası değil", "Harita yükleniyor…")
  .split("Önizleme hakkında").join("Harita hakkında")
  .replace("Bu, yeni düzenin çalışan bir örneği", "Gerçek harita ve uydu görüntüsü")
  .replace(/<li>Harita <b>şematik bir çizimdir<\/b>;[^\n]*<\/li>/, "<li>Duraklar <b>gerçek harita</b> üzerinde gösterilir. Sağdaki düğmeyle sokak haritası ile uydu görüntüsü arasında geçersin.</li>")
  .replace(/<li>Önizleme gerçek konumunu okuyamaz\.[^\n]*<\/li>/, "<li>“Konumumu bul”, tarayıcı izin verirse gerçek konumunu gösterir; konum yalnızca tarayıcında kalır.</li>");
const page = (real, web) => `${web ? "" : `<title>Ziyaret Rehberim Haritası</title>
<meta name="claude:viewport-fit-sides" content="cover">
${fonts}
`}<style>
${real ? "/* Leaflet 1.9.4 · BSD-2-Clause · (c) Volodymyr Agafonkin */\n" + fs.readFileSync(LF + "leaflet.css", "utf8").split("\n").filter((l) => !l.includes("url(")).join("\n") + "\n" : ""}${rd("app.css")}</style>
${real ? realBody(rd("body.html")) : rd("body.html")}
${real ? "<script>\n/* Leaflet 1.9.4 · BSD-2-Clause · (c) Volodymyr Agafonkin */\n" + fs.readFileSync(LF + "leaflet.js", "utf8").replace(/\/\/# sourceMappingURL=.*$/m, "") + "</script>\n" : ""}<script>
${rd("data.js")}</script>
<script>
${rd("app.js")}</script>
`;
const reset = ":root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}";
const full = (real) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${reset}</style></head><body>${page(real)}</body></html>`;
// Yayın sürümü. Deneme yayını olduğu için arama motorlarına kapalı (noindex); kalıcı adrese geçince bu satır kaldırılır.
const web = () => `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
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
fs.mkdirSync(path.join(__dirname, "dist"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "dist/ziyaret-rehberim-haritasi.html"), page(false));
fs.writeFileSync(path.join(__dirname, "dist/gercek-harita.html"), full(true));
fs.writeFileSync(path.join(__dirname, "dist/sematik.html"), full(false));
fs.writeFileSync(path.join(__dirname, "dist/index.html"), web());
const repoRoot = path.join(__dirname, "..");
if (fs.existsSync(path.join(repoRoot, ".nojekyll"))) fs.writeFileSync(path.join(repoRoot, "index.html"), web());
console.log("ok", page(false).length, full(true).length, web().length);
