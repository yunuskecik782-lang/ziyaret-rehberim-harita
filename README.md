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
  ekranda sayfanın üstüne açılır. Telefonda sütun ve ince şerit yoktur, tam ekran menü vardır:
  kutusuz ve simgesiz bir yazı listesi; Güzergâhlar başta kapalıdır, dokununca altı rota açılır.
  Görünüm (21 Kasım 2026'dan beri) ATLAS'ın "Kurumsal Lacivert" düzenini örnek alır: soğuk açık gri zemin, beyaz kart, hafif gölge, lacivert
  yazı ve düğme (`--ink`, `--koyu`), küçük köşeler (kart 14-16, kutu 8-10 piksel), altın yalnızca ince çizgi ve
  rakam rozetinde. Renkli zeminler ve renkli yazılar yoktur; rota renkleri (`--r1`…`--r6`) yalnızca haritada ve küçük noktalarda kullanılır.
  22 Kasım 2026'da 40 kurumsal sitenin (e-Devlet, bakanlıklar, GOV.UK ve benzerleri) incelemesine göre sadeleştirildi: düğmeler düz
  lacivert (parlama ve geçiş rengi yok), kart gölgeleri ince, etiketler büyük harf yerine cümle düzeninde, odak halkası 3 piksel lacivert
  (lacivert zeminde beyaz), başlıklardaki altın alt çizgi kaldırıldı. Bu kurallar `site/site.css` ve `kaynak/app.css` sonundaki
  "Kurumsal sadeleştirme" bölümündedir.
  22 Kasım 2026'dan beri sol sütun ve ince şerit beyazdır (Stripe'taki sade düzenden ilham): ince kenar çizgisi, gri bölüm başlıkları,
  açık mavi kutuda iki tonlu simgeler (`ICON2` ve `ic2`, `site/build.js`; dolgu parçaları `.t` sınıfıyla rengin açık tonudur), seçili satırda
  açık mavi zemin ve solda lacivert çizgi. Sayfanın başı maviden beyaza geçer (`body::after`, sayfayla kayar), sayfanın sonu alt bilginin
  üstündeki şeritte beyazdan laciverte geçer (`.alt::before`).
  Site içi arama: üst şeritteki "Ara" düğmesi (kısayol `/`) ve ana sayfa kapağındaki alan aynı pencereyi açar (`ARA_KUTU`, `site/build.js`;
  davranışı `site/site.js`). Dizin `a/ara.json` her üretimde yazılır: rotalar, duraklar (`#durak-<n>` bağlantısıyla) ve sayfaların
  sol sütundaki "Bu sayfada" bölümleri. Arama tarayıcıda yapılır, Türkçe harfler ve şapkalar eşit sayılır.
  Alt bilgi lacivert ve sütunludur (Güzergâhlar, Pratik bilgi, Site); en altta kaynaklar ve "Son güncelleme" (üretim günü, İstanbul saati).
  Gizlilik (`/gizlilik/`) ve Erişilebilirlik (`/erisilebilirlik/`) sayfaları `metinSayfa` ile üretilir; metinler sitenin gerçekte yaptığını
  anlatır. Yeni bir veri işlemi eklenirse önce bu metinler güncellenir.
  "Güzergâhlar" açılır listesi altı rotayı gölgeli rakam rozetleriyle gösterir (`.guz-no`); liste açılınca rozetler sırayla belirir.
  Rakam rozetleri (`.no`, `.sira.altin`, `.guz-no`): açılan soluk altın zemin, koyu rakam. Renkleri `--altin-gr`, `--altin-yazi` ve `--rozet-*`
  değişkenlerinden gelir. Altın yazı rengi olarak kullanılmaz, yalnızca zemin ve çizgidir. Harita uygulamasındaki sıra kutusu (`.bdg`) açık
  gridir; altındaki ince çizgi durağın haritadaki işaret rengidir.
  Kategori simgeleri (`RESIM` ve `rs()`, `site/build.js`) gerçek yapılardan sadeleştirilmiş tek renk çizimlerdir: kavuklu mezar taşı ve servi,
  Kanuni Türbesi gibi revaklı türbe, Süleymaniye gibi dört minareli cami, Galata Kulesi, kara surları, pusula. Fotoğraf değildir, dışarıdan dosya yüklenmez.
  Sayfa geçişinde bilerek efekt yoktur: tarayıcı eski sayfayı yeni sayfa çizilene kadar tutar, tek karede değiştirir (titreme olmasın diye).
  Aşağıdaki bölümler kaydırınca belirir; açılışta ekranda olan içerik hiç gizlenmez.
  Arka plan (`.zemin`; `ZEMIN` ve `ZEMIN_CSS`, `site/build.js`): beyaza yakın zemin, çok yavaş kayan Selçuklu yıldızı deseni (`.z-desen`;
  sekiz köşeli yıldız ve haç), ortayı açık tutan beyaz bir örtü (`.z-sis`) ve yavaşça yer değiştiren iki yumuşak ışık. Desen karosu betikte
  çizilir; ikinci seçenek şemsedir (Osmanlı cilt süslemesindeki dilimli madalyon). Lale kafesi site sahibinin isteğiyle kaldırıldı; üçgen ya da
  soyut geometrik dolgu kullanılmaz. Desen tam bir karo (şemsede yarım karo çapraz) kayınca kendi üzerine oturur, döngüde sıçrama olmaz.
  Yalnızca `transform` ile hareket eder; işi ekran kartı yapar.
  Hareketler sayfanın başındaki ortak saate (`--zt`) bağlıdır, sayfa değişince kaldığı yerden sürer. "Hareketi azalt" seçili cihazlarda durur.
