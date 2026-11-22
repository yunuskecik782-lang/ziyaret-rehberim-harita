/* Sayfa davranışları: üst şerit, telefon menüsü, giriş animasyonları, rota haritası ve sokak tarifi,
   konuma göre ulaşım önerisi, hesap ve kayıtlı rotalar. ZR_YER ve ZR_IC değerlerini site/build.js bu dosyanın başına ekler. */
(() => {
  "use strict";
  window.ZR_HAZIR = 1;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ZR_IC[n] || ""}</svg>`;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sayfa = document.body.dataset.sayfa, HESAP = globalThis.ZR_HESAP, YOL = globalThis.ZR_YOL;
  const genis = matchMedia("(min-width: 900px)"), dokunmatik = matchMedia("(pointer: coarse)").matches;
  const veri = (() => { try { return JSON.parse($("#veri").textContent); } catch (e) { return null; } })();
  const RAD = Math.PI / 180, olc = (a, b) => { const x = (b[1] - a[1]) * RAD * Math.cos(((a[0] + b[0]) / 2) * RAD), y = (b[0] - a[0]) * RAD; return Math.hypot(x, y) * 6371000; };
  const fmtD = (m) => (m < 1000 ? Math.max(10, Math.round(m / 10) * 10) + " m" : (m / 1000).toFixed(1).replace(".", ",") + " km");
  const dkYuru = (m) => Math.max(1, Math.round(m / 75)); // dakikada 75 m: sitedeki sürelerle aynı ölçü
  const fmtDk = (t) => (t < 60 ? t + " dk" : Math.floor(t / 60) + " sa" + (t % 60 ? " " + (t % 60) + " dk" : ""));

  /* ——— Bildirim ——— */
  const bil = $(".bildirim"); let bilT;
  const bildir = (m) => { bil.textContent = m; bil.classList.add("gor"); clearTimeout(bilT); bilT = setTimeout(() => bil.classList.remove("gor"), 3400); };

  /* ——— Üst şerit ve telefon menüsü ——— */
  const ust = $(".ust"), mb = $(".menu-btn"), menu = $("#menu");
  const kaydi = () => ust.classList.toggle("kaydi", scrollY > 8);
  addEventListener("scroll", kaydi, { passive: true }); kaydi();
  function menuAc(a) {
    document.body.classList.toggle("menu-acik", a); mb.setAttribute("aria-expanded", a); mb.setAttribute("aria-label", a ? "Menüyü kapat" : "Menü");
    menu.inert = !a; document.documentElement.style.overflow = a ? "hidden" : "";
  }
  mb.addEventListener("click", () => menuAc(!document.body.classList.contains("menu-acik")));
  menu.addEventListener("click", (e) => { if (e.target.closest("a") || e.target.classList.contains("menu-zemin")) menuAc(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") menuAc(false); });
  genis.addEventListener("change", () => menuAc(false));
  addEventListener("pageshow", (e) => { if (e.persisted) menuAc(false); });

  /* ——— Geniş ekran: sol sütun. "Menü" düğmesi sütunun en başındadır; sütun kapalıyken soldaki ince şeritteki düğme açar.
     1480 pikselden geniş ekranda sütun sabit durur (kapatılırsa tercih saklanır), daha dar masaüstünde sayfanın üstüne açılır.
     Tam ekran harita sayfasında hep üstüne açılır. ——— */
  const yan = $("#yan"), ac = $(".yan-ac"), kapa = $(".yan-kapa"), kok = document.documentElement;
  if (yan && ac && kapa) {
    const sabit = matchMedia("(min-width: 1480px)"), sabitMi = () => sabit.matches && sayfa !== "rota-olustur";
    const acikMi = () => (sabitMi() ? !kok.classList.contains("yan-kapali") : kok.classList.contains("yan-acik"));
    const kay = $(".yan-kay");
    const yaz = () => { const a = acikMi(); ac.setAttribute("aria-expanded", a); kapa.setAttribute("aria-expanded", a); yan.inert = !a; };
    const ayarla = (a, odak) => {
      if (sabitMi()) {
        kok.classList.toggle("yan-kapali", !a); try { localStorage.setItem("zr.yan", a ? "1" : "0"); } catch (e) {}
      } else kok.classList.toggle("yan-acik", a);
      yaz();
      if (odak) (a ? kapa : ac).focus({ preventScroll: true });
    };
    ac.addEventListener("click", () => ayarla(true, true));
    kapa.addEventListener("click", () => ayarla(false, true));
    // Şeritteki kısayol: sütunu açar, o grubu açıp başa getirir
    $$(".yan-ray [data-grup]").forEach((b) => b.addEventListener("click", () => {
      const g = document.getElementById(b.dataset.grup); ayarla(true);
      if (g) { g.open = true; kay.scrollTo({ top: Math.max(0, g.offsetTop - 64), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }
    }));
    $(".yan-perde").addEventListener("click", () => ayarla(false));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !sabitMi() && acikMi()) ayarla(false, true); });
    yan.addEventListener("click", (e) => { if (e.target.closest("a") && !sabitMi()) ayarla(false); });
    const dar = () => { kok.classList.remove("yan-acik"); yaz(); };
    sabit.addEventListener("change", dar); genis.addEventListener("change", dar);
    addEventListener("pageshow", (e) => { if (e.persisted) dar(); });
    // Sayfa değişince sütun kaldığı yerden devam etsin
    try { const y = +sessionStorage.getItem("zr.yan.y"); if (y) kay.scrollTop = y; } catch (e) {}
    addEventListener("pagehide", () => { try { sessionStorage.setItem("zr.yan.y", kay.scrollTop); } catch (e) {} });
    yaz();
  }
  // Üst şeritteki "Güzergâhlar" listesi: fareyle üstüne gelince açılır; dokunmatik ekranda ve klavyede düğmeyle açılıp kapanır
  $$(".acilir").forEach((d) => {
    const b = $("button", d), yaz = (a) => { d.classList.toggle("acik", a); b.setAttribute("aria-expanded", a); };
    b.addEventListener("click", (e) => { e.preventDefault(); yaz(!d.classList.contains("acik")); });
    d.addEventListener("mouseleave", () => yaz(false));
    d.addEventListener("focusout", (e) => { if (!d.contains(e.relatedTarget)) yaz(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && d.classList.contains("acik")) { yaz(false); b.focus(); } });
  });

  /* ——— Site içi arama: duraklar, rotalar ve sayfa bölümleri ———
     Dizin (a/ara.json) site/build.js ile üretilir; pencere ilk açıldığında bir kez yüklenir. Arama tamamen tarayıcıda yapılır,
     yazılan hiçbir şey bir yere gönderilmez. Türkçe harfler ve şapkalar eşit sayılır: "eyup" yazan "Eyüp"ü, "ebu" yazan "Ebû"yu bulur. */
  const araK = $("#ara"), araQ = $("#ara-q"), araS = $("#ara-sonuc"), araN = $("#ara-say");
  if (araK && araQ && typeof araK.showModal === "function") {
    const katla = (t) => String(t || "").toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/[’'`.,·:;()]/g, " ").replace(/\s+/g, " ").trim();
    let dizin = null, yukleniyor = null, sonQ = null;
    const yukle = () => yukleniyor || (yukleniyor = fetch(ZR_YER.kok + "a/ara.json", { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((v) => {
      const R = v.r.map((r) => ({ id: r[0], no: r[1], ad: r[2], yol: r[3], alt: r[4], say: r[5] }));
      const og = [];
      R.forEach((r) => og.push({ t: "rota", ad: r.ad, ust: `Rota ${r.no} · ${r.say} durak`, alt: r.alt, u: r.yol, rid: r.id, no: r.no }));
      v.d.forEach((d) => { const r = R[d[0]]; og.push({ t: "durak", ad: d[2], hon: d[3], ust: `Rota ${r.no} · ${r.ad}`, alt: [d[4], d[5]].filter(Boolean).join(" · "), u: r.yol + "#durak-" + d[1], rid: r.id, no: d[1] }); });
      v.s.forEach((x) => og.push({ t: "sayfa", ad: x[0], ust: x[3] || "Sayfa", alt: x[1], u: x[2] }));
      og.forEach((o) => { o.k = katla(o.ad); o.h = katla([o.ad, o.hon, o.alt, o.ust].join(" ")); });
      return (dizin = { R, og });
    }).catch((e) => { yukleniyor = null; throw e; }));
    function puanla(o, kel) {
      let p = 0;
      for (const w of kel) {
        if (!o.h.includes(w)) return 0;
        p += o.k.startsWith(w) ? 30 : (" " + o.k).includes(" " + w) ? 20 : o.k.includes(w) ? 12 : (" " + o.h).includes(" " + w) ? 6 : 3;
      }
      return p + (o.t === "rota" ? 4 : o.t === "sayfa" ? 1 : 0);
    }
    const satir = (o) => `<li><a class="ara-o a-${o.t}" href="${esc(o.u)}"><span class="ara-sim">${o.t === "sayfa" ? ic("bilgi") : `<b>${esc(o.no)}</b>`}</span><span class="ara-y"><small>${esc(o.ust)}</small><b>${esc(o.ad)}${o.hon ? ` <em>${esc(o.hon)}</em>` : ""}</b>${o.alt ? `<span>${esc(o.alt)}</span>` : ""}</span>${ic("fwd")}</a></li>`;
    function ara() {
      const q = araQ.value, kel = katla(q).split(" ").filter(Boolean);
      if (q === sonQ && araS.childElementCount) return;
      sonQ = q;
      if (!dizin) {
        araS.innerHTML = '<p class="ara-bos">Dizin yükleniyor…</p>';
        yukle().then(() => { sonQ = null; ara(); }, () => { araS.innerHTML = '<p class="ara-bos">Arama şu an açılamadı. Sayfayı yenileyip yeniden dene.</p>'; araN.textContent = ""; });
        return;
      }
      if (!kel.length) {
        araS.innerHTML = `<p class="ara-bas">Hazır rotalar</p><ul class="ara-liste">${dizin.og.filter((o) => o.t === "rota").map(satir).join("")}</ul><p class="ara-ipucu"><span>Örnek:</span><button type="button">Eyüp</button><button type="button">Süleymaniye</button><button type="button">Ebû Eyyûb</button><button type="button">İstanbulkart</button></p>`;
        araN.textContent = "";
        return;
      }
      const bul = dizin.og.map((o) => [puanla(o, kel), o]).filter((x) => x[0] > 0).sort((a, b) => b[0] - a[0] || a[1].ad.localeCompare(b[1].ad, "tr"));
      if (!bul.length) {
        araS.innerHTML = `<p class="ara-bos"><b>“${esc(q.trim())}” için sonuç yok.</b> Yazımı kontrol et ya da daha kısa yaz, örneğin yalnızca semt adını. Aradığın yer rehberde yoksa <a href="${ZR_YER.olustur}">haritada</a> çevresine bakabilirsin.</p>`;
        araN.textContent = "Sonuç yok.";
        return;
      }
      const ilk = bul.slice(0, 24).map((x) => x[1]);
      araS.innerHTML = `<ul class="ara-liste">${ilk.map(satir).join("")}</ul>${bul.length > ilk.length ? `<p class="ara-not2">İlk ${ilk.length} sonuç gösteriliyor; aramayı daralt.</p>` : ""}`;
      araN.textContent = bul.length + " sonuç";
    }
    const sonucLinkleri = () => $$(".ara-o", araS);
    function araAc(q) {
      if (!araK.open) { menuAc(false); araK.showModal(); document.documentElement.classList.add("ara-acik"); }
      if (q != null) araQ.value = q;
      sonQ = null; ara(); araQ.focus();
      if (q != null) { const n = araQ.value.length; try { araQ.setSelectionRange(n, n); } catch (e) {} }
    }
    araK.addEventListener("close", () => document.documentElement.classList.remove("ara-acik"));
    araK.addEventListener("click", (e) => {
      if (e.target === araK || e.target.closest(".ara-kapa")) { araK.close(); return; }
      const ip = e.target.closest(".ara-ipucu button");
      if (ip) { araQ.value = ip.textContent; ara(); araQ.focus(); return; }
      const a = e.target.closest("a");
      if (a) { const h = new URL(a.href, location.href); if (h.pathname === location.pathname && h.hash) araK.close(); }
    });
    araQ.addEventListener("input", ara);
    $(".ara-ust", araK).addEventListener("submit", (e) => { e.preventDefault(); const a = sonucLinkleri()[0]; if (a) a.click(); });
    araK.addEventListener("keydown", (e) => {
      // Esc her zaman kapatır (arama türündeki alanda tarayıcı önce yazıyı silmeye çalışır)
      if (e.key === "Escape") { e.preventDefault(); araK.close(); return; }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const l = sonucLinkleri();
      if (!l.length) return;
      const i = l.indexOf(document.activeElement);
      e.preventDefault();
      if (e.key === "ArrowDown") (l[i + 1] || l[0]).focus();
      else if (i <= 0) araQ.focus();
      else l[i - 1].focus();
    });
    $$(".ara-ac").forEach((b) => b.addEventListener("click", () => araAc()));
    $$("form[data-ara]").forEach((f) => {
      const g = $("input", f);
      f.addEventListener("submit", (e) => { e.preventDefault(); araAc(g.value); g.value = ""; });
      g.addEventListener("input", () => { const v = g.value; g.value = ""; araAc(v); });
    });
    addEventListener("keydown", (e) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || araK.open) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
      e.preventDefault(); araAc();
    });
    // Aramadan gelinen durak kartı kısa süre vurgulanır (rota sayfası)
    const durakVurgu = () => { const d = /^#durak-\d+$/.test(location.hash) && $(location.hash); if (d) { d.classList.add("vurgu"); setTimeout(() => d.classList.remove("vurgu"), 2600); } };
    addEventListener("hashchange", durakVurgu); durakVurgu();
  } else {
    $$(".ara-ac").forEach((b) => (b.hidden = true));
    $$("form[data-ara]").forEach((f) => (f.hidden = true));
  }

  /* ——— Hesap durumu: "Giriş yap" yerine kullanıcı adı ——— */
  function hesapYaz() {
    const a = HESAP && HESAP.aktif();
    $$("[data-hesap-ad]").forEach((el) => { el.textContent = a ? (a.ad.length > 16 ? a.ad.slice(0, 15) + "…" : a.ad) : el.dataset.hesapAd; });
    // Yuvarlak düğme: girişte adın baş harfi, girişsiz kişi simgesi. Menünün başında ad ve hesap türü.
    const harf = a ? esc(a.ad.trim().charAt(0).toLocaleUpperCase("tr") || "?") : ic("user");
    $$("[data-kisi-yuz]").forEach((el) => { el.innerHTML = harf; });
    $$(".ust .giris").forEach((b) => { b.classList.toggle("girisli", !!a); b.title = a ? a.ad + " · Hesabım ve ayarlar" : "Giriş yap · Ayarlar"; });
    $$("[data-kisi-ad]").forEach((el) => { el.textContent = a ? a.ad : "Giriş yapmadın"; });
    $$("[data-kisi-alt]").forEach((el) => { el.textContent = a ? (a.eposta || (a.tur === "wp" ? "WordPress.com hesabı" : "Bu cihazdaki hesap")) : "Rotalarını hesabında saklamak için giriş yap"; });
    $$("[data-kisi-giris]").forEach((el) => { el.hidden = !!a; });
    $$("[data-kisi-profil], [data-kisi-cikis]").forEach((el) => { el.hidden = !a; });
  }
  hesapYaz(); if (HESAP) HESAP.dinle(hesapYaz);
  (() => {
    const kisi = $(".ust .kisi"); if (!kisi) return;
    const b = $(".giris", kisi), m = $("#kisi-menu", kisi);
    const ac = (a) => { m.hidden = !a; b.setAttribute("aria-expanded", a); };
    b.addEventListener("click", () => ac(m.hidden));
    document.addEventListener("click", (e) => { if (!m.hidden && !kisi.contains(e.target)) ac(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !m.hidden) { ac(false); b.focus(); } });
    m.addEventListener("click", (e) => {
      if (e.target.closest("a")) ac(false);
      if (e.target.closest("[data-kisi-cikis]") && HESAP) { HESAP.cikis(); ac(false); bildir("Çıkış yapıldı."); }
    });
  })();

  /* ——— Aşağı indikçe beliren kartlar ———
     Sayfa açıldığında ekranda olan her şey olduğu gibi görünür (ikinci bir belirme, titreme olmaz). Yalnızca ekranın altında kalan kartlar
     gizlenir; ziyaretçi oraya inince yumuşakça yükselip belirir. Gizleme ekran dışında yapıldığı için göze görünmez. */
  const gz = $$("[data-g]");
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target; io.unobserve(el);
      el.classList.add("acil"); el.classList.remove("bekle");
      setTimeout(() => el.classList.remove("acil"), 1400);
    }), { rootMargin: "0px 0px -4% 0px", threshold: 0.04 });
    const alt = innerHeight * 0.98;
    gz.forEach((el) => { if (el.getBoundingClientRect().top > alt) { el.classList.add("bekle"); io.observe(el); } });
  }

  /* ——— Sayfa içi bağlantı şeridi (Ücretler ve Saatler) ——— */
  const capa = $(".capa");
  if (capa && "IntersectionObserver" in window) {
    const ba = $$("a", capa), he = ba.map((a) => $(a.getAttribute("href")));
    const io = new IntersectionObserver(() => {
      let sec = 0; he.forEach((h, i) => { if (h && h.getBoundingClientRect().top < innerHeight * 0.45) sec = i; });
      ba.forEach((a, i) => a.classList.toggle("secili", i === sec));
    }, { rootMargin: "-20% 0px -50% 0px", threshold: [0, 0.2, 1] });
    he.forEach((h) => h && io.observe(h));
    addEventListener("scroll", () => { let sec = 0; he.forEach((h, i) => { if (h && h.getBoundingClientRect().top < innerHeight * 0.45) sec = i; }); ba.forEach((a, i) => a.classList.toggle("secili", i === sec)); }, { passive: true });
    ba[0].classList.add("secili");
  }

  /* ——— Gömülü harita uygulamasına komut: #kategori=… · #rota=r3 · #kayit=2 ——— */
  function haritaHash(fr, h) {
    try {
      const w = fr.contentWindow;
      if (w.location.hash === "#" + h) { w.location.hash = ""; setTimeout(() => { w.location.hash = h; }, 70); } else w.location.hash = h;
    } catch (e) { fr.src = fr.dataset.src + "#" + h; }
  }

  /* ——— Ana sayfa: kategori ve "Haritada başlat" düğmeleri aynı sayfadaki haritayı sürer ——— */
  function ana() {
    const kutu = $(".cerceve"), fr = $("iframe", kutu); let yuklu = false;
    const yukle = (h) => { if (!yuklu) { fr.src = fr.dataset.src + (h ? "#" + h : ""); yuklu = true; } else if (h) haritaHash(fr, h); };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting) && genis.matches) { yukle(""); io.disconnect(); } }, { rootMargin: "600px" });
      io.observe(kutu);
    }
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-hash]"); if (!a || !genis.matches) return; // telefonda bağlantı tam ekran harita sayfasına gider
      e.preventDefault(); yukle(a.dataset.hash);
      $$(".kat a, .yan-ic a[data-hash]").forEach((k) => k.classList.toggle("secili", k.dataset.hash === a.dataset.hash));
      if (a.closest(".yan")) { // Sol sütundan seçilince harita ekrana tam otursun (giriş animasyonu ölçümü kaydırmasın diye yerleşim konumu kullanılır)
        let y = 0; for (let el = kutu; el; el = el.offsetParent) y += el.offsetTop;
        scrollTo({ top: y - ust.offsetHeight - 14, behavior: "smooth" });
      } else $(".kat").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ——— Rota oluştur: tam sayfa harita ——— */
  function olustur() {
    const fr = $(".tam iframe");
    fr.src = fr.dataset.src + location.hash;
    addEventListener("hashchange", () => haritaHash(fr, location.hash.slice(1)));
  }

  /* ——— Ortak harita kurulumu ——— */
  // Haritalar uydu görünümüyle açılır. Ziyaretçi düğmeyle sokak haritasına geçerse bu tercih saklanır (harita uygulamasıyla ortak anahtar).
  const KATMAN = "zr.katman.2", UYDU_K = "Uydu görüntüsü: Esri, Maxar, Earthstar Geographics", SOKAK_K = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> katkıda bulunanlar';
  function haritaKur(host, ipucuMetni, dugme, kaynak) {
    const map = L.map(host, { zoomControl: false, attributionControl: false, scrollWheelZoom: false, dragging: !dokunmatik, touchZoom: true, minZoom: 10, maxZoom: 19, zoomSnap: 0.5, maxBounds: [[40.85, 28.6], [41.25, 29.35]], maxBoundsViscosity: 0.6 });
    L.control.zoom({ position: "bottomright", zoomInTitle: "Yakınlaştır", zoomOutTitle: "Uzaklaştır" }).addTo(map);
    const sokak = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, referrerPolicy: "strict-origin-when-cross-origin" });
    const uydu = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 });
    const uyduAd = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, zIndex: 2 });
    function katman(a, sakla) {
      if (a) { map.removeLayer(sokak); uydu.addTo(map); uyduAd.addTo(map); } else { map.removeLayer(uydu); map.removeLayer(uyduAd); sokak.addTo(map); }
      host.classList.toggle("uydu", a);
      if (dugme) { dugme.setAttribute("aria-pressed", a); dugme.lastElementChild.textContent = a ? "Harita" : "Uydu"; dugme.title = a ? "Sokak haritasına geç" : "Uydu görüntüsüne geç"; }
      if (kaynak) kaynak.innerHTML = a ? UYDU_K : SOKAK_K;
      if (sakla) try { localStorage.setItem(KATMAN, a ? "uydu" : "sokak"); } catch (e) {}
    }
    let ilk = true; try { ilk = localStorage.getItem(KATMAN) !== "sokak"; } catch (e) {}
    katman(ilk);
    if (dugme) dugme.addEventListener("click", () => katman(!map.hasLayer(uydu), true));
    // Bilgisayarda fare tekerleği sayfayı kaydırır; haritaya bir kez tıklanınca yakınlaştırmaya geçer.
    map.on("click", () => map.scrollWheelZoom.enable()); host.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());
    // Kutu genişleyip daralınca (sol sütun açılıp kapanınca, pencere büyüyünce) harita yeni boyuta oturur.
    if ("ResizeObserver" in window) { let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => map.invalidateSize({ pan: false }), 140); }).observe(host); }
    // Telefonda tek parmak sayfayı kaydırır, harita iki parmakla oynar.
    if (dokunmatik) {
      const ip = document.createElement("div"); ip.className = "h-ipucu"; ip.textContent = ipucuMetni; host.appendChild(ip); let t;
      host.addEventListener("touchmove", (e) => { if (e.touches.length === 1 && !map.dragging.enabled()) { ip.classList.add("gor"); clearTimeout(t); t = setTimeout(() => ip.classList.remove("gor"), 1400); } else ip.classList.remove("gor"); }, { passive: true });
    }
    return { map };
  }
  const imk = (sinif, yazi, stil) => L.divIcon({ className: "imk " + sinif, html: `<span${stil ? ` style="${stil}"` : ""}>${yazi}</span>`, iconSize: [0, 0] });
  function konumAl(tamam, hata) {
    if (!navigator.geolocation) return hata("Bu tarayıcı konum özelliğini desteklemiyor.");
    navigator.geolocation.getCurrentPosition((p) => tamam([p.coords.latitude, p.coords.longitude], p.coords.accuracy), (e) => hata(e.code === 1 ? "Konum izni verilmedi. Tarayıcının adres çubuğundaki izinlerden açabilirsin." : "Konum alınamadı. Açık havada ya da konum servisi açıkken yeniden dene."), { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  /* ——— Bugün kapalı olan duraklar ———
     Durağın saat notunda bugünün adı ile "kapalı" aynı parçada geçiyorsa ("Pazartesi kapalı", "cuma turistik ziyarete kapalı") o parça
     kartta belirginleşir ve durak listesinin üstünde kısa bir not çıkar. Yeni bilgi üretilmez; yalnızca sayfadaki not öne alınır.
     Gün İstanbul saatine göre belirlenir. */
  function bugunKapali(toplam) {
    let gun; try { gun = new Intl.DateTimeFormat("tr-TR", { weekday: "long", timeZone: "Europe/Istanbul" }).format(new Date()).toLocaleLowerCase("tr-TR"); } catch (e) { return; }
    const harf = "a-zçğıöşüâîû", re = new RegExp("(^|[^" + harf + "])" + gun + "(?![" + harf + "])"), kapali = [];
    $$(".durak").forEach((k) => {
      const s = k.querySelector(".durak-s span"); if (!s) return;
      const par = s.textContent.split(" · "), i = par.findIndex((p) => { const kucuk = p.toLocaleLowerCase("tr-TR"); return kucuk.includes("kapalı") && re.test(kucuk); });
      if (i < 0) return;
      const r = document.createElement("em"); r.className = "bugun-r"; r.textContent = "Bugün"; s.textContent = ""; s.append(r, " ");
      par.forEach((p, j) => { if (j) s.append(" · "); if (j === i) { const b = document.createElement("strong"); b.className = "bugun-p"; b.textContent = p; s.append(b); } else s.append(p); });
      k.classList.add("bugun-k"); kapali.push(+k.id.replace("durak-", ""));
    });
    const not = $("#bugun-not"); if (!not || !kapali.length) return;
    const p = not.querySelector("p"), b = document.createElement("strong"); b.textContent = "Bugün " + gun + ".";
    p.append(b, " Bu rotadaki " + (kapali.length === toplam ? "durakların" : kapali.length + " durağın") + " saat notunda bugün için “kapalı” yazıyor: ");
    kapali.forEach((no, j) => { const a = document.createElement("a"); a.href = "#durak-" + no; a.textContent = no + ". durak"; if (j) p.append(", "); p.append(a); });
    p.append(". Saatler değişebilir; gitmeden önce doğrula.");
    not.hidden = false;
  }

  /* ——— Rota sayfası: geniş harita, numaralı duraklar, sokaklardan yürüyüş yolu ve dönüş tarifi ——— */
  function rotaSayfa() {
    const R = veri, DU = R.duraklar, n = DU.length, host = $("#harita"), kart = $("#harita-kart");
    bugunKapali(n);
    const { map } = haritaKur(host, "Haritayı kaydırmak için iki parmağını kullan ya da “Büyüt”e dokun", $('[data-h="uydu"]'), $("#h-kaynak"));
    const pts = DU.map((d) => [d.lat, d.lng]), sinir = L.latLngBounds(pts).pad(0.14);
    // Rotada uzak ilçelerden (Sarıyer, Şile, Silivri…) durak varsa haritanın gezilebilen alanı onları da kapsar.
    map.setMaxBounds(L.latLngBounds([[40.85, 28.6], [41.25, 29.35]]).extend(sinir.pad(0.2)));
    map.fitBounds(sinir);
    const cizgi = L.layerGroup().addTo(map);
    const isaret = DU.map((d) => {
      const m = L.marker([d.lat, d.lng], { icon: imk("", d.n), title: d.n + ". " + d.ad, riseOnHover: true, zIndexOffset: 400 - d.n }).addTo(map);
      m.bindPopup(`<b>${d.n}. ${esc(d.ad)}${d.hon ? " " + esc(d.hon) : ""}</b>${d.tur ? esc(d.tur) + " · " : ""}<a href="#durak-${d.n}">Açıklamayı oku</a>`, { offset: [0, -12], closeButton: false, maxWidth: 240 });
      m.on("popupopen", () => sec(d.n)); return m;
    });
    function sec(no) { isaret.forEach((m, i) => { const el = m.getElement(); if (el) el.classList.toggle("sec", DU[i].n === no); }); }

    // Aralar: taşıtla geçilenler noktalı çizgi; yürünenler sokak yolu gelince dolu çizgi.
    // Sokak yolu beklenirken düz çizgi çizilmez; kuş uçuşu kesik çizgi yalnızca yol alınamazsa görünür.
    const tasit = new Set(R.tasit), ara = [];
    for (let k = 0; k < n - 1; k++) ara.push({ tasit: tasit.has(k), d: olc(pts[k], pts[k + 1]), pts: null, adim: null });
    const kosular = []; let bas = 0, bekle = true;
    for (let k = 0; k < n; k++) if (k === n - 1 || tasit.has(k)) { if (k > bas) kosular.push([bas, k]); bas = k + 1; }
    function ciz() {
      cizgi.clearLayers();
      ara.forEach((a, k) => {
        if (a.tasit) L.polyline([pts[k], pts[k + 1]], { className: "yl-tasit", interactive: false }).addTo(cizgi);
        else if (a.pts) { L.polyline(a.pts, { className: "yl-kasa", interactive: false }).addTo(cizgi); L.polyline(a.pts, { className: "yl-ana", interactive: false }).addTo(cizgi); }
        else if (!bekle) L.polyline([pts[k], pts[k + 1]], { className: "yl-kesik", interactive: false }).addTo(cizgi);
      });
    }
    ciz();

    const durum = $("#tarif-durum"), tarif = $("#tarif"), hYol = $("#h-yol");
    // Yürüyüş mesafesi sayfada tek sayıdır: başlıktaki bilgi satırı ile haritanın altındaki satır aynı sayıyı gösterir.
    // Sokak yolu ölçülünce ikisi de ölçülen sayıyı yazar; ölçülemezse ikisi de sayfadaki kayıtlı sayıyı (R.km) gösterir.
    const hapKm = $(".rota-bas .hap[data-yuru]"), hapYazi = hapKm && [...hapKm.childNodes].find((x) => x.nodeType === 3);
    function tarifYaz() {
      const yuru = ara.filter((a) => !a.tasit), sokakli = yuru.length && yuru.every((a) => a.pts);
      const top = yuru.reduce((s, a) => s + (a.pts ? a.d : a.d * 1.3), 0), km = sokakli || !R.km ? fmtD(top) : R.km;
      hYol.textContent = (sokakli ? "Yürüyüş yolu sokaklardan · " : "Yürüyüş yaklaşık · ") + km + (tasit.size ? " + " + tasit.size + " taşıt geçişi" : "");
      if (sokakli && hapYazi) hapYazi.nodeValue = km + " yürüyüş";
      tarif.innerHTML = ara.map((a, k) => {
        const b = DU[k + 1], bas2 = `<span class="ar"><span class="no">${DU[k].n}</span>${ic("fwd")}<span class="no">${b.n}</span></span><span class="ad">${esc(b.ad)}</span>`;
        if (a.tasit) return `<details><summary>${bas2}<small>taşıtla · ${fmtD(a.d)}</small>${ic("down")}</summary><ol><li>${ic("tram")}<span>Bu iki durak arası uzun; tramvay, metro ya da vapurla geçilir. Hangi hattı kullanacağını <a href="${R.ulasim}">Ulaşım</a> sayfası gösterir.</span></li></ol></details>`;
        const d = a.pts ? a.d : a.d * 1.3, adim = a.adim && a.adim.length ? a.adim : null;
        return `<details><summary>${bas2}<small>${d < 15 ? "aynı yerde" : fmtD(d) + " · " + fmtDk(dkYuru(d))}</small>${ic("down")}</summary><ol>${adim ? adim.map((s) => `<li>${ic(s.k)}<span>${esc(s.t)}</span><small>${s.d >= 10 ? fmtD(s.d) : ""}</small></li>`).join("") : `<li>${ic("walk")}<span>${d < 15 ? "Bir önceki durakla aynı yerde." : a.pts ? "Kısa bir yürüyüş; durak hemen yakında." : "Sokak tarifi alınamadı. Mesafe kuş uçuşu ölçüden tahmin edildi."}</span></li>`}</ol></details>`;
      }).join("");
    }
    // Sokak yolu: aynı rota için 30 gün bu cihazda saklanır; yol tarifi sunucusuna her açılışta yeniden sorulmaz.
    const ozet = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
    // Anahtardaki sayı, yol hesabının kuralı değişince artırılır (2: aynı avludaki duraklar doğrudan bağlanır); eski kayıtlar silinir.
    const CK = "zr.yolc.2." + R.id + ".";
    try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.startsWith("zr.yolc.1.")) localStorage.removeItem(k); } } catch (e) {}
    const saklaAl = (k) => { try { const v = JSON.parse(localStorage.getItem(CK + k) || "null"); if (v && Date.now() - v.t < 30 * 864e5) return v.l; } catch (e) {} return null; };
    const saklaYaz = (k, l) => { try { localStorage.setItem(CK + k, JSON.stringify({ t: Date.now(), l: l.map((x) => ({ d: Math.round(x.d), pts: x.pts.map((p) => [+p[0].toFixed(5), +p[1].toFixed(5)]), adim: x.adim })) })); } catch (e) {} };
    async function yolGetir() {
      if (!YOL || !kosular.length) { durum.hidden = true; bekle = false; ciz(); return tarifYaz(); }
      durum.hidden = false; durum.className = "tarif-durum bekle"; durum.textContent = "Sokak sokak yürüyüş yolu hazırlanıyor…";
      const son = await Promise.allSettled(kosular.map(async ([a, b]) => {
        const p = pts.slice(a, b + 1), k = ozet(YOL.anahtar(p)); let l = saklaAl(k);
        if (!l) { l = (await YOL.yol(p)).legs; saklaYaz(k, l); }
        l.forEach((x, i) => { Object.assign(ara[a + i], { d: x.d, pts: x.pts, adim: x.adim }); });
      }));
      bekle = false; ciz(); tarifYaz();
      if (son.some((s) => s.status === "rejected")) {
        durum.className = "tarif-durum"; durum.innerHTML = `Sokak tarifi şu an alınamadı; haritadaki kesik çizgi durakları kuş uçuşu birleştirir. <button class="btn kucuk" type="button" id="yol-yeniden">Yeniden dene</button>`;
        $("#yol-yeniden").addEventListener("click", yolGetir);
      } else durum.hidden = true;
    }
    tarifYaz(); yolGetir();

    // Düğmeler: büyüt, uydu, konum
    const bBuyut = $('[data-h="buyut"]'), bKonum = $('[data-h="konum"]');
    function buyut(a) {
      kart.classList.toggle("buyuk", a); bBuyut.setAttribute("aria-pressed", a); bBuyut.innerHTML = ic(a ? "kucult" : "buyut") + `<span>${a ? "Küçült" : "Büyüt"}</span>`;
      document.documentElement.style.overflow = a ? "hidden" : "";
      if (dokunmatik) map.dragging[a ? "enable" : "disable"]();
      setTimeout(() => { map.invalidateSize(); map.fitBounds(sinir); }, 60);
    }
    bBuyut.addEventListener("click", () => buyut(!kart.classList.contains("buyuk")));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && kart.classList.contains("buyuk")) buyut(false); });
    let ben, benC;
    bKonum.addEventListener("click", () => {
      bKonum.disabled = true;
      konumAl((p, hassas) => {
        bKonum.disabled = false;
        if (ben) { ben.setLatLng(p); benC.setLatLng(p).setRadius(Math.min(hassas || 30, 400)); } else { benC = L.circle(p, { radius: Math.min(hassas || 30, 400), color: "#2F6FED", weight: 1, fillOpacity: 0.12, interactive: false }).addTo(map); ben = L.marker(p, { icon: imk("ben", ""), interactive: false, zIndexOffset: 900 }).addTo(map); }
        map.flyToBounds(L.latLngBounds(pts.concat([p])).pad(0.12), { duration: 0.8 });
        bildir("Konumun haritada mavi noktayla gösteriliyor. Konum bu sayfadan dışarı çıkmaz.");
      }, (m) => { bKonum.disabled = false; bildir(m); });
    });

    // Durak kartı ↔ harita
    document.addEventListener("click", (e) => {
      const g = e.target.closest("[data-goster]");
      if (g) {
        const i = DU.findIndex((d) => d.n === +g.dataset.goster); if (i < 0) return;
        kart.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => { map.flyTo(pts[i], Math.max(map.getZoom(), 17), { duration: 0.8 }); isaret[i].openPopup(); }, 350);
        return;
      }
      const a = e.target.closest('.leaflet-popup a[href^="#durak-"]');
      if (a) {
        if (kart.classList.contains("buyuk")) buyut(false);
        const h = $(a.getAttribute("href")); if (h) { $$(".durak.vurgu").forEach((x) => x.classList.remove("vurgu")); h.classList.add("vurgu"); h.classList.remove("bekle"); }
      }
    });
  }

  /* ——— Ulaşım: konuma göre hangi hat, hangi durak ——— */
  function ulasim() {
    const AG = veri.ag, ROT = veri.rotalar, DUR = AG.durak, HAT = AG.hat;
    const HIZ = { T1: 280, T4: 280, T5: 280, T6: 450, M1: 550, M2: 550, Marmaray: 650 }, KISA = { Marmaray: "MR" };
    const yer = (ad) => [DUR[ad][0], DUR[ad][1]];
    const { map } = haritaKur($("#harita"), "Haritayı kaydırmak için iki parmağını kullan", $('[data-h="uydu"]'), $("#h-kaynak"));
    const tumu = L.latLngBounds(Object.keys(DUR).filter((d) => d !== "Üsküdar").map(yer)).pad(0.06);
    map.fitBounds(tumu);
    // Bütün hatlar soluk ve şematik; duraklar küçük nokta
    const adlar = (kod) => HAT[kod].sira.filter((x) => typeof x === "string");
    for (const kod of Object.keys(HAT)) L.polyline(adlar(kod).map(yer), { className: "yl-hat", color: HAT[kod].renk, interactive: false }).addTo(map);
    const hatlari = {};
    for (const kod of Object.keys(HAT)) for (const ad of adlar(kod)) (hatlari[ad] = hatlari[ad] || []).push(kod);
    for (const ad of Object.keys(DUR)) if (hatlari[ad]) L.marker(yer(ad), { icon: imk("kucuk", "", "--rc:" + HAT[hatlari[ad][0]].renk), title: ad + " · " + hatlari[ad].join(", "), keyboard: false }).addTo(map).bindTooltip(ad + " · " + hatlari[ad].join(", "), { direction: "top", offset: [0, -6] });
    const rotaIs = ROT.map((r) => L.marker([r.lat, r.lng], { icon: imk("", r.no, "--rc:var(--" + r.id + ")"), title: r.ad, zIndexOffset: 500 }).addTo(map).bindTooltip(r.no + " · " + r.ad + " başlangıcı", { direction: "top", offset: [0, -16] }));

    // Ağ: (durak, hat) düğümleri; hat boyunca biniş, aynı durakta aktarma, yürüyerek aktarma
    const kom = new Map(), ekle = (a, b, w, e) => { if (!kom.has(a)) kom.set(a, []); kom.get(a).push(Object.assign({ b, w }, e)); };
    for (const kod of Object.keys(HAT)) {
      let once = null, atla = 0;
      for (const x of HAT[kod].sira) {
        if (typeof x === "number") { atla = x; continue; }
        if (once) { const w = (olc(yer(once), yer(x)) * 1.25) / HIZ[kod] + 0.7 * (1 + atla), e = { tur: "bin", kod, n: 1 + atla }; ekle(once + "|" + kod, x + "|" + kod, w, e); ekle(x + "|" + kod, once + "|" + kod, w, e); }
        once = x; atla = 0;
      }
    }
    for (const ad of Object.keys(hatlari)) for (const k1 of hatlari[ad]) for (const k2 of hatlari[ad]) if (k1 !== k2) ekle(ad + "|" + k1, ad + "|" + k2, 5, { tur: "aktar" });
    for (const [a, b, dk, not] of AG.yaya) for (const ka of hatlari[a] || []) for (const kb of hatlari[b] || []) { ekle(a + "|" + ka, b + "|" + kb, dk + 3, { tur: "yaya", dk, not }); ekle(b + "|" + kb, a + "|" + ka, dk + 3, { tur: "yaya", dk, not }); }

    function hesapla(bas, r) {
      // bas: { p: [enlem, boylam] } ya da { durak: "ad" }
      const hedef = [r.lat, r.lng], yuruDk = (m) => (m * 1.3) / 75;
      const dogrudan = bas.p ? olc(bas.p, hedef) : olc(yer(bas.durak), hedef);
      const giris = bas.durak ? [[bas.durak, 0]] : Object.keys(hatlari).map((ad) => [ad, olc(bas.p, yer(ad))]).filter((x) => x[1] < 2600).sort((a, b) => a[1] - b[1]).slice(0, 5);
      const cikis = Object.keys(hatlari).map((ad) => [ad, olc(yer(ad), hedef)]).filter((x) => x[1] < 1300 || x[0] === r.varis);
      const enYakin = bas.p ? Object.keys(hatlari).map((ad) => [ad, olc(bas.p, yer(ad))]).sort((a, b) => a[1] - b[1])[0] : null;
      if (!giris.length) return { uzak: true, enYakin, dogrudan };
      const mesafe = new Map(), once = new Map(), bitti = new Set();
      for (const [ad, m] of giris) for (const k of hatlari[ad]) { mesafe.set(ad + "|" + k, yuruDk(m) + (bas.durak ? 0 : 3)); once.set(ad + "|" + k, { a: "S", tur: "ilk", m, ad }); }
      const son = new Map(cikis.map((c) => [c[0], c[1]]));
      let enIyi = null;
      for (;;) {
        let u = null, mu = Infinity;
        for (const [k, v] of mesafe) if (!bitti.has(k) && v < mu) { mu = v; u = k; }
        if (u == null) break; bitti.add(u);
        const ad = u.split("|")[0];
        if (son.has(ad)) { const g2 = mu + yuruDk(son.get(ad)), t = g2 + (ad === r.varis ? 0 : 3); if (!enIyi || t < enIyi.t) enIyi = { t, g: g2, u, m: son.get(ad) }; }
        if (enIyi && mu > enIyi.t) break;
        for (const e of kom.get(u) || []) { const v = mu + e.w; if (v < (mesafe.has(e.b) ? mesafe.get(e.b) : Infinity)) { mesafe.set(e.b, v); once.set(e.b, Object.assign({ a: u }, e)); } }
      }
      if (!enIyi) return { uzak: true, enYakin, dogrudan };
      const zincir = []; for (let k = enIyi.u; k !== "S"; k = once.get(k).a) zincir.unshift([k, once.get(k)]);
      const adim = []; let binis = null;
      for (const [k, e] of zincir) {
        const [ad, kod] = k.split("|");
        if (e.tur === "ilk") { if (e.m > 30) adim.push({ tur: "yuru", ad, m: e.m * 1.3 }); binis = null; }
        else if (e.tur === "bin") { if (binis && binis.kod === kod) { binis.b = ad; binis.n += e.n; } else { binis = { tur: "bin", kod, a: e.a.split("|")[0], b: ad, n: e.n }; adim.push(binis); } }
        else if (e.tur === "aktar") { adim.push({ tur: "aktar", ad, kod }); binis = null; }
        else { adim.push({ tur: "yaya", a: e.a.split("|")[0], b: ad, dk: e.dk, not: e.not, kod }); binis = null; }
      }
      // Sonda ya da başta binişe dönüşmeyen aktarmalar gereksizdir
      while (adim.length && adim[adim.length - 1].tur !== "bin") adim.pop();
      const ilkBin = adim.findIndex((a) => a.tur === "bin");
      const temiz = adim.filter((a, i) => !(a.tur === "aktar" && i < ilkBin));
      const inis = temiz.length ? temiz[temiz.length - 1].b : null;
      if (!inis) return { yuru: true, dogrudan };
      const sonM = olc(yer(inis), hedef) * 1.3;
      temiz.push({ tur: "son", m: sonM });
      const yuruTop = yuruDk(dogrudan);
      if (bas.p && (dogrudan < 900 || yuruTop <= enIyi.g)) return { yuru: true, dogrudan };
      return { adim: temiz, dk: Math.round(enIyi.g), aktarma: temiz.filter((a) => a.tur === "bin" || (a.tur === "yaya" && a.not)).length - 1, dogrudan };
    }

    const sonuc = $("#o-sonuc"), sRota = $("#o-rota"), sDurak = $("#o-durak"), bKonum = $("#o-konum"), kat = L.layerGroup().addTo(map);
    let bas = null;
    const hatr = (kod) => `<span class="hatr" style="--hc:${HAT[kod].renk}">${esc(kod)}</span>`;
    const disari = (r) => `<div class="dugmeler"><a class="btn kucuk koyu" href="https://www.google.com/maps/dir/?api=1&amp;destination=${r.lat},${r.lng}&amp;travelmode=transit" target="_blank" rel="noopener">Google Haritalar’da toplu taşıma${ic("ext")}</a><a class="btn kucuk" href="https://maps.apple.com/?daddr=${r.lat},${r.lng}&amp;dirflg=r" target="_blank" rel="noopener">Apple Haritalar${ic("ext")}</a><a class="btn kucuk yumusak" href="${r.yol}">Rotayı aç${ic("fwd")}</a></div>`;
    function goster() {
      const r = ROT.find((x) => x.id === sRota.value); kat.clearLayers();
      if (!bas) { map.flyTo([r.lat, r.lng], 15, { duration: 0.7 }); return; }
      const s = hesapla(bas, r), hedef = [r.lat, r.lng], basP = bas.p || yer(bas.durak), sinir = [basP, hedef];
      if (bas.p) L.marker(bas.p, { icon: imk("ben", ""), interactive: false, zIndexOffset: 900 }).addTo(kat);
      const bas2 = `<h4><span class="no">${r.no}</span>${esc(r.ad)}</h4>`;
      let ic2;
      if (s.uzak) {
        const anadolu = basP[1] > 29.0;
        ic2 = `<p>${s.enYakin ? `Yakınında bu rehberdeki raylı hatların durağı görünmüyor. En yakını <b>${esc(s.enYakin[0])}</b> (${fmtD(s.enYakin[1])}).` : "Bu duraktan uygun bir bağlantı bulunamadı."} ${anadolu ? "Anadolu yakasındaysan Üsküdar ya da Kadıköy’den vapurla Eminönü’ne, ya da Marmaray’la Sirkeci’ye geçebilirsin." : ""} Tam tarif için harita uygulamasını aç.</p>`;
      } else if (s.yuru) {
        L.polyline([basP, hedef], { className: "yl-kesik", interactive: false }).addTo(kat);
        ic2 = `<p><b>Yürüyerek gidebilirsin.</b> Rotanın ilk durağı (${esc(r.ilk)}) yaklaşık ${fmtD(s.dogrudan * 1.3)} uzakta, ${fmtDk(dkYuru(s.dogrudan * 1.3))} sürer.</p>`;
      } else {
        let onceki = basP;
        const li = s.adim.map((a) => {
          if (a.tur === "yuru") { L.polyline([basP, yer(a.ad)], { className: "yl-kesik", interactive: false }).addTo(kat); onceki = yer(a.ad); return `<li>${ic("walk")}<span><b>${esc(a.ad)}</b> durağına yürü · ${fmtDk(dkYuru(a.m))} (${fmtD(a.m)})</span></li>`; }
          if (a.tur === "bin") {
            const ad = adlar(a.kod), i = ad.indexOf(a.a), j = ad.indexOf(a.b), dilim = (i < j ? ad.slice(i, j + 1) : ad.slice(j, i + 1).reverse()).map(yer);
            L.polyline(dilim, { color: "#fff", weight: 10, opacity: 0.95, interactive: false }).addTo(kat); L.polyline(dilim, { color: HAT[a.kod].renk, weight: 6, opacity: 1, interactive: false }).addTo(kat);
            for (const d of [a.a, a.b]) { L.marker(yer(d), { icon: imk("ist", KISA[a.kod] || a.kod, "--hc:" + HAT[a.kod].renk), title: d, zIndexOffset: 700 }).addTo(kat).bindTooltip(d, { direction: "top", offset: [0, -14] }); sinir.push(yer(d)); }
            onceki = yer(a.b);
            return `<li>${hatr(a.kod)}<span>${esc(HAT[a.kod].ad)} ile <b>${esc(a.a)}</b> → <b>${esc(a.b)}</b> · ${a.n} durak</span></li>`;
          }
          if (a.tur === "aktar") return `<li>${ic("fwd")}<span>Aktarma: <b>${esc(a.ad)}</b> · ${esc(HAT[a.kod].ad)} tarafına geç</span></li>`;
          if (a.tur === "yaya") { L.polyline([yer(a.a), yer(a.b)], { className: "yl-kesik", interactive: false }).addTo(kat); return `<li>${ic(a.not ? "tram" : "walk")}<span>${a.not ? esc(a.not) + " ile" : "Yürüyerek"} <b>${esc(a.b)}</b> durağına geç · ${a.dk} dk</span></li>`; }
          L.polyline([onceki, hedef], { className: "yl-kesik", interactive: false }).addTo(kat);
          return `<li>${ic("pin")}<span>İndiğin duraktan rotanın ilk durağına yürü: <b>${esc(r.ilk)}</b> · ${fmtDk(dkYuru(a.m))} (${fmtD(a.m)})</span></li>`;
        }).join("");
        ic2 = `<p><b>Yaklaşık ${fmtDk(s.dk)}</b> · ${s.aktarma > 0 ? s.aktarma + " aktarma" : "aktarmasız"}</p><ol>${li}</ol><p class="ince">Süre, bekleme payıyla birlikte kaba bir tahmindir; sefer sıklığına göre değişir.</p>`;
      }
      sonuc.innerHTML = `<div class="oneri-kutu ${r.id}">${bas2}${ic2}${disari(r)}</div><p class="ince">Konumun yalnızca bu sayfada, tarayıcında kullanıldı; hiçbir yere gönderilmedi.</p>`;
      map.flyToBounds(L.latLngBounds(sinir).pad(0.18), { duration: 0.8, maxZoom: 16 });
    }
    bKonum.addEventListener("click", () => {
      bKonum.disabled = true; sonuc.innerHTML = '<p class="tarif-durum bekle">Konumun alınıyor…</p>';
      konumAl((p) => {
        bKonum.disabled = false; sDurak.value = "";
        if (olc(p, [41.02, 28.96]) > 60000) { bas = null; kat.clearLayers(); sonuc.innerHTML = `<div class="oneri-kutu"><p>Konumun İstanbul’un tarihî yarımadasından uzak görünüyor. İstanbul’a vardığında bu sayfa sana hangi hatta bineceğini gösterir; şimdilik aşağıdan bir durak seçip deneyebilirsin.</p></div>`; return; }
        bas = { p }; goster();
      }, (m) => { bKonum.disabled = false; sonuc.innerHTML = `<p class="hata">${esc(m)} Dilersen aşağıdan bulunduğun durağı seç.</p>`; });
    });
    sDurak.addEventListener("change", () => { if (sDurak.value) { bas = { durak: sDurak.value }; goster(); } });
    sRota.addEventListener("change", goster);
    rotaIs.forEach((m, i) => m.on("click", () => { sRota.value = ROT[i].id; goster(); }));
    const ist = /^#rota=(r[1-6])$/.exec(location.hash); if (ist) sRota.value = ist[1];
  }

  /* ——— Kayıtlı rotalar listesi (Rotalarım ve Hesabım) ——— */
  function kayitListesi(el) {
    let onay = -1, onayT;
    function ciz() {
      const l = HESAP.rotalar();
      if (!l.length) { el.innerHTML = `<div class="bos"><span class="menu-sim">${ic("mark")}</span><b>Henüz kayıtlı rotan yok</b><p>Haritada bir rota kur, “Kaydet”e dokun; burada görünür.</p><a class="btn altin" href="${ZR_YER.olustur}">${ic("rota")}Rota oluştur</a></div>`; return; }
      el.innerHTML = `<div class="kayitlar">${l.map((r, i) => {
        const t = r.t ? new Date(r.t).toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) : "";
        const parca = [r.keys.length + " durak", r.km ? String(r.km).replace(".", ",") + " km" + (r.sokak ? "" : " (tahmini)") : "", r.start && r.start.label ? "başlangıç: " + r.start.label : "", t].filter(Boolean);
        return `<article class="kayit" style="--i:${i}"><span class="menu-sim">${ic("rota")}</span><div><b>${esc(r.name)}</b><small>${esc(parca.join(" · "))}</small></div><div class="dugmeler"><a class="btn kucuk koyu" href="${ZR_YER.olustur}#kayit=${i}">Haritada aç</a><button class="btn kucuk" type="button" data-sil="${i}">${onay === i ? "Emin misin? Sil" : ic("trash") + "Sil"}</button></div></article>`;
      }).join("")}</div>`;
    }
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-sil]"); if (!b) return; const i = +b.dataset.sil;
      if (onay !== i) { onay = i; clearTimeout(onayT); onayT = setTimeout(() => { onay = -1; ciz(); }, 4000); return ciz(); }
      const l = HESAP.rotalar(), ad = l[i] && l[i].name; l.splice(i, 1); onay = -1; clearTimeout(onayT); HESAP.rotalariYaz(l); bildir(`“${ad}” silindi.`);
    });
    HESAP.dinle(ciz); ciz();
  }

  /* ——— Hesabım › Görünüm ———
     Giriş yapan ziyaretçi sitenin ve haritanın görünümünü kendine göre ayarlar: sayı rozetlerinin rengi, zemin deseni, rota çizgisinin rengi ve
     biçimi, harita işaretlerinin biçimi, hareket. Seçim anında uygulanır; kaydı ve uygulaması kaynak/hesap.js içindedir. */
  const G_AD = {
    rozet: ["Sayı rozetleri", { altin: "Altın", lacivert: "Lacivert", zumrut: "Zümrüt", gul: "Gül", gumus: "Gümüş" }],
    desen: ["Arka plan deseni", { yildiz: "Selçuklu yıldızı", semse: "Şemse (Osmanlı)", yok: "Desensiz" }],
    cizgi: ["Rota çizgisinin rengi", { varsayilan: "Varsayılan", altin: "Altın", turkuaz: "Turkuaz", gul: "Gül", yesil: "Yeşil" }],
    stil: ["Rota çizgisinin biçimi", { nokta: "Akan noktalar", kesik: "Akan çizgiler", duz: "Düz çizgi" }],
    isaret: ["Harita işaretleri", { karisik: "Kategoriye göre", igne: "Hepsi konum işareti", daire: "Hepsi yuvarlak" }],
    hareket: ["Hareket", { acik: "Açık", az: "Azaltılmış" }],
  };
  const G_CIZGI = { varsayilan: ["#FFE08A", "#0E1B2E", "#0E1B2E"], altin: ["#F5C451", "#0E1B2E", "#0E1B2E"], turkuaz: ["#22C3D6", "#0B2A3A", "#fff"], gul: ["#E4577F", "#fff", "#fff"], yesil: ["#2FAE72", "#fff", "#fff"] };
  const G_YOL = "M4 25C12 25 13 9 21 9s9 16 17 16", G_IGNE = "M0 14.6C0 14.6-7.4 6.6-7.4.3a7.4 7.4 0 0 1 14.8 0C7.4 6.6 0 14.6 0 14.6z";
  function gOrnek(g, v, sec) {
    if (g === "rozet") return `<span class="g-on"><span class="no" data-rozet="${v}">1</span></span>`;
    if (g === "desen") return `<span class="g-on do-${v}"></span>`;
    if (g === "cizgi") { const c = G_CIZGI[v]; return `<span class="g-on uydu"><svg viewBox="0 0 42 34" aria-hidden="true"><path d="${G_YOL}" fill="none" stroke="${c[1]}" stroke-width="7" stroke-linecap="round"/><path d="${G_YOL}" fill="none" stroke="${c[0]}" stroke-width="3.4" stroke-linecap="round"/><path d="${G_YOL}" fill="none" stroke="${c[2]}" stroke-width="2" stroke-linecap="round" stroke-dasharray=".1 7"/></svg></span>`; }
    if (g === "stil") { const c = G_CIZGI[sec.cizgi]; return `<span class="g-on uydu"><svg viewBox="0 0 42 34" aria-hidden="true"><path d="${G_YOL}" fill="none" stroke="${c[1]}" stroke-width="7" stroke-linecap="round"/><path d="${G_YOL}" fill="none" stroke="${c[0]}" stroke-width="3.4" stroke-linecap="round"/>${v === "duz" ? "" : `<path class="g-akis" d="${G_YOL}" fill="none" stroke="${c[2]}" stroke-width="2" stroke-linecap="round" stroke-dasharray="${v === "kesik" ? "4 6" : ".1 7"}"/>`}</svg></span>`; }
    if (g === "isaret") { const igne = (x, r) => `<g transform="translate(${x} 13)"><path d="${G_IGNE}" fill="${r}" stroke="#fff" stroke-width="1.4"/><circle cx=".2" cy=".4" r="2.9" fill="#0B1420" fill-opacity=".62"/><ellipse cx="-3.4" cy="-4" rx="2.6" ry="1.1" transform="rotate(-40 -3.4 -4)" fill="#fff" fill-opacity=".62"/></g>`, daire = (x, r) => `<circle cx="${x}" cy="17" r="6.6" fill="${r}" stroke="#fff" stroke-width="1.4"/><ellipse cx="${x - 2.4}" cy="13.8" rx="2.8" ry="1.3" transform="rotate(-34 ${x - 2.4} 13.8)" fill="#fff" fill-opacity=".6"/>`;
      return `<span class="g-on uydu"><svg viewBox="0 0 42 34" aria-hidden="true">${v === "karisik" ? igne(14, "#2E5AAC") + daire(29, "#5B6FB8") : v === "igne" ? igne(13, "#2E5AAC") + igne(29, "#B04A62") : daire(13, "#2E5AAC") + daire(29, "#B04A62")}</svg></span>`; }
    return `<span class="g-on">${ic(v === "az" ? "basla" : "spark")}</span>`;
  }
  function gorunumHtml() {
    const sec = HESAP.gorunum();
    return `<div class="kart gorunum" id="gorunum"><p class="ince" style="margin-top:0">Seçimin anında uygulanır ve bu cihazda saklanır; çıkış yapınca site varsayılan görünümüne döner.</p>
${Object.keys(G_AD).map((g) => `<fieldset class="g-grup"><legend>${G_AD[g][0]}</legend><div class="g-sec">${HESAP.G_SEC[g].map((v) => `<button class="g-s" type="button" data-g="${g}" data-v="${v}" aria-pressed="${sec[g] === v}">${gOrnek(g, v, sec)}<b>${G_AD[g][1][v]}</b></button>`).join("")}</div></fieldset>`).join("")}
<div class="dugmeler" style="margin-top:20px"><a class="btn kucuk yumusak" href="${ZR_YER.olustur}">${ic("rota")}Haritada gör</a><button class="btn kucuk" type="button" data-is="g-sifirla">Varsayılana dön</button></div></div>`;
  }

  /* ——— Hesabım ——— */
  function hesabim() {
    const kok = $("#hesap-kok"), pro = $("#hesap"), gYer = $("#gorunum-yer"), guv = $("#guvenlik"), guvYer = $("#guvenlik-yer");
    let sek = location.hash === "#kayit" ? "kayit" : "giris", mesaj = "";
    // WordPress.com ile giriş (hesap.js, WP bölümü): açıksa asıl giriş yolu odur; bu cihazda eski hesap varsa onun girişi katlanmış olarak kalır.
    const WPG = HESAP.wp && HESAP.wp.acik() ? HESAP.wp : null; let wpBekle = !!(WPG && WPG.bekliyor()), wpHata = "", silOnay = 0;
    // E-posta ve şifreyle üyelik (hesap.js, Firebase bölümü): açıksa asıl yol odur; WordPress.com ile giriş altta ikinci seçenek olarak kalır.
    const FBG = HESAP.fb && HESAP.fb.acik() ? HESAP.fb : null; let fbBilgi = "";
    const wpDugme = () => (wpBekle ? '<p class="tamam" role="status">Girişin tamamlanıyor…</p>' : `${wpHata ? `<div class="hata" role="alert" style="margin-bottom:14px">${esc(wpHata)}</div>` : ""}<div class="dugmeler"><button class="btn${FBG ? "" : " koyu"}" type="button" data-is="wp">${ic("user")}WordPress.com ile giriş yap</button></div>`);
    const eskiGiris = () => (HESAP.cihazHesabiVar() ? `<details class="katla"><summary>${ic("fwd")}Bu cihazdaki eski hesabımla gir</summary><form class="form" data-form="giris" novalidate>
<div class="alan"><label for="h-ad">Kullanıcı adı</label><input id="h-ad" name="ad" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="24" required></div>
<div class="alan"><label for="h-sifre">Şifre</label><input id="h-sifre" name="sifre" type="password" autocomplete="current-password" required></div>
<div class="hata" role="alert" hidden></div>
<button class="btn" type="submit">Giriş yap</button></form></details>` : "");
    function fbGirisHtml(mis) {
      const k = sek === "kayit", u = sek === "unut";
      const eposta = (id, oto) => `<div class="alan"><label for="${id}">E-posta adresi</label><input id="${id}" name="eposta" type="email" autocomplete="${oto}" inputmode="email" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="120" required></div>`;
      const ust = u ? `<h2>Şifremi unuttum</h2><p class="giris-y">E-posta adresini yaz. Bu adrese kayıtlı bir hesap varsa şifreni yenilemen için bir bağlantı göndeririz.</p>
<form class="form" data-form="fb-unut" novalidate>${eposta("f-eposta", "email")}<div class="hata" role="alert" hidden></div><button class="btn koyu" type="submit">Yenileme bağlantısı gönder</button></form>
<p class="ince" style="margin-top:14px"><button class="baglanti" type="button" data-sek="giris">Giriş ekranına dön</button></p>`
        : `<div class="sekmeler" data-s="${k ? "kayit" : "giris"}" role="tablist"><button type="button" role="tab" aria-selected="${!k}" data-sek="giris">Giriş yap</button><button type="button" role="tab" aria-selected="${k}" data-sek="kayit">Üye ol</button></div>
<form class="form" data-form="${k ? "fb-kayit" : "fb-giris"}" novalidate>
${k ? '<div class="alan"><label for="f-ad">Adın</label><input id="f-ad" name="ad" autocomplete="name" maxlength="60" required><small>Sitede “Giriş yap” yazısının yerinde bu ad görünür.</small></div>' : ""}
${eposta("f-eposta", k ? "email" : "username")}
<div class="alan"><label for="f-sifre">Şifre</label><input id="f-sifre" name="sifre" type="password" autocomplete="${k ? "new-password" : "current-password"}" required>${k ? "<small>En az 8 karakter.</small>" : ""}</div>
${k ? '<div class="alan"><label for="f-sifre2">Şifre (tekrar)</label><input id="f-sifre2" name="sifre2" type="password" autocomplete="new-password" required></div>' : ""}
<div class="hata" role="alert" hidden></div>
${k ? "" : '<div class="dugmeler" data-dogrula hidden style="margin:0 0 12px"><button class="btn kucuk" type="button" data-is="fb-tekrar">Doğrulama e-postasını yeniden gönder</button></div>'}
<button class="btn koyu" type="submit">${k ? "Üye ol" : "Giriş yap"}</button>
${k ? "" : '<p class="ince" style="margin:12px 0 0"><button class="baglanti" type="button" data-sek="unut">Şifremi unuttum</button></p>'}</form>
<p class="ince" style="margin-top:14px">${k ? `Üye olunca e-postana bir doğrulama bağlantısı gelir. Bağlantıya dokunduktan sonra buradan giriş yaparsın. Hesabın Google Firebase’de tutulur; ayrıntısı <a href="${ZR_YER.kok}gizlilik/#giris">Gizlilik</a> sayfasında.` : "Kayıtlı rotaların bu cihazda durur."}</p>`;
      return `<div class="kart">${fbBilgi ? `<p class="tamam" role="status" style="margin-bottom:16px">${esc(fbBilgi)}</p>` : ""}${ust}
${WPG && !u ? `<div class="ya-da"><span>ya da</span></div>${wpDugme()}<p class="ince" style="margin-top:10px">WordPress.com hesabın varsa onunla da girebilirsin.</p>` : ""}
${mis ? `<p class="ince" style="margin-top:12px">Giriş yapmadan kaydedilmiş ${mis} rotan var. Giriş yapınca hesabına taşıyabilirsin.</p>` : ""}
${u ? "" : eskiGiris()}</div>`;
    }
    function ciz() {
      const a = HESAP.aktif(), mis = HESAP.misafirRotalari().length;
      // Girişsiz: görünüm yerine kısa bir not, güvenlik bölümü ve kutusu gizli
      guv.hidden = !a; $$("[data-giris-gerek]").forEach((el) => { el.hidden = !a; });
      if (!a) { guvYer.innerHTML = ""; gYer.innerHTML = `<div class="kart gorunum-kapali"><p>Görünüm ayarların hesabına bağlıdır: sayı rozetlerinin rengi, arka plan deseni, rota çizgisi ve harita işaretleri. Seçmek için giriş yap ya da üye ol.</p><div class="dugmeler"><a class="btn kucuk koyu" href="#profil">${ic("user")}Giriş yap</a></div></div>`; }
      if (!a && FBG) { pro.innerHTML = fbGirisHtml(mis); return; }
      if (!a && WPG) {
        pro.innerHTML = `<div class="kart"><h2>Giriş yap</h2>
<p class="giris-y">WordPress.com hesabınla giriş yaparsın. Hesabın yoksa aynı ekranda e-posta adresinle ücretsiz açarsın; şifreni unutursan orada e-postayla yenilersin.</p>
${wpBekle ? '<p class="tamam" role="status">Girişin tamamlanıyor…</p>' : `${wpHata ? `<div class="hata" role="alert" style="margin-bottom:14px">${esc(wpHata)}</div>` : ""}<div class="dugmeler"><button class="btn koyu" type="button" data-is="wp">${ic("user")}WordPress.com ile giriş yap</button></div>`}
<p class="ince" style="margin-top:14px">Giriş için WordPress.com’a gidip geri dönersin. Sitemiz yalnızca adını ve kullanıcı adını alır; şifren ve e-posta adresin bize gelmez. Kayıtlı rotaların bu cihazda durur.</p>
${mis ? `<p class="ince" style="margin-top:8px">Giriş yapmadan kaydedilmiş ${mis} rotan var. Giriş yapınca hesabına taşıyabilirsin.</p>` : ""}
${HESAP.cihazHesabiVar() ? `<details class="katla"><summary>${ic("fwd")}Bu cihazdaki eski hesabımla gir</summary><form class="form" data-form="giris" novalidate>
<div class="alan"><label for="h-ad">Kullanıcı adı</label><input id="h-ad" name="ad" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="24" required></div>
<div class="alan"><label for="h-sifre">Şifre</label><input id="h-sifre" name="sifre" type="password" autocomplete="current-password" required></div>
<div class="hata" role="alert" hidden></div>
<button class="btn" type="submit">Giriş yap</button></form></details>` : ""}</div>`;
        return;
      }
      if (!a) {
        const k = sek === "kayit";
        pro.innerHTML = `<div class="kart"><div class="sekmeler" data-s="${sek}" role="tablist"><button type="button" role="tab" aria-selected="${!k}" data-sek="giris">Giriş yap</button><button type="button" role="tab" aria-selected="${k}" data-sek="kayit">Hesap oluştur</button></div>
<form class="form" data-form="${sek}" novalidate>
<div class="alan"><label for="h-ad">Kullanıcı adı</label><input id="h-ad" name="ad" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="24" required>${k ? "<small>3–24 karakter; harf, rakam, nokta, alt çizgi ve tire.</small>" : ""}</div>
<div class="alan"><label for="h-sifre">Şifre</label><input id="h-sifre" name="sifre" type="password" autocomplete="${k ? "new-password" : "current-password"}" required>${k ? "<small>En az 6 karakter.</small>" : ""}</div>
${k ? '<div class="alan"><label for="h-sifre2">Şifre (tekrar)</label><input id="h-sifre2" name="sifre2" type="password" autocomplete="new-password" required></div>' : ""}
<div class="hata" role="alert" hidden></div>
<button class="btn koyu" type="submit">${k ? "Hesabımı oluştur" : "Giriş yap"}</button></form>
${mis ? `<p class="ince" style="margin-top:14px">Giriş yapmadan kaydedilmiş ${mis} rotan var. ${k ? "Hesabını oluşturunca" : "Giriş yapınca"} hesabına taşıyabilirsin.</p>` : ""}</div>`;
        return;
      }
      const n = HESAP.rotalar().length, wpH = a.tur === "wp", fbH = a.tur === "fb";
      const eskiTasi = `${HESAP.cihazHesabiVar() ? `<details class="katla"><summary>${ic("fwd")}Eski hesabımdaki rotaları taşı</summary><form class="form" data-form="eski" novalidate><p class="ince">Bu cihazda daha önce kullanıcı adı ve şifreyle açtığın hesabın rotalarını bu hesaba taşır. Eski hesap silinmez.</p><div class="alan"><label for="e-ad">Eski kullanıcı adı</label><input id="e-ad" name="ad" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="24" required></div><div class="alan"><label for="e-sifre">Eski şifre</label><input id="e-sifre" name="sifre" type="password" autocomplete="off" required></div><div class="hata" role="alert" hidden></div><button class="btn koyu" type="submit">Rotaları taşı</button></form></details>` : ""}`;
      const hesapIsleri = wpH ? `<details class="katla"><summary>${ic("fwd")}Şifre ve e-posta</summary><div class="form"><p class="ince">Şifreni ve e-posta adresini WordPress.com’da değiştirirsin. Şifreni unutursan WordPress.com’un giriş ekranındaki şifre yenileme bağlantısı e-postana bir bağlantı yollar.</p><div class="dugmeler"><a class="btn" href="https://wordpress.com/me/security" target="_blank" rel="noopener">WordPress.com hesap ayarları</a></div></div></details>
${eskiTasi}
<details class="katla"${silOnay ? " open" : ""}><summary>${ic("fwd")}Bu cihazdaki kayıtlarımı sil</summary><div class="form"><p class="ince">Bu hesabın bu cihazda duran rotaları ve görünüm ayarları silinir. Geri alınamaz. WordPress.com hesabın silinmez.</p><div class="dugmeler"><button class="btn" type="button" data-is="wp-sil">${silOnay ? "Emin misin? Silmek için yeniden dokun" : "Bu cihazdaki kayıtlarımı sil"}</button></div></div></details>`
        : fbH ? `<details class="katla"><summary>${ic("fwd")}Şifre değiştir</summary><div class="form"><p class="ince">Şifreni e-postana gelen bağlantıyla değiştirirsin. Bağlantı ${esc(a.eposta)} adresine gider.</p><div class="dugmeler"><button class="btn" type="button" data-is="fb-yenile">Şifre yenileme bağlantısı gönder</button></div></div></details>
${eskiTasi}
<details class="katla"><summary>${ic("fwd")}Hesabı sil</summary><form class="form" data-form="fb-sil" novalidate><p class="ince">Hesabın Firebase’den silinir; bu cihazdaki rotaların ve görünüm ayarların da silinir. Geri alınamaz.</p><div class="alan"><label for="x-sifre">Şifre</label><input id="x-sifre" name="sifre" type="password" autocomplete="current-password" required></div><div class="hata" role="alert" hidden></div><button class="btn" type="submit">Hesabımı sil</button></form></details>` : "";
      pro.innerHTML = `<div class="kart">${mesaj ? `<p class="tamam" style="margin-bottom:16px">${esc(mesaj)}</p>` : ""}
<div class="profil"><span class="harf">${esc(a.ad.charAt(0).toLocaleUpperCase("tr"))}</span><div><h2>${esc(a.ad)}</h2><p class="ince">${wpH ? "WordPress.com hesabı" + (a.kullanici ? " · @" + esc(a.kullanici) : "") + " · " : fbH ? esc(a.eposta) + " · " : "Bu cihazdaki hesap · "}${n ? n + " kayıtlı rota" : "Henüz kayıtlı rota yok"}</p></div></div>
${mis ? `<div class="uyari-serit" style="margin:16px 0 0"><span>Giriş yapmadan kaydettiğin ${mis} rota var.</span><button class="btn kucuk koyu" type="button" data-is="tasi">Hesabıma taşı</button></div>` : ""}
<div class="dugmeler" style="margin-top:18px"><a class="btn altin" href="${ZR_YER.rotalarim}">${ic("mark")}Rotalarım${n ? ` <span class="sayi">${n}</span>` : ""}</a><a class="btn" href="${ZR_YER.olustur}">${ic("rota")}Rota oluştur</a><button class="btn" type="button" data-is="cikis">Çıkış yap</button></div></div>`;
      guvYer.innerHTML = `<div class="kart guvenlik">${wpH || fbH ? hesapIsleri : `<details class="katla"><summary>${ic("fwd")}Şifre değiştir</summary><form class="form" data-form="sifre" novalidate><div class="alan"><label for="s-eski">Şimdiki şifre</label><input id="s-eski" name="eski" type="password" autocomplete="current-password" required></div><div class="alan"><label for="s-yeni">Yeni şifre</label><input id="s-yeni" name="yeni" type="password" autocomplete="new-password" required><small>En az 6 karakter.</small></div><div class="hata" role="alert" hidden></div><button class="btn koyu" type="submit">Şifreyi değiştir</button></form></details>
<details class="katla"><summary>${ic("fwd")}Hesabı sil</summary><form class="form" data-form="sil" novalidate><p class="ince">Hesap ve bu hesaba kayıtlı rotalar silinir. Geri alınamaz.</p><div class="alan"><label for="x-sifre">Şifre</label><input id="x-sifre" name="sifre" type="password" autocomplete="current-password" required></div><div class="hata" role="alert" hidden></div><button class="btn" type="submit">Hesabımı sil</button></form></details>`}</div>`;
      gYer.innerHTML = gorunumHtml();
    }
    kok.addEventListener("click", (e) => {
      const s = e.target.closest("[data-sek]"); if (s) { sek = s.dataset.sek; fbBilgi = ""; ciz(); const g = $("form input", kok); if (g) g.focus(); return; }
      const g = e.target.closest(".g-s"); if (g) { HESAP.gorunumYaz({ [g.dataset.g]: g.dataset.v }); const y = $(`.g-s[data-g="${g.dataset.g}"][data-v="${g.dataset.v}"]`, kok); if (y) y.focus({ preventScroll: true }); return; }
      const b = e.target.closest("[data-is]"); if (!b) return;
      if (b.dataset.is === "g-sifirla") { HESAP.gorunumYaz(Object.fromEntries(Object.keys(HESAP.G_SEC).map((k) => [k, HESAP.G_SEC[k][0]]))); bildir("Varsayılan görünüme dönüldü."); return; }
      if (b.dataset.is === "cikis") { mesaj = ""; silOnay = 0; HESAP.cikis(); bildir("Çıkış yapıldı."); ciz(); }
      if (b.dataset.is === "fb-tekrar") { b.disabled = true; FBG.dogrulamaTekrar().then((s) => { b.disabled = false; bildir(s.ok ? "Doğrulama e-postası yeniden gönderildi." : s.hata); }); return; }
      if (b.dataset.is === "fb-yenile") { const a = HESAP.aktif(); b.disabled = true; FBG.sifreYenile(a && a.eposta).then((s) => { b.disabled = false; bildir(s.ok ? "Şifre yenileme bağlantısı e-postana gönderildi." : s.hata); }); return; }
      if (b.dataset.is === "wp") { wpHata = ""; b.disabled = true; const s = WPG.basla(); if (!s.ok) { wpHata = s.hata; ciz(); } return; }
      // İki adımlı silme: ilk dokunuş sorar, 8 saniye içindeki ikinci dokunuş siler.
      if (b.dataset.is === "wp-sil") {
        if (Date.now() - silOnay > 8000) { silOnay = Date.now(); ciz(); const y = $('[data-is="wp-sil"]', kok); if (y) y.focus({ preventScroll: true }); return; }
        silOnay = 0; mesaj = ""; HESAP.hesabiSil("").then((s) => { bildir(s.ok ? "Bu cihazdaki kayıtların silindi." : s.hata); ciz(); scrollTo({ top: 0, behavior: "smooth" }); });
      }
      if (b.dataset.is === "tasi") { const k = HESAP.misafiriTasi(); bildir(k ? k + " rota hesabına taşındı." : "Rotalar zaten hesabında."); ciz(); }
    });
    kok.addEventListener("submit", async (e) => {
      e.preventDefault(); const f = e.target, v = Object.fromEntries(new FormData(f)), hata = $(".hata", f), btn = $('[type="submit"]', f);
      const yaz = (m) => { hata.hidden = false; hata.textContent = m; hata.style.animation = "none"; void hata.offsetWidth; hata.style.animation = ""; };
      hata.hidden = true; btn.disabled = true; let s;
      try {
        if (f.dataset.form === "kayit") s = v.sifre !== v.sifre2 ? { ok: false, hata: "Şifreler aynı değil." } : await HESAP.kayit(v.ad, v.sifre);
        else if (f.dataset.form === "giris") s = await HESAP.giris(v.ad, v.sifre);
        else if (f.dataset.form === "sifre") s = await HESAP.sifreDegis(v.eski, v.yeni);
        else if (f.dataset.form === "eski") s = await HESAP.eskidenTasi(v.ad, v.sifre);
        else if (f.dataset.form === "fb-kayit") s = v.sifre !== v.sifre2 ? { ok: false, hata: "Şifreler aynı değil." } : await FBG.kayit(v.ad, v.eposta, v.sifre);
        else if (f.dataset.form === "fb-giris") s = await FBG.giris(v.eposta, v.sifre);
        else if (f.dataset.form === "fb-unut") s = await FBG.sifreYenile(v.eposta);
        else if (f.dataset.form === "fb-sil") s = await FBG.sil(v.sifre);
        else s = await HESAP.hesabiSil(v.sifre);
      } catch (err) { s = { ok: false, hata: "Bir şey ters gitti. Sayfayı yenileyip yeniden dene." }; }
      btn.disabled = false;
      if (!s.ok) { if (s.dogrulanmadi) { const d = $("[data-dogrula]", f); if (d) d.hidden = false; } return yaz(s.hata); }
      if (f.dataset.form === "fb-kayit" || f.dataset.form === "fb-unut") {
        sek = "giris";
        fbBilgi = f.dataset.form === "fb-unut" ? "Bu adrese kayıtlı bir hesap varsa şifre yenileme bağlantısını gönderdik. Gelen kutunu, gerekirse gereksiz (spam) klasörünü kontrol et."
          : s.mail ? `Hesabın açıldı. ${s.eposta} adresine bir doğrulama bağlantısı gönderdik. Bağlantıya dokunduktan sonra buradan giriş yap. Mail birkaç dakikada gelmezse gereksiz (spam) klasörüne bak.`
          : `Hesabın açıldı ama doğrulama e-postası gönderilemedi (${s.hata}). Giriş yapmayı dene; ekranda yeniden gönderme düğmesi çıkar.`;
        ciz(); const g = $("#f-eposta", kok); if (g && s.eposta) g.value = s.eposta;
        scrollTo({ top: 0, behavior: "smooth" }); return;
      }
      if (f.dataset.form === "fb-giris") { fbBilgi = ""; mesaj = s.ilk ? "Giriş yapıldı. Hoş geldin!" : "Yeniden hoş geldin!"; }
      else if (f.dataset.form === "fb-sil") { mesaj = ""; bildir("Hesabın silindi."); }
      else if (f.dataset.form === "kayit") mesaj = "Hesabın oluşturuldu. Hoş geldin!";
      else if (f.dataset.form === "giris") mesaj = "Giriş yapıldı. Hoş geldin!";
      else if (f.dataset.form === "sifre") { mesaj = "Şifren değiştirildi."; }
      else if (f.dataset.form === "eski") { mesaj = s.n ? s.n + " rota bu hesaba taşındı." : "Taşınacak yeni rota yoktu; eski hesaptaki rotalar zaten burada."; }
      else { mesaj = ""; bildir("Hesabın silindi."); }
      ciz(); scrollTo({ top: 0, behavior: "smooth" });
    });
    HESAP.dinle(() => { const o = document.activeElement; if (!o || !kok.contains(o) || !(o.tagName === "INPUT" && o.closest("form"))) ciz(); });
    ciz();
    // WordPress.com'dan dönüş: jeton hesap.js yüklenirken adres çubuğundan alınıp silindi; burada kimlik sorulur ve oturum açılır.
    if (wpBekle) WPG.tamamla().then((s) => { wpBekle = false; if (s && s.ok) mesaj = s.ilk ? "Giriş yapıldı. Hoş geldin!" : "Yeniden hoş geldin!"; else if (s) wpHata = s.hata; ciz(); }, () => { wpBekle = false; wpHata = "WordPress.com girişi tamamlanamadı. Yeniden dene."; ciz(); });
  }

  /* ——— Hesabım › Ayarlar: bu cihazın ayarları ve veri araçları ———
     Düğmeler localStorage anahtarını yazar (site/build.js, AYAR). İlk seçenek varsayılandır: seçilince anahtar silinir.
     Okuma ayarları (yazı boyutu, kontrast) anında html etiketine uygulanır; harita ayarlarını harita uygulaması açılışta okur. */
  function ayarlar() {
    const ls = { al(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, yaz(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); return true; } catch (e) { return false; } } };
    const kok = $("#hesap-kok"); if (!kok) return;
    const anahtarlar = [...new Set($$("[data-ayar]", kok).map((b) => b.dataset.ayar))];
    const ilk = (k) => $(`[data-ayar="${k}"]`, kok).dataset.v;
    function goster() {
      for (const k of anahtarlar) { const v = ls.al(k) || ilk(k), var_ = $$(`[data-ayar="${k}"]`, kok).some((b) => b.dataset.v === v); $$(`[data-ayar="${k}"]`, kok).forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === (var_ ? v : ilk(k)))); }
      const n = HESAP ? HESAP.rotalar().length : 0, sayi = $("[data-veri-sayi]", kok);
      if (sayi) sayi.textContent = (n ? n + " kayıtlı rotanı" : "Kayıtlı rotalarını") + " bir dosya (JSON) olarak cihazına kaydeder; başka bir telefona ya da bilgisayara taşımak için kullanabilirsin.";
      const ob = $("[data-veri-onbellek]", kok); let c = 0; try { for (let i = 0; i < localStorage.length; i++) if ((localStorage.key(i) || "").startsWith("zr.yolc.")) c++; } catch (e) {}
      if (ob) ob.textContent = `Daha önce çizilen yürüyüş yolları 30 gün saklanır; rota sayfaları böylece daha hızlı açılır. Şu an ${c ? c + " yol kayıtlı" : "boş"}.`;
    }
    const uygula = () => { const d = document.documentElement, y = ls.al("zr.yazi"), o = ls.al("zr.kontrast"), sk = ls.al("zr.katman.2") === "sokak";
      if (y === "buyuk" || y === "cokbuyuk") d.setAttribute("data-yazi", y); else d.removeAttribute("data-yazi");
      if (o === "yuksek") d.setAttribute("data-kontrast", o); else d.removeAttribute("data-kontrast");
      d.classList.toggle("h-sokak", sk); };
    kok.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ayar]");
      if (b) { const k = b.dataset.ayar, v = b.dataset.v; ls.yaz(k, v === ilk(k) ? "" : v); uygula(); goster(); b.focus({ preventScroll: true }); bildir("Kaydedildi: " + $(`#${CSS.escape("a-" + k.replace(/\W/g, "-"))}`).textContent + " · " + b.textContent + "."); return; }
      const d = e.target.closest("[data-veri]"); if (!d || d.tagName === "INPUT") return;
      if (d.dataset.veri === "indir") {
        const l = HESAP ? HESAP.rotalar() : []; if (!l.length) { bildir("İndirilecek kayıtlı rota yok."); return; }
        const dosya = new Blob([JSON.stringify({ tur: "ziyaret-rehberim-rotalar", surum: 1, tarih: new Date().toISOString(), rotalar: l }, null, 2)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(dosya); a.download = "ziyaret-rehberim-rotalarim-" + new Date().toISOString().slice(0, 10) + ".json";
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); bildir(l.length + " rota dosyaya yazıldı."); return;
      }
      if (d.dataset.veri === "onbellek") { let c = 0; try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.startsWith("zr.yolc.")) { localStorage.removeItem(k); c++; } } } catch (e) {} goster(); bildir(c ? c + " kayıtlı yol silindi." : "Önbellek zaten boş."); return; }
      if (d.dataset.veri === "sifirla") { for (const k of anahtarlar) ls.yaz(k, ""); uygula(); goster(); bildir("Bu cihazdaki ayarlar ilk hâline döndü."); }
    });
    // Dosyadan geri yükleme: yalnızca beklenen alanlar alınır, değerler denetlenir; var olan rotalar korunur, aynı rota iki kez eklenmez.
    const temiz = (r) => {
      if (!r || typeof r !== "object" || typeof r.name !== "string" || !Array.isArray(r.keys) || !r.start) return null;
      const keys = r.keys.filter((k) => typeof k === "string" && /^[\w.-]{1,40}$/.test(k)).slice(0, 80), lat = +r.start.lat, lng = +r.start.lng;
      if (!keys.length || !(lat > 40.7 && lat < 41.6 && lng > 27.9 && lng < 30)) return null;
      const o = { name: r.name.trim().slice(0, 80) || "Rotam", keys, start: { lat, lng, label: typeof r.start.label === "string" ? r.start.label.slice(0, 80) : "", acik: !!r.start.acik } };
      if (typeof r.km === "number" && isFinite(r.km) && r.km >= 0 && r.km < 500) o.km = r.km;
      if (typeof r.sokak === "boolean") o.sokak = r.sokak;
      if (typeof r.t === "number" && isFinite(r.t)) o.t = r.t;
      return o;
    };
    kok.addEventListener("change", (e) => {
      const g = e.target.closest('input[data-veri="yukle"]'); if (!g || !g.files || !g.files[0]) return;
      const f = g.files[0]; g.value = "";
      if (f.size > 2e6) { bildir("Dosya çok büyük. Ziyaret Rehberim’den indirdiğin rota dosyasını seç."); return; }
      f.text().then((m) => {
        let v; try { v = JSON.parse(m); } catch (err) { bildir("Bu dosya okunamadı. Ziyaret Rehberim’den indirdiğin rota dosyasını seç."); return; }
        const gelen = (Array.isArray(v) ? v : v && Array.isArray(v.rotalar) ? v.rotalar : []).map(temiz).filter(Boolean);
        if (!gelen.length) { bildir("Dosyada rota bulunamadı."); return; }
        const l = HESAP.rotalar(), imza = (r) => r.name + "|" + r.keys.join(","), var_ = new Set(l.map(imza));
        const yeni = gelen.filter((r) => !var_.has(imza(r)) && (var_.add(imza(r)), true));
        if (!yeni.length) { bildir("Bu dosyadaki rotalar zaten kayıtlı."); return; }
        HESAP.rotalariYaz([...yeni, ...l].slice(0, 200)); goster(); bildir(yeni.length + " rota eklendi.");
      }, () => bildir("Dosya okunamadı."));
    });
    if (HESAP) HESAP.dinle(goster); goster();
    addEventListener("storage", (e) => { if (!e.key || e.key.startsWith("zr.")) { uygula(); goster(); } });
  }

  /* ——— Rotalarım ——— */
  function rotalarim() {
    const mis = $("#misafir");
    const yaz = () => { const a = HESAP.aktif(), n = HESAP.rotalar().length; mis.innerHTML = a ? `<p class="ince" style="margin-bottom:14px"><b>${esc(a.ad)}</b> hesabına kayıtlı rotalar.</p>` : `<div class="uyari-serit"><span>${n ? "Bu rotalar giriş yapmadan kaydedilmiş. Giriş yapınca hesabına taşıyabilirsin." : "Rota kaydetmek için giriş yapman gerekir."}</span><a class="btn kucuk koyu" href="${ZR_YER.hesap}">Giriş yap ya da hesap oluştur</a></div>`; };
    HESAP.dinle(yaz); yaz(); kayitListesi($("#kayitlar"));
  }

  const SAYFA = { ana, "rota-olustur": olustur, rota: rotaSayfa, ulasim, hesabim: () => { hesabim(); ayarlar(); }, rotalarim };
  try { if (SAYFA[sayfa]) SAYFA[sayfa](); } catch (e) { console.error(e); }
})();
