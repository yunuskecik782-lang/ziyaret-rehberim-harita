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
Yönetim paneli de (aşağıda) iki dalı aynı kayda taşır. Panelden yayın yapılmış olabileceği için depoda çalışmaya başlamadan önce
`git pull` yapılır.

Geri almak için: alan adında kökteki dört A kaydı silinip WordPress.com'un varsayılan A kayıtları geri getirilir, `www` kaydı
yeniden `ziyaretrehberim.com` yapılır. WordPress sayfaları silinmedi; alan adı geri dönünce eskisi gibi açılır.

## Dosyalar

Üretilen dosyalar elle düzenlenmez; kaynak değişir, sonra iki komut çalışır: `node kaynak/build.js && node site/build.js`.

- `index.html`, `404.html`, `sitemap.xml`, `robots.txt` ve `a/`, `rota-olustur/`, `guzergahlar/`, `ulasim/`, `ucretler-ve-saatler/`,
  `ziyaret-adabi/`, `hesabim/`, `rotalarim/`, `yonetim/` klasörleri: site sayfaları. `node site/build.js` yalnızca bunları silip baştan yazar.
- `harita/index.html`: harita uygulaması (tek dosya). `node kaynak/build.js` üretir. Site sayfalarına `?gomulu=1` ile gömülür.
- `404.html`: olmayan adreslerde çıkar. Eski önizleme adreslerini (`/yeni/…`) ve eski "Hakkında" sayfasını yeni yerlerine yönlendirir.
- `site/build.js`: sayfaları üretir. Adres sabitleri (`KOK`, `HARITA`, `ALAN`) en üsttedir. Rota ve durak sayıları veriden hesaplanır.
- `site/io.js`: iki üretim betiğinin dosya okuma ve yazma katmanı. Betikler dosyaya doğrudan dokunmaz; böylece aynı betikler
  yönetim panelinde, tarayıcının içinde de çalışır. Bu yüzden betiklerde `require`, `fs`, `path` kullanılmaz.
- `site/veri-yaz.js`: `kaynak/data.js` içindeki `PANEL:BAS` … `PANEL:SON` bölümünü (rotalar, konseptler, duraklar) yeniden yazar.
  Paneli de bu işlev kullanır. `node site/veri-yaz.js` dosyayı aynı biçime getirir.
- `site/yonetim.js`, `site/yonetim.css`: yönetim paneli (`/yonetim/`).
- `site/icerik.js`: Ulaşım, Ücretler ve Saatler, Ziyaret Âdâbı metinleri. Bir maddeyi değiştirmek ya da eklemek için yalnızca bu dosya düzenlenir.
- `site/rota-metin.json`: rota sayfalarındaki açıklamalar ("Güzergâh hakkında", "Nasıl gidilir?", ipucu).
- `site/site.css`, `site/site.js`: görünüm ve davranış (harita, sokak tarifi, ulaşım önerisi, hesap).
  Masaüstünde (900 pikselden geniş) sayfa pencereyi doldurur: logo en solda, "Giriş yap" en sağda; üst şeritte menü düğmesi yoktur.
  Sol kenarda hep görünen 60 piksellik ince bir şerit vardır: en üstte menü düğmesi, altında bölüm kısayolları. Menü düğmesi sol sütunu
  açar: filtreler, güzergâhlar, o sayfanın bölümleri, pratik bilgi (`yanCubuk` işlevi, `site/build.js`). Sütunun başındaki koyu "Menü"
  çubuğu onu kapatır. Sütun 1480 pikselden geniş ekranda sabit durur; kapatılırsa tercih o tarayıcıda saklanır (`zr.yan`), daha dar
  ekranda sayfanın üstüne açılır. Telefonda sütun ve ince şerit yoktur, tam ekran menü vardır.
  "Güzergâhlar" açılır listesi altı rotayı küçük rota çizimleriyle gösterir (`miniRota`).
  Sayfa geçişinde bilerek efekt yoktur: tarayıcı eski sayfayı yeni sayfa çizilene kadar tutar, tek karede değiştirir (titreme olmasın diye).
  Aşağıdaki bölümler kaydırınca belirir; açılışta ekranda olan içerik hiç gizlenmez.
  Arka plan (`.zemin`; `ZEMIN` ve `ZEMIN_CSS`, `site/build.js`) bilerek sadedir: beyaza yakın zemin, yavaşça yer değiştiren iki yumuşak ışık
  ve köşelerde çok yavaş dönen iki ince geometrik gül. Yalnızca `transform` ile hareket eder; işi ekran kartı yapar, sayfa yavaşlamaz.
  Hareketler sayfanın başındaki ortak saate (`--zt`) bağlıdır, sayfa değişince kaldığı yerden sürer. "Hareketi azalt" seçili cihazlarda durur.
- `kaynak/data.js`: rotalar, duraklar, koordinatlar, hazır başlangıç noktaları. Her durağın son alanı kalıcı anahtarıdır
  (`r1-4` gibi); sıra ya da rota değişse de aynı kalır, ziyaretçilerin kayıtlı rotaları bozulmaz. Elle durak eklerken yeni,
  benzersiz bir anahtar verilir ve var olan anahtarlar değiştirilmez.
