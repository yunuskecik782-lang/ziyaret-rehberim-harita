/* Üretim betiklerinin (kaynak/build.js, site/build.js) dosya işlemleri, Node için.
   Aynı betikler yönetici panelinde tarayıcıda da çalışır; orada bu işlemlerin yerini panelin bellekteki karşılıkları alır (site/yonetim.js). */
const fs = require("fs"), path = require("path");
const DEPO = path.join(__dirname, "..");
const tam = (f) => path.join(DEPO, f);
module.exports = {
  oku: (f) => fs.readFileSync(tam(f), "utf8"),
  var: (f) => fs.existsSync(tam(f)),
  yaz: (f, s) => { fs.mkdirSync(path.dirname(tam(f)), { recursive: true }); fs.writeFileSync(tam(f), s); },
  sil: (klasor) => fs.rmSync(tam(klasor), { recursive: true, force: true }),
  kopya: (a, b) => { fs.mkdirSync(path.dirname(tam(b)), { recursive: true }); fs.copyFileSync(tam(a), tam(b)); },
  modul: (f) => { const p = require.resolve(tam(f)); delete require.cache[p]; return require(p); },
};