- `kaynak/data.js`: rotalar, duraklar, koordinatlar, hazır başlangıç noktaları. Her durağın son alanı kalıcı anahtarıdır
  (`r1-4` gibi); sıra ya da rota değişse de aynı kalır, ziyaretçilerin kayıtlı rotaları bozulmaz. Elle durak eklerken yeni,
  benzersiz bir anahtar verilir ve var olan anahtarlar değiştirilmez.
- `kaynak/app.css`, `kaynak/body.html`, `kaynak/app.js`: harita uygulamasının arayüzü, rota hesabı, kaydetme ve dışa aktarma.
  Panelde üç sekme vardır: Hazır rotalar (her rota tek satırlık kart), Keşfet (üstte tek satırlık rota özeti ve başlangıç noktası,
  iki satıra sığan kategori düğmeleri, sonra yakından uzağa durak listesi) ve Rotam. "Rotayı başlat" çubuğu yalnızca Rotam sekmesinde
  görünür (`syncGo`); Keşfet'teki "Rotama git" oraya götürür. Rota çizgisinin üstünde gidiş yönüne doğru küçük noktalar akar (`.rt-akis`).
  Harita işaretleri iki biçimdedir (`MK_SEKIL`, `kaynak/app.js`): Sahâbe, padişah türbeleri ve camiler konum işareti (ucu tam noktada),
  tarihî mekânlar ve surlar yuvarlak. İkisi de üç boyutlu görünür: parlak, ortası delik konum işareti ve parlak boncuk. Resimleri `mkPin` ve
  `mkTop` çizer (kendi çizimimiz, dışarıdan dosya yok); `mkResimler` her rota rengi için bir kez üretip CSS’e `--mk-pin` ve `--mk-top` olarak
  verir. Rotaya giren işaretin deliğinin önünde sıra numarası durur. Sahâbe işaretlerinin ve seçili işaretin ucunda yavaş bir halka atar;
  padişah işaretlerinin kenarı altındır; yeri yaklaşık olanların kenarı kesiklidir.
- `kaynak/build.js`: harita uygulamasının parçalarını birleştirir. Sitenin bu alan adındaki yolu `SITE_YOL` sabitindedir.
- `kaynak/yol.js`: sokakları izleyen yürüyüş yolu ve dönüş tarifi. Hesap, OpenStreetMap verisiyle çalışan açık yol tarifi sunucusunda
  (FOSSGIS · routing.openstreetmap.de) yapılır; sunucuya yalnızca noktaların enlem ve boylamı gider. Ziyaretçinin kendi konumu,
  ekranda sorulup "evet" denmedikçe gönderilmez. Sunucu yanıt vermezse çizgi kuş uçuşuna döner. Ücretsiz bir topluluk hizmetidir, garanti vermez.
