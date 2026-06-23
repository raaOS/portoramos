import type { Locale } from '@/contexts/LanguageContext';
import type { WorkflowStep } from '@/types/about';
import type { WorkExperience } from '@/types/experience';
import type { GalleryGroup, Project } from '@/types/projects';

const EN_TEXT: Record<string, string> = {
  PORTOFOLIO: 'PORTFOLIO',
  'Available for new Jobs': 'Available for new jobs',
  'Motto kerja': 'Work motto',
  'Desain adalah Hook: Bikin mereka berhenti scroll, lalu mengerti.':
    'Design is the hook: make people stop scrolling, then make them understand.',
  'Berpengalaman lebih dari 14 tahun di industri desain, saya berkembang sebagai Desainer Visual yang menggabungkan strategi dan estetika. Terbiasa bekerja di lingkungan korporasi maupun secara freelance, saya fokus pada Graphic Design, Branding, dan Visual Storytelling yang relevan dengan kebutuhan bisnis.':
    'With more than 14 years in the design industry, I have grown as a visual designer who combines strategy and aesthetics. Experienced in both corporate and freelance environments, I focus on graphic design, branding, and visual storytelling that stays relevant to business needs.',
  'Kombinasi keahlian teknis dan interpersonal yang saya gunakan untuk membangun solusi berkualitas.':
    'A mix of technical and interpersonal skills I use to build high-quality solutions.',
  'Mendefinisikan visi visual yang kuat untuk membangun identitas brand yang berkarakter dan unik.':
    'Defining a strong visual vision to build distinctive and memorable brand identities.',
  'Mengemas pesan bisnis menjadi bahasa visual yang intuitif, berani, dan fungsional di berbagai platform.':
    'Turning business messages into intuitive, bold, and functional visual language across platforms.',
  'Rekan kerja strategis yang responsif terhadap feedback dan selalu mencari solusi terbaik untuk semua pihak.':
    'A strategic collaborator who responds to feedback and keeps looking for the best solution for everyone involved.',
  'Selalu terdepan dalam adopsi teknologi (AI & Automation) dan tren desain terbaru untuk efisiensi maksimal.':
    'Staying ahead in technology adoption, AI, automation, and design trends to maximize efficiency.',
  'Berkomitmen penuh pada kualitas pixel-perfect hasil akhir dan ketepatan waktu penyelesaian proyek.':
    'Fully committed to pixel-perfect final quality and reliable project delivery.',
  'Workflow data sedang dimuat atau tidak tersedia.': 'Workflow data is loading or unavailable.',
  'Workflow data tidak tersedia': 'Workflow data is unavailable',
  '* Catatan Iterasi: Dapat berulang (loop) kembali ke tahap':
    '* Iteration note: This can loop back to',
  'No skills to display.': 'No skills to display.',
  'No experience data found.': 'No experience data found.',
  'Memuat lebih banyak project...': 'Loading more projects...',
  'Memuat karya...': 'Loading works...',
  'Start a Project?': 'Start a Project?',

  'Manipulasi Foto Musik Alam': 'Nature Music Photo Manipulation',
  "Eksperimen surealis menggabungkan piringan hitam vinyl dengan elemen alam liar. Konsepnya visualisasi 'suara alam' secara harfiah.":
    'A surreal experiment combining a vinyl record with wild natural elements. The concept literally visualizes the sound of nature.',
  'Kolase Lanskap Menanjak': 'Ascending Landscape Collage',
  'Kolase digital yang mainin skala ekstrem. Tangan raksasa vs manusia kecil di lanskap musim gugur yang dramatis.':
    'A digital collage that plays with extreme scale: a giant hand against tiny humans in a dramatic autumn landscape.',
  'Montase Bunga Cantik': 'Beautiful Flower Montage',
  'Animasi pendek looping (GIF style) yang super colorful. Bunga meledak keluar dari lampu lalu lintas. Aneh? Iya. Keren? Pasti.':
    'A colorful short looping animation in a GIF-like style. Flowers burst out of a traffic light. Strange? Yes. Cool? Definitely.',
  "Sinkronisasi gerakan 'ledakan' bunga biar kerasa natural tapi tetap kartunis.":
    'Synchronizing the flower burst so it feels natural while staying cartoonish.',
  'Project iseng buat konten TikTok/Reels. Pengen bikin sesuatu yang satisfying buat ditonton ulang-ulang.':
    'A playful TikTok/Reels content experiment, built to feel satisfying on repeat views.',
  'Potensial untuk aset social media brand fashion atau kosmetik yang playful.':
    'Potentially useful as a playful social media asset for fashion or cosmetic brands.',
  'Kombinasi 3D particle system ringan dan layering 2D asset bunga.':
    'A combination of a lightweight 3D particle system and layered 2D flower assets.',
  'Komposisi Kinetik Mengalir': 'Flowing Kinetic Composition',
  'Poster olahraga yang dinamis. Background kuning ngejreng + efek motion blur buat nampilin kecepatan dan energi.':
    'A dynamic sports poster with a bright yellow background and motion blur to express speed and energy.',
  "Visual harus teriak 'CEPAT' dan 'ENERGIK' dalam sekilas pandang.":
    'The visual had to shout FAST and ENERGETIC at first glance.',
  'Iklan sepatu lari urban. Target audiensnya anak muda kota yang aktif.':
    'An urban running shoe ad aimed at active young city audiences.',
  'Desain high-impact yang cocok buat billboard atau poster jalanan.':
    'A high-impact design suited for billboards or street posters.',
  'Pakai warna kuning safety (warning color) biar eye-catching, plus tipografi miring (italic) yang agresif.':
    'Using safety yellow as an eye-catching warning color, paired with aggressive italic typography.',
  'Seni Poster Flatiron Neon': 'Flatiron Neon Poster Art',
  'Gedung Flatiron New York tapi versi Cyberpunk/Vaporwave. Gradien pink-cyan nabrak gedung tua yang hitam putih.':
    'New Yorks Flatiron Building reimagined in a cyberpunk and vaporwave style, with a pink-cyan gradient colliding against a black-and-white landmark.',
  "Old meets New. Arsitektur klasik yang 'dijajah' oleh estetika digital neon.":
    'Old meets new: classic architecture taken over by digital neon aesthetics.',
  'Efek glow pada tipografinya bikin teksnya serasa lampu neon beneran.':
    'The typography glow makes the text feel like real neon signage.',
  'Seleksi gedung yang detail banget, lalu background diganti total dengan gradien vector.':
    'A detailed building selection, then a full background replacement with a vector gradient.',
  'Promo Streaming Digital Penuh Semangat Natal': 'Festive Digital Streaming Promo',
  'Visual vertikal dengan latar hijau tua ini menampilkan promo Natal, menonjolkan gift card layanan streaming populer (Netflix, Spotify, dll.) yang dibingkai menyerupai kado. Aksen hiasan Natal 3D digunakan untuk memperkuat suasana liburan. Desain ini bertujuan memberikan informasi diskon dan mengarahkan audiens ke tautan pembelian.':
    'A vertical dark green holiday promo highlighting popular streaming gift cards such as Netflix and Spotify, framed like physical gifts. 3D Christmas accents strengthen the seasonal mood while the layout clearly communicates discounts and purchase direction.',
  "Tantangannya adalah membuat produk digital (kartu langganan) terasa 'hadiah' yang fisik dan menarik di tengah kebisingan promosi musiman. Selain itu, desain harus tetap mobile-first dan memastikan semua branding pihak ketiga (Netflix, dll.) tidak terdistorsi.":
    'The challenge was making a digital subscription card feel like a physical, desirable gift amid seasonal promo noise, while keeping the design mobile-first and preserving third-party brand integrity.',
  'Tingkat konversi penjualan gift card meningkat 45% selama minggu pertama. Desain ini juga mendapatkan apresiasi tingkat tinggi karena berhasil menyatukan nuansa nostalgia liburan dengan estetika UI/UX aplikasi digital modern.':
    'Gift card sales conversion increased by 45% during the first week, and the design was well received for blending holiday nostalgia with a modern digital app aesthetic.',
  'Saya menggunakan palet warna merah-hijau klasik dengan elemen 3D (ornamen, permen tongkat) untuk membangun suasana festive yang instan. Gift card ditata miring dan diberi efek bungkus kado untuk menonjolkan nilai gifting. Hierarki visual dibuat sangat jelas: Promo > CTA > Produk.':
    'I used a classic red-green palette with 3D ornaments and candy canes to create an instant festive feel. The gift cards are angled and styled like wrapped presents, with a clear hierarchy: Promo > CTA > Product.',
  'Pastoral Kawanan Berhalo': 'Haloed Herd Pastoral',
  "Scene pedesaan yang aneh dan creepy. Hewan ternak punya 'halo' suci, melayang di sekitar figur misterius. Moodnya seperti lukisan klasik tapi twist horor.":
    'A strange, eerie rural scene where livestock carry sacred halos around a mysterious figure. It feels like a classical painting with a horror twist.',
  'Religious iconography meets rural horror. Apa jadinya kalau hewan ternak dianggap suci dengan cara yang salah?':
    'Religious iconography meets rural horror. What happens when livestock are treated as sacred in the wrong way?',
  'Cahaya halo yang pudar dan tidak sempurna.': 'Faded, imperfect halo light.',
  "Digital painting di atas foto dasar (matte painting). Banyak main brush texture cat minyak biar kerasa 'old painting'.":
    'Digital painting over a base photo, using oil-paint brush textures to create an old-painting feel.',
  'Tipografi Mekar Gotik': 'Gothic Bloom Typography',
  "Tipografi yang 'tenggelam' di antara tanaman hutan gelap. Moody, atmospheric, dan sedikit gothic.":
    'Typography submerged among dark forest plants. Moody, atmospheric, and slightly gothic.',
  'Alam mengambil alih karya manusia. Teks (budaya) yang pelan-pelan tertutup semak belukar.':
    'Nature takes over human work: text and culture slowly being covered by wild growth.',
  'Shadow daun di atas huruf yang bikin efek realistis.':
    'Leaf shadows over the letters create a realistic depth effect.',
  'Teknik masking layer per layer. Sebagian huruf di depan daun, sebagian di belakang, buat efek kedalaman (depth).':
    'Layer-by-layer masking, placing some letters in front of leaves and others behind them to create depth.',
  'Kolase Dunia OK Terfragmentasi': 'Fragmented OK World Collage',
  "Kolase dadaisme modern. Potongan tubuh, globe, dan simbol tangan 'OK' yang random tapi estetik. Warna-warni pop art.":
    'A modern Dadaist collage of body fragments, globes, and random OK hand symbols arranged with a pop-art color palette.',
  'Kekacauan informasi di era digital. Semuanya terpotong-potong dan dicampur aduk.':
    'Information chaos in the digital era: everything is fragmented and mixed together.',
  'Komposisi diagonal yang bikin visualnya kerasa dinamis/gerak.':
    'A diagonal composition that makes the visual feel dynamic and in motion.',
  "Metode 'Cut & Paste' digital. Sengaja dibuat kasar potongannya biar kerasa kayak zine punk.":
    'A digital cut-and-paste method, intentionally rough to feel like a punk zine.',
  'Efek Poster Bunga Berkerut': 'Crumpled Flower Poster Effect',
  'Simulasi poster jalanan yang udah agak rusak/lecek (wheatpaste texture). Visualnya bunga cantik tapi teksturnya kasar.':
    'A simulated street poster with worn wheatpaste texture: beautiful flowers against a rough physical surface.',
  'Bikin efek kertas lecek yang realistis tanpa kelihatan maksa.':
    'Creating a realistic crumpled-paper effect without making it feel forced.',
  "Pengen bikin desain digital yang gak kerasa 'terlalu digital' atau licin.":
    'The goal was to make a digital design that did not feel too digital or overly polished.',
  "Memberikan kesan 'street' dan raw, cocok untuk brand streetwear atau event musik underground.":
    'It gives a raw street feel, suitable for streetwear brands or underground music events.',
  "Pakai displacement map dari foto kertas kusut asli, di-blend mode 'Multiply' di atas artwork.":
    'Using a displacement map from real wrinkled paper photos, blended in Multiply mode over the artwork.',
  'Belenggu Sandal Surgawi': 'Shackled Heavenly Sandal',
  'Visual absurd: Sandal jepit tapi ada sayap malaikatnya, dirantai di atas tumpukan emas. Satire tentang komodifikasi hal suci.':
    'An absurd visual: flip-flops with angel wings chained above piles of gold, satirizing the commodification of sacred things.',
  "Kritik sosial tentang materialisme. 'Surgawi' yang terikat oleh kekayaan duniawi (emas).":
    'A social critique of materialism: the heavenly bound by worldly wealth.',
  'Kilauan emas yang kontras dengan tekstur batu rantai yang kasar.':
    'Gold shine contrasted with the rough stone texture of the chains.',
  'Digital painting dengan referensi patung klasik Yunani.':
    'Digital painting using classical Greek sculpture references.',
  'Komposit Gerbang Neraka': 'Gate of Hell Composite',
  'Visualisasi dark fantasy tentang perjalanan ke dunia bawah. Mood-nya gelap, gloomy, dengan gagak sebagai simbol mistis.':
    'A dark-fantasy visualization of a journey to the underworld, with a gloomy mood and crows as mystical symbols.',
  'Terinspirasi dari film-film horor gothic klasik. Mencoba menangkap perasaan isolasi dan ketidakpastian saat melangkah ke tempat asing.':
    'Inspired by classic gothic horror films, aiming to capture isolation and uncertainty when entering an unfamiliar place.',
  'Siluet jembatan dan kabut tipis di kejauhan.':
    'A bridge silhouette and thin mist in the distance.',
  'Pencahayaan sangat minim (low-key lighting). Hampir 70% canvas adalah shadow/hitam untuk membangun suspense.':
    'Very minimal low-key lighting, with nearly 70% of the canvas held in shadow to build suspense.',
  'Kaleidoskop Tipografi Gradien': 'Gradient Typography Kaleidoscope',
  'Ilusi optik dari huruf-huruf yang diputar dan didistorsi. Warnanya ungu neon yang trippy banget.':
    'An optical illusion built from rotated and distorted letters, using a trippy neon purple palette.',
  'Eksplorasi bentuk huruf sebagai tekstur visual, bukan untuk dibaca.':
    'Exploring letterforms as visual texture rather than readable text.',
  'Gradasi warna yang smooth banget transisinya.': 'Very smooth gradient transitions.',
  "Pakai filter 'Polar Coordinates' dan 'Twirl' di Photoshop untuk mendistorsi teks biasa jadi bentuk abstrak.":
    'Using Polar Coordinates and Twirl filters in Photoshop to distort ordinary text into abstract forms.',
  'Politik Pop Digital': 'Digital Pop Politics',
  'Satire visual yang menggabungkan tokoh politik kaku dengan elemen bunga-bunga glitchy yang chaos. Tabrakan visual yang disengaja.':
    'A visual satire combining stiff political figures with chaotic glitchy floral elements. The collision is intentional.',
  'Mengkritik formalitas politik dengan estetika internet/glitch art. Bunga melambangkan topeng keindahan di atas realita yang keras.':
    'Critiquing political formality through internet and glitch-art aesthetics, with flowers acting as a beautiful mask over harsh realities.',
  "Karya ini sempat viral di komunitas Glitch Art karena kontras warnanya yang 'nyolot'.":
    'This piece gained traction in glitch-art communities because of its loud color contrast.',
  'Teknik datamoshing dan pixel sorting diaplikasikan ke foto asli, lalu di-overlay dengan ilustrasi bunga vintage.':
    'Datamoshing and pixel sorting were applied to the original photo, then overlaid with vintage flower illustrations.',
  'Tempat Perlindungan Sneaker Surealis': 'Surreal Sneaker Shelter',
  "Imajinasi liar kalau sepatu itu bukan cuma alas kaki, tapi 'rumah' atau tempat berlindung. Manipulasi skala yang fun.":
    'A playful scale-manipulation concept imagining sneakers not just as footwear, but as shelter.',
  'Sneaker culture meets architectural dreams. Mengubah struktur sepatu sneakers modern jadi bangunan monumen di tengah alam.':
    'Sneaker culture meets architectural dreams, turning a modern sneaker structure into a monument-like building in nature.',
  'Tekstur tali sepatu yang berubah jadi kabel baja raksasa.':
    'Shoelace texture transformed into giant steel cables.',
  'Modeling dasar di Blender untuk referensi perspektif, lalu heavy photobashing di Photoshop untuk tekstur beton dan lumutnya.':
    'Basic Blender modeling for perspective reference, followed by heavy Photoshop photobashing for concrete and moss textures.',
  'Overlay Bunga Barok Digital': 'Digital Baroque Flower Overlay',
  'Poster tipografi modern yang nabrakin gaya lukisan klasik Barok yang gelap dengan font sans-serif super clean.':
    'A modern typography poster that collides dark Baroque painting aesthetics with a clean sans-serif type treatment.',
  'Gimana caranya naruh teks putih di atas background bunga yang super detail tanpa bikin pusing bacanya.':
    'Finding a way to place white text over a highly detailed flower background without hurting readability.',
  "Eksplorasi tren desain 'Modern Nostalgia' yang lagi hype. Pengen bikin poster event fiktif yang elegan tapi edgy.":
    'An exploration of the Modern Nostalgia design trend, shaped as an elegant yet edgy fictional event poster.',
  'Didesain untuk poster pameran seni atau cover majalah fashion indie.':
    'Designed for an art exhibition poster or indie fashion magazine cover.',
  'Mainin kontras dan hierarchy ukuran font. Bunga dijadikan tekstur background, bukan focal point utama.':
    'Playing with contrast and type-size hierarchy, using flowers as background texture instead of the main focal point.',
  'Narasi Visual & Moodboard': 'Visual Narrative & Moodboard',
  'Kumpulan potongan visual alias Moodboard untuk project film pendek sci-fi. Gabungan foto travel, tekstur, dan warna-warna dingin.':
    'A moodboard collection for a short sci-fi film, combining travel photos, textures, and cool-toned colors.',
  "Visual storytelling tanpa kata. Mengumpulkan fragmen-fragmen gambar untuk membangun 'dunia' dan 'rasa' sebelum syuting dimulai.":
    'Wordless visual storytelling: collecting image fragments to build the world and mood before shooting begins.',
  'Konsistensi palet warna biru-abu (cold tone) di setiap panel.':
    'A consistent blue-gray cold-tone palette across each panel.',
  'Kurasi ratusan foto, color correction biar tone-nya nyambung semua, lalu layouting gaya grid sinematik.':
    'Curating hundreds of photos, color-correcting them into one connected tone, then laying them out in a cinematic grid.',
  'Tipografi Alam Kontras Tinggi': 'High-Contrast Nature Typography',
  'Eksperimen layout majalah. Hijau daun yang nendang banget warnanya ketemu sama whitespace dan tipografi Swiss Style.':
    'A magazine layout experiment pairing punchy leaf green with whitespace and Swiss-style typography.',
  'Menyeimbangkan area kosong (negative space) dengan area foto yang padat tekstur.':
    'Balancing negative space against a dense, textured photo area.',
  'Latihan komposisi grid sistem. Mencoba memecah kekakuan grid dengan elemen organik (daun).':
    'A grid-system composition exercise, breaking rigid structure with organic leaf elements.',
  'Cocok banget buat referensi layout lookbook fashion summer season.':
    'Well suited as a layout reference for a summer fashion lookbook.',
  "Menggunakan tipografi bold sans-serif sebagai 'jangkar' visual biar mata gak lari kemana-mana.":
    'Using bold sans-serif typography as a visual anchor so the eye stays focused.',
  'Desain Sampul Hijau Tua': 'Dark Green Cover Design',
  'Mockup cover buku/majalah indie. Nuansanya misterius, deep forest green dengan aksen merah beri.':
    'An indie book or magazine cover mockup with a mysterious deep forest-green mood and red berry accents.',
  "Bikin visual yang 'sepi' tapi gak kosong.": 'Creating a quiet visual that does not feel empty.',
  'Bikin desain cover untuk buku puisi fiksi bertema alam dan kehilangan.':
    'Designing a fictional poetry-book cover about nature and loss.',
  'Desain ini dirancang untuk menarik pembaca yang suka estetika minimalis dan melankolis.':
    'The design is aimed at readers who like minimalist, melancholic aesthetics.',
  'Pakai satu foto makro yang kuat sebagai background, tipografi disimpen kecil dan rapi di tengah biar elegan.':
    'Using one strong macro photo as the background, with small centered typography for an elegant feel.',
  'Identitas Monogram Hijau': 'Green Monogram Identity',
  "Explorasi logo monogram yang 'classy'. Menggabungkan inisial huruf dengan style kaligrafi modern di atas background tekstur organik.":
    'A classy monogram logo exploration, combining initials with modern calligraphic style over an organic textured background.',
  "Bikin logo yang kerasa mahal tapi tetap 'membumi' (nature-vibe).":
    'Creating a logo that feels premium while staying grounded in a nature-inspired mood.',
  'Konsep branding untuk luxury boutique hotel yang eco-friendly.':
    'A branding concept for an eco-friendly luxury boutique hotel.',
  'Draft logo ini bisa dikembangkan jadi full brand identity kit.':
    'This logo draft can be expanded into a complete brand identity kit.',
  'Pilih jenis huruf serif yang tajam, dipadukan warna hijau lumut gelap (forest green) biar kesan eksklusifnya dapet.':
    'Choosing a sharp serif typeface and pairing it with dark moss green to create a more exclusive impression.',

  '5 tahun 10 bulan': '5 years 10 months',
  '1 tahun 1 bulan': '1 year 1 month',
  '2 tahun 9 bulan': '2 years 9 months',
  '8 bulan': '8 months',
  '2 tahun 11 bulan': '2 years 11 months',
  '3 bulan': '3 months',
  'Agt 2016 - Mar 2017': 'Aug 2016 - Mar 2017',
  'Okt 2012 - Agt 2015': 'Oct 2012 - Aug 2015',
  'Mentor Desain Grafis': 'Graphic Design Mentor',
  'Mengelola seluruh visual brand, dari konten sosmed sampai materi cetak.':
    'Managed the full brand visual system, from social media content to printed materials.',
  'Kolaborasi dengan tim UI/UX untuk memastikan konsistensi desain produk.':
    'Collaborated with the UI/UX team to keep product design consistent.',
  'Mentoring mahasiswa dan sharing session rutin biar mereka makin jago desain.':
    'Mentored students and ran regular sharing sessions to improve their design skills.',
  'Kasih feedback konstruktif buat ningkatin kualitas karya peserta.':
    'Provided constructive feedback to improve participant work quality.',
  'Merancang strategi visual buat promosi perusahaan yang lebih nendang.':
    'Designed stronger visual strategies for company promotions.',
  'Handle semua kebutuhan desain, baik online maupun offline.':
    'Handled design needs across online and offline channels.',
  'Mendesain produk t-shirt yang laku keras di pasaran.':
    'Designed T-shirt products that performed strongly in the market.',
  'Handle orderan customer dan pastiin pengiriman aman terkendali.':
    'Handled customer orders and kept shipping organized.',
  'Kelola stok dan administrasi produk harian.': 'Managed stock and daily product administration.',
  'Certified Coffee Master. Belajar art of coffee langsung dari ahlinya.':
    'Certified Coffee Master, trained directly in the art of coffee.',
  'Edukasi customer soal dunia kopi dengan cara yang fun.':
    'Educated customers about coffee in an engaging way.',
  'Memberikan service terbaik buat setiap customer yang datang.':
    'Delivered excellent service for every customer.',
  'Bikin konten visual buat marketing online.': 'Created visual content for online marketing.',
  'Handle chat customer dan proses orderan.': 'Handled customer chats and order processing.',
  'Quality control produk sebelum dikirim.': 'Quality-checked products before shipping.',

  'Memahami fondasi proyek': 'Understanding the project foundation',
  'Tahap awal untuk memahami masalah bisnis, target audience, dan tujuan desain.':
    'The opening phase for understanding the business problem, target audience, and design goals.',
  'Briefing & Debrief': 'Briefing & Debrief',
  'Diskusi awal dengan klien untuk memahami kebutuhan dan ekspektasi.':
    'Initial discussion with the client to understand needs and expectations.',
  'Research & Observasi': 'Research & Observation',
  'Analisis pasar, kompetitor, dan tren yang relevan.':
    'Analysis of market, competitors, and relevant trends.',
  'Cari Referensi & Asset': 'Find References & Assets',
  'Mengumpulkan inspirasi visual, moodboard, dan resource.':
    'Collecting visual inspiration, moodboards, and resources.',
  'Sync dengan Klien': 'Client Sync',
  'Presentasi temuan dan validasi arah konsep.':
    'Presenting findings and validating the concept direction.',
  'Merancang pendekatan visual': 'Designing the visual approach',
  'Menentukan hierarki visual, pesan utama, dan strategi komunikasi desain.':
    'Defining visual hierarchy, the main message, and the design communication strategy.',
  'Definisikan Pesan Utama': 'Define the Core Message',
  'Menentukan core message yang harus tersampaikan.':
    'Defining the core message that needs to come through.',
  'Hierarki Visual': 'Visual Hierarchy',
  'Merancang struktur informasi dan prioritas elemen.':
    'Designing the information structure and element priorities.',
  'Brainstorm dengan Tim': 'Team Brainstorm',
  'Diskusi kreatif untuk eksplorasi ide.': 'Creative discussion to explore ideas.',
  'Proposal Konsep': 'Concept Proposal',
  'Menyusun presentasi konsep untuk klien.': 'Preparing a concept presentation for the client.',
  'Mengembangkan desain': 'Developing the design',
  'Proses kreatif membuat desain dengan iterasi dan revisi.':
    'A creative design process with iteration and revision.',
  'Draft & Wireframe': 'Draft & Wireframe',
  'Membuat kerangka awal dan layout dasar.': 'Creating the initial structure and base layout.',
  'Desain Visual': 'Visual Design',
  'Mengembangkan visual dengan detail penuh.': 'Developing the visual work in full detail.',
  'Review Internal': 'Internal Review',
  'Evaluasi dengan tim sebelum ke klien.': 'Team evaluation before presenting to the client.',
  'Present ke Klien': 'Client Presentation',
  'Menampilkan hasil dan menerima feedback.': 'Presenting the result and receiving feedback.',
  'Penyempurnaan dan ACC': 'Refinement and approval',
  'Tahap revisi akhir hingga persetujuan final dari klien.':
    'The final revision phase until client approval.',
  'Revisi R1': 'Revision R1',
  'Perbaikan berdasarkan feedback pertama.': 'Improvements based on the first feedback round.',
  'Revisi R2 (jika perlu)': 'Revision R2 (if needed)',
  'Penyempurnaan tambahan.': 'Additional refinement.',
  'Detail terakhir dan quality check.': 'Final details and quality check.',
  'ACC dari Klien': 'Client Approval',
  'Persetujuan final dan tanda tangan.': 'Final approval and sign-off.',
  'Serah terima final': 'Final handoff',
  'Penyerahan aset final dan dokumentasi.': 'Delivery of final assets and documentation.',
  'Menyusun semua file dalam format siap pakai.': 'Preparing all files in ready-to-use formats.',
  'Styleguide & Dokumentasi': 'Styleguide & Documentation',
  'Panduan penggunaan dan brand guidelines.': 'Usage guidance and brand guidelines.',
  'Sesi penjelasan dan Q&A dengan klien.': 'Explanation and Q&A session with the client.',
  'Backup project dan closing administrasi.': 'Project backup and administrative closing.',
};

