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
  $$(".acilir > button").forEach((b) => b.addEventListener("click", () => b.focus()));

  /* ——— Hesap durumu: "Giriş yap" yerine kullanıcı adı ——— */
  function hesapYaz() {
    const a = HESAP && HESAP.aktif();
    $$("[data-hesap-ad]").forEach((el) => { el.textContent = a ? (a.ad.length > 16 ? a.ad.slice(0, 15) + "…" : a.ad) : el.dataset.hesapAd; });
  }
  hesapYaz(); if (HESAP) HESAP.dinle(hesapYaz);

  /* ——— Görünür oldukça açılan kartlar ——— */
  const gz = $$("[data-g]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("gor"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    gz.forEach((el) => io.observe(el));
  } else gz.forEach((el) => el.classList.add("gor"));

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
      $$(".kat a").forEach((k) => k.classList.toggle("secili", k === a));
      $(".kat").scrollIntoView({ behavior: "smooth", block: "start" });
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

  /* ——— Rota sayfası: geniş harita, numaralı duraklar, sokaklardan yürüyüş yolu ve dönüş tarifi ——— */
  function rotaSayfa() {
    const R = veri, DU = R.duraklar, n = DU.length, host = $("#harita"), kart = $("#harita-kart");
    const { map } = haritaKur(host, "Haritayı kaydırmak için iki parmağını kullan ya da “Büyüt”e dokun", $('[data-h="uydu"]'), $("#h-kaynak"));
    const pts = DU.map((d) => [d.lat, d.lng]), sinir = L.latLngBounds(pts).pad(0.14);
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
    function tarifYaz() {
      const yuru = ara.filter((a) => !a.tasit), sokakli = yuru.length && yuru.every((a) => a.pts);
      const top = yuru.reduce((s, a) => s + (a.pts ? a.d : a.d * 1.3), 0);
      hYol.textContent = (sokakli ? "Yürüyüş yolu sokaklardan · " : "Yürüyüş yaklaşık · ") + fmtD(top) + (tasit.size ? " + " + tasit.size + " taşıt geçişi" : "");
      tarif.innerHTML = ara.map((a, k) => {
        const b = DU[k + 1], bas2 = `<span class="ar"><span class="no">${DU[k].n}</span>${ic("fwd")}<span class="no">${b.n}</span></span><span class="ad">${esc(b.ad)}</span>`;
        if (a.tasit) return `<details><summary>${bas2}<small>taşıtla · ${fmtD(a.d)}</small>${ic("down")}</summary><ol><li>${ic("tram")}<span>Bu iki durak arası uzun; tramvay, metro ya da vapurla geçilir. Hangi hattı kullanacağını <a href="${R.ulasim}">Ulaşım</a> sayfası gösterir.</span></li></ol></details>`;
        const d = a.pts ? a.d : a.d * 1.3, adim = a.adim && a.adim.length ? a.adim : null;
        return `<details><summary>${bas2}<small>${d < 15 ? "aynı yerde" : fmtD(d) + " · " + fmtDk(dkYuru(d))}</small>${ic("down")}</summary><ol>${adim ? adim.map((s) => `<li>${ic(s.k)}<span>${esc(s.t)}</span><small>${s.d >= 10 ? fmtD(s.d) : ""}</small></li>`).join("") : `<li>${ic("walk")}<span>${d < 15 ? "Bir önceki durakla aynı yerde." : a.pts ? "Kısa bir yürüyüş; durak hemen yakında." : "Sokak tarifi alınamadı. Mesafe kuş uçuşu ölçüden tahmin edildi."}</span></li>`}</ol></details>`;
      }).join("");
    }
    // Sokak yolu: aynı rota için 30 gün bu cihazda saklanır; yol tarifi sunucusuna her açılışta yeniden sorulmaz.
    const ozet = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
    const CK = "zr.yolc.1." + R.id + ".";
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
        const h = $(a.getAttribute("href")); if (h) { $$(".durak.vurgu").forEach((x) => x.classList.remove("vurgu")); h.classList.add("vurgu", "gor"); }
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

  /* ——— Hesabım ——— */
  function hesabim() {
    const kok = $("#hesap"), rot = $("#hesap-rotalar"); let sek = location.hash === "#kayit" ? "kayit" : "giris", mesaj = "", liste = false;
    function ciz() {
      const a = HESAP.aktif(), mis = HESAP.misafirRotalari().length;
      rot.hidden = !a;
      if (!a) {
        const k = sek === "kayit";
        kok.innerHTML = `<div class="kart"><div class="sekmeler" data-s="${sek}" role="tablist"><button type="button" role="tab" aria-selected="${!k}" data-sek="giris">Giriş yap</button><button type="button" role="tab" aria-selected="${k}" data-sek="kayit">Hesap oluştur</button></div>
<form class="form" data-form="${sek}" novalidate>
<div class="alan"><label for="h-ad">Kullanıcı adı</label><input id="h-ad" name="ad" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="24" required>${k ? "<small>3–24 karakter; harf, rakam, nokta, alt çizgi ve tire.</small>" : ""}</div>
<div class="alan"><label for="h-sifre">Şifre</label><input id="h-sifre" name="sifre" type="password" autocomplete="${k ? "new-password" : "current-password"}" required>${k ? "<small>En az 6 karakter.</small>" : ""}</div>
${k ? '<div class="alan"><label for="h-sifre2">Şifre (tekrar)</label><input id="h-sifre2" name="sifre2" type="password" autocomplete="new-password" required></div>' : ""}
<div class="hata" role="alert" hidden></div>
<button class="btn koyu" type="submit">${k ? "Hesabımı oluştur" : "Giriş yap"}</button></form>
${mis ? `<p class="ince" style="margin-top:14px">Giriş yapmadan kaydedilmiş ${mis} rotan var. ${k ? "Hesabını oluşturunca" : "Giriş yapınca"} hesabına taşıyabilirsin.</p>` : ""}</div>`;
        return;
      }
      const n = HESAP.rotalar().length;
      kok.innerHTML = `<div class="kart">${mesaj ? `<p class="tamam" style="margin-bottom:16px">${esc(mesaj)}</p>` : ""}
<div class="profil"><span class="harf">${esc(a.ad.charAt(0).toLocaleUpperCase("tr"))}</span><div><h2>${esc(a.ad)}</h2><p class="ince">${n ? n + " kayıtlı rota" : "Henüz kayıtlı rota yok"}</p></div></div>
${mis ? `<div class="uyari-serit" style="margin:16px 0 0"><span>Giriş yapmadan kaydettiğin ${mis} rota var.</span><button class="btn kucuk koyu" type="button" data-is="tasi">Hesabıma taşı</button></div>` : ""}
<div class="dugmeler" style="margin-top:18px"><a class="btn altin" href="${ZR_YER.olustur}">${ic("rota")}Rota oluştur</a><a class="btn" href="${ZR_YER.rotalarim}">${ic("mark")}Rotalarım</a><button class="btn" type="button" data-is="cikis">Çıkış yap</button></div>
<details class="katla"><summary>${ic("fwd")}Şifre değiştir</summary><form class="form" data-form="sifre" novalidate><div class="alan"><label for="s-eski">Şimdiki şifre</label><input id="s-eski" name="eski" type="password" autocomplete="current-password" required></div><div class="alan"><label for="s-yeni">Yeni şifre</label><input id="s-yeni" name="yeni" type="password" autocomplete="new-password" required><small>En az 6 karakter.</small></div><div class="hata" role="alert" hidden></div><button class="btn koyu" type="submit">Şifreyi değiştir</button></form></details>
<details class="katla"><summary>${ic("fwd")}Hesabı sil</summary><form class="form" data-form="sil" novalidate><p class="ince">Hesap ve bu hesaba kayıtlı rotalar silinir. Geri alınamaz.</p><div class="alan"><label for="x-sifre">Şifre</label><input id="x-sifre" name="sifre" type="password" autocomplete="current-password" required></div><div class="hata" role="alert" hidden></div><button class="btn" type="submit">Hesabımı sil</button></form></details></div>`;
      if (!liste) { liste = true; kayitListesi($("#kayitlar")); }
    }
    kok.addEventListener("click", (e) => {
      const s = e.target.closest("[data-sek]"); if (s) { sek = s.dataset.sek; ciz(); $("#h-ad").focus(); return; }
      const b = e.target.closest("[data-is]"); if (!b) return;
      if (b.dataset.is === "cikis") { mesaj = ""; HESAP.cikis(); bildir("Çıkış yapıldı."); ciz(); }
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
        else s = await HESAP.hesabiSil(v.sifre);
      } catch (err) { s = { ok: false, hata: "Bir şey ters gitti. Sayfayı yenileyip yeniden dene." }; }
      btn.disabled = false;
      if (!s.ok) return yaz(s.hata);
      if (f.dataset.form === "kayit") mesaj = "Hesabın oluşturuldu. Hoş geldin!";
      else if (f.dataset.form === "giris") mesaj = "Giriş yapıldı. Hoş geldin!";
      else if (f.dataset.form === "sifre") { mesaj = "Şifren değiştirildi."; }
      else { mesaj = ""; bildir("Hesabın silindi."); }
      ciz(); scrollTo({ top: 0, behavior: "smooth" });
    });
    HESAP.dinle(() => { if (!document.activeElement || !kok.contains(document.activeElement) || document.activeElement.tagName !== "INPUT") ciz(); });
    ciz();
  }

  /* ——— Rotalarım ——— */
  function rotalarim() {
    const mis = $("#misafir");
    const yaz = () => { const a = HESAP.aktif(), n = HESAP.rotalar().length; mis.innerHTML = a ? `<p class="ince" style="margin-bottom:14px"><b>${esc(a.ad)}</b> hesabına kayıtlı rotalar.</p>` : `<div class="uyari-serit"><span>${n ? "Bu rotalar giriş yapmadan kaydedilmiş. Giriş yapınca hesabına taşıyabilirsin." : "Rota kaydetmek için giriş yapman gerekir."}</span><a class="btn kucuk koyu" href="${ZR_YER.hesap}">Giriş yap ya da hesap oluştur</a></div>`; };
    HESAP.dinle(yaz); yaz(); kayitListesi($("#kayitlar"));
  }

  const SAYFA = { ana, "rota-olustur": olustur, rota: rotaSayfa, ulasim, hesabim, rotalarim };
  try { if (SAYFA[sayfa]) SAYFA[sayfa](); } catch (e) { console.error(e); }
})();
