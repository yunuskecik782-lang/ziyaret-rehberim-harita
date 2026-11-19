/* Durak verisi: ziyaretrehberim.com'daki 6 rota sayfasından (Jetpack Map işaretleri + durak kartları) alındı. */
globalThis.ZR_DATA = (() => {
  const BASE = "https://ziyaretrehberim.com/guzergahlar/";
  /* PANEL:BAS · Buradan PANEL:SON satırına kadar olan bölümü yönetici paneli de yazar (/yonetim/). Elle düzenlerken biçimi koru. */
  const ROUTES = [
    {"id":"r1","no":"01","name":"Sahâbe-i Kirâm — 1","kicker":"Ashâb-ı kirâm","concept":"sahabe","slug":"sahabe-1","km":"5,3 km","sure":"≈ 3 saat","lede":"Eyüp Sultan’dan Ayvansaray surlarına ve Eğrikapı’ya, ashâbın izinde."},
    {"id":"r2","no":"02","name":"Sahâbe-i Kirâm — 2","kicker":"Ashâb-ı kirâm","concept":"sahabe","slug":"sahabe-2","km":"2,9 km","sure":"≈ 4 saat","lede":"Surlardan Balat’a, Eminönü ve Karaköy’den Sultanahmet ile Koca Mustafa Paşa’ya."},
    {"id":"r3","no":"03","name":"Padişah Ziyaretleri","kicker":"Türbeler","concept":"padisah","slug":"padisah-ziyaretleri","km":"6,9 km","sure":"≈ 4,5 saat","lede":"Eyüp’ten tarihî yarımadaya, Osmanlı sultanları ve hânedânının türbeleri."},
    {"id":"r4","no":"04","name":"Tarihî Camiler","kicker":"Selâtin camileri","concept":"cami","slug":"tarihi-camiler","km":"10,1 km","sure":"≈ 7 saat","lede":"Mimar Sinan’dan baroka, Eyüp’ten Marmara kıyısına şâheser camiler."},
    {"id":"r5","no":"05","name":"Tarihî Mekânlar ve Gezi","kicker":"Klasik gezi","concept":"mekan","slug":"tarihi-mekanlar-gezi","km":"6,5 km","sure":"≈ 9 saat","lede":"Saraylar, sarnıçlar, çarşılar ve kulelerle klasik İstanbul rotası."},
    {"id":"r6","no":"06","name":"Suriçi Ziyaretleri","kicker":"Kara surları","concept":"sur","slug":"surici-ziyaretleri","km":"6,5 km","sure":"≈ 3,5 saat","lede":"Theodosius surları boyunca, Marmara’dan Haliç’e bir yürüyüş."},
  ];
  ROUTES.forEach((r) => (r.url = BASE + r.slug + "/"));

  const CONCEPTS = [
    {"id":"sahabe","label":"Sahâbe","routes":["r1","r2"]},
    {"id":"padisah","label":"Padişah türbeleri","routes":["r3"]},
    {"id":"cami","label":"Camiler","routes":["r4"]},
    {"id":"mekan","label":"Tarihî mekânlar","routes":["r5"]},
    {"id":"sur","label":"Suriçi","routes":["r6"]},
    {"id":"ikram","label":"Sabit ikramlar","soon":true},
  ];

  // [rota, sıra, ad, kısaltma, tür, yer, açıklama, saat, yaklaşık konum?, enlem, boylam, kalıcı anahtar]
  // Kalıcı anahtar durağın kimliğidir: sıra ya da rota değişse de aynı kalır, ziyaretçilerin kayıtlı rotaları bozulmaz.
  const RAW = [
    [0, 1, "Hâlid bin Zeyd Ebû Eyyûb el-Ensârî", "r.a.", "Kabir", "Eyüp Sultan Camii iç avlusu · Merkez Mah.", "Hz. Peygamber’in mihmandârı ve sancaktarı. Kabri fetihten sonra bulunmuş; türbe ve cami Fatih Sultan Mehmed döneminde yapılmıştır.", "Her gün açık · yaz 06:30–23:00, kış 07:00–20:00", 0, 41.04796, 28.93378, "r1-1"],
    [0, 2, "Câbir oğlu Muhammed el-Ensârî", "r.a.", "Kabir", "Düğmeciler Mescidi avlusu · Düğmeciler Cd.", "Mescidin avlusundaki üç kabirden ortadaki; etrafı duvarla çevrili açık bir kabirdir.", "", 0, 41.04714, 28.92704, "r1-2"],
    [0, 3, "Ebü’d-Derdâ", "r.a.", "Makam", "Zal Paşa Cd. · Nişancı", "İlim ve hikmetiyle tanınan sahâbî. Kabri Şam’da anılır; Zal Mahmud Paşa ile Cezerî Kasım Paşa camileri arasındaki bahçeli makam, iki hâcet penceresiyle ziyaret edilir.", "", 0, 41.04404, 28.93591, "r1-3"],
    [0, 4, "Edhem", "rh.a.", "Kabir", "Abdurrahman Şeref Bey Cd. No:26 · Nişancı", "Arpacı Hayreddin Camii’nin karşısındaki köşe türbe; parmaklık ardından görülür. Bazı kaynaklar burayı 15. yüzyılda yaşamış Edhem Baba’nın kabri olarak tanıtır.", "", 0, 41.0423, 28.93574, "r1-4"],
    [0, 5, "Ka’b", "r.a.", "Makam", "Yâ Vedûd Camii karşısı · sur dışı", "Hz. Kâb (Hacı Hüsrev) Mescidi’nin yanındaki türbe; içine girilebilir.", "", 0, 41.03958, 28.94073, "r1-5"],
    [0, 6, "Ebû Şeybe el-Hudrî", "r.a.", "Kabir", "Toklu Dede Haziresi · Toklu İbrahim Dede Sk.", "İki sur arasındaki hazirede, İstanbul’da kabri bilinen sahâbîlerden. Türbe restorasyonun ardından 2 Temmuz 2021’de yeniden ziyarete açılmıştır.", "Pazartesi kapalı · 08:30–17:00 · kapalı olabilir", 0, 41.03927, 28.94138, "r1-6"],
    [0, 7, "Hamdullah el-Ensârî", "r.a.", "Kabir", "Toklu Dede Haziresi", "Ebû Şeybe ile aynı çatı altında, ayrı kapıdan girilen türbe.", "Pazartesi kapalı · 08:30–17:00", 0, 41.03934, 28.94135, "r1-7"],
    [0, 8, "Ahmed el-Ensârî", "r.a.", "Kabir", "Toklu Dede Haziresi", "Türbenin karşısında, içinden büyük bir ağacın yükseldiği açık kabir.", "", 0, 41.03923, 28.94119, "r1-8"],
    [0, 9, "Muhammed el-Ensârî", "r.a.", "Kabir", "Ayvansaray Cd. · sura bitişik", "Hatice Sultan Sıbyan Mektebi’nin yanında, surlara yaslanmış türbe; kabir pencereden görülür.", "Pazartesi kapalı · 08:30–17:00", 0, 41.03983, 28.94266, "r1-9"],
    [0, 10, "Câbir bin Abdullah el-Ensârî", "r.anhümâ", "Makam", "Atik Mustafa Paşa (Hz. Câbir) Camii · Çember Sk.", "Çok sayıda hadis rivayet eden meşhur sahâbî. Kabri Medine’de anılır; caminin içindeki makam perde ve yaldızlı kapının ardındadır.", "", 0, 41.03864, 28.94404, "r1-10"],
    [0, 11, "Ebû Zerr-i Gıfârî", "r.a.", "Makam", "Ebûzer Gıfârî Camii bahçesi · Çınarlıçeşme Sk.", "Zühd ve doğruluğuyla anılan büyük sahâbî. Kabri Rebeze’dedir; cami bahçesindeki açık makam kaldırımdan da görülür.", "", 0, 41.03774, 28.94302, "r1-11"],
    [0, 12, "Abdullah el-Hudrî", "r.a.", "Kabir", "Kandilli Türbe Sk. sonu · İvaz Efendi Camii yakını", "Ayvansaray ile Eğrikapı arasında, sur içinde. Kaynaklar yeri tarif eder; kesin nokta için mahalleliye sormak gerekebilir.", "", 1, 41.03795, 28.94055, "r1-12"],
    [0, 13, "Şu’be", "r.a.", "Kabir", "Şişhane Cd. No:35 · Avcı Bey Camii karşısı", "Bir evin bahçesindeki açık kabir; komşu bahçeden geçilerek ziyaret edilir.", "", 0, 41.03525, 28.93994, "r1-13"],
    [0, 14, "Hâfir", "r.a.", "Kabir", "Eğrikapı’nın hemen dışı", "Kapıya bitişik, üstü açık türbe. Kuşatmada şehit düştüğü rivayet edilir.", "", 0, 41.03646, 28.93928, "r1-14"],
    [0, 15, "Abdüssâdık Âmir bin Sâme", "r.a.", "Kabir", "Eğrikapı dışındaki mezarlık", "Surlardan Eyüp’e inen yolun sağındaki kabristanda, Hâfir’e yakın açık türbe. Konum kaynaklardaki tarife göre yaklaşık yerleştirilmiştir.", "", 1, 41.03625, 28.9377, "r1-15"],
    [1, 1, "Abdurrahman Paşa ve Refîki", "rh.a.", "Kabir", "Sulukule surları dibi · Fatih", "Kitapta ashâb arasında anılır; bazı kaynaklar kabrin Sakabaşı Abdullah Paşa’ya ait olduğunu belirtir. Kesin nokta kaynaklarda verilmediğinden yaklaşık gösterilmiştir.", "", 1, 41.0244, 28.9327, "r2-1"],
    [1, 2, "Ebû Sa’îd el-Hudrî", "r.a.", "Makam", "Kariye Camii arkasındaki bahçe · Kariye Türbesi Sk.", "Pek çok hadis rivayet eden ünlü sahâbî. Kabri Medine’de anılır; buradaki türbe makamdır.", "", 0, 41.03141, 28.93922, "r2-2"],
    [1, 3, "Hüsam bin Abdullah", "r.a.", "Kabir", "Paşa Hamamı Cd. × Sultan Çeşme Cd. · yukarı Balat", "Kaynaklarda Abdullah bin Hişâm olarak da geçer; kabri eski hamamın külhanı yanında anılır.", "", 0, 41.03147, 28.94072, "r2-3"],
    [1, 4, "Câfer bin Abdullah el-Ensârî", "r.a.", "Kabir", "Hoca Kasım Günânî Camii avlusu", "Fetih ordusunun sakası olarak anılır; kabri caminin mihrap önündeki avludadır.", "", 0, 41.03171, 28.94189, "r2-4"],
    [1, 5, "Hasan ve Hüseyin Kardeşler", "r.anhümâ", "Kabir", "Hasan Hüseyin Yokuşu · Hoca Kasım Günânî Camii yanı", "Hz. Eyyûb’a imamlık ettikleri nakledilen iki kardeş; kabirleri yokuş üzerindedir.", "", 0, 41.03202, 28.94173, "r2-5"],
    [1, 6, "Abdullah el-Ensârî", "r.a.", "Kabir", "Sultan Çeşme Cd. × Kürkçü Çeşme Cd. · Balat", "Bir evin önündeki küçük bahçede yer alan kabir.", "", 0, 41.0333, 28.94432, "r2-6"],
    [1, 7, "Baba Cafer", "rh.a.", "Makam", "Zindan Han (Baba Cafer Zindanı) alt katı · Eminönü", "Hârûn Reşîd devrinde elçi olarak geldiği ve zindanda vefat ettiği rivayet edilen zat; makamı hanın alt katındadır.", "", 0, 41.01879, 28.96918, "r2-7"],
    [1, 8, "Vehb bin Huşeyre", "r.a.", "Makam", "Yeraltı Camii · Kemankeş Cd., Karaköy", "Eski Bizans mahzeni Kurşunlu Mahzen’deki camide, arka girişe yakın parmaklıklı odadaki iki makamdan biri.", "", 0, 41.02253, 28.97648, "r2-8"],
    [1, 9, "Amr ibnü’l-Âs", "r.a.", "Makam", "Yeraltı Camii · Karaköy", "Mısır’ın fâtihi büyük kumandan sahâbî. Kabri Mısır’dadır; makamı Vehb bin Huşeyre ile yan yanadır.", "", 0, 41.02253, 28.97648, "r2-9"],
    [1, 10, "Süfyân bin Uyeyne", "rh.a.", "Makam", "Yeraltı Camii · Karaköy", "Hadis ilminin büyük imamlarından (tebe-i tâbiîn); Mekke’de vefat etmiştir. Makamı caminin ayrı bir odasındadır.", "", 0, 41.02253, 28.97648, "r2-10"],
    [1, 11, "Abdurrahmân-ı Şâmî", "r.a.", "Makam", "Kabasakal Cd. × Tevkifhâne Sk. · Cankurtaran", "Sancaktar Baba olarak da bilinir. Sultanahmet’ten Ayasofya’ya yürürken sağda kalan eski tekkenin köşesindeki türbe.", "", 0, 41.0068, 28.97919, "r2-11"],
    [1, 12, "Ali Tablî", "r.a.", "Kabir", "Şehzade Camii çevresi · Kalenderhane Mah.", "Kuşatmada tabl (davul) çalarken şehit olduğu anlatılan zat. Kabri Şehzade külliyesi içinde anılır; nokta yaklaşık gösterilmiştir.", "", 1, 41.01425, 28.95712, "r2-12"],
    [1, 13, "Dâye Hâtun", "r.anhâ", "Kabir", "Sümbül Efendi Camii avlusu · Koca Mustafa Paşa", "Zincirli servinin yanındaki ahşap türbe; fetih ordusuna hizmet eden hanımlardan olduğu nakledilir.", "", 0, 41.00352, 28.92879, "r2-13"],
    [1, 14, "Çifte Sultanlar", "r.anhümâ", "Kabir", "Sümbül Efendi Camii avlusu · Koca Mustafa Paşa", "Hz. Hüseyin’in kızları Fâtıma ve Sakîne olarak anılan (Kerîmeteyn-i Muhteremeyn) açık türbe.", "", 0, 41.00364, 28.92893, "r2-14"],
    [2, 1, "Mihrişah Vâlide Sultan Türbesi", "", "", "Eyüp Sultan Camii güneyi · Eyüp", "III. Selim’in annesi; 1790’larda tamamlanan Türk barok külliyesi, sebil ve imaretiyle.", "", 1, 41.0466, 28.9344, "r3-1"],
    [2, 2, "Sultan V. Mehmed Reşad Türbesi", "", "", "Haliç kıyısı · Eyüp", "1918’de vefat eden padişahın türbesi; Mimar Kemâleddin’in eseri.", "Resmî listede ziyarete kapalı görünüyor", 1, 41.0472, 28.937, "r3-2"],
    [2, 3, "Yavuz Sultan Selim Türbesi", "", "", "Yavuz Selim Camii avlusu · Çarşamba", "Hilâfeti Osmanlı’ya getiren I. Selim; beşinci tepede, Haliç’e bakan caminin avlusundadır.", "Her gün açık · yaz 08:30–19:00, kış 08:30–17:00", 0, 41.02625, 28.95163, "r3-3"],
    [2, 4, "Fatih Sultan Mehmed Türbesi", "", "", "Fatih Camii haziresi", "İstanbul’un fatihi; adını taşıyan külliyenin kıble tarafındaki türbede yatar.", "Her gün açık · yaz 07:00–21:00, kış 08:30–19:00", 0, 41.01929, 28.95028, "r3-4"],
    [2, 5, "Nakşidil Vâlide Sultan Türbesi", "", "", "Fatih Camii külliyesi", "II. Mahmud’un annesi; külliyenin doğusunda, ampir üslûbunda zarif bir türbe.", "", 1, 41.0189, 28.9517, "r3-5"],
    [2, 6, "Şehzade Mehmed Türbesi", "", "", "Şehzade Camii haziresi · Şehzadebaşı", "Kanunî’nin oğlu için Mimar Sinan’ın yaptığı, çinileriyle ünlü türbe.", "", 1, 41.01362, 28.9577, "r3-6"],
    [2, 7, "Kânûnî Sultan Süleyman Türbesi", "", "", "Süleymaniye Camii haziresi", "46 yıl hüküm süren Kânûnî; Sinan’ın Süleymaniye külliyesinde yatar.", "Pazartesi kapalı · 08:30–17:00 (yazın 20:00’ye kadar)", 0, 41.0157, 28.96447, "r3-7"],
    [2, 8, "Hürrem Sultan Türbesi", "", "", "Süleymaniye Camii haziresi", "Kanunî’nin eşi; çinilerle bezeli türbe, Kanunî’nin hemen yanı başındadır.", "Pazartesi kapalı · 08:30–17:00", 0, 41.01567, 28.96481, "r3-8"],
    [2, 9, "Sultan II. Bayezid Türbesi", "", "", "Beyazıt Camii haziresi", "Erken klasik dönemin padişahı; Beyazıt Camii’nin kıble tarafındaki hazirede yatar.", "", 1, 41.00995, 28.96585, "r3-9"],
    [2, 10, "Sultan II. Mahmud Türbesi", "", "", "Divanyolu · Çemberlitaş", "II. Mahmud, Abdülaziz ve II. Abdülhamid’in medfun olduğu türbe ve geniş haziresi.", "Pazartesi kapalı · yaz 08:30–20:00, kış 08:30–19:00", 0, 41.00848, 28.97259, "r3-10"],
    [2, 11, "Sultan I. Ahmed Türbesi", "", "", "Sultanahmet Camii külliyesi", "I. Ahmed ile II. Osman ve IV. Murad’ın da yattığı türbe; meydanın kuzey köşesindedir.", "Pazartesi kapalı · yaz 08:30–20:00, kış 08:30–19:00", 0, 41.00679, 28.97698, "r3-11"],
    [2, 12, "Ayasofya Padişah Türbeleri", "", "", "Ayasofya bahçesi · Kabasakal Cd. girişi", "II. Selim, III. Murad ve III. Mehmed’in çinili türbeleri ile şehzadeler türbesi.", "2026 saatleri doğrulanamadı; yerinde kontrol edin", 0, 41.00787, 28.97965, "r3-12"],
    [2, 13, "Hatice Turhan Vâlide Sultan Türbesi", "", "", "Yeni Cami külliyesi · Eminönü", "Külliyenin bânisi. IV. Mehmed, II. Mustafa, III. Ahmed, I. Mahmud ve III. Osman da burada medfundur.", "Pazartesi kapalı · yaz 08:30–20:00, kış 08:30–17:00", 0, 41.01609, 28.97179, "r3-13"],
    [3, 1, "Eyüp Sultan Camii", "", "", "Eyüp", "Şehrin manevî kalbi; Fatih döneminde yapılan, III. Selim döneminde yenilenen selâtin camii.", "", 0, 41.04796, 28.93378, "r4-1"],
    [3, 2, "Mihrimah Sultan Camii", "", "", "Edirnekapı", "Sinan’ın, surların yanındaki bol ışıklı ve zarif eseri; şehrin en yüksek tepesindedir.", "", 0, 41.02936, 28.9357, "r4-2"],
    [3, 3, "Yavuz Sultan Selim Camii", "", "", "Çarşamba · Fatih", "Beşinci tepede, sade ve heybetli erken klasik cami; Haliç’e nâzırdır.", "", 0, 41.02661, 28.95129, "r4-3"],
    [3, 4, "Fatih Camii", "", "", "Fatih", "Fetihten sonra yapılan ilk büyük külliye; 1766 depreminden sonra yeniden inşa edilmiştir.", "", 0, 41.01975, 28.94976, "r4-4"],
    [3, 5, "Şehzade Camii", "", "", "Şehzadebaşı", "Sinan’ın “çıraklık eserim” dediği rivayet edilen, simetrik klasik cami.", "", 0, 41.01388, 28.95708, "r4-5"],
    [3, 6, "Süleymaniye Camii", "", "", "Süleymaniye", "Sinan’ın “kalfalık eserim” dediği büyük külliye; Haliç’e bakan avlusu ve hazireleriyle.", "", 0, 41.01624, 28.96382, "r4-6"],
    [3, 7, "Rüstem Paşa Camii", "", "", "Tahtakale · Eminönü", "İznik çinileriyle ünlü; çarşının üst katında, sakin ve küçük bir cami.", "", 0, 41.01768, 28.96872, "r4-7"],
    [3, 8, "Yeni Cami", "", "", "Eminönü", "Eminönü’nün simgesi; Hatice Turhan Sultan’ın tamamlattığı külliye.", "", 0, 41.01695, 28.97208, "r4-8"],
    [3, 9, "Nuruosmaniye Camii", "", "", "Çemberlitaş", "Osmanlı barokunun başyapıtlarından; Kapalıçarşı’nın kapısındadır.", "", 0, 41.01034, 28.97041, "r4-9"],
    [3, 10, "Sultan II. Bayezid Camii", "", "", "Beyazıt Meydanı", "Erken klasik dönemin önemli selâtin camilerinden.", "", 0, 41.01028, 28.96528, "r4-10"],
    [3, 11, "Sultanahmet Camii", "", "", "Sultanahmet", "“Mavi Cami”; altı minaresi ve İznik çinileriyle ünlü.", "Namaz vakitleri dışında ziyaret · ücretsiz", 0, 41.00541, 28.97665, "r4-11"],
    [3, 12, "Sokollu Mehmed Paşa Camii", "", "", "Kadırga", "Sinan’ın çini ve oran şâheseri; yamaca ustalıkla yerleştirilmiş külliye.", "", 0, 41.00484, 28.97204, "r4-12"],
    [3, 13, "Küçük Ayasofya Camii", "", "", "Küçükayasofya · Kumkapı", "6. yüzyılda Aziz Sergios ve Bakhos kilisesi olarak yapılmış, sonra camiye dönüştürülmüştür.", "", 0, 41.00274, 28.9722, "r4-13"],
    [4, 1, "Topkapı Sarayı", "", "", "Sultanahmet", "Yaklaşık 400 yıl imparatorluğun yönetim merkezi; Kutsal Emanetler, Harem ve Aya İrini.", "Salı kapalı · 09:00–18:00, kışın gişe 17:00 · kombine: yerli 500 TL, yabancı 2.750 TL", 0, 41.01152, 28.98338, "r5-1"],
    [4, 2, "İstanbul Arkeoloji Müzeleri", "", "", "Gülhane", "İskender Lahdi ve geniş antik eser koleksiyonu; bazı bölümler restorasyon nedeniyle kapalıdır.", "Her gün 09:00–18:30, gişe 17:30 · yerli 200 TL, yabancı 15 €", 0, 41.01169, 28.98121, "r5-2"],
    [4, 3, "Gülhane Parkı", "", "", "Sarayburnu", "Sarayın dış bahçesi niteliğindeki tarihî park; Haliç ve Boğaz manzarası.", "", 0, 41.01331, 28.98151, "r5-3"],
    [4, 4, "Ayasofya", "", "", "Sultanahmet", "Bizans ve Osmanlı mimarisinin eşsiz sentezi; 2020’den beri ibadete açık bir cami.", "İbadet ücretsiz · ziyaretçi galerisi 25 €, 09:00–19:30 · cuma 12:00–14:00 galeri kapalı", 0, 41.00851, 28.98, "r5-4"],
    [4, 5, "Yerebatan Sarnıcı", "", "", "Sultanahmet", "Bizans su mühendisliğinin başyapıtı; Medusa başlı sütunlarıyla. Haziran 2026’da Vakıflar Genel Müdürlüğü’ne devredilmiştir.", "Her gün · kış 09:00–18:00 · güncel ücret gişede", 0, 41.00848, 28.97838, "r5-5"],
    [4, 6, "Sultanahmet Meydanı (Hipodrom)", "", "", "Sultanahmet", "Dikilitaş, Yılanlı Sütun ve Örme Sütun ile açık hava müzesi.", "", 0, 41.00615, 28.9756, "r5-6"],
    [4, 7, "Türk ve İslam Eserleri Müzesi", "", "", "İbrahim Paşa Sarayı", "Halı, hat ve çini koleksiyonlarıyla Sultanahmet’in sessiz bir durağı.", "Her gün 09:00–18:30, gişe 17:30 · yerli 200 TL, yabancı 17 €", 0, 41.00628, 28.97491, "r5-7"],
    [4, 8, "Çemberlitaş", "", "", "Divanyolu", "Konstantin’in porfir sütunu; yanında Sinan’ın tasarladığı hamam.", "", 0, 41.00855, 28.97128, "r5-8"],
    [4, 9, "Kapalıçarşı", "", "", "Beyazıt", "1461’den beri çarşı; binlerce dükkânlık dev kapalı çarşı.", "Pzt–Cmt yaklaşık 08:30–19:00 · pazar ve dinî bayramlarda kapalı", 0, 41.01097, 28.96825, "r5-9"],
    [4, 10, "Mısır Çarşısı", "", "", "Eminönü", "Baharat ve lezzet çarşısı; Yeni Cami külliyesinin parçası.", "Her gün yaklaşık 08:00–19:30", 0, 41.01646, 28.9711, "r5-10"],
    [4, 11, "Galata Kulesi", "", "", "Galata", "14. yüzyılda Cenevizliler tarafından yapılan kule; şehir ve Haliç manzarası.", "Her gün · yerli 200 TL, yabancı 30 € · saatleri gitmeden doğrulayın", 0, 41.02557, 28.97413, "r5-11"],
    [4, 12, "Tünel ve İstiklal Caddesi", "", "", "Beyoğlu", "1875’te açılan tarihî füniküler; İstiklal’in nostaljik tramvayı.", "", 0, 41.02834, 28.97399, "r5-12"],
    [4, 13, "Dolmabahçe Sarayı", "", "", "Beşiktaş", "19. yüzyılın görkemli sarayı; Boğaz kıyısında.", "Pazartesi kapalı · 09:00–17:00 · yerli 250 TL, yabancı 2.000 TL", 0, 41.03916, 29.00046, "r5-13"],
    [5, 1, "Yedikule Hisarı", "", "", "Yedikule", "Surların Marmara ucundaki kalesi; Altın Kapı ve burçlarıyla.", "Pazartesi kapalı · 09:00–17:00 · restorasyon sürüyor", 0, 40.99357, 28.92393, "r6-1"],
    [5, 2, "Silivri Kapı", "", "", "Silivrikapı", "Theodosius surlarının önemli kapılarından; yanında Bizans dönemi yeraltı mezar odası.", "", 1, 41.0063, 28.922, "r6-2"],
    [5, 3, "Mevlanakapı", "", "", "Mevlanakapı", "Kara surlarında yürüyüşün ara durağı; adını yakınındaki Yenikapı Mevlevîhânesi’nden alır.", "", 0, 41.0141, 28.92199, "r6-3"],
    [5, 4, "Topkapı ve Panorama 1453", "", "", "Topkapı Kültür Parkı", "Kuşatmada büyük topların yerleştirildiği kapı; karşısındaki parkta fethi anlatan panoramik müze.", "", 0, 41.01828, 28.92039, "r6-4"],
    [5, 5, "Edirnekapı", "", "", "Edirnekapı", "Fatih’in şehre girdiği kabul edilen kapı; surların en yüksek noktası.", "", 1, 41.02985, 28.9353, "r6-5"],
    [5, 6, "Kariye Camii (Khora)", "", "", "Edirnekapı", "Bizans’ın en güzel mozaik ve freskleri; 2024’te yeniden ibadete açılmıştır.", "09:00–18:00 · yabancı 20 €, ibadet ve T.C. vatandaşları ücretsiz · cuma turistik ziyarete kapalı", 0, 41.03121, 28.93904, "r6-6"],
    [5, 7, "Tekfur Sarayı", "", "", "Ayvansaray", "Günümüze ulaşan Bizans sivil saraylarından; bugün Çini Müzesi olarak gezilir.", "Pazartesi kapalı · 09:00–17:00 · 50 TL, yabancı 300 TL", 0, 41.03393, 28.94067, "r6-7"],
  ];
  /* PANEL:SON */

  // Başlangıç noktası için hazır seçenekler: yaklaşık noktalardır; işaretlerle üst üste gelmemesi için en yakın durağın ~75 m yanına konuldu.
  const PRESETS = [
    { label: "Eminönü", lat: 41.01721, lng: 28.97125 },
    { label: "Sultanahmet", lat: 41.00615, lng: 28.97649 },
    { label: "Eyüp Sultan", lat: 41.04822, lng: 28.93295 },
    { label: "Edirnekapı", lat: 41.02937, lng: 28.93467 },
    { label: "Galata", lat: 41.02509, lng: 28.97476 },
  ];

  /* Şematik taban haritası: kıyılar elle sadeleştirilmiş yaklaşık çizgilerdir (ölçekli sokak haritası değil). */
  const GEO = {
    europe: [
      [41.1, 28.86], [40.972, 28.86], [40.9755, 28.878], [40.98, 28.895], [40.9865, 28.911],
      [40.9893, 28.9222], [40.9922, 28.929], [40.9972, 28.9368], [41.0008, 28.9455], [40.9978, 28.952],
      [40.9982, 28.959], [41.0018, 28.963], [41.0016, 28.9705], [41.001, 28.9765], [41.0022, 28.982],
      [41.0052, 28.986], [41.01, 28.9875], [41.015, 28.9878], [41.0172, 28.985], [41.0176, 28.98],
      [41.0183, 28.974], [41.0192, 28.9705], [41.02, 28.9685], [41.0218, 28.964], [41.0262, 28.9605],
      [41.03, 28.9545], [41.0335, 28.95], [41.0375, 28.9478], [41.041, 28.9452], [41.044, 28.9415],
      [41.0462, 28.939], [41.048, 28.9382], [41.0512, 28.9375], [41.0555, 28.9388], [41.0605, 28.9408],
      [41.0655, 28.9422], [41.0672, 28.9442], [41.0645, 28.9462], [41.0595, 28.9448], [41.0545, 28.9428],
      [41.0502, 28.943], [41.0468, 28.9458], [41.0432, 28.9502], [41.0396, 28.9548], [41.0346, 28.9612],
      [41.0312, 28.9652], [41.0276, 28.968], [41.0244, 28.9708], [41.0222, 28.9745], [41.0213, 28.9775],
      [41.0221, 28.9812], [41.0246, 28.9838], [41.0276, 28.9872], [41.0306, 28.9906], [41.0346, 28.9937],
      [41.037, 28.9966], [41.0384, 29.002], [41.0398, 29.0052], [41.0412, 29.0078], [41.0432, 29.0128],
      [41.0455, 29.0192], [41.047, 29.0258], [41.0502, 29.0302], [41.0562, 29.0342], [41.0652, 29.0402],
      [41.076, 29.044], [41.1, 29.056],
    ],
    asia: [
      [41.1, 29.1], [41.1, 29.074], [41.08, 29.0665], [41.065, 29.0592], [41.0552, 29.0522],
      [41.0472, 29.0442], [41.0402, 29.0345], [41.0322, 29.0225], [41.0272, 29.0148], [41.0212, 29.0086],
      [41.0152, 29.0088], [41.0102, 29.0106], [41.0002, 29.0152], [40.9922, 29.0222], [40.9802, 29.0262],
      [40.95, 29.03], [40.95, 29.1],
    ],
    walls: [
      [40.9895, 28.9226], [40.9937, 28.9229], [41.0, 28.9222], [41.0063, 28.9218], [41.0141, 28.9218],
      [41.0192, 28.9232], [41.024, 28.929], [41.0298, 28.9349], [41.034, 28.9399], [41.0364, 28.9395],
      [41.0392, 28.9414], [41.0409, 28.9446],
    ],
    bridges: [
      [[41.0188, 28.9722], [41.0222, 28.9745]],
      [[41.0218, 28.964], [41.0244, 28.9708]],
      [[41.044, 28.9415], [41.0468, 28.9458]],
      [[41.0474, 29.0268], [41.0452, 29.041]],
    ],
    isle: [41.0211, 29.0041],
    labels: [
      { t: "Eyüp", lat: 41.0515, lng: 28.9285 },
      { t: "Fatih", lat: 41.0118, lng: 28.9405 },
      { t: "Eminönü", lat: 41.0132, lng: 28.9665, minK: 0.05 },
      { t: "Beyoğlu", lat: 41.0338, lng: 28.9765 },
      { t: "Beşiktaş", lat: 41.0468, lng: 29.0045 },
      { t: "Üsküdar", lat: 41.026, lng: 29.0275 },
      { t: "Kadıköy", lat: 40.9905, lng: 29.0325 },
      { t: "Zeytinburnu", lat: 40.9985, lng: 28.9045 },
      { t: "Haliç", lat: 41.0287, lng: 28.9612, water: 1, rot: -43 },
      { t: "Boğaziçi", lat: 41.0325, lng: 29.0075, water: 1, rot: -52 },
      { t: "Marmara Denizi", lat: 40.9885, lng: 28.968, water: 1 },
      { t: "Kara surları", lat: 41.0102, lng: 28.9183, wall: 1, rot: -90, minK: 0.045 },
    ],
  };

  return { ROUTES, CONCEPTS, RAW, PRESETS, GEO };
})();
if (typeof module !== "undefined") module.exports = globalThis.ZR_DATA;
