/* Sitenin düzenlenebilir metinleri. Bir maddeyi değiştirmek, eklemek ya da çıkarmak için yalnızca bu dosya düzenlenir;
   sonra "node site/build.js" çalıştırılır. Rota açıklamaları site/rota-metin.json dosyasında, durak bilgileri kaynak/data.js dosyasındadır. */
module.exports = {
  /* ——— Ziyaret Âdâbı ——— */
  adab: {
    ozet: "Manevî mekânlarda huzuru ve saygıyı koruyan incelikler. Yola çıkmadan bir kez okumak yeterli.",
    gruplar: [
      {
        baslik: "Yola çıkmadan", not: "Hazırlık, ziyaretin yarısıdır.",
        maddeler: [
          ["niyet", "Niyet ve hazırlık", "Ziyarete ibret almak, dua etmek ve vefa göstermek niyetiyle çıkın. Rotayı, durakları ve saatleri önceden gözden geçirin."],
          ["su", "Abdest ve temizlik", "Abdestli ve temiz kıyafetle girin; içeride ayakkabılarınızı çıkarın. Yanınızda temiz bir çorap bulundurun."],
          ["ortu", "Kıyafet", "Kadınlar için başörtüsü; herkes için diz ve omuz kapalı, sade kıyafet. Çantanızda bir örtü bulunması işinizi kolaylaştırır."],
          ["saat", "Zamanı doğru seçin", "Namaz vakitlerini ve türbelerin kapalı günlerini önceden kontrol edin. Cuma öğle saatlerinde camiler ibadete ayrılır; ziyareti buna göre planlayın."],
          ["ayak", "Yürüyüşe hazır olun", "Rahat ayakkabı giyin, su alın, yazın şapka bulundurun. Yokuşlu etaplarda acele etmeyin, mola verin."],
        ],
      },
      {
        baslik: "Kabir ve türbe ziyaretinde", not: "Sükûnet, selâm ve dua.",
        maddeler: [
          ["selam", "Selâm ve Fâtiha", "Kabir başında selâm verip Fâtiha okuyun; dilerseniz yakındaki camide iki rek’at namaz kılın."],
          ["dua", "Dua", "Dua yalnızca Allah’a edilir. Ziyaret ettiğiniz zat için rahmet dileyin; onun hayatından ibret ve örnek alın."],
          ["sessiz", "Sükûnet", "Alçak sesle konuşun, telefonunuzu sessize alın. Türbe içinde sohbet etmeyin, bir şey yiyip içmeyin."],
          ["el", "Türbeye saygı", "Sandukaya ve parmaklıklara el yüz sürmeyin, etrafında dönmeyin, eşiği öpmeyin. Kabirlerin üzerine basmayın, mezar taşlarına yaslanmayın ya da oturmayın."],
          ["mum", "Âdetlerden uzak durun", "Mum yakmak, çaput bağlamak, para ya da yiyecek bırakmak, adak adamak ve türbeye doğru namaz kılmak gibi âdetlerden uzak durun."],
          ["sira", "Kısa tutun, yer açın", "Kalabalık saatlerde ziyareti kısa tutun; arkadan gelenlere yer açın. Pencereden ziyaret edilen kabirlerde önünde uzun süre beklemeyin."],
        ],
      },
      {
        baslik: "Camide", not: "Önce ibadet edenlerin huzuru.",
        maddeler: [
          ["cami", "Namaz vakti", "Namaz vakitlerinde ziyareti kısa tutun, saf önünden geçmeyin. Cemaat namazdayken ziyaretçilere ayrılan bölümde bekleyin."],
          ["hali", "Halıya saygı", "Halıya ayakkabıyla basmayın; ayakkabınızı poşete ya da rafa koyun. Halı üzerinde bir şey yiyip içmeyin."],
          ["bolum", "Ayrılmış bölümler", "Kadınlar ve erkekler için ayrılan bölümlere, görevlilerin ve levhaların yönlendirmesine uyun. Kapalı alanları zorlamayın."],
          ["kitap", "Mushaf ve eşyalar", "Mushafları ve rahleleri yerinde bırakın. Tarihî çinilere, kalem işlerine ve ahşaba dokunmayın."],
        ],
      },
      {
        baslik: "İnsanlara ve çevreye karşı", not: "Bu mekânlar mahallelerin içindedir.",
        maddeler: [
          ["foto", "Fotoğraf", "Fotoğrafta saygılı olun; ziyaretçileri ve ibadeti rahatsız etmeyin. Namaz kılanları ve dua edenleri izinsiz çekmeyin, flaş kullanmayın."],
          ["mahalle", "Mahalleli", "Dar sokaklarda ev kapılarının önünü kapatmayın. Kalabalık gruplar hâlinde yüksek sesle yürümeyin; mahalle sakinlerine selâm verin."],
          ["cop", "Temizlik", "Çöpünüzü yanınızda taşıyın. Hazirelerde çiçek koparmayın, ağaçlara ve taşlara yazı yazmayın."],
          ["cocuk", "Çocuklar ve gruplar", "Çocuklara önceden nerede olduğunuzu kısaca anlatın. Grup hâlindeyseniz girişte sıra olun, rehber içeride alçak sesle anlatsın."],
          ["yardim", "Görevliler ve ikram", "Görevlilerin uyarılarına uyun. Türbe ve cami çevresinde ikram edilen şeyleri israf etmeyin; dilenci ve satıcı ısrarına karşı nazik ama kararlı olun."],
        ],
      },
    ],
    kisaltmalar: [
      ["r.a.", "radıyallahu anh"],
      ["r.anhâ", "radıyallahu anhâ (hanım sahâbî)"],
      ["r.anhümâ", "radıyallahu anhümâ (iki kişi)"],
      ["r.anhüm", "radıyallahu anhüm (ikiden çok kişi)"],
      ["rh.a.", "rahmetullahi aleyh (sahâbe dışındaki zatlar)"],
    ],
    hakkinda: [
      "İstanbul’un manevî ve tarihî hazineleri altı rotada: sahâbe ve padişah türbeleri, tarihî camiler, klasik gezi durakları ve kara surları. Sahâbe rotaları, Cafer E. Babadağlı’nın <em>İstanbul’da Bulunan Ashâb-ı Kirâm Kabir ve Makamları</em> eserindeki yirmi dokuz zatı kapsar.",
    ],
    ince: "Süreler 4,5 km/sa yürüyüşle hesaplanmış yaklaşık değerlerdir; yokuşlar hesaba katılmamıştır.",
  },

  /* ——— Ücretler ve Saatler ——— */
  ucret: {
    ozet: "İstanbulkart ücretleri, türbe, müze ve çarşı saatleri tek sayfada.",
    tarih: "20.07.2026 tarifesi",
    one: [
      ["Tam biniş", "46,20 TL", "İstanbulkart ile"],
      ["İstanbulkart", "165 TL", "kart bedeli"],
      ["Türbeler", "Ücretsiz", "bütün türbelerde giriş"],
      ["Banka kartı", "65 TL", "temassız geçiş, aktarma indirimi yok"],
    ],
    kart: [
      ["Tam biniş (İstanbulkart)", "46,20 TL"],
      ["1. aktarma · 2. aktarma", "34,40 · 26,42 TL"],
      ["3.–5. aktarmalar", "17,18 TL"],
      ["BİRgeç · İKİgeç · ÜÇgeç", "65 · 120 · 185 TL"],
      ["BEŞgeç · ONgeç", "275 · 530 TL"],
      ["Temassız banka kartı ile geçiş", "65 TL"],
      ["Marmaray (istasyon sayısına göre)", "37,40 – 82,17 TL"],
      ["T6 Sirkeci–Kazlıçeşme ilk biniş", "37,40 TL"],
      ["Vapur Üsküdar – Eminönü", "58,52 TL"],
      ["Vapur Kadıköy – Eminönü / Karaköy", "65,21 TL"],
      ["İstanbulkart kart bedeli", "165 TL"],
    ],
    kartNot: "20.07.2026 tarifesi. Ücretler İBB kararlarıyla yıl içinde değişir; İstanbulkart uygulamasından ya da ALO 153’ten doğrulayın.",
    kartIpucu: [
      ["Aktarma", "İlk binişten sonraki 120 dakika içindeki aktarmalar kademeli indirimlidir. Temassız banka kartıyla geçişte aktarma indirimi yoktur."],
      ["Gece", "00:30–05:30 arası gece seferlerinde çift ücret alınır."],
      ["Marmaray", "Girişte en yüksek ücret alınır, çıkışta kart okutulunca fark iade edilir."],
      ["Kart", "İstasyon ve iskelelerdeki Biletmatik’lerden ya da büfelerden alınır; bir kart birkaç kişi için art arda okutulabilir."],
    ],
    turbeAcik: [
      ["Eyüp Sultan Türbesi", "06:30–23:00", "07:00–20:00"],
      ["Fatih Sultan Mehmed Türbesi", "07:00–21:00", "08:30–19:00"],
      ["Yavuz Sultan Selim Türbesi", "08:30–19:00", "08:30–17:00"],
    ],
    turbePzt: [
      ["Kânûnî Sultan Süleyman Türbesi", "08:30–20:00", "08:30–17:00"],
      ["Sultan II. Mahmud Türbesi", "08:30–20:00", "08:30–19:00"],
      ["Sultan I. Ahmed Türbesi", "08:30–20:00", "08:30–19:00"],
      ["Hatice Turhan Sultan Türbesi", "08:30–20:00", "08:30–17:00"],
      ["Hürrem Sultan Türbesi", "08:30–17:00", "08:30–17:00"],
      ["Ebû Şeybe · Hamdullah · Muhammed el-Ensârî", "08:30–17:00", "yerinde teyit"],
    ],
    turbeNot: "Türbelere giriş ücretsizdir. Kandil gecelerinde Eyüp Sultan sabaha kadar açıktır. Yaz saatleri 1 Mayıs–1 Ekim dönemi içindir.",
    muze: [
      ["Topkapı Sarayı", "Salı", "09:00–18:00 · kışın gişe 17:00", "500 TL", "2.750 TL"],
      ["Ayasofya ziyaretçi galerisi", "Cuma 12–14", "09:00–19:30", "25 €", "25 €"],
      ["Kariye Camii", "Cuma (turist)", "09:00–18:00", "ücretsiz", "20 €"],
      ["Yerebatan Sarnıcı", "—", "kış 09:00–18:00", "gişede", "gişede"],
      ["Galata Kulesi", "—", "kaynaklarda farklı", "200 TL", "30 €"],
      ["Dolmabahçe Sarayı", "Pazartesi", "09:00–17:00", "250 TL", "2.000 TL"],
      ["Arkeoloji Müzeleri", "—", "09:00–18:30 · gişe 17:30", "200 TL", "15 €"],
      ["Türk ve İslam Eserleri Müzesi", "—", "09:00–18:30 · gişe 17:30", "200 TL", "17 €"],
      ["Tekfur Sarayı", "Pazartesi", "09:00–17:00", "50 TL", "300 TL"],
      ["Yedikule Hisarı", "Pazartesi", "09:00–17:00", "—", "—"],
      ["Kapalıçarşı", "Pazar", "≈ 08:30–19:00", "serbest", "serbest"],
      ["Mısır Çarşısı", "—", "≈ 08:00–19:30", "serbest", "serbest"],
    ],
    muzeIpucu: [
      ["Ayasofya", "İbadet ücretsizdir; ziyaretçi galerisine ayrı kapıdan girilir."],
      ["Kariye", "Namaz vakitlerinden 15 dakika önce turistik giriş durur."],
      ["Topkapı", "Müzekart Harem ve Aya İrini’de geçmez."],
      ["Kapalı ve restorasyonda", "Büyük Saray Mozaikleri ve Fethiye müzeleri kapalı; Arkeoloji Müzeleri, Yedikule ve Ayasofya’da bazı bölümler restorasyondadır."],
    ],
    dip: "Kasım 2026 derlemesi; resmî kurum yayınlarından derlenmiştir. Gitmeden önce doğrulayın.",
  },

  /* ——— Ulaşım ——— */
  ulasim: {
    ozet: "Rehberdeki rotalara tramvay, metro, Marmaray ve vapurla nasıl gidilir.",
    aktarma: "Eminönü, Sirkeci ve Karaköy birbirine yürüme mesafesindedir; T1, T5, T6, Marmaray ve vapurlar arasında aktarma burada yapılır.",
    // Her rotanın başlangıcına en uygun varış durağı (öneri hesabında kullanılır).
    varis: { r1: "Eyüpsultan Teleferik", r2: "Vatan", r3: "Feshane", r4: "Eyüpsultan Teleferik", r5: "Gülhane", r6: "Yedikule" },
    hatlar: [
      { kod: "T1", ad: "Kabataş – Bağcılar Tramvayı", renk: "#2F6DB5", acik: "Tarihî yarımadanın omurgası; rehberdeki durakların yarısından fazlası bu hatta 5 dakikalık yürüme mesafesindedir. Gün boyu sık sefer.",
        duraklar: [["Kabataş", "Dolmabahçe Sarayı (14 dk) · F1 ile Taksim · vapur iskelesi"], ["Karaköy", "Yeraltı Camii (3 dk) · Tünel (F2) ile Galata · Kadıköy vapuru"], ["Eminönü", "Yeni Cami · Hatice Turhan Türbesi · Mısır Çarşısı · T5 ve vapur aktarması"], ["Sirkeci", "Marmaray ve T6 (Kazlıçeşme hattı) aktarması"], ["Gülhane", "Topkapı Sarayı (7 dk) · Arkeoloji Müzeleri · Gülhane Parkı"], ["Sultanahmet", "Ayasofya · Sultanahmet Camii · I. Ahmed Türbesi · Yerebatan · TİEM"], ["Çemberlitaş", "II. Mahmud Türbesi (2 dk) · Nuruosmaniye · Kapalıçarşı"], ["Beyazıt-Kapalıçarşı", "Beyazıt Camii ve II. Bayezid Türbesi · Süleymaniye (10 dk)"], ["Laleli-Üniversite", "M2 Vezneciler’e 300 m · Şehzade Camii"], ["Topkapı", "Kara surları · Panorama 1453 · T4 aktarması"]] },
      { kod: "T5", ad: "Eminönü – Alibeyköy (Haliç) Tramvayı", renk: "#8E4D8A", acik: "Haliç kıyısını izler; sahâbe rotalarının anahtarı. 14 istasyon: Eminönü, Küçükpazar, Cibali, Fener, Balat, Ayvansaray, Feshane, Eyüpsultan Teleferik ve Alibeyköy yönü.",
        duraklar: [["Eminönü", "T1 ve vapur aktarması"], ["Küçükpazar", "Zindan Han · Baba Cafer makamı · Rüstem Paşa Camii"], ["Cibali", "Gül Camii · Atatürk Köprüsü ayağı"], ["Fener", "Yavuz Selim Camii ve Türbesi (6 dk, yokuş) · Fener Rum Patrikhanesi"], ["Balat", "Yukarı Balat sahâbe kabirleri (5–10 dk, yokuş) · Kariye"], ["Ayvansaray", "Sur dibi sahâbe türbeleri (2–5 dk) · Câbir Camii · Tekfur Sarayı"], ["Feshane", "Ebü’d-Derdâ makamı (4 dk) · Mihrişah Sultan Türbesi · Eyüp çarşısı"], ["Eyüpsultan Teleferik", "Eyüp Sultan Camii ve Türbesi (5 dk) · TF2 ile Piyer Loti"]] },
      { kod: "M2", ad: "Yenikapı – Hacıosman Metrosu", renk: "#1B8A4C", acik: "Yarımadanın iç kesimini Beyoğlu ve iş merkezlerine bağlar; Haliç’i köprüyle geçer. Cuma ve cumartesi geceleri gece seferi yapılan hatlardandır.",
        duraklar: [["Yenikapı", "Marmaray, T6 ve M1 aktarması"], ["Vezneciler", "Şehzade Camii (5 dk) · Süleymaniye (8 dk) · Fatih Camii (15 dk)"], ["Haliç", "Köprü üstü istasyon; Haliç manzarası"], ["Şişhane", "Galata Kulesi (5 dk) · Tünel · İstiklal Caddesi"], ["Taksim", "F1 ile Kabataş"], ["Gayrettepe", "M11 ile İstanbul Havalimanı"]] },
      { kod: "T6", ad: "Sirkeci – Kazlıçeşme Hattı (T6 · U3)", renk: "#0E8F8F", acik: "Şubat 2024’te açılan sahil hattı; eski banliyö güzergâhında 8 istasyon. 06:00–23:00 arası çalışır, İstanbulkart ve aktarma geçerlidir. Koca Mustafa Paşa ve Yedikule için en pratik seçenektir.",
        duraklar: [["Sirkeci", "T1 ve Marmaray aktarması"], ["Cankurtaran", "Abdurrahmân-ı Şâmî makamı (6 dk) · Sultanahmet’e yokuş"], ["Kumkapı", "Küçük Ayasofya · Sokollu Mehmed Paşa camileri"], ["Yenikapı", "M2, M1 ve Marmaray aktarması"], ["Kocamustafapaşa", "Sümbül Efendi Camii · Çifte Sultanlar (9 dk)"], ["Yedikule", "Yedikule Hisarı (4 dk)"], ["Kazlıçeşme", "Marmaray aktarması · surların Marmara ucu"]] },
      { kod: "Marmaray", ad: "Halkalı – Gebze", renk: "#4B5C8C", acik: "İki yakayı Boğaz’ın altından birleştirir. İstasyon sayısına göre ücretlendirilir: girişte en yüksek ücret alınır, çıkışta kart okutulunca fark iade edilir. Yaklaşık 06:00–23:00, 15 dakikada bir.",
        duraklar: [["Kazlıçeşme", "T6 aktarması · Yedikule yönü"], ["Yenikapı", "M1, M2 ve T6 aktarması"], ["Sirkeci", "T1 ve T6 aktarması · Eminönü’ne 5 dk"], ["Üsküdar", "M5 aktarması · Haliç vapurunun kalkış iskelesi"], ["Ayrılık Çeşmesi", "M4 ile Kadıköy ve Sabiha Gökçen Havalimanı"]] },
      { kod: "T4", ad: "Topkapı – Mescid-i Selam Tramvayı", renk: "#D2691E", acik: "Kara surlarına paralel ilerler; Edirnekapı, Kariye ve Sulukule yönü için en pratik hat.",
        duraklar: [["Topkapı", "T1 aktarması · Panorama 1453 (2 dk)"], ["Vatan", "M1 Topkapı-Ulubatlı aktarması · Sulukule surları"], ["Edirnekapı", "Mihrimah Sultan Camii (4 dk) · Kariye (7 dk) · Tekfur Sarayı"], ["Şehitlik", "Edirnekapı Şehitliği"]] },
      { kod: "F", ad: "Füniküler ve Teleferik · F1 · F2 Tünel · TF2", renk: "#6F7682", acik: "Yokuşları aşan kısa bağlantılar: F1 Taksim–Kabataş, F2 Tünel Karaköy–Beyoğlu (1875’ten beri), TF2 Eyüp–Piyer Loti teleferiği (yaklaşık 08:00–22:00, yazın 23:00; bakım kapanışlarını kontrol edin).", duraklar: [] },
      { kod: "Vapur", ad: "Şehir Hatları Vapurları", renk: "#16243F", acik: "Eminönü–Üsküdar, Eminönü–Kadıköy ve Karaköy–Kadıköy hatları gün boyu sık çalışır. Haliç hattı Üsküdar – Karaköy – Kasımpaşa – Fener – Balat – Hasköy – Ayvansaray – Sütlüce – Eyüpsultan iskelelerine uğrar; yaklaşık saatte bir, uçtan uca 55 dk. Kış tarifesinde pazartesi–cumartesi 07:30–19:45, pazar 10:30–20:45 arası (Şehir Hatları’ndan doğrulayın).", duraklar: [] },
    ],
    otobus: [["99 · 99A", "Eminönü – Eyüp yönü", "Haliç kıyısından Eyüp’e; T5’e alternatif."], ["44B", "Eminönü – Eyüp yönü", "Balat ve Ayvansaray üzerinden."], ["87", "Taksim – Edirnekapı", "Edirnekapı, Kariye ve Fatih çevresi."], ["28", "Edirnekapı – Beşiktaş", "Surlardan Eminönü ve Boğaz kıyısına."]],
    sefer: [["Metro ve tramvaylar", "06:00–00:00"], ["Marmaray · 15 dakikada bir", "06:00–23:00"], ["T6 Sirkeci–Kazlıçeşme", "06:00–23:00"], ["TF2 Piyer Loti teleferiği · yazın 23:00", "08:00–22:00"], ["Haliç vapuru · pazar 10:30–20:45", "07:30–19:45"]],
    seferNot: "Cuma ve cumartesi geceleri M2 dâhil bazı metro hatlarında gece seferi yapılır.",
    hava: {
      metin: "<strong>İstanbul Havalimanı:</strong> M11 metrosu ile Gayrettepe (M2 aktarması) ya da Halkalı (Marmaray aktarması). <strong>Sabiha Gökçen:</strong> M4 metrosu ile Ayrılık Çeşmesi, oradan Marmaray ile Sirkeci.",
      tablo: [["İstanbul Hvl. → Sultanahmet", "Havaist HVL-11", "420 TL"], ["İstanbul Hvl. → Beyazıt", "Havaist HVL-12", "370 TL"], ["İstanbul Hvl. → Aksaray / Taksim", "Havaist HVL-1 / HVL-9", "470 TL"], ["Sabiha Gökçen → Sultanahmet", "Havaist HVL-13", "405 TL"], ["Sabiha Gökçen → Taksim", "SG-2 havalimanı otobüsü", "485,10 TL"]],
      not: "Uygulamalar: İstanbulkart (bakiye ve tarife); yol tarifi için harita uygulamaları; canlı sefer bilgisi için İETT, Metro İstanbul ve Şehir Hatları’nın kendi kanalları.",
    },
    /* Konuma göre öneri için sade ağ. Konumlar OpenStreetMap haritasında tek tek kontrol edildi (Kasım 2026);
       "y: 1" olanlar yaklaşık. "ara": iki durak arasında listede olmayan ara durak sayısı. */
    ag: {
      durak: {
        "Kabataş": [41.0338, 28.9923], "Karaköy": [41.0228, 28.9740], "Eminönü": [41.0173, 28.9730], "Eminönü (T5)": [41.0194, 28.9661], "Sirkeci": [41.0150, 28.9770],
        "Gülhane": [41.0133, 28.9790], "Sultanahmet": [41.0080, 28.9755], "Çemberlitaş": [41.0085, 28.9711], "Beyazıt-Kapalıçarşı": [41.0092, 28.9667], "Laleli-Üniversite": [41.0095, 28.9597],
        "Aksaray": [41.0095, 28.9539], "Topkapı": [41.0195, 28.9200], "Küçükpazar": [41.0208, 28.9632], "Cibali": [41.0262, 28.9585], "Fener": [41.0303, 28.9512], "Balat": [41.0339, 28.9481],
        "Ayvansaray": [41.0395, 28.9439], "Feshane": [41.0454, 28.9380], "Eyüpsultan Teleferik": [41.0504, 28.9352], "Cankurtaran": [41.0040, 28.9806, 1], "Kumkapı": [41.0033, 28.9629],
        "Yenikapı": [41.0050, 28.9518], "Cerrahpaşa": [41.0024, 28.9425, 1], "Kocamustafapaşa": [40.9998, 28.9332], "Yedikule": [40.9950, 28.9217, 1], "Kazlıçeşme": [40.9925, 28.9175],
        "Vezneciler": [41.0125, 28.9595], "Haliç": [41.0228, 28.9667], "Şişhane": [41.0283, 28.9730], "Taksim": [41.0370, 28.9850], "Vatan": [41.0255, 28.9293], "Edirnekapı": [41.0312, 28.9341],
        "Topkapı-Ulubatlı": [41.0237, 28.9305], "Üsküdar": [41.0257, 29.0140],
      },
      hat: {
        T1: { ad: "T1 tramvayı", renk: "#2F6DB5", sira: ["Kabataş", 2, "Karaköy", "Eminönü", "Sirkeci", "Gülhane", "Sultanahmet", "Çemberlitaş", "Beyazıt-Kapalıçarşı", "Laleli-Üniversite", "Aksaray", 5, "Topkapı"] },
        T5: { ad: "T5 tramvayı", renk: "#8E4D8A", sira: ["Eminönü (T5)", "Küçükpazar", "Cibali", "Fener", "Balat", "Ayvansaray", "Feshane", "Eyüpsultan Teleferik"] },
        T6: { ad: "T6 hattı", renk: "#0E8F8F", sira: ["Sirkeci", "Cankurtaran", "Kumkapı", "Yenikapı", "Cerrahpaşa", "Kocamustafapaşa", "Yedikule", "Kazlıçeşme"] },
        M2: { ad: "M2 metrosu", renk: "#1B8A4C", sira: ["Yenikapı", "Vezneciler", "Haliç", "Şişhane", "Taksim"] },
        T4: { ad: "T4 tramvayı", renk: "#D2691E", sira: ["Topkapı", 1, "Vatan", "Edirnekapı"] },
        Marmaray: { ad: "Marmaray", renk: "#4B5C8C", sira: ["Kazlıçeşme", "Yenikapı", "Sirkeci", "Üsküdar"] },
        M1: { ad: "M1 metrosu", renk: "#C8102E", sira: ["Yenikapı", "Aksaray", 1, "Topkapı-Ulubatlı"] },
      },
      // Yürüyerek yapılan aktarmalar: [durak, durak, dakika]
      yaya: [["Eminönü", "Eminönü (T5)", 8], ["Laleli-Üniversite", "Vezneciler", 5], ["Vatan", "Topkapı-Ulubatlı", 4], ["Taksim", "Kabataş", 6, "F1 füniküleri"], ["Şişhane", "Karaköy", 6, "F2 Tünel"], ["Eminönü", "Sirkeci", 6], ["Karaköy", "Eminönü", 9], ["Haliç", "Küçükpazar", 6]],
    },
  },
};