- `kaynak/hesap.js`: kullanıcı adı ve şifreyle hesap. Sunucu yoktur: hesap ve kayıtlı rotalar yalnızca o cihazda, o tarayıcıda durur;
  şifrenin kendisi saklanmaz (rastgele tuzla PBKDF2-SHA-256 özeti tutulur). Şifre sıfırlanamaz. Rota kaydetmek için giriş gerekir.
  Görünüm ayarları da buradadır (Hesabım sayfasındaki "Görünüm" kartı): rozet rengi, arka plan deseni, rota çizgisinin rengi ve biçimi,
  harita işaretlerinin biçimi, hareket. Seçenekler `G_SEC` içindedir (ilk değer varsayılandır); kart `gorunumHtml()` ile çizilir (`site/site.js`).
  Seçim hesaba bağlıdır ve o cihazda durur (`zr.gorunum.u.<hesap>`); giriş yapınca etkin kopyaya (`zr.gorunum.v1`) alınır, çıkışta silinir.
  Sayfa, seçimi `<html>` üzerine `data-rozet`, `data-desen`, `data-cizgi`, `data-stil`, `data-isaret`, `data-hareket` olarak yazar;
  renkler ve biçimler bu niteliklere bağlı CSS ile değişir. Sayfa başındaki küçük betik bunu ilk çizimden önce uygular.
  Yeni bir seçenek eklemek için: `G_SEC`'e değer, `site/site.js` içindeki `G_AD`'a ad, CSS'e o değerin kuralı eklenir.
- WordPress.com hesabıyla giriş (`kaynak/hesap.js`, "WP" bölümü): `WP_ISTEMCI` sabitine developer.wordpress.com/apps üzerinde açılan
  uygulamanın "Client ID" sayısı yazılınca açılır; boşken Hesabım sayfası eski hâliyle (kullanıcı adı ve şifre) çalışır. "Client Secret"
  kullanılmaz ve depoya yazılmaz. Uygulamanın "Redirect URLs" alanı `https://ziyaretrehberim.com/hesabim/`, "Javascript Origins" alanı
  `https://ziyaretrehberim.com` olmalıdır; adres değişirse ikisi de orada güncellenir. Akış: ziyaretçi WordPress.com'un ekranına gider
  (hesabı yoksa orada e-postasıyla açar, şifresini orada yeniler), onay verince `/hesabim/` adresine kısa ömürlü bir jetonla döner.
  Jeton adres çubuğundan hemen silinir, hiç saklanmaz; onunla yalnızca kimlik sorulur (kapsam `auth`) ve ad ile kullanıcı adı alınır,
  e-posta adresi alınmaz. Hesap o cihazda `wp:<WordPress.com kullanıcı numarası>` kimliğiyle tutulur. Kayıtlı rotalar ve görünüm ayarları
  bu yolda da yalnızca o cihazda durur; üye listesi tutulmaz. Giriş açıkken yeni "cihaz" hesabı açılmaz; cihazdaki eski hesapla giriş ve
  eski hesabın rotalarını taşıma (eski şifre sorulur) yerinde kalır. WordPress.com bu tarayıcı akışını "eski" (legacy) diye anar; kaldırırsa
  giriş için küçük bir sunucu gerekir.
