# Ziyaret Rehberim Haritası

İstanbul'daki manevî ve tarihî ziyaret duraklarını (6 rota, 75 durak) gerçek harita ve uydu görüntüsü üzerinde gösteren tek sayfalık harita.
Ziyaretçi konumunu görür, bir konsept seçer (camiler, sahâbe kabirleri, padişah türbeleri…), kendine en yakın rotayı kurar,
rotayı cihazına kaydeder ya da Google Haritalar / Apple Haritalar'da açar.

Bu depo bir **deneme yayınıdır**; sayfa şimdilik arama motorlarına kapalıdır (`noindex`).

## Yayın

Adres: https://harita.ziyaretrehberim.com/ (kökteki `CNAME` dosyası bu adresi belirler; alan adında `harita` için bir CNAME kaydı vardır).

Sayfa GitHub Pages ile `gh-pages` dalından yayınlanır. `main` ve `gh-pages` aynı içeriği taşır;
her güncellemede ikisi birlikte gönderilir: `git push origin main main:gh-pages`.

## Dosyalar

- `index.html`: yayınlanan sayfa. Tek dosyadır, `kaynak/` içindeki parçalardan üretilir. Elle düzenlenmez.
- `kaynak/data.js`: rotalar, duraklar, koordinatlar, hazır başlangıç noktaları.
- `kaynak/app.css`, `kaynak/body.html`, `kaynak/app.js`: arayüz, harita, rota hesabı, kaydetme ve dışa aktarma.
- `kaynak/build.js`: parçaları birleştirir. `node kaynak/build.js` komutu `index.html` dosyasını yeniden üretir.
- `kaynak/vendor/leaflet/`: Leaflet 1.9.4 (BSD-2-Clause, lisansı klasörün içinde).
- `onizleme/`: ziyaretrehberim.com sayfalarında kullanılan görseller. `ana-harita.jpg` ve `rota-r1…r6.jpg` OpenStreetMap
  haritası üzerinde üretilmiştir (© OpenStreetMap katkıda bulunanlar). `zr-simgeler.png` simge şerididir:
  Lucide (ISC) ve Tabler Icons (MIT) simgelerinden derlenmiştir.

## Yeni ön yüz (önizleme)

Adres: https://harita.ziyaretrehberim.com/yeni/ (deneme; arama motorlarına kapalı).

Sitenin kendi yazılımımızla kurulan ön yüzü: ana sayfa (harita aynı sayfada açılır), altı rota sayfası, Ulaşım (konuma göre hat ve durak önerisi),
Ücretler ve Saatler, Ziyaret Âdâbı, Hesabım, Rotalarım ve tam sayfa Rota oluştur. Telefonda altta dört düğmeli menü vardır.

- `site/build.js`: sayfaları üretir. `node site/build.js` komutu `yeni/` klasörünü baştan yazar. `yeni/` elle düzenlenmez.
- `site/icerik.js`: Ulaşım, Ücretler ve Saatler, Ziyaret Âdâbı metinleri. Bir maddeyi değiştirmek ya da eklemek için yalnızca bu dosya düzenlenir.
- `site/rota-metin.json`: rota sayfalarındaki açıklamalar ("Güzergâh hakkında", "Nasıl gidilir?", ipucu).
- `site/site.css`, `site/site.js`: görünüm ve davranış (harita, sokak tarifi, ulaşım önerisi, hesap).
- `kaynak/yol.js`: sokakları izleyen yürüyüş yolu ve dönüş tarifi. Hesap, OpenStreetMap verisiyle çalışan açık yol tarifi sunucusunda
  (FOSSGIS · routing.openstreetmap.de) yapılır; sunucuya yalnızca noktaların enlem ve boylamı gider. Ziyaretçinin kendi konumu,
  ekranda sorulup "evet" denmedikçe gönderilmez. Sunucu yanıt vermezse çizgi kuş uçuşuna döner. Ücretsiz bir topluluk hizmetidir, garanti vermez.
- `kaynak/hesap.js`: kullanıcı adı ve şifreyle hesap. Sunucu yoktur: hesap ve kayıtlı rotalar yalnızca o cihazda, o tarayıcıda durur;
  şifrenin kendisi saklanmaz (rastgele tuzla PBKDF2-SHA-256 özeti tutulur). Şifre sıfırlanamaz.

Ana alan adı bu ön yüze bağlanacağı zaman `site/build.js` içindeki `KOK` ve `HARITA`, `kaynak/build.js` içindeki `SITE_YOL` değiştirilir.

## Harita kaynakları

- Sokak haritası: © [OpenStreetMap](https://www.openstreetmap.org/copyright) katkıda bulunanlar.
- Uydu görüntüsü ve yer adları: Esri World Imagery (Esri, Maxar, Earthstar Geographics). Deneme amaçlı kullanılıyor;
  kalıcı yayından önce sağlayıcının kullanım şartları netleştirilmeli.

## Konum

Konum yalnızca tarayıcıda, ziyaretçinin izniyle kullanılır ve hiçbir yerde saklanmaz. Sokak yolu çizilirken başlangıç noktası,
yalnızca ziyaretçi ekrandaki soruya "evet" derse yol tarifi sunucusuna gider; "hayır" derse ilk etap düz çizgiyle gösterilir.
Yürüyüş süreleri dakikada 75 m üzerinden hesaplanır; sokak yolu alınamazsa mesafe kuş uçuşu × 1,3 ile tahmin edilir.
