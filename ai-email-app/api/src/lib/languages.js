/**
 * Supported languages for 6amreads.
 * Code format: ISO 639-1 where possible, zh-Hans/zh-Hant for Chinese variants.
 * @type {Array<{ code: string, name: string, nameNative: string }>}
 */
const LANGUAGES = [
  { code: 'en', name: 'English', nameNative: 'English' },
  { code: 'zh-Hant', name: 'Chinese Traditional', nameNative: '繁體中文' },
  { code: 'zh-Hans', name: 'Chinese Simplified', nameNative: '简体中文' },
  { code: 'ko', name: 'Korean', nameNative: '한국어' },
  { code: 'ja', name: 'Japanese', nameNative: '日本語' },
  { code: 'fr', name: 'French', nameNative: 'Français' },
  { code: 'es', name: 'Spanish', nameNative: 'Español' },
  { code: 'de', name: 'German', nameNative: 'Deutsch' },
  { code: 'it', name: 'Italian', nameNative: 'Italiano' },
  { code: 'vi', name: 'Vietnamese', nameNative: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', nameNative: 'ไทย' },
  { code: 'ms', name: 'Malaysian', nameNative: 'Bahasa Melayu' },
  { code: 'id', name: 'Indonesian', nameNative: 'Bahasa Indonesia' },
  { code: 'km', name: 'Cambodian', nameNative: 'ភាសាខ្មែរ' },
  { code: 'hi', name: 'Hindi', nameNative: 'हिन्दी' },
  { code: 'ar', name: 'Arabic', nameNative: 'العربية' },
];

const CODE_SET = new Set(LANGUAGES.map((l) => l.code));

function isValidLanguage(code) {
  return code && CODE_SET.has(code);
}

function getLanguageName(code) {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? lang.name : code || 'English';
}

function getLanguageNameNative(code) {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? lang.nameNative : code || 'English';
}

/** Map our code to NewsAPI language param (for /everything). Unsupported → 'en'. */
function toNewsApiLanguage(code) {
  const map = {
    en: 'en',
    zh-Hant: 'zh',
    zh-Hans: 'zh',
    ko: 'en',
    ja: 'en',
    fr: 'fr',
    es: 'es',
    de: 'de',
    it: 'it',
    vi: 'en',
    th: 'en',
    ms: 'en',
    id: 'en',
    km: 'en',
    hi: 'en',
    ar: 'ar',
  };
  return map[code] || 'en';
}

/** Human-readable language for Claude prompts. */
function toClaudeLanguage(code) {
  const map = {
    en: 'English',
    'zh-Hant': 'Traditional Chinese (繁體中文)',
    'zh-Hans': 'Simplified Chinese (简体中文)',
    ko: 'Korean (한국어)',
    ja: 'Japanese (日本語)',
    fr: 'French (Français)',
    es: 'Spanish (Español)',
    de: 'German (Deutsch)',
    it: 'Italian (Italiano)',
    vi: 'Vietnamese (Tiếng Việt)',
    th: 'Thai (ไทย)',
    ms: 'Malaysian (Bahasa Melayu)',
    id: 'Indonesian (Bahasa Indonesia)',
    km: 'Khmer/Cambodian (ភាសាខ្មែរ)',
    hi: 'Hindi (हिन्दी)',
    ar: 'Arabic (العربية)',
  };
  return map[code] || 'English';
}

/** Email template labels by language. */
const EMAIL_LABELS = {
  en: {
    greeting: 'Good morning',
    noHeadlines: "No headlines available this morning — we'll be back tomorrow.",
    section1: "Your daily lesson",
    section2: "Today's news",
    section2Desc: "Neutral summaries tailored to your interests. Tap a headline to read the full story.",
    section3: "Shape tomorrow's paper",
    section3Desc: "One tap — we'll fold this into your profile for the next edition.",
    moreLikeThis: "More like this",
    lessLikeThis: "Less like this",
    section4: "Sources",
    readFullArticle: "Read full article →",
    footer: "You receive 6amreads because you signed up at 6amreads.com.",
    footer2: "Prefer the web? Open your",
    dashboard: "dashboard",
  },
  'zh-Hant': {
    greeting: '早安',
    section1: '今日學習',
    section2: '今日新聞',
    section2Desc: '根據你的興趣整理的中立摘要。點擊標題閱讀全文。',
    section3: '塑造明天的報紙',
    section3Desc: '一鍵反饋，我們會將此納入你的設定。',
    moreLikeThis: '更多此類',
    lessLikeThis: '少一點',
    section4: '來源',
    readFullArticle: '閱讀全文 →',
    footer: '你收到 6amreads 是因為已在 6amreads.com 註冊。',
    footer2: '想用網頁版？開啟',
    dashboard: '控制台',
  },
  'zh-Hans': {
    greeting: '早上好',
    section1: '今日学习',
    section2: '今日新闻',
    section2Desc: '根据你的兴趣整理的中立摘要。点击标题阅读全文。',
    section3: '塑造明天的报纸',
    section3Desc: '一键反馈，我们会将此纳入你的设定。',
    moreLikeThis: '更多此类',
    lessLikeThis: '少一点',
    section4: '来源',
    readFullArticle: '阅读全文 →',
    footer: '你收到 6amreads 是因为已在 6amreads.com 注册。',
    footer2: '想用网页版？打开',
    dashboard: '控制台',
  },
  ko: { greeting: '좋은 아침', section1: '오늘의 교훈', section2: '오늘의 뉴스', section2Desc: '관심사에 맞춘 중립 요약. 제목을 클릭해 전체 기사를 읽으세요.', section3: '내일의 신문 만들기', section3Desc: '한 번의 클릭으로 다음 호에 반영됩니다.', moreLikeThis: '더 많이', lessLikeThis: '덜 보기', section4: '출처', readFullArticle: '전체 기사 읽기 →', footer: '6amreads.com에서 가입하여 이 메일을 받고 있습니다.', dashboard: '대시보드' },
  ja: { greeting: 'おはようございます', section1: '今日のレッスン', section2: '今日のニュース', section2Desc: 'あなたの興味に合わせた中立的な要約。見出しをクリックして全文を読めます。', section3: '明日の新聞を形作る', section3Desc: 'ワンタップで次号に反映されます。', moreLikeThis: 'もっと見る', lessLikeThis: '減らす', section4: 'ソース', readFullArticle: '全文を読む →', footer: '6amreads.comに登録したため、このメールを受信しています。', dashboard: 'ダッシュボード' },
  fr: { greeting: 'Bonjour', section1: "Votre leçon du jour", section2: "L'actualité du jour", section2Desc: "Résumés neutres adaptés à vos centres d'intérêt. Cliquez pour lire l'article complet.", section3: "Faites évoluer votre journal", section3Desc: "Un clic — nous l'intégrerons à votre profil pour le prochain numéro.", moreLikeThis: "Plus comme ça", lessLikeThis: "Moins", section4: "Sources", readFullArticle: "Lire l'article →", footer: "Vous recevez 6amreads car vous vous êtes inscrit sur 6amreads.com.", dashboard: "tableau de bord" },
  es: { greeting: 'Buenos días', section1: 'Tu lección del día', section2: "Noticias de hoy", section2Desc: 'Resúmenes neutros según tus intereses. Haz clic para leer el artículo completo.', section3: 'Da forma al periódico de mañana', section3Desc: 'Un clic — lo incorporaremos a tu perfil para la próxima edición.', moreLikeThis: 'Más como esto', lessLikeThis: 'Menos', section4: 'Fuentes', readFullArticle: 'Leer artículo completo →', footer: 'Recibes 6amreads porque te registraste en 6amreads.com.', dashboard: 'panel' },
  de: { greeting: 'Guten Morgen', section1: 'Deine tägliche Lektion', section2: 'Nachrichten des Tages', section2Desc: 'Neutrale Zusammenfassungen nach deinen Interessen. Klicke für den vollständigen Artikel.', section3: 'Gestalte die Zeitung von morgen', section3Desc: 'Ein Klick — wir nehmen es in dein Profil für die nächste Ausgabe auf.', moreLikeThis: 'Mehr davon', lessLikeThis: 'Weniger', section4: 'Quellen', readFullArticle: 'Vollständigen Artikel lesen →', footer: 'Du erhältst 6amreads, weil du dich bei 6amreads.com angemeldet hast.', dashboard: 'Dashboard' },
  it: { greeting: 'Buongiorno', section1: 'La tua lezione del giorno', section2: 'Notizie di oggi', section2Desc: 'Riassunti neutri su misura. Clicca per leggere l\'articolo completo.', section3: 'Dai forma al giornale di domani', section3Desc: 'Un clic — lo includeremo nel tuo profilo per la prossima edizione.', moreLikeThis: 'Più così', lessLikeThis: 'Meno', section4: 'Fonti', readFullArticle: 'Leggi articolo completo →', footer: 'Ricevi 6amreads perché ti sei iscritto su 6amreads.com.', dashboard: 'pannello' },
  vi: { greeting: 'Chào buổi sáng', section1: 'Bài học hôm nay', section2: 'Tin tức hôm nay', section2Desc: 'Tóm tắt trung lập theo sở thích của bạn. Nhấp để đọc toàn bộ.', section3: 'Định hình báo ngày mai', section3Desc: 'Một cú nhấp — chúng tôi sẽ đưa vào hồ sơ cho số tiếp theo.', moreLikeThis: 'Thêm nữa', lessLikeThis: 'Ít hơn', section4: 'Nguồn', readFullArticle: 'Đọc toàn bộ →', footer: 'Bạn nhận 6amreads vì đã đăng ký tại 6amreads.com.', dashboard: 'bảng điều khiển' },
  th: { greeting: 'สวัสดีตอนเช้า', section1: 'บทเรียนวันนี้', section2: 'ข่าววันนี้', section2Desc: 'สรุปที่เป็นกลางตามความสนใจ คลิกเพื่ออ่านฉบับเต็ม', section3: 'กำหนดรูปแบบหนังสือพิมพ์วันพรุ่ง', section3Desc: 'คลิกเดียว — เราจะใส่ในโปรไฟล์ของคุณสำหรับฉบับถัดไป', moreLikeThis: 'เพิ่มเติม', lessLikeThis: 'น้อยลง', section4: 'แหล่งที่มา', readFullArticle: 'อ่านฉบับเต็ม →', footer: 'คุณได้รับ 6amreads เพราะสมัครที่ 6amreads.com', dashboard: 'แดชบอร์ด' },
  ms: { greeting: 'Selamat pagi', section1: 'Pelajaran hari ini', section2: 'Berita hari ini', section2Desc: 'Ringkasan neutral mengikut minat anda. Klik untuk baca penuh.', section3: 'Bentuk surat khabar esok', section3Desc: 'Satu klik — kami akan masukkan ke profil anda untuk edisi seterusnya.', moreLikeThis: 'Lebih seperti ini', lessLikeThis: 'Kurang', section4: 'Sumber', readFullArticle: 'Baca artikel penuh →', footer: 'Anda terima 6amreads kerana mendaftar di 6amreads.com.', dashboard: 'papan pemuka' },
  id: { greeting: 'Selamat pagi', section1: 'Pelajaran hari ini', section2: 'Berita hari ini', section2Desc: 'Ringkasan netral sesuai minat Anda. Klik untuk baca lengkap.', section3: 'Bentuk koran besok', section3Desc: 'Satu klik — kami akan masukkan ke profil untuk edisi berikutnya.', moreLikeThis: 'Lebih seperti ini', lessLikeThis: 'Kurang', section4: 'Sumber', readFullArticle: 'Baca artikel lengkap →', footer: 'Anda terima 6amreads karena mendaftar di 6amreads.com.', dashboard: 'dasbor' },
  km: { greeting: 'អរុណសួស្តី', section1: 'មេរៀនថ្ងៃនេះ', section2: 'ព័ត៌មានថ្ងៃនេះ', section2Desc: 'សង្ខេបអព្យាក្រឹត្យតាមចំណាប់អារម្មណ៍របស់អ្នក។', section3: 'រៀបចំកាសែតថ្ងៃស្អែក', section3Desc: 'មួយចុច — យើងនឹងរួមបញ្ចូលក្នុងប្រវត្តិរូបរបស់អ្នក។', moreLikeThis: 'បន្ថែម', lessLikeThis: 'តិចជាង', section4: 'ប្រភព', readFullArticle: 'អានពេញលេញ →', footer: 'អ្នកទទួល 6amreads ព្រោះចុះឈ្មោះនៅ 6amreads.com។', dashboard: 'ផ្ទៃតាប្លូ' },
  hi: { greeting: 'शुभ प्रभात', section1: 'आज का पाठ', section2: 'आज की खबरें', section2Desc: 'आपकी रुचि के अनुसार तटस्थ सारांश। पूरा लेख पढ़ने के लिए क्लिक करें।', section3: 'कल का अखबार बनाएं', section3Desc: 'एक क्लिक — हम इसे अगले संस्करण के लिए आपके प्रोफाइल में शामिल करेंगे।', moreLikeThis: 'और ऐसा', lessLikeThis: 'कम', section4: 'स्रोत', readFullArticle: 'पूरा लेख पढ़ें →', footer: 'आप 6amreads प्राप्त कर रहे हैं क्योंकि आपने 6amreads.com पर साइन अप किया।', dashboard: 'डैशबोर्ड' },
  ar: { greeting: 'صباح الخير', section1: 'درسك اليوم', section2: 'أخبار اليوم', section2Desc: 'ملخصات محايدة حسب اهتماماتك. انقر لقراءة المقال كاملاً.', section3: 'شكّل صحيفة الغد', section3Desc: 'نقرة واحدة — سنضيفها إلى ملفك للإصدار القادم.', moreLikeThis: 'المزيد من هذا', lessLikeThis: 'أقل', section4: 'المصادر', readFullArticle: 'قراءة المقال كاملاً ←', footer: 'تتلقى 6amreads لأنك سجلت في 6amreads.com.', dashboard: 'لوحة التحكم' },
};

function getEmailLabels(code) {
  return EMAIL_LABELS[code] || EMAIL_LABELS.en;
}

module.exports = {
  LANGUAGES,
  isValidLanguage,
  getLanguageName,
  getLanguageNameNative,
  toNewsApiLanguage,
  toClaudeLanguage,
  getEmailLabels,
};
