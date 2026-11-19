/* Hesap, kayıtlı rotalar ve görünüm ayarları. Sunucu yok: hepsi yalnızca bu cihazda, bu tarayıcıda (localStorage) durur.
   Şifre düz yazıyla saklanmaz; rastgele tuzla PBKDF2-SHA-256 özeti tutulur. Sunucu tarafı kurulduğunda bu dosyanın yerini o alır.
   Görünüm ayarları (rozet rengi, zemin deseni, rota çizgisi, harita işaretleri, hareket) hesaba bağlıdır: giriş yapınca uygulanır,
   çıkış yapınca site varsayılan görünümüne döner. Seçimler <html> üzerine data-… olarak yazılır; gerisini CSS yapar.
   İki tür hesap vardır: "cihaz" (kullanıcı adı ve şifre yalnızca bu cihazda) ve "wp" (WordPress.com hesabıyla giriş; aşağıda WP bölümü).
   İkisinde de kayıtlı rotalar ve görünüm ayarları bu cihazda durur. */
globalThis.ZR_HESAP = (() => {
  "use strict";
  const K_H = "zr.hesaplar.v1", K_O = "zr.oturum.v1", K_M = "zr.rotalar.v1", K_U = "zr.rotalar.u.", K_G = "zr.gorunum.v1", K_GU = "zr.gorunum.u.";
  const ls = {
    al(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    yaz(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    sil(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  const oku = (k, bos) => { try { const v = JSON.parse(ls.al(k) || "null"); return v == null ? bos : v; } catch (e) { return bos; } };
  const kimlik = (ad) => String(ad || "").trim().toLocaleLowerCase("tr");
  const hesaplar = () => { const v = oku(K_H, {}); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; };
  function aktif() { const id = ls.al(K_O), h = hesaplar(); return id && h[id] ? { id, ad: h[id].ad, t: h[id].t, tur: h[id].tur === "wp" ? "wp" : "cihaz", kullanici: h[id].kullanici || "" } : null; }
  const cihazHesabiVar = () => Object.values(hesaplar()).some((k) => k && k.tur !== "wp");
  const anahtar = () => { const a = aktif(); return a ? K_U + a.id : K_M; };
  const gecerli = (r) => r && typeof r.name === "string" && Array.isArray(r.keys) && r.start && typeof r.start.lat === "number";
  const listeOku = (k) => { const v = oku(k, []); return Array.isArray(v) ? v.filter(gecerli) : []; };
  const rotalar = () => listeOku(anahtar());
  const rotalariYaz = (list) => { const ok = ls.yaz(anahtar(), JSON.stringify(list)); duyur(); return ok; };
  const misafirRotalari = () => listeOku(K_M);

  const dinleyen = new Set();
  const duyur = () => { for (const f of dinleyen) { try { f(); } catch (e) {} } };
  const dinle = (f) => { dinleyen.add(f); return () => dinleyen.delete(f); };
  try { window.addEventListener("storage", (e) => { if (!e.key || e.key.indexOf("zr.") === 0) duyur(); }); } catch (e) {}

  // Görünüm seçenekleri. Her listenin ilk değeri varsayılandır.
  const G_SEC = { rozet: ["altin", "lacivert", "zumrut", "gul", "gumus"], desen: ["yildiz", "semse", "yok"], cizgi: ["varsayilan", "altin", "turkuaz", "gul", "yesil"], stil: ["nokta", "kesik", "duz"], isaret: ["karisik", "igne", "daire"], hareket: ["acik", "az"] };
  const gDuzelt = (v) => { const o = {}; for (const k in G_SEC) o[k] = v && G_SEC[k].includes(v[k]) ? v[k] : G_SEC[k][0]; return o; };
  const gorunum = () => gDuzelt(aktif() ? oku(K_G, null) : null);
  function gorunumUygula() {
    const o = gorunum(), d = document.documentElement;
    for (const k in o) { if (o[k] === G_SEC[k][0]) d.removeAttribute("data-" + k); else d.setAttribute("data-" + k, o[k]); }
  }
  function gorunumYaz(yeni) {
    const a = aktif(); if (!a) return false;
    const o = gDuzelt({ ...gorunum(), ...yeni }), m = JSON.stringify(o), ok = ls.yaz(K_G, m);
    ls.yaz(K_GU + a.id, m); gorunumUygula(); duyur();
    return ok;
  }
  // Oturum değişince: hesabın kayıtlı görünümü etkin kopyaya alınır; oturum yoksa etkin kopya silinir.
  function gorunumOturum() {
    const a = aktif(), m = a ? ls.al(K_GU + a.id) : null;
    if (m) ls.yaz(K_G, m); else ls.sil(K_G);
    gorunumUygula();
  }
  try { gorunumUygula(); window.addEventListener("storage", (e) => { if (!e.key || e.key === K_G || e.key === K_O) gorunumUygula(); }); } catch (e) {}

  const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  const kripto = () => (globalThis.crypto && globalThis.crypto.subtle ? globalThis.crypto : null);
  async function ozet(sifre, tuzHex) {
    const c = kripto(); if (!c) throw new Error("guvenli");
    const tuz = new Uint8Array(tuzHex.match(/../g).map((h) => parseInt(h, 16)));
    const anah = await c.subtle.importKey("raw", new TextEncoder().encode(sifre), "PBKDF2", false, ["deriveBits"]);
    return hex(await c.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: tuz, iterations: 150000 }, anah, 256));
  }
  const esit = (a, b) => { if (a.length !== b.length) return false; let f = 0; for (let i = 0; i < a.length; i++) f |= a.charCodeAt(i) ^ b.charCodeAt(i); return f === 0; };

  const AD_KURAL = /^[\p{L}\p{N}._-]{3,24}$/u;
  function denetle(ad, sifre) {
    if (!AD_KURAL.test(String(ad || "").trim())) return "Kullanıcı adı 3–24 karakter olmalı; harf, rakam, nokta, alt çizgi ve tire kullanabilirsin.";
    if (String(sifre || "").length < 6) return "Şifre en az 6 karakter olmalı.";
    return "";
  }
  async function kayit(ad, sifre) {
    const hata = denetle(ad, sifre); if (hata) return { ok: false, hata };
    if (!kripto()) return { ok: false, hata: "Bu tarayıcı güvenli şifre saklamayı desteklemiyor ya da sayfa güvenli (https) adresten açılmadı." };
    const h = hesaplar(), id = kimlik(ad);
    if (h[id]) return { ok: false, hata: "Bu kullanıcı adı zaten var. Giriş yapmayı dene." };
    const tuz = hex(kripto().getRandomValues(new Uint8Array(16)));
    h[id] = { ad: String(ad).trim(), tuz, ozet: await ozet(sifre, tuz), t: Date.now() };
    if (!ls.yaz(K_H, JSON.stringify(h))) return { ok: false, hata: "Tarayıcı kayda izin vermedi. Gizli pencerede olabilirsin." };
    ls.yaz(K_O, id); gorunumOturum(); duyur();
    return { ok: true, misafir: misafirRotalari().length };
  }
  async function giris(ad, sifre) {
    const h = hesaplar(), id = kimlik(ad), kay = h[id];
    if (!kay || kay.tur === "wp") return { ok: false, hata: "Böyle bir kullanıcı adı bulunamadı. Yazımı kontrol et ya da hesap oluştur." };
    if (!kripto()) return { ok: false, hata: "Sayfa güvenli (https) adresten açılmadığı için giriş yapılamıyor." };
    if (!esit(await ozet(sifre, kay.tuz), kay.ozet)) return { ok: false, hata: "Şifre yanlış." };
    ls.yaz(K_O, id); gorunumOturum(); duyur();
    return { ok: true, misafir: misafirRotalari().length };
  }
  function cikis() { ls.sil(K_O); gorunumOturum(); duyur(); }
  async function sifreDegis(eski, yeni) {
    const a = aktif(); if (!a) return { ok: false, hata: "Önce giriş yap." };
    if (String(yeni || "").length < 6) return { ok: false, hata: "Yeni şifre en az 6 karakter olmalı." };
    const h = hesaplar(), kay = h[a.id];
    if (kay.tur === "wp") return { ok: false, hata: "Bu hesabın şifresi WordPress.com'da değiştirilir." };
    if (!esit(await ozet(eski, kay.tuz), kay.ozet)) return { ok: false, hata: "Şimdiki şifre yanlış." };
    kay.tuz = hex(kripto().getRandomValues(new Uint8Array(16))); kay.ozet = await ozet(yeni, kay.tuz);
    return ls.yaz(K_H, JSON.stringify(h)) ? { ok: true } : { ok: false, hata: "Tarayıcı kayda izin vermedi." };
  }
  async function hesabiSil(sifre) {
    const a = aktif(); if (!a) return { ok: false, hata: "Önce giriş yap." };
    const h = hesaplar(), kay = h[a.id];
    if (kay.tur !== "wp" && !esit(await ozet(sifre, kay.tuz), kay.ozet)) return { ok: false, hata: "Şifre yanlış." };
    delete h[a.id]; ls.yaz(K_H, JSON.stringify(h)); ls.sil(K_U + a.id); ls.sil(K_GU + a.id); ls.sil(K_O); gorunumOturum(); duyur();
    return { ok: true };
  }
  // Giriş yapmadan kaydedilmiş rotaları hesaba taşır (aynı adlı rota varsa hesaptaki kalır).
  function misafiriTasi() {
    const a = aktif(); if (!a) return 0;
    const m = misafirRotalari(); if (!m.length) return 0;
    const benim = listeOku(K_U + a.id), adlar = new Set(benim.map((r) => r.name));
    const yeni = m.filter((r) => !adlar.has(r.name));
    ls.yaz(K_U + a.id, JSON.stringify([...yeni, ...benim])); ls.sil(K_M); duyur();
    return yeni.length;
  }
  // Bu cihazdaki eski (cihaz türü) bir hesabın rotalarını şimdiki hesaba taşır. Eski hesabın şifresi sorulur: ortak kullanılan bir cihazda
  // başkasının rotaları alınamasın. Aynı adlı rota varsa şimdiki hesaptaki kalır; eski hesap silinmez.
  async function eskidenTasi(ad, sifre) {
    const a = aktif(); if (!a) return { ok: false, hata: "Önce giriş yap." };
    const h = hesaplar(), id = kimlik(ad), kay = h[id];
    if (!kay || kay.tur === "wp" || id === a.id) return { ok: false, hata: "Bu cihazda böyle bir eski hesap bulunamadı." };
    if (!kripto()) return { ok: false, hata: "Sayfa güvenli (https) adresten açılmadığı için şifre denetlenemiyor." };
    if (!esit(await ozet(sifre, kay.tuz), kay.ozet)) return { ok: false, hata: "Şifre yanlış." };
    const benim = listeOku(K_U + a.id), adlar = new Set(benim.map((r) => r.name)), yeni = listeOku(K_U + id).filter((r) => !adlar.has(r.name));
    if (yeni.length && !ls.yaz(K_U + a.id, JSON.stringify([...yeni, ...benim]))) return { ok: false, hata: "Tarayıcı kayda izin vermedi." };
    const g = ls.al(K_GU + id); if (g && !ls.al(K_GU + a.id)) { ls.yaz(K_GU + a.id, g); gorunumOturum(); }
    duyur();
    return { ok: true, n: yeni.length };
  }

  /* ——— WordPress.com hesabıyla giriş (WordPress.com Connect) ———
     Sunucumuz olmadığı için tarayıcı akışı kullanılır: ziyaretçi WordPress.com'un ekranına gider, orada giriş yapar ya da e-postasıyla hesap açar,
     onay verince bu sayfaya kısa ömürlü bir jetonla döner. Jetonla yalnızca "ben kimim" sorusu sorulur (kapsam: auth); ad ve kullanıcı adı alınır,
     e-posta adresi istenmez, jeton saklanmaz ve adres çubuğundan hemen silinir. Şifre bu siteye hiç gelmez.
     WP_ISTEMCI: developer.wordpress.com/apps üzerinde açılan uygulamanın "Client ID" sayısı. Herkese açık bir sayıdır (giriş adresinde görünür);
     "Client Secret" burada kullanılmaz ve depoya yazılmaz. Sayı boşken bu giriş yolu sitede görünmez. */
  const WP_ISTEMCI = "";
  const yerelDeneme = (() => { try { return /^(localhost|127\.0\.0\.1)$/.test(location.hostname); } catch (e) { return false; } })();
  const WP = { istemci: String((yerelDeneme && globalThis.ZR_WP_ISTEMCI) || WP_ISTEMCI), taban: (yerelDeneme && globalThis.ZR_WP_TABAN) || "https://public-api.wordpress.com" };
  const K_W = "zr.wp.bekleyen", WP_SURE = 15 * 60000;
  const wpAcik = () => !!WP.istemci;
  const wpDonusAdresi = () => location.origin + "/hesabim/";
  // Dönüş adresindeki jeton, başka hiçbir betik adresi okumadan önce alınır ve adres çubuğundan silinir (geçmişte ve yer imlerinde kalmasın).
  let wpGelen = null;
  try {
    const h = new URLSearchParams(location.hash.replace(/^#/, "")), q = new URLSearchParams(location.search);
    if (h.get("access_token") || ((h.get("error") || q.get("error")) && ls.al(K_W))) {
      wpGelen = { jeton: h.get("access_token") || "", hata: h.get("error") || q.get("error") || "", durum: h.get("state") };
      history.replaceState(null, "", location.pathname);
    }
    // Sayfa açıkken adrese sonradan eklenen bir jeton işlenmez, yalnızca adres çubuğundan silinir.
    window.addEventListener("hashchange", () => { if (/(^#|&)access_token=/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search); });
  } catch (e) {}
  function wpBasla() {
    if (!wpAcik()) return { ok: false, hata: "WordPress.com ile giriş henüz açılmadı." };
    let s; try { s = hex(globalThis.crypto.getRandomValues(new Uint8Array(16))); } catch (e) { return { ok: false, hata: "Bu tarayıcı güvenli giriş için gereken rastgele sayıyı üretemiyor." }; }
    if (!ls.yaz(K_W, JSON.stringify({ s, t: Date.now() }))) return { ok: false, hata: "Tarayıcı kayda izin vermedi. Gizli pencerede olabilirsin." };
    location.assign(WP.taban + "/oauth2/authorize?client_id=" + encodeURIComponent(WP.istemci) + "&redirect_uri=" + encodeURIComponent(wpDonusAdresi()) + "&response_type=token&scope=auth&state=" + s);
    return { ok: true };
  }
  // Dönüşü tamamlar. Sonuç: null (dönüş yok) ya da { ok, hata?, ilk?, misafir? }.
  async function wpTamamla() {
    const g = wpGelen; wpGelen = null; if (!g) return null;
    const bek = oku(K_W, null); ls.sil(K_W);
    if (g.hata) return { ok: false, hata: g.hata === "access_denied" ? "Giriş onaylanmadı. İstersen yeniden deneyebilirsin." : "WordPress.com girişi tamamlanamadı. Yeniden dene." };
    // Giriş bu cihazdan, az önce başlatılmış olmalı; WordPress.com "state" değerini geri yollarsa aynı olmalı.
    if (!wpAcik() || !bek || typeof bek.t !== "number" || Date.now() - bek.t > WP_SURE || (g.durum != null && g.durum !== bek.s)) return { ok: false, hata: "Bu giriş isteği bu cihazdan başlatılmamış ya da süresi dolmuş. “WordPress.com ile giriş yap”a yeniden dokun." };
    let kim;
    try {
      // Jeton bizim uygulamamız için mi verilmiş? Bu soru yanıtsız kalırsa (ağ ya da tarayıcı engeli) sonraki istek yine korur:
      // WordPress.com, kimlik isteğine yalnızca jetonun ait olduğu uygulamanın izinli adreslerinden gelince yanıt verir.
      let bilgi = null;
      try { const r = await fetch(WP.taban + "/oauth2/token-info?client_id=" + encodeURIComponent(WP.istemci) + "&token=" + encodeURIComponent(g.jeton), { credentials: "omit" }); bilgi = { ok: r.ok, j: r.ok ? await r.json() : null }; } catch (e) {}
      if (bilgi && (!bilgi.ok || !bilgi.j || String(bilgi.j.client_id) !== WP.istemci)) return { ok: false, hata: "Bu giriş bu site için verilmemiş. “WordPress.com ile giriş yap”a yeniden dokun." };
      const r = await fetch(WP.taban + "/rest/v1.1/me?fields=ID,display_name,username,verified", { headers: { Authorization: "Bearer " + g.jeton }, credentials: "omit" });
      if (!r.ok) throw new Error("http " + r.status);
      kim = await r.json();
    } catch (e) { return { ok: false, hata: "WordPress.com hesabın okunamadı. Bağlantını kontrol edip yeniden dene." }; }
    if (!kim || !/^\d+$/.test(String(kim.ID))) return { ok: false, hata: "WordPress.com hesabın okunamadı. Yeniden dene." };
    if (kim.verified === false) return { ok: false, hata: "WordPress.com e-posta adresini henüz doğrulamamışsın. Sana gelen e-postadaki bağlantıya dokun, sonra yeniden giriş yap." };
    const id = "wp:" + kim.ID, h = hesaplar(), ilk = !h[id];
    h[id] = { t: Date.now(), ...(h[id] || {}), tur: "wp", ad: String(kim.display_name || kim.username || "Üye").trim().slice(0, 60) || "Üye", kullanici: String(kim.username || "").slice(0, 60) };
    if (!ls.yaz(K_H, JSON.stringify(h))) return { ok: false, hata: "Tarayıcı kayda izin vermedi. Gizli pencerede olabilirsin." };
    ls.yaz(K_O, id); gorunumOturum(); duyur();
    return { ok: true, ilk, misafir: misafirRotalari().length };
  }
  const wp = { acik: wpAcik, basla: wpBasla, tamamla: wpTamamla, bekliyor: () => !!wpGelen };
  return { aktif, rotalar, rotalariYaz, misafirRotalari, misafiriTasi, kayit, giris, cikis, sifreDegis, hesabiSil, denetle, dinle, gorunum, gorunumYaz, G_SEC, cihazHesabiVar, eskidenTasi, wp };
})();