- E-posta ve şifreyle üyelik (`kaynak/hesap.js`, Firebase bölümü; 22 Kasım 2026'dan beri asıl giriş yolu): Google Firebase
  Authentication'ın herkese açık REST adresleri kullanılır, kütüphane yüklenmez. `FB_API` sabiti Firebase projesinin ("ziyaret-rehberim")
  web yapılandırmasındaki `apiKey` değeridir; herkese açık bir değerdir, koruma Firebase'deki yetkili alan adı listesinden gelir
  (Authentication > Settings > Authorized domains: `ziyaretrehberim.com`). Hizmet hesabı anahtarı gibi gizli değerler depoya yazılmaz.
  Akış: üye olunca adına doğrulama maili gider; doğrulanmamış adresle giriş yapılmaz (ekranda "yeniden gönder" düğmesi çıkar).
  "Şifremi unuttum" yenileme bağlantısı yollar; kayıtlı olmayan adrese de aynı yanıtı verir. Maillerin dili `X-Firebase-Locale: tr`
  başlığıyla Türkçe istenir; gönderen adı ve metinler Firebase'de Authentication > Templates bölümünden değişir.
  Şifre ve Firebase jetonu saklanmaz; hesap o cihazda `fb:<Firebase kullanıcı kimliği>` olarak, adı ve e-posta adresiyle tutulur.
  Hesap silme şifreyi yeniden sorar ve hesabı Firebase'den de siler. `FB_API` boşken bu yol görünmez; WordPress.com ile giriş açıksa
  e-postayla üyeliğin altında "ya da" diye ikinci seçenek olarak durur. Gizlilik sayfası `FB_API` doluysa Firebase paragraflarını ekler.
  Yerel denemede (localhost) `ZR_FB_API` ve `ZR_FB_TABAN` ile taklit bir sunucuya bağlanır; gerçek Firebase'e gidilmez.
- Rota sayfalarının düzeni (`rotaSayfa`, `site/build.js`): başlık ve bilgi hapları, altında sayfa içi kısa yollar (`.atla`: Nasıl gidilir,
  Duraklar, Yürüyüş tarifi, Ziyaret âdâbı), harita, sonra "yola çıkmadan" notları (`.once`: rotanın ipuçları durak listesinden önce durur),
  duraklar, Güzergâh hakkında, Nasıl gidilir, Duraklar arası yürüyüş ve en altta önceki ile sonraki rotaya geçiş (`komsu`, `.rota-gec`).
  "Bugün kapalı" notu (`bugunKapali`, `site/site.js`): bir durağın saat notunda bugünün adı ile "kapalı" aynı parçada geçiyorsa
  ("Pazartesi kapalı", "cuma turistik ziyarete kapalı") o parça kartta "Bugün" etiketiyle belirginleşir ve durak listesinin üstünde
  hangi durakların etkilendiğini söyleyen kısa bir not çıkar. Yeni bilgi üretilmez, yalnızca sayfadaki saat notu okunur; gün İstanbul
  saatine göre belirlenir. Saat notunun yazımı değişirse (gün adı ve "kapalı" aynı " · " parçasında olmalı) not çıkmaz, sayfa bozulmaz.
  Telefonda durak kartındaki iki düğme tek satırda durur.
- Yürüyüş mesafesi tek sayıdır ve tek yerden gelir: rotanın `km` alanı (`ROUTES`, `kaynak/data.js`). Ana sayfa kartları, harita uygulamasındaki
  hazır rotalar, rota sayfasının başlığındaki bilgi satırı ve önceki/sonraki rota kartları bu alanı yazar (`KM_HAP`, `site/build.js`;
  `rota-metin.json` içindeki "… km yürüyüş" satırı yalnızca yer tutar). Alandaki sayılar sokaktan ölçülen toplamlardır: yürünen etapların
  yol tarifi hizmetindeki uzunluğu ile durağın yola uzaklığı toplanır, taşıtla geçilen aralar sayılmaz (19 Kasım 2026 ölçümü: 5,3 · 2,9 · 6,9 ·
  10,1 · 6,5 · 6,5 km). Rota sayfası açılınca harita yolu yeniden ölçer; başlıktaki satır ve haritanın altındaki satır ölçülen sayıyla eşitlenir
  (`tarifYaz`, `site/site.js`), yol alınamazsa ikisi de `km` alanını gösterir. Durak eklenir, çıkarılır ya da yeri değişirse `km` alanı
  rota sayfasının haritasının altında yazan sayıyla güncellenmelidir.
  Aynı avlu kuralı (`iste`, `kaynak/yol.js`): art arda iki durak birbirine, bağlandıkları sokaklardan daha yakınsa (aynı hazire, aynı yapı)
  sokağa çıkıp geri dönen yol yerine doğrudan bağlanır; aynı yerdeki duraklar "aynı yerde" görünür. Bu kural değişirse rota sayfasının
  cihazdaki yol kaydı anahtarındaki sayı (`zr.yolc.2.`) artırılır.
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
