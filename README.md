# Ziyaret Rehberim Haritası

İstanbul'daki manevî ve tarihî ziyaret duraklarını (6 rota, 75 durak) gerçek harita ve uydu görüntüsü üzerinde gösteren tek sayfalık harita.
Ziyaretçi konumunu görür, bir konsept seçer (camiler, sahâbe kabirleri, padişah türbeleri…), kendine en yakın rotayı kurar,
rotayı cihazına kaydeder ya da Google Haritalar / Apple Haritalar'da açar.

Bu depo bir **deneme yayınıdır**; sayfa şimdilik arama motorlarına kapalıdır (`noindex`).

## Yayın

Sayfa GitHub Pages ile `gh-pages` dalından yayınlanır. `main` ve `gh-pages` aynı içeriği taşır;
her güncellemede ikisi birlikte gönderilir: `git push origin main main:gh-pages`.

## Dosyalar

- `index.html`: yayınlanan sayfa. Tek dosyadır, `kaynak/` içindeki parçalardan üretilir. Elle düzenlenmez.
- `kaynak/data.js`: rotalar, duraklar, koordinatlar, hazır başlangıç noktaları.
- `kaynak/app.css`, `kaynak/body.html`, `kaynak/app.js`: arayüz, harita, rota hesabı, kaydetme ve dışa aktarma.
- `kaynak/build.js`: parçaları birleştirir. `node kaynak/build.js` komutu `index.html` dosyasını yeniden üretir.
- `kaynak/vendor/leaflet/`: Leaflet 1.9.4 (BSD-2-Clause, lisansı klasörün içinde).

## Harita kaynakları

- Sokak haritası: © [OpenStreetMap](https://www.openstreetmap.org/copyright) katkıda bulunanlar.
- Uydu görüntüsü ve yer adları: Esri World Imagery (Esri, Maxar, Earthstar Geographics). Deneme amaçlı kullanılıyor;
  kalıcı yayından önce sağlayıcının kullanım şartları netleştirilmeli.

## Konum

Konum yalnızca tarayıcıda, ziyaretçinin izniyle kullanılır. Hiçbir yere gönderilmez ve saklanmaz.
Yürüyüş mesafeleri ve süreleri tahminîdir (kuş uçuşu mesafe × 1,3; dakikada 75 m).
