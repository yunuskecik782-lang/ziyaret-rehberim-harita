/* Ziyaret Rehberim · yönetim paneli (/yonetim/).
   Sunucu yoktur. Panel, durak ve rota bilgilerini depodan (GitHub) okur; "Kaydet ve yayınla" denince kaynak/data.js ile site/rota-metin.json
   dosyalarını yeniden yazar, siteyi tarayıcıda yeniden üretir (kaynak/build.js ve site/build.js aynen çalışır) ve hepsini tek kayıt olarak
   depoya gönderir. Yazma yetkisi GitHub anahtarından gelir. Anahtar yalnızca bu cihazda, yönetici şifresiyle şifrelenmiş olarak durur
   (PBKDF2-SHA-256 + AES-GCM) ve api.github.com dışında hiçbir yere gönderilmez. */
(() => {
  "use strict";
  const A = globalThis.ZR_YONETIM, VERI_YAZ = globalThis.ZR_VERI_YAZ;
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const kok = $("#kok"), enc = new TextEncoder(), dec = new TextDecoder();
  const YEREL = ["127.0.0.1", "localhost"].includes(location.hostname);
  let API = "https://api.github.com";
  try { const o = YEREL && localStorage.getItem("zr.yonetim.api"); if (o) API = o; } catch (e) {}

  /* ——— Yönetici kaydı: anahtar bu cihazda şifreli durur ——— */
  const KAYIT = "zr.yonetim.1", TUR = 600000;
  const b64 = (u) => btoa(Array.from(u, (c) => String.fromCharCode(c)).join("")), unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const kucuk = (s) => String(s).trim().toLocaleLowerCase("tr");
  const kayitOku = () => { try { const r = JSON.parse(localStorage.getItem(KAYIT)); return r && r.kasa ? r : null; } catch (e) { return null; } };
  async function turet(sifre, tuz, tur) {
    const ham = await crypto.subtle.importKey("raw", enc.encode(sifre), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: tuz, iterations: tur, hash: "SHA-256" }, ham, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function kasaYaz(ad, sifre, jeton) {
    const tuz = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const k = await turet(sifre, tuz, TUR);
    const c = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: enc.encode(kucuk(ad)) }, k, enc.encode(jeton)));
    localStorage.setItem(KAYIT, JSON.stringify({ ad: ad.trim(), tuz: b64(tuz), iv: b64(iv), kasa: b64(c), tur: TUR }));
  }
  async function kasaAc(ad, sifre) {
    const r = kayitOku(); if (!r || kucuk(r.ad) !== kucuk(ad)) throw new Error("eslesmedi");
    const k = await turet(sifre, unb64(r.tuz), r.tur);
    return dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(r.iv), additionalData: enc.encode(kucuk(ad)) }, k, unb64(r.kasa)));
  }

  /* ——— GitHub ——— */
  let JETON = null;
  async function gh(yol, sec = {}) {
    let r;
    try {
      r = await fetch(API + "/repos/" + A.depo + yol, { method: sec.method || "GET", cache: "no-store", body: sec.body ? JSON.stringify(sec.body) : undefined,
        headers: { Accept: "application/vnd.github+json", Authorization: "Bearer " + (sec.jeton || JETON), "X-GitHub-Api-Version": "2022-11-28", ...(sec.body ? { "Content-Type": "application/json" } : {}) } });
    } catch (e) { const h = new Error("ag"); h.kod = 0; throw h; }
    if (!r.ok) { const h = new Error("GitHub " + r.status); h.kod = r.status; try { h.ileti = (await r.json()).message; } catch (e) {} throw h; }
    return r.status === 204 ? null : r.json();
  }
  const hataMetni = (e) => e.kod === 0 ? "GitHub’a ulaşılamadı. İnternet bağlantını kontrol edip yeniden dene."
    : e.kod === 401 ? "GitHub anahtarı geçersiz ya da süresi dolmuş. Yeni bir anahtar oluşturup yönetici kaydını yenilemen gerekir."
    : e.kod === 403 || e.kod === 404 ? "Anahtarın bu depoda bu işlem için izni yok. Anahtarı oluştururken yalnızca bu depoyu seçip “Contents: Read and write” izni verdiğinden emin ol."
    : e.kod === 409 || e.kod === 422 ? "Depo bu arada değişmiş. Sayfayı yenileyip değişikliklerini yeniden yap." + (e.ileti ? " (" + e.ileti + ")" : "")
    : e.kod ? "GitHub beklenmeyen bir yanıt verdi (" + e.kod + ")." : (e.message || "Bilinmeyen hata");
  async function havuz(liste, n, is) { let i = 0; await Promise.all(Array.from({ length: Math.min(n, liste.length) }, async () => { while (i < liste.length) await is(liste[i++]); })); }

  /* ——— Depodan yükleme ——— */
  const D = { taban: null, ayri: false, agac: new Map(), kaynak: new Map() };
  const M = { rotalar: [], kavram: [], durak: [], metin: {} };
  let ILK = "", ILKV = null;
  async function yukle() {
    const [m, p] = await Promise.all(A.dallar.map((d) => gh("/git/ref/heads/" + d)));
    D.taban = m.object.sha; D.ayri = p.object.sha !== m.object.sha;
    const c = await gh("/git/commits/" + D.taban), t = await gh("/git/trees/" + c.tree.sha + "?recursive=1");
    if (t.truncated) throw new Error("Depodaki dosya listesi eksik geldi; yeniden dene.");
    D.agac = new Map(t.tree.filter((x) => x.type === "blob").map((x) => [x.path, { sha: x.sha, mode: x.mode }]));
    const gerek = [...D.agac.keys()].filter((f) => /^(site|kaynak)\//.test(f) && !/^kaynak\/(dist|vendor\/maplibre)\//.test(f) && /\.(js|json|css|html)$/.test(f));
    D.kaynak = new Map();
    await havuz(gerek, 6, async (f) => { const b = await gh("/git/blobs/" + D.agac.get(f).sha); D.kaynak.set(f, dec.decode(unb64(b.content.replace(/\s/g, "")))); });
    const kap = {}; new Function("globalThis", "module", D.kaynak.get("kaynak/data.js"))(kap, undefined);
    const Z = kap.ZR_DATA;
    M.rotalar = Z.ROUTES.map((r) => { const { url, ...k } = r; return k; });
    M.kavram = Z.CONCEPTS;
    M.durak = Z.RAW.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((a) => ({ k: a[11] || Z.ROUTES[a[0]].id + "-" + a[1], r: a[0], ad: a[2], hon: a[3] || "", tur: a[4] || "", yer: a[5] || "", acik: a[6] || "", saat: a[7] || "", yak: !!a[8], lat: a[9], lng: a[10] }));
    M.metin = JSON.parse(D.kaynak.get("site/rota-metin.json"));
    ILKV = JSON.parse(JSON.stringify(durum())); ILK = JSON.stringify(ILKV);
  }
  const durum = () => ({ rotalar: M.rotalar, durak: M.durak, metin: M.metin });
  const degisti = () => JSON.stringify(durum()) !== ILK;
  const rotaDuraklari = (i) => M.durak.filter((d) => d.r === i);
  const ham = () => { const say = {}; return M.durak.map((d) => { say[d.r] = (say[d.r] || 0) + 1; return [d.r, say[d.r], d.ad.trim(), d.hon.trim(), d.tur.trim(), d.yer.trim(), d.acik.trim(), d.saat.trim(), d.yak ? 1 : 0, +d.lat, +d.lng, d.k]; }); };

  /* ——— Değişiklik özeti ve denetim ——— */
  const ALAN = { ad: "ad", hon: "kısaltma", tur: "tür", yer: "yer", acik: "açıklama", saat: "saat ve ücret", yak: "yaklaşık konum", lat: "konum", lng: "konum" };
  function farklar() {
    const f = [], eski = new Map(ILKV.durak.map((d) => [d.k, d])), yeni = new Map(M.durak.map((d) => [d.k, d]));
    const rAd = (i) => M.rotalar[i].name;
    for (const d of M.durak) {
      const e = eski.get(d.k);
      if (!e) { f.push(`Yeni durak: ${d.ad} (${rAd(d.r)})`); continue; }
      const a = [...new Set(Object.keys(ALAN).filter((k) => e[k] !== d[k]).map((k) => ALAN[k]))];
      if (e.r !== d.r) a.unshift(`rota: ${rAd(e.r)} → ${rAd(d.r)}`);
      if (a.length) f.push(`${d.ad}: ${a.join(", ")} değişti`);
    }
    for (const e of ILKV.durak) if (!yeni.has(e.k)) f.push(`Silinen durak: ${e.ad} (${rAd(e.r)})`);
    M.rotalar.forEach((r, i) => {
      const e = ILKV.rotalar[i];
      if (JSON.stringify(e) !== JSON.stringify(r)) f.push(`${r.name}: rota bilgileri değişti`);
      if (JSON.stringify(ILKV.metin[r.id]) !== JSON.stringify(M.metin[r.id])) f.push(`${r.name}: sayfa metinleri değişti`);
      const s1 = ILKV.durak.filter((d) => d.r === i && yeni.has(d.k) && yeni.get(d.k).r === i).map((d) => d.k).join(), s2 = M.durak.filter((d) => d.r === i && eski.has(d.k) && eski.get(d.k).r === i).map((d) => d.k).join();
      if (s1 !== s2) f.push(`${r.name}: durak sırası değişti`);
    });
    return f;
  }
  const ETIKET = /<(?!\/?(strong|em|b|i|br)\s*\/?>|a\s+href="https?:\/\/[^"<>]*"\s*>|\/a>)/i;
  function denetle() {
    const h = [];
    M.rotalar.forEach((r, i) => {
      if (!r.name.trim()) h.push(`${r.no} numaralı rotanın adı boş.`);
      if (!rotaDuraklari(i).length) h.push(`${r.name}: rotada en az bir durak olmalı.`);
      const m = M.metin[r.id];
      if (!m.h1.trim()) h.push(`${r.name}: sayfa başlığı boş.`);
      for (const t of [...m.about, m.how.start, m.how.along, m.how.back, ...m.tip]) if (ETIKET.test(t)) { h.push(`${r.name}: metinlerde yalnızca <strong>, <em>, <br> ve <a href="https://…"> kullanılabilir. “<” işaretini başka yerde kullanma.`); break; }
    });
    for (const d of M.durak) {
      if (!d.ad.trim()) h.push(`${M.rotalar[d.r].name}: adı boş bir durak var.`);
      if (!(+d.lat > 40.7 && +d.lat < 41.4 && +d.lng > 28.3 && +d.lng < 29.6)) h.push(`${d.ad || "Adsız durak"}: konum İstanbul dışında görünüyor (${d.lat}, ${d.lng}).`);
    }
    return h;
  }

  /* ——— Siteyi tarayıcıda üretme ve depoya gönderme ——— */
  function derle(kaynak) {
    const cikti = new Map(), silinen = [], kopya = [];
    const io = {
      oku: (f) => { if (!kaynak.has(f)) throw new Error("Kaynak dosya bulunamadı: " + f); return kaynak.get(f); },
      var: (f) => D.agac.has(f) || kaynak.has(f),
      yaz: (f, s) => { if (!f.startsWith("kaynak/dist/")) cikti.set(f, s); },
      sil: (k) => silinen.push(k + "/"),
      kopya: (a, b) => kopya.push([a, b]),
      modul: (f) => { const m = { exports: {} }; new Function("module", "exports", io.oku(f))(m, m.exports); return m.exports; },
    };
    new Function(io.oku("kaynak/build.js") + "\n;return ZR_DERLE_HARITA;")()(io);
    const ozet = new Function(io.oku("site/build.js") + "\n;return ZR_DERLE_SITE;")()(io);
    return { cikti, silinen, kopya, ozet };
  }
  async function blobSha(metin) {
    const g = enc.encode(metin), b = enc.encode("blob " + g.length + "\0"), t = new Uint8Array(b.length + g.length); t.set(b); t.set(g, b.length);
    return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-1", t)), (x) => x.toString(16).padStart(2, "0")).join("");
  }
  async function yayinla(ileti, adim) {
    adim("Depo kontrol ediliyor…");
    const [m, p] = await Promise.all(A.dallar.map((d) => gh("/git/ref/heads/" + d)));
    if (m.object.sha !== D.taban || p.object.sha !== D.taban) { const h = new Error("degisti"); h.kod = 409; throw h; }
    adim("Site yeniden üretiliyor…");
    await new Promise((r) => setTimeout(r, 30));
    const kaynak = new Map(D.kaynak);
    kaynak.set("kaynak/data.js", VERI_YAZ(kaynak.get("kaynak/data.js"), { ROUTES: M.rotalar, CONCEPTS: M.kavram, RAW: ham() }));
    kaynak.set("site/rota-metin.json", JSON.stringify(M.metin, null, 1) + "\n");
    const { cikti, silinen, kopya } = derle(kaynak);
    cikti.set("kaynak/data.js", kaynak.get("kaynak/data.js")); cikti.set("site/rota-metin.json", kaynak.get("site/rota-metin.json"));
    const agac = [], kalan = new Set(cikti.keys());
    for (const [f, s] of cikti) { const e = D.agac.get(f); if (!e || e.sha !== (await blobSha(s))) agac.push({ path: f, mode: "100644", type: "blob", content: s }); }
    for (const [a, b] of kopya) { kalan.add(b); const k = D.agac.get(a), e = D.agac.get(b); if (k && (!e || e.sha !== k.sha)) agac.push({ path: b, mode: "100644", type: "blob", sha: k.sha }); }
    for (const f of D.agac.keys()) if (silinen.some((k) => f.startsWith(k)) && !kalan.has(f)) agac.push({ path: f, mode: "100644", type: "blob", sha: null });
    if (!agac.length) return { degisen: 0 };
    adim(`${agac.length} dosya gönderiliyor…`);
    // Büyük dosyalar önce tek tek yüklenir; kalanı ağaç isteğinin içinde gider.
    for (const e of agac) if (e.content && e.content.length > 60000) { e.sha = (await gh("/git/blobs", { method: "POST", body: { content: e.content, encoding: "utf-8" } })).sha; delete e.content; }
    const eskiAgac = (await gh("/git/commits/" + D.taban)).tree.sha;
    const t = await gh("/git/trees", { method: "POST", body: { base_tree: eskiAgac, tree: agac } });
    const c = await gh("/git/commits", { method: "POST", body: { message: ileti, tree: t.sha, parents: [D.taban] } });
    adim("Yayına alınıyor…");
    for (const d of A.dallar) await gh("/git/refs/heads/" + d, { method: "PATCH", body: { sha: c.sha, force: false } });
    return { degisen: agac.length, sha: c.sha };
  }

  /* ——— Giriş ve ilk kurulum ——— */
  let denemeler = 0, kilit = 0;
  const kabuk = (ic) => `<main class="giris"><div class="giris-kart"><b class="marka">Ziyaret <em>Rehberim</em><span>Yönetim</span></b>${ic}</div><p class="giris-alt"><a href="/">Siteye dön</a></p></main>`;
  function girisCiz(hata) {
    const r = kayitOku();
    if (!r) return kurCiz();
    kok.innerHTML = kabuk(`<h1>Yönetici girişi</h1><p class="ince">Bu cihazda kayıtlı yönetici adı ve şifrenle gir.</p>
<form id="gf" autocomplete="off"><label>Yönetici adı<input name="ad" required autocapitalize="none" spellcheck="false"></label><label>Şifre<input name="sifre" type="password" required></label>
<p class="hata" role="alert"${hata ? "" : " hidden"}>${esc(hata || "")}</p><button class="btn koyu genis" type="submit">Giriş yap</button></form>
<details class="yardim"><summary>Şifremi unuttum</summary><p>Şifre hiçbir yerde saklanmaz, bu yüzden sıfırlanamaz. Bu cihazdaki yönetici kaydını silip yeni bir ad, şifre ve GitHub anahtarıyla yeniden kurabilirsin. Sitedeki bilgiler silinmez.</p><button class="btn kucuk tehlike" type="button" id="kayit-sil">Bu cihazdaki kaydı sil</button></details>`);
    $("#gf").addEventListener("submit", async (e) => {
      e.preventDefault(); const f = new FormData(e.target), dg = $("#gf button"), ht = $("#gf .hata");
      if (Date.now() < kilit) { ht.hidden = false; ht.textContent = `Çok fazla yanlış deneme. ${Math.ceil((kilit - Date.now()) / 1000)} saniye sonra yeniden dene.`; return; }
      dg.disabled = true; dg.textContent = "Kontrol ediliyor…";
      try { JETON = await kasaAc(f.get("ad"), f.get("sifre")); denemeler = 0; }
      catch (x) { if (++denemeler >= 5) { kilit = Date.now() + 30000; denemeler = 0; } return girisCiz("Yönetici adı ya da şifre yanlış."); }
      panelAc();
    });
    $("#kayit-sil").addEventListener("click", (e) => {
      const b = e.currentTarget;
      if (b.dataset.emin) { localStorage.removeItem(KAYIT); return kurCiz(); }
      b.dataset.emin = "1"; b.textContent = "Emin misin? Silmek için yeniden dokun";
    });
  }
  function kurCiz(hata, on = {}) {
    kok.innerHTML = kabuk(`<h1>İlk kurulum</h1><p class="ince">Bu cihaz için bir yönetici adı ve şifre belirle, sonra GitHub anahtarını bir kez yapıştır. Anahtar bu cihazda şifrenle şifrelenip saklanır; başka cihazda aynı kurulumu bir kez daha yaparsın.</p>
<form id="kf" autocomplete="off"><label>Yönetici adı<input name="ad" required minlength="3" autocapitalize="none" spellcheck="false" value="${esc(on.ad || "")}"></label>
<label>Şifre <small>en az 10 karakter</small><input name="sifre" type="password" required minlength="10" autocomplete="new-password"></label><label>Şifre (tekrar)<input name="sifre2" type="password" required minlength="10" autocomplete="new-password"></label>
<label>GitHub anahtarı<input name="jeton" type="password" required spellcheck="false" autocomplete="off" placeholder="github_pat_…"></label>
<p class="hata" role="alert"${hata ? "" : " hidden"}>${esc(hata || "")}</p><button class="btn koyu genis" type="submit">Kur ve giriş yap</button></form>
<details class="yardim" open><summary>Anahtar nasıl oluşturulur?</summary><ol><li>GitHub’da oturum açıp <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">yeni anahtar sayfasını</a> aç (Settings → Developer settings → Fine-grained tokens → Generate new token).</li><li><b>Token name:</b> Ziyaret Rehberim yönetim. <b>Expiration:</b> istediğin süre.</li><li><b>Repository access:</b> “Only select repositories” seç, listeden <b>${esc(A.depo.split("/")[1])}</b> deposunu işaretle.</li><li><b>Permissions → Repository permissions → Contents:</b> “Read and write”. Başka izin verme.</li><li>“Generate token”a bas, çıkan anahtarı kopyalayıp yukarıya yapıştır.</li></ol><p>Bu anahtar yalnızca bu deponun dosyalarını değiştirebilir. İstediğin an GitHub’da aynı sayfadan silebilirsin.</p></details>`);
    $("#kf").addEventListener("submit", async (e) => {
      e.preventDefault(); const f = new FormData(e.target), ad = String(f.get("ad")).trim(), jeton = String(f.get("jeton")).trim(), dg = $("#kf button[type=submit]");
      if (f.get("sifre") !== f.get("sifre2")) return kurCiz("Şifreler aynı değil.", { ad });
      dg.disabled = true; dg.textContent = "Anahtar deneniyor…";
      try {
        const d = await gh("", { jeton });
        if (d.permissions && d.permissions.push === false) return kurCiz("Bu anahtar depoyu okuyabiliyor ama yazamıyor. “Contents: Read and write” izni ver.", { ad });
        await kasaYaz(ad, String(f.get("sifre")), jeton); JETON = jeton;
      } catch (x) { return kurCiz(hataMetni(x), { ad }); }
      panelAc();
    });
  }

  /* ——— Panel ——— */
  const S = { rota: 0, sec: null, form: null, ekle: false, uydu: true };
  let map, katmanlar, isaretler = [];
  const bildir = (t) => { const b = $("#bildirim"); if (!b) return; b.textContent = t; b.classList.add("acik"); clearTimeout(bildir.t); bildir.t = setTimeout(() => b.classList.remove("acik"), 3200); };
  async function panelAc() {
    kok.innerHTML = `<main class="giris"><div class="giris-kart"><b class="marka">Ziyaret <em>Rehberim</em><span>Yönetim</span></b><p class="ince" id="yuk">Bilgiler depodan okunuyor…</p></div></main>`;
    try { await yukle(); } catch (e) { JETON = null; return girisCiz(hataMetni(e)); }
    kok.innerHTML = `<header class="ust"><b class="marka">Ziyaret <em>Rehberim</em><span>Yönetim</span></b><span class="durum" id="durum"></span><span class="bosluk"></span>
<a class="btn kucuk" href="/" target="_blank" rel="noopener">Siteyi aç</a><button class="btn kucuk" type="button" id="geri-al" hidden>Değişiklikleri geri al</button><button class="btn kucuk" type="button" id="cikis">Çıkış</button><button class="btn altin" type="button" id="yayin" disabled>Kaydet ve yayınla</button></header>
${D.ayri ? '<p class="uyari">Depodaki yayın dalı ile ana dal aynı değil. Yayınlama kapalı; önce bunun düzeltilmesi gerekir.</p>' : ""}
<div class="govde"><aside class="yan"><div class="rotalar" id="rotalar" role="tablist" aria-label="Rota"></div>
<div class="arac"><button class="btn kucuk koyu" type="button" id="ekle">+ Haritadan yeni durak</button><button class="btn kucuk" type="button" id="rbilgi">Rota bilgileri ve metinleri</button></div>
<ol class="liste" id="liste"></ol></aside>
<section class="orta"><div id="harita"></div><p class="ipucu" id="ipucu" hidden></p><button class="btn kucuk katman" type="button" id="katman">Sokak haritası</button><p class="kaynak" id="kaynak"></p></section>
<aside class="form" id="form" hidden></aside></div>
<div class="perde" id="perde" hidden><div class="kutu" id="kutu" role="dialog" aria-modal="true"></div></div><div class="bildirim" id="bildirim" role="status" aria-live="polite"></div>`;
    haritaKur(); olaylar(); ciz(); sigdir();
  }
  function haritaKur() {
    map = L.map("harita", { zoomControl: true, attributionControl: false }).setView([41.02, 28.95], 13);
    const uydu = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 });
    const ad = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 });
    const sokak = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 });
    katmanlar = { uydu: L.layerGroup([uydu, ad]), sokak };
    katmanAyarla();
    map.on("click", (e) => { if (S.ekle) durakEkle(e.latlng.lat, e.latlng.lng); });
  }
  function katmanAyarla() {
    map.removeLayer(katmanlar.uydu); map.removeLayer(katmanlar.sokak); (S.uydu ? katmanlar.uydu : katmanlar.sokak).addTo(map);
    $("#katman").textContent = S.uydu ? "Sokak haritası" : "Uydu görüntüsü";
    $("#kaynak").textContent = S.uydu ? "Uydu görüntüsü: Esri, Maxar, Earthstar Geographics" : "© OpenStreetMap katkıda bulunanlar";
    $(".orta").classList.toggle("uydu", S.uydu);
  }
  const sigdir = () => { const d = rotaDuraklari(S.rota); if (d.length) map.fitBounds(L.latLngBounds(d.map((x) => [x.lat, x.lng])).pad(0.18), { maxZoom: 17 }); };
  const secili = () => M.durak.find((d) => d.k === S.sec) || null;
  function isaretCiz() {
    isaretler.forEach((m) => m.remove()); isaretler = [];
    const sira = {};
    for (const d of M.durak) {
      sira[d.r] = (sira[d.r] || 0) + 1;
      const bu = d.r === S.rota, sec = d.k === S.sec;
      const m = L.marker([d.lat, d.lng], { draggable: sec, keyboard: false, zIndexOffset: sec ? 1000 : bu ? 500 : 0, title: d.ad,
        icon: L.divIcon({ className: "", iconSize: bu ? [30, 30] : [14, 14], iconAnchor: bu ? [15, 15] : [7, 7], html: bu ? `<span class="ymk${sec ? " sec" : ""}">${sira[d.r]}</span>` : '<span class="ymk kucuk"></span>' }) }).addTo(map);
      m.on("click", () => { if (S.ekle) return; S.rota = d.r; durakSec(d.k); });
      if (sec) m.on("dragend", () => { const p = m.getLatLng(); d.lat = +p.lat.toFixed(5); d.lng = +p.lng.toFixed(5); const f = $("#form"); if (f && S.form === "durak") { $('[data-alan="lat"]', f).value = d.lat; $('[data-alan="lng"]', f).value = d.lng; } durumCiz(); });
      isaretler.push(m);
    }
  }
  function durumCiz() {
    const n = degisti() ? farklar().length || 1 : 0;
    $("#durum").textContent = n ? `${n} değişiklik kaydedilmedi` : "Değişiklik yok";
    $("#durum").classList.toggle("var", !!n); $("#yayin").disabled = !n || D.ayri; $("#geri-al").hidden = !n;
  }
  function listeCiz() {
    $("#rotalar").innerHTML = M.rotalar.map((r, i) => `<button type="button" role="tab" data-rota="${i}" aria-selected="${i === S.rota}"><b>${esc(r.no)}</b><span>${esc(r.name)}</span><small>${rotaDuraklari(i).length}</small></button>`).join("");
    const d = rotaDuraklari(S.rota);
    $("#liste").innerHTML = d.map((x, i) => `<li class="${x.k === S.sec ? "sec" : ""}"><button type="button" class="satir" data-sec="${esc(x.k)}"><i>${i + 1}</i><span><b>${esc(x.ad || "Adsız durak")}${x.hon ? ` <small>${esc(x.hon)}</small>` : ""}</b><small>${esc(x.yer)}</small></span></button>
<span class="ok"><button type="button" data-yukari="${esc(x.k)}" aria-label="Yukarı taşı"${i ? "" : " disabled"}>↑</button><button type="button" data-asagi="${esc(x.k)}" aria-label="Aşağı taşı"${i < d.length - 1 ? "" : " disabled"}>↓</button></span></li>`).join("") || '<li class="bos">Bu rotada durak yok.</li>';
  }
  const ciz = () => { listeCiz(); isaretCiz(); durumCiz(); };
  const alan = (ad, etiket, deger, o = {}) => `<label class="${o.sinif || ""}">${etiket}${o.not ? ` <small>${o.not}</small>` : ""}${o.cok ? `<textarea data-alan="${ad}" rows="${o.cok}">${esc(deger)}</textarea>` : `<input data-alan="${ad}" value="${esc(deger)}"${o.tip ? ` type="${o.tip}" step="0.00001" inputmode="decimal"` : ""}>`}</label>`;
  function formAc(tur) { S.form = tur; const f = $("#form"); f.hidden = !tur; $(".govde").classList.toggle("formlu", !!tur); if (tur === "durak") durakForm(); else if (tur === "rota") rotaForm(); setTimeout(() => map.invalidateSize(), 60); if (tur && matchMedia("(max-width: 860px)").matches) f.scrollIntoView({ block: "start" }); }
  function durakForm() {
    const d = secili(); if (!d) return formAc(null);
    $("#form").innerHTML = `<header><h2>Durak</h2><button class="btn kucuk" type="button" data-kapat>Kapat</button></header>
${alan("ad", "Ad", d.ad)}<div class="iki">${alan("hon", "Kısaltma", d.hon, { not: "r.a., k.s. gibi" })}${alan("tur", "Tür", d.tur, { not: "Kabir, Türbe, Makam…" })}</div>
${alan("yer", "Yer", d.yer, { not: "yapı, mahalle" })}${alan("acik", "Açıklama", d.acik, { cok: 5 })}${alan("saat", "Saat ve ücret", d.saat, { cok: 2 })}
<label>Rota<select data-alan="r">${M.rotalar.map((r, i) => `<option value="${i}"${i === d.r ? " selected" : ""}>${esc(r.no)} · ${esc(r.name)}</option>`).join("")}</select></label>
<div class="iki">${alan("lat", "Enlem", d.lat, { tip: "number" })}${alan("lng", "Boylam", d.lng, { tip: "number" })}</div>
<p class="ince">Konumu değiştirmek için haritadaki sarı işareti sürükle ya da sayıları yaz.</p>
<label class="tik"><input type="checkbox" data-alan="yak"${d.yak ? " checked" : ""}> Konum yaklaşık (tam yeri doğrulanmadı)</label>
<div class="form-alt"><button class="btn kucuk tehlike" type="button" data-sil>Durağı sil</button></div>`;
  }
  const blok = (a) => a.join("\n\n"), bolBlok = (s) => s.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean), bolSatir = (s) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  function rotaForm() {
    const r = M.rotalar[S.rota], m = M.metin[r.id];
    $("#form").innerHTML = `<header><h2>Rota ${esc(r.no)}</h2><button class="btn kucuk" type="button" data-kapat>Kapat</button></header>
${alan("R.name", "Rota adı", r.name)}${alan("R.kicker", "Üst başlık", r.kicker)}${alan("R.lede", "Kısa tanıtım", r.lede, { cok: 2 })}
<div class="iki">${alan("R.km", "Yürüyüş", r.km, { not: "ör. 3,8 km" })}${alan("R.sure", "Süre", r.sure, { not: "ör. ≈ 3 saat" })}</div>
<h3>Rota sayfası</h3>${alan("M.h1", "Sayfa başlığı", m.h1)}${alan("M.pills", "Üstteki kısa bilgiler", m.pills.join("\n"), { cok: 4, not: "her satır bir bilgi; durak sayısı kendiliğinden güncellenir" })}
${alan("M.about", "Güzergâh hakkında", blok(m.about), { cok: 7, not: "paragraflar arasında boş satır bırak" })}
${alan("M.how.start", "Nasıl gidilir: başlangıç", m.how.start, { cok: 3 })}${alan("M.how.along", "Nasıl gidilir: rota boyunca", m.how.along, { cok: 3 })}${alan("M.how.back", "Nasıl gidilir: dönüş", m.how.back, { cok: 3 })}
${alan("M.tip", "İpuçları", blok(m.tip), { cok: 4, not: "her ipucu ayrı paragraf" })}
<p class="ince">Kalın yazı için &lt;strong&gt;…&lt;/strong&gt; kullanabilirsin. Adres (${esc(r.slug)}) ve rota numarası buradan değişmez.</p>`;
  }
  function durakSec(k) { S.sec = k; S.ekle = false; ekleCiz(); ciz(); formAc("durak"); const d = secili(); if (d) map.panTo([d.lat, d.lng]); }
  const ekleCiz = () => { const i = $("#ipucu"); i.hidden = !S.ekle; i.textContent = S.ekle ? "Haritada yeni durağın yerine dokun. Vazgeçmek için düğmeye yeniden bas." : ""; $("#ekle").textContent = S.ekle ? "Vazgeç" : "+ Haritadan yeni durak"; $(".orta").classList.toggle("ekle", S.ekle); };
  function durakEkle(lat, lng) {
    const r = M.rotalar[S.rota]; let k; do { k = r.id + "-y" + Math.random().toString(36).slice(2, 7); } while (M.durak.some((d) => d.k === k));
    M.durak.push({ k, r: S.rota, ad: "Yeni durak", hon: "", tur: "", yer: "", acik: "", saat: "", yak: false, lat: +lat.toFixed(5), lng: +lng.toFixed(5) });
    durakSec(k); const a = $('[data-alan="ad"]', $("#form")); if (a) { a.focus(); a.select(); }
    bildir("Yeni durak eklendi. Bilgilerini doldur.");
  }
  function tasi(k, yon) {
    const d = rotaDuraklari(S.rota), i = d.findIndex((x) => x.k === k), j = i + yon; if (i < 0 || j < 0 || j >= d.length) return;
    const a = M.durak.indexOf(d[i]), b = M.durak.indexOf(d[j]); [M.durak[a], M.durak[b]] = [M.durak[b], M.durak[a]]; ciz();
  }
  function olaylar() {
    $("#rotalar").addEventListener("click", (e) => { const b = e.target.closest("[data-rota]"); if (!b) return; S.rota = +b.dataset.rota; S.sec = null; if (S.form === "rota") rotaForm(); else formAc(null); ciz(); sigdir(); });
    $("#liste").addEventListener("click", (e) => { const t = e.target.closest("button"); if (!t) return; if (t.dataset.sec) durakSec(t.dataset.sec); else if (t.dataset.yukari) tasi(t.dataset.yukari, -1); else if (t.dataset.asagi) tasi(t.dataset.asagi, 1); });
    $("#ekle").addEventListener("click", () => { S.ekle = !S.ekle; ekleCiz(); });
    $("#rbilgi").addEventListener("click", () => { S.sec = null; ciz(); formAc("rota"); });
    $("#katman").addEventListener("click", () => { S.uydu = !S.uydu; katmanAyarla(); });
    $("#cikis").addEventListener("click", () => { if (degisti() && !$("#cikis").dataset.emin) { $("#cikis").dataset.emin = "1"; $("#cikis").textContent = "Kaydedilmedi. Yine de çık"; return; } JETON = null; girisCiz(); });
    $("#geri-al").addEventListener("click", (e) => { const b = e.currentTarget; if (!b.dataset.emin) { b.dataset.emin = "1"; b.textContent = "Emin misin? Hepsi geri alınır"; return; } delete b.dataset.emin; b.textContent = "Değişiklikleri geri al"; const v = JSON.parse(ILK); M.rotalar = v.rotalar; M.durak = v.durak; M.metin = v.metin; S.sec = null; formAc(null); ciz(); sigdir(); });
    $("#yayin").addEventListener("click", yayinSor);
    const f = $("#form");
    f.addEventListener("input", (e) => {
      const a = e.target.dataset.alan; if (!a) return; const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      if (S.form === "durak") {
        const d = secili(); if (!d) return;
        if (a === "r") { d.r = +v; S.rota = d.r; M.durak.splice(M.durak.indexOf(d), 1); M.durak.push(d); ciz(); sigdir(); return; }
        if (a === "lat" || a === "lng") { const n = parseFloat(String(v).replace(",", ".")); if (!isFinite(n)) return; d[a] = +n.toFixed(5); isaretCiz(); durumCiz(); return; }
        d[a] = v; if (a === "ad" || a === "hon" || a === "yer") listeCiz(); durumCiz();
      } else if (S.form === "rota") {
        const r = M.rotalar[S.rota], m = M.metin[r.id];
        if (a.startsWith("R.")) { r[a.slice(2)] = v; if (a === "R.name") listeCiz(); }
        else if (a === "M.h1") m.h1 = v; else if (a === "M.pills") m.pills = bolSatir(v); else if (a === "M.about") m.about = bolBlok(v); else if (a === "M.tip") m.tip = bolBlok(v);
        else if (a.startsWith("M.how.")) m.how[a.slice(6)] = v.trim();
        durumCiz();
      }
    });
    f.addEventListener("click", (e) => {
      if (e.target.closest("[data-kapat]")) { S.sec = null; formAc(null); ciz(); return; }
      const s = e.target.closest("[data-sil]"); if (!s) return;
      if (!s.dataset.emin) { s.dataset.emin = "1"; s.textContent = "Emin misin? Silmek için yeniden dokun"; return; }
      const d = secili(); if (d) { M.durak.splice(M.durak.indexOf(d), 1); S.sec = null; formAc(null); ciz(); bildir("Durak silindi. Yayınlayana kadar sitede durur."); }
    });
    addEventListener("beforeunload", (e) => { if (JETON && degisti()) { e.preventDefault(); e.returnValue = ""; } });
  }
  function yayinSor() {
    const h = denetle(), f = farklar(), p = $("#perde"), k = $("#kutu"); p.hidden = false;
    if (h.length) { k.innerHTML = `<h2>Önce şunları düzelt</h2><ul class="fark">${h.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><div class="dugmeler"><button class="btn koyu" type="button" data-vazgec>Tamam</button></div>`; }
    else k.innerHTML = `<h2>Yayınlansın mı?</h2><p class="ince">Aşağıdaki değişiklikler siteye işlenecek. Yayına girmesi bir iki dakika sürer.</p><ul class="fark">${f.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p class="hata" id="yhata" role="alert" hidden></p><div class="dugmeler"><button class="btn" type="button" data-vazgec>Vazgeç</button><button class="btn altin" type="button" id="yevet">Yayınla</button></div>`;
    k.onclick = async (e) => {
      if (e.target.closest("[data-vazgec]")) { p.hidden = true; return; }
      if (!e.target.closest("#yevet")) return;
      const dg = $("#yevet"); dg.disabled = true; $("[data-vazgec]", k).disabled = true;
      try {
        const ozet = f.length === 1 ? f[0] : `${f.length} değişiklik`;
        const s = await yayinla("Yönetim paneli: " + ozet + (f.length > 1 ? "\n\n" + f.map((x) => "- " + x).join("\n") : ""), (t) => { dg.textContent = t; });
        dg.textContent = "Bilgiler yenileniyor…"; await yukle(); S.sec = null; formAc(null); ciz();
        k.innerHTML = `<h2>Yayınlandı</h2><p class="ince">${s.degisen ? `${s.degisen} dosya güncellendi. ` : ""}Değişiklikler bir iki dakika içinde sitede görünür. Eski hâlini görürsen sayfayı yenile.</p><div class="dugmeler"><button class="btn koyu" type="button" data-vazgec>Tamam</button></div>`;
      } catch (x) { const y = $("#yhata"); if (y) { y.hidden = false; y.textContent = hataMetni(x); } dg.disabled = false; dg.textContent = "Yeniden dene"; const v = $("[data-vazgec]", k); if (v) v.disabled = false; }
    };
  }

  if (!globalThis.crypto || !crypto.subtle) kok.innerHTML = kabuk("<h1>Bu sayfa açılamadı</h1><p class=\"ince\">Yönetim paneli yalnızca güvenli (https) adreste çalışır.</p>");
  else girisCiz();
})();
