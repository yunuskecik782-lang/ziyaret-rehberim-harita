/* Yürüyüş yolu: sokakları izleyen yol çizgisi ve dönüş adımları.
   Hesap, OpenStreetMap verisiyle çalışan açık yol tarifi sunucusunda (FOSSGIS · routing.openstreetmap.de, OSRM "foot" profili) yapılır.
   Sunucuya yalnızca noktaların enlem ve boylamı gider; hiçbir şey kaydedilmez. Sunucu yanıt vermezse çağıran taraf düz çizgiye döner. */
globalThis.ZR_YOL = (() => {
  "use strict";
  const TABAN = (globalThis.ZR_YOL_TABAN || "https://routing.openstreetmap.de/routed-foot/route/v1/driving/");
  const PARCA = 24, SURE = 14000, HIZ = 75; // dakikada 75 m (4,5 km/sa): sitedeki sürelerle aynı ölçü
  const mem = new Map(), bekleyen = new Map();
  const k5 = (p) => (+p[0]).toFixed(5) + "," + (+p[1]).toFixed(5);
  const anahtar = (pts) => pts.map(k5).join(";");
  const R = 6371000, rad = Math.PI / 180;
  const olc = (a, b) => { const x = (b[1] - a[1]) * rad * Math.cos(((a[0] + b[0]) / 2) * rad), y = (b[0] - a[0]) * rad; return Math.hypot(x, y) * R; };

  const YON = { left: "Sola dön", right: "Sağa dön", "slight left": "Hafif sola dön", "slight right": "Hafif sağa dön", "sharp left": "Keskin sola dön", "sharp right": "Keskin sağa dön", uturn: "Geri dön" };
  const SIMGE = { left: "sol", right: "sag", "slight left": "sol", "slight right": "sag", "sharp left": "sol", "sharp right": "sag", uturn: "geri", straight: "duz" };
  function adim(st) {
    const m = st.maneuver || {}, t = m.type || "", mod = m.modifier || "", ad = (st.name || "").trim();
    let tx, k = SIMGE[mod] || "duz";
    if (t === "depart") { tx = ad ? ad + " üzerinden yürümeye başla" : "Yürümeye başla"; k = "basla"; }
    else if (t === "arrive") { tx = "Durağa vardın"; k = "var"; }
    else if (/roundabout|rotary/.test(t)) { tx = ad ? "Kavşaktan " + ad + " yönüne geç" : "Kavşaktan geç"; k = "duz"; }
    else if (t === "new name" || t === "continue" || t === "notification" || mod === "straight" || !YON[mod]) { tx = ad ? ad + " boyunca devam et" : "Düz devam et"; k = "duz"; }
    else {
      const on = t === "end of road" ? "Yolun sonunda " : t === "fork" ? "Ayrımda " : "";
      const y = on ? YON[mod].charAt(0).toLocaleLowerCase("tr") + YON[mod].slice(1) : YON[mod];
      tx = on + y + (ad ? ": " + ad : "");
    }
    return { t: tx, d: st.distance || 0, k, ad };
  }
  // Çok kısa adımlar ve art arda gelen aynı "devam et" satırları birleştirilir; okunur bir tarif kalır.
  function sadelestir(list) {
    const out = [];
    for (const a of list) {
      if (a.k === "var") continue;
      const son = out[out.length - 1];
      if (son && ((a.k === "duz" && son.ad === a.ad) || (a.d < 7 && a.k === "duz"))) { son.d += a.d; continue; }
      if (son && son.d < 7 && son.k !== "basla") { a.d += son.d; out[out.length - 1] = a; continue; }
      out.push({ ...a });
    }
    return out;
  }

  async function iste(pts, signal) {
    const url = TABAN + pts.map((p) => (+p[1]).toFixed(6) + "," + (+p[0]).toFixed(6)).join(";") + "?overview=false&steps=true&geometries=geojson&continue_straight=false";
    const ctl = new AbortController(), zaman = setTimeout(() => ctl.abort(), SURE);
    if (signal) signal.addEventListener("abort", () => ctl.abort(), { once: true });
    try {
      const r = await fetch(url, { signal: ctl.signal, credentials: "omit", referrerPolicy: "strict-origin-when-cross-origin" });
      if (!r.ok) throw new Error("http " + r.status);
      const j = await r.json();
      if (!j || j.code !== "Ok" || !j.routes || !j.routes[0]) throw new Error("yanit");
      return j.routes[0].legs.map((lg, i) => {
        // Her adımın çizgi üzerindeki yeri (i: adımın başladığı noktanın sırası) saklanır; "şu kadar metre sonra dön" hesabı bundan yapılır.
        const hat = [], ham = [];
        for (const st of lg.steps || []) {
          let ilk = -1;
          for (const c of (st.geometry && st.geometry.coordinates) || []) { const q = [c[1], c[0]], s = hat[hat.length - 1]; if (!s || s[0] !== q[0] || s[1] !== q[1]) hat.push(q); if (ilk < 0) ilk = hat.length - 1; }
          const ad = adim(st); ad.i = ilk < 0 ? Math.max(0, hat.length - 1) : ilk; ham.push(ad);
        }
        // Durak yoldan içerideyse (avlu, hazire) çizgi durağın kendisine kadar uzatılır.
        const a = pts[i], b = pts[i + 1];
        if (!hat.length) hat.push([+a[0], +a[1]], [+b[0], +b[1]]);
        const bas = olc(a, hat[0]), son = olc(hat[hat.length - 1], b), duz = olc(a, b);
        // İki durak birbirine, bağlandıkları sokaklardan daha yakınsa (aynı avlu, aynı hazire, aynı yapı) sokağa çıkıp geri dönülmez; doğrudan bağlanır.
        if (duz < bas + son) return { d: duz, pts: [[+a[0], +a[1]], [+b[0], +b[1]]], adim: [] };
        if (bas > 4) { hat.unshift([+a[0], +a[1]]); for (const ad of ham) ad.i++; }
        if (son > 4) hat.push([+b[0], +b[1]]);
        return { d: (lg.distance || 0) + (bas > 4 ? bas : 0) + (son > 4 ? son : 0), pts: hat, adim: sadelestir(ham) };
      });
    } finally { clearTimeout(zaman); }
  }

  /* pts: [[enlem, boylam], …] (en az iki nokta). Sonuç: { d, legs: [{ d, pts, adim: [{ t, d, k, ad, i }] }] } */
  function yol(pts, { signal } = {}) {
    if (!pts || pts.length < 2) return Promise.resolve({ d: 0, legs: [] });
    const key = anahtar(pts);
    if (mem.has(key)) return Promise.resolve(mem.get(key));
    if (bekleyen.has(key)) return bekleyen.get(key);
    const is = (async () => {
      const legs = [];
      for (let i = 0; i < pts.length - 1; i += PARCA) legs.push(...(await iste(pts.slice(i, i + PARCA + 1), signal)));
      const sonuc = { d: legs.reduce((s, l) => s + l.d, 0), legs };
      mem.set(key, sonuc); if (mem.size > 40) mem.delete(mem.keys().next().value);
      return sonuc;
    })();
    bekleyen.set(key, is);
    is.then(() => bekleyen.delete(key), () => bekleyen.delete(key));
    return is;
  }
  const hazir = (pts) => mem.get(anahtar(pts)) || null;
  const dk = (m) => Math.max(1, Math.round(m / HIZ));
  const SERVIS = { ad: "OpenStreetMap yol tarifi (FOSSGIS)", adres: "routing.openstreetmap.de" };
  return { yol, hazir, anahtar, olc, dk, SERVIS };
})();