export function localizeText(value: string | undefined | null, locale: Locale) {
  if (!value || locale === 'id') return value ?? '';

  if (value.includes('Mau ngobrol soal kerja sama')) {
    return 'Want to talk about collaboration, a project, or anything else? Write here and I will reply soon.';
  }

  const key = value.trim();
  return EN_TEXT[key] ?? value;
}

function localizeTextArray(values: string[] | undefined, locale: Locale) {
  return values?.map((value) => localizeText(value, locale));
}

function localizeGalleryGroups(groups: GalleryGroup[] | undefined, locale: Locale) {
  if (!groups || locale === 'id') return groups;
  return groups.map((group) => ({
    ...group,
    name: localizeText(group.name, locale),
    description: group.description ? localizeText(group.description, locale) : group.description,
  }));
}

export function localizeProject(project: Project, locale: Locale): Project {
  if (locale === 'id') return project;

  return {
    ...project,
    title: localizeText(project.title, locale),
    description: localizeText(project.description, locale),
    role: project.role ? localizeText(project.role, locale) : project.role,
    timeline: project.timeline ? localizeText(project.timeline, locale) : project.timeline,
    team: project.team ? localizeText(project.team, locale) : project.team,
    narrative: project.narrative
      ? {
          ...project.narrative,
          context: localizeText(project.narrative.context, locale),
          challenge: localizeText(project.narrative.challenge, locale),
          solution: localizeText(project.narrative.solution, locale),
          impact: localizeText(project.narrative.impact, locale),
          result: localizeText(project.narrative.result, locale),
          concept: localizeText(project.narrative.concept, locale),
          process: localizeText(project.narrative.process, locale),
          detail: localizeText(project.narrative.detail, locale),
        }
      : project.narrative,
    galleryGroups: localizeGalleryGroups(project.galleryGroups, locale),
  };
}

export function localizeWorkflowSteps(steps: WorkflowStep[] | undefined, locale: Locale) {
  if (!steps || locale === 'id') return steps ?? [];

  return steps.map((step) => ({
    ...step,
    title: localizeText(step.title, locale),
    subtitle: localizeText(step.subtitle, locale),
    description: localizeText(step.description, locale),
    subSteps: step.subSteps?.map((subStep) => ({
      ...subStep,
      title: localizeText(subStep.title, locale),
      description: localizeText(subStep.description, locale),
    })),
  }));
}

export function localizeWorkExperience(job: WorkExperience, locale: Locale): WorkExperience {
  if (locale === 'id') return job;

  return {
    ...job,
    year: localizeText(job.year, locale),
    duration: localizeText(job.duration, locale),
    position: localizeText(job.position, locale),
    description: localizeTextArray(job.description, locale) ?? job.description,
  };
}
