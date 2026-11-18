/* kaynak/data.js içindeki PANEL:BAS … PANEL:SON bölümünü yeniden yazar.
   Yönetici paneli (tarayıcı) ve "node site/veri-yaz.js" (biçimi tazelemek için) aynı işlevi kullanır.
   veri = { ROUTES: [...], CONCEPTS: [...], RAW: [[rota, sıra, ad, kısaltma, tür, yer, açıklama, saat, yaklaşık, enlem, boylam, anahtar], ...] } */
(function (g) {
  const BAS = "  /* PANEL:BAS", SON = "/* PANEL:SON */\n";
  const j = (v) => JSON.stringify(v);
  function ZR_VERI_YAZ(metin, veri) {
    const a = metin.indexOf(BAS), b = metin.indexOf(SON);
    if (a < 0 || b < a) throw new Error("kaynak/data.js içinde PANEL:BAS / PANEL:SON işaretleri bulunamadı.");
    const rotalar = veri.ROUTES.map((r) => { const { url, ...k } = r; return "    " + j(k) + ","; }).join("\n");
    const kavram = veri.CONCEPTS.map((c) => "    " + j(c) + ",").join("\n");
    const sira = veri.RAW.slice().sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    const duraklar = sira.map((d) => {
      const anahtar = d[11] || veri.ROUTES[d[0]].id + "-" + d[1];
      return "    [" + [d[0], d[1], d[2], d[3] || "", d[4] || "", d[5] || "", d[6] || "", d[7] || "", d[8] ? 1 : 0, +(+d[9]).toFixed(5), +(+d[10]).toFixed(5), anahtar].map(j).join(", ") + "],";
    }).join("\n");
    const blok = `  /* PANEL:BAS · Buradan PANEL:SON satırına kadar olan bölümü yönetici paneli de yazar (/yonetim/). Elle düzenlerken biçimi koru. */
  const ROUTES = [
${rotalar}
  ];
  ROUTES.forEach((r) => (r.url = BASE + r.slug + "/"));

  const CONCEPTS = [
${kavram}
  ];

  // [rota, sıra, ad, kısaltma, tür, yer, açıklama, saat, yaklaşık konum?, enlem, boylam, kalıcı anahtar]
  // Kalıcı anahtar durağın kimliğidir: sıra ya da rota değişse de aynı kalır, ziyaretçilerin kayıtlı rotaları bozulmaz.
  const RAW = [
${duraklar}
  ];
  `;
    return metin.slice(0, a) + blok + metin.slice(b);
  }
  g.ZR_VERI_YAZ = ZR_VERI_YAZ;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ZR_VERI_YAZ;
    if (require.main === module) {
      const fs = require("fs"), path = require("path"), f = path.join(__dirname, "../kaynak/data.js");
      const eski = fs.readFileSync(f, "utf8"), kap = {}; new Function("globalThis", "module", eski)(kap, undefined);
      const yeni = ZR_VERI_YAZ(eski, kap.ZR_DATA);
      fs.writeFileSync(f, yeni); console.log(yeni === eski ? "değişmedi" : "yeniden yazıldı", kap.ZR_DATA.RAW.length, "durak");
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
