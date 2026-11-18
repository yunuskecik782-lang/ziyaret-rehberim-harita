/* Hesap ve kayıtlı rotalar. Sunucu yok: hesap ve rotalar yalnızca bu cihazda, bu tarayıcıda (localStorage) durur.
   Şifre düz yazıyla saklanmaz; rastgele tuzla PBKDF2-SHA-256 özeti tutulur. Sunucu tarafı kurulduğunda bu dosyanın yerini o alır. */
globalThis.ZR_HESAP = (() => {
  "use strict";
  const K_H = "zr.hesaplar.v1", K_O = "zr.oturum.v1", K_M = "zr.rotalar.v1", K_U = "zr.rotalar.u.";
  const ls = {
    al(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    yaz(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    sil(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  const oku = (k, bos) => { try { const v = JSON.parse(ls.al(k) || "null"); return v == null ? bos : v; } catch (e) { return bos; } };
  const kimlik = (ad) => String(ad || "").trim().toLocaleLowerCase("tr");
  const hesaplar = () => { const v = oku(K_H, {}); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; };
  function aktif() { const id = ls.al(K_O), h = hesaplar(); return id && h[id] ? { id, ad: h[id].ad, t: h[id].t } : null; }
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
    ls.yaz(K_O, id); duyur();
    return { ok: true, misafir: misafirRotalari().length };
  }
  async function giris(ad, sifre) {
    const h = hesaplar(), id = kimlik(ad), kay = h[id];
    if (!kay) return { ok: false, hata: "Böyle bir kullanıcı adı bulunamadı. Yazımı kontrol et ya da hesap oluştur." };
    if (!kripto()) return { ok: false, hata: "Sayfa güvenli (https) adresten açılmadığı için giriş yapılamıyor." };
    if (!esit(await ozet(sifre, kay.tuz), kay.ozet)) return { ok: false, hata: "Şifre yanlış." };
    ls.yaz(K_O, id); duyur();
    return { ok: true, misafir: misafirRotalari().length };
  }
  function cikis() { ls.sil(K_O); duyur(); }
  async function sifreDegis(eski, yeni) {
    const a = aktif(); if (!a) return { ok: false, hata: "Önce giriş yap." };
    if (String(yeni || "").length < 6) return { ok: false, hata: "Yeni şifre en az 6 karakter olmalı." };
    const h = hesaplar(), kay = h[a.id];
    if (!esit(await ozet(eski, kay.tuz), kay.ozet)) return { ok: false, hata: "Şimdiki şifre yanlış." };
    kay.tuz = hex(kripto().getRandomValues(new Uint8Array(16))); kay.ozet = await ozet(yeni, kay.tuz);
    return ls.yaz(K_H, JSON.stringify(h)) ? { ok: true } : { ok: false, hata: "Tarayıcı kayda izin vermedi." };
  }
  async function hesabiSil(sifre) {
    const a = aktif(); if (!a) return { ok: false, hata: "Önce giriş yap." };
    const h = hesaplar(), kay = h[a.id];
    if (!esit(await ozet(sifre, kay.tuz), kay.ozet)) return { ok: false, hata: "Şifre yanlış." };
    delete h[a.id]; ls.yaz(K_H, JSON.stringify(h)); ls.sil(K_U + a.id); ls.sil(K_O); duyur();
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
  return { aktif, rotalar, rotalariYaz, misafirRotalari, misafiriTasi, kayit, giris, cikis, sifreDegis, hesabiSil, denetle, dinle };
})();
