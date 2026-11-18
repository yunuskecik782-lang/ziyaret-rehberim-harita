# Ziyaret Rehberim

İstanbul ziyaret ve gezi rehberi (6 rota, 75 durak): https://ziyaretrehberim.com/

Bu depo sitenin kendisidir: ana sayfa, altı rota sayfası, Ulaşım (konuma göre hat ve durak önerisi), Ücretler ve Saatler,
Ziyaret Âdâbı, Hesabım, Rotalarım ve harita uygulaması. Ziyaretçi konumunu görür, bir konsept seçer (camiler, sahâbe kabirleri,
padişah türbeleri…), kendine en yakın rotayı kurar, "Rotayı başlat" ile adım adım tarif alır, giriş yaptıysa rotayı kaydeder
ya da Google Haritalar / Apple Haritalar'da açar.

## Yayın

Adres: https://ziyaretrehberim.com/ (kökteki `CNAME` dosyası bu adresi belirler). Alan adında kök için GitHub Pages'in dört A kaydı
(185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) ve `www` için `yunuskecik782-lang.github.io` CNAME kaydı vardır.
Site 18 Kasım 2026 akşamı bu adrese bağlandı; öncesinde aynı adreste WordPress sayfaları duruyordu, bu depo da
`harita.ziyaretrehberim.com` adresinde (site `/yeni/` altında önizleme olarak) yayınlanıyordu.

Site GitHub Pages ile `gh-pages` dalından yayınlanır. `main` ve `gh-pages` aynı içeriği taşır;
her güncellemede ikisi birlikte gönderilir: `git push origin main main:gh-pages`.

Geri almak için: alan adında kökteki dört A kaydı silinip WordPress.com'un varsayılan A kayıtları geri getirilir, `www` kaydı
yeniden `ziyaretrehberim.com` yapılır. WordPress sayfaları silinmedi; alan adı geri dönünce eskisi gibi açılır.

## Dosyalar

Üretilen dosyalar elle düzenlenmez; kaynak değişir, sonra iki komut çalışır: `node kaynak/build.js && node site/build.js`.

- `index.html`, `404.html`, `sitemap.xml`, `robots.txt` ve `a/`, `rota-olustur/`, `guzergahlar/`, `ulasim/`, `ucretler-ve-saatler/`,
  `ziyaret-adabi/`, `hesabim/`, `rotalarim/` klasörleri: site sayfaları. `node site/build.js` yalnızca bunları silip baştan yazar.
- `harita/index.html`: harita uygulaması (tek dosya). `node kaynak/build.js` üretir. Site sayfalarına `?gomulu=1` ile gömülür.
- `404.html`: olmayan adreslerde çıkar. Eski önizleme adreslerini (`/yeni/…`) ve eski "Hakkında" sayfasını yeni yerlerine yönlendirir.
- `site/build.js`: sayfaları üretir. Adres sabitleri (`KOK`, `HARITA`, `ALAN`) en üsttedir.
- `site/icerik.js`: Ulaşım, Ücretler ve Saatler, Ziyaret Âdâbı metinleri. Bir maddeyi değiştirmek ya da eklemek için yalnızca bu dosya düzenlenir.
- `site/rota-metin.json`: rota sayfalarındaki açıklamalar ("Güzergâh hakkında", "Nasıl gidilir?", ipucu).
- `site/site.css`, `site/site.js`: görünüm ve davranış (harita, sokak tarifi, ulaşım önerisi, hesap).
- `kaynak/data.js`: rotalar, duraklar, koordinatlar, hazır başlangıç noktaları.
- `kaynak/app.css`, `kaynak/body.html`, `kaynak/app.js`: harita uygulamasının arayüzü, rota hesabı, kaydetme ve dışa aktarma.
- `kaynak/build.js`: harita uygulamasının parçalarını birleştirir. Sitenin bu alan adındaki yolu `SITE_YOL` sabitindedir.
- `kaynak/yol.js`: sokakları izleyen yürüyüş yolu ve dönüş tarifi. Hesap, OpenStreetMap verisiyle çalışan açık yol tarifi sunucusunda
  (FOSSGIS · routing.openstreetmap.de) yapılır; sunucuya yalnızca noktaların enlem ve boylamı gider. Ziyaretçinin kendi konumu,
  ekranda sorulup "evet" denmedikçe gönderilmez. Sunucu yanıt vermezse çizgi kuş uçuşuna döner. Ücretsiz bir topluluk hizmetidir, garanti vermez.
- `kaynak/hesap.js`: kullanıcı adı ve şifreyle hesap. Sunucu yoktur: hesap ve kayıtlı rotalar yalnızca o cihazda, o tarayıcıda durur;
  şifrenin kendisi saklanmaz (rastgele tuzla PBKDF2-SHA-256 özeti tutulur). Şifre sıfırlanamaz. Rota kaydetmek için giriş gerekir.
- `kaynak/vendor/leaflet/`: Leaflet 1.9.4 (BSD-2-Clause, lisansı klasörün içinde).
- `kaynak/vendor/maplibre/`: MapLibre GL JS 4.7.1 (BSD-3-Clause, lisansı klasörün içinde). Yalnızca "Rotayı başlat" denince yüklenir
  (`a/maplibre-gl.js`, `a/maplibre-gl.css`): uydu görüntüsünü eğik gösterir ve haritayı gidiş yönüne çevirir. Bina modeli yoktur.
  Cihaz açamazsa tarif düz haritada sürer.
- `onizleme/`: sitede kullanılan görseller. `ana-kapak.jpg` (ve küçük hâli `ana-kapak-k.jpg`) site sahibinin gönderdiği fotoğraftır;
  kaynağı ve lisansı henüz yazılmadı. `ana-harita.jpg` ve `rota-r1…r6.jpg` OpenStreetMap haritası üzerinde üretilmiştir
  (© OpenStreetMap katkıda bulunanlar). `zr-simgeler.png` simge şerididir: Lucide (ISC) ve Tabler Icons (MIT) simgelerinden derlenmiştir.

Arama motorları: site sayfaları açıktır (`sitemap.xml`). Hesabım, Rotalarım, 404 ve tek başına harita uygulaması (`/harita/`) kapalıdır (`noindex`).

## Harita kaynakları

- Sokak haritası: © [OpenStreetMap](https://www.openstreetmap.org/copyright) katkıda bulunanlar.
- Uydu görüntüsü ve yer adları: Esri World Imagery (Esri, Maxar, Earthstar Geographics). Bütün haritalar uydu görünümüyle açılır;
  ziyaretçi "Harita" düğmesiyle sokak haritasına geçerse seçimi o tarayıcıda hatırlanır. Sağlayıcının kullanım şartları
  henüz netleştirilmedi; uydu artık varsayılan olduğu için netleştirilmesi gerekir.

## Konum

Konum yalnızca tarayıcıda, ziyaretçinin izniyle kullanılır ve hiçbir yerde saklanmaz. Sokak yolu çizilirken başlangıç noktası,
yalnızca ziyaretçi ekrandaki soruya "evet" derse yol tarifi sunucusuna gider; "hayır" derse ilk etap düz çizgiyle gösterilir.
"Rotayı başlat" da konumu yol tarifi sunucusuna göndermeden önce bir kez sorar. Kurulmakta olan rota sekme kapanana kadar
tarayıcıda tutulur (durakların sırası; ziyaretçinin konumu tutulmaz).
Yürüyüş süreleri dakikada 75 m üzerinden hesaplanır; sokak yolu alınamazsa mesafe kuş uçuşu × 1,3 ile tahmin edilir.