- `kaynak/app.css`, `kaynak/body.html`, `kaynak/app.js`: harita uygulamasının arayüzü, rota hesabı, kaydetme ve dışa aktarma.
  Panelde üç sekme vardır: Hazır rotalar (her rota tek satırlık kart), Keşfet (üstte tek satırlık rota özeti ve başlangıç noktası,
  iki satıra sığan kategori düğmeleri, sonra yakından uzağa durak listesi) ve Rotam. "Rotayı başlat" çubuğu yalnızca Rotam sekmesinde
  görünür (`syncGo`); Keşfet'teki "Rotama git" oraya götürür. Rota çizgisinin üstünde gidiş yönüne doğru küçük noktalar akar (`.rt-akis`).
- `kaynak/build.js`: harita uygulamasının parçalarını birleştirir. Sitenin bu alan adındaki yolu `SITE_YOL` sabitindedir.
- `kaynak/yol.js`: sokakları izleyen yürüyüş yolu ve dönüş tarifi. Hesap, OpenStreetMap verisiyle çalışan açık yol tarifi sunucusunda
  (FOSSGIS · routing.openstreetmap.de) yapılır; sunucuya yalnızca noktaların enlem ve boylamı gider. Ziyaretçinin kendi konumu,
  ekranda sorulup "evet" denmedikçe gönderilmez. Sunucu yanıt vermezse çizgi kuş uçuşuna döner. Ücretsiz bir topluluk hizmetidir, garanti vermez.
- `kaynak/hesap.js`: kullanıcı adı ve şifreyle hesap. Sunucu yoktur: hesap ve kayıtlı rotalar yalnızca o cihazda, o tarayıcıda durur;
  şifrenin kendisi saklanmaz (rastgele tuzla PBKDF2-SHA-256 özeti tutulur). Şifre sıfırlanamaz. Rota kaydetmek için giriş gerekir.
- `kaynak/vendor/leaflet/`: Leaflet 1.9.4 (BSD-2-Clause, lisansı klasörün içinde).
- `kaynak/vendor/yazi/`: sitenin ve harita uygulamasının iki yazı tipi, Inter ve Plus Jakarta Sans (SIL Open Font License 1.1,
  lisansları ve kaynak notu klasörün içinde). Yalnızca sitede geçen harflerle küçültülmüş tek dosyalardır; site kendi sunucusundan
  verir (`a/`); site sayfaları ve harita uygulaması Google'a yazı tipi isteği göndermez (yalnızca yönetim paneli hâlâ Google Fonts kullanır). `font-display: optional`: yazı tipi hemen hazır değilse sayfa yedek yazı tipiyle açılır ve
  sonradan değişip kaymaz.
- "Rotayı başlat" (adım adım tarif) aynı düz (2B) Leaflet haritasında çalışır; ek kütüphane yüklenmez, dokununca hemen açılır.
- `onizleme/`: sitede kullanılan görseller. `ana-kapak.jpg` (ve küçük hâli `ana-kapak-k.jpg`) site sahibinin gönderdiği fotoğraftır;
  kaynağı ve lisansı henüz yazılmadı. `ana-harita.jpg` ve `rota-r1…r6.jpg` OpenStreetMap haritası üzerinde üretilmiştir
  (© OpenStreetMap katkıda bulunanlar). `zr-simgeler.png` simge şerididir: Lucide (ISC) ve Tabler Icons (MIT) simgelerinden derlenmiştir.

Arama motorları: site sayfaları açıktır (`sitemap.xml`). Hesabım, Rotalarım, 404, yönetim paneli ve tek başına harita uygulaması (`/harita/`) kapalıdır (`noindex`).

## Yönetim paneli

Adres: https://ziyaretrehberim.com/yonetim/ (sitede bağlantısı yoktur). Durakların adı, türü, yeri, açıklaması, saati ve konumu,
durak sırası, rota bilgileri ve rota sayfası metinleri buradan değiştirilir; haritaya dokunarak yeni durak eklenir, durak silinir.

Nasıl çalışır: sunucu yoktur. Panel depoyu GitHub'ın arayüzünden okur, değişiklikleri `kaynak/data.js` ve `site/rota-metin.json`
dosyalarına yazar, iki üretim betiğini tarayıcıda çalıştırır ve değişen dosyaları tek bir kayıt olarak `main` ile `gh-pages`
dallarına birlikte gönderir. Yayın bir iki dakikada siteye yansır. Her yayın depoda bir kayıttır; eski hâl kayıt geçmişinden geri alınır.
Paneli açtıktan sonra depo başka bir yerden değiştiyse panel yayınlamaz, sayfayı yenilemeyi ister.

Giriş: panel ilk açılışta her cihazda bir kez kurulur. Yönetici adı ve şifre belirlenir, GitHub'da oluşturulan anahtar yapıştırılır
(Fine-grained token; yalnızca bu depo; izin olarak yalnızca "Contents: Read and write"). Anahtar o tarayıcıda şifreyle şifrelenip
saklanır (AES-GCM; anahtar şifreden PBKDF2-SHA-256, 600.000 turla türetilir), açık hâli diske yazılmaz. Yazma yetkisini veren şey
GitHub anahtarıdır; yönetici adı ve şifre o cihazdaki anahtarı korur. Şifre unutulursa giriş ekranındaki "Bu cihazdaki kaydı sil"
ile kayıt silinip kurulum yeniden yapılır. Anahtar GitHub'dan silinirse panel hiçbir cihazda yazamaz.

Panelde henüz olmayanlar: yeni rota açmak ya da rota silmek (altı rota renklere, konseptlere, görsellere ve metinlere bağlıdır),
Ulaşım, Ücretler ve Saatler ve Ziyaret Âdâbı metinleri (`site/icerik.js`), görseller.

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
