/**
 * داده‌های نمونه — پاستور پلاس
 */

function buildTreatmentSlots(startHour, endHour, bookedStarts = []) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push({
      start: h,
      end: h + 1,
      label: `${h} تا ${h + 1}`,
      booked: bookedStarts.includes(h),
    });
  }
  return slots;
}

function buildVisitHours(startHour, endHour) {
  const hours = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);
  return hours;
}

const PASTEUR_DATA = {
  institute: {
    nameFa: 'پاستور پلاس',
    nameEn: 'Pasteur Plus',
    shortNameFa: 'پاستور پلاس',
    shortNameEn: 'Pasteur Plus',
    address: 'تبریز، خیابان پاستور جدید، تقاطع شریعتی، مجتمع سلامت پاستور',
    serviceArea: 'پاسه، تبریز و حومه',
    phone: '۰۴۱-۳۳۳۳۴۴۴۴',
    whatsapp: '۰۹۱۴۱۲۳۴۵۶۷',
    welcome: 'به اپلیکیشن هوشمند پاستور پلاس خوش آمدید',
    subtitle: 'رزرو سریع نوبت دندان، تجهیزات پزشکی، VIP و تسهیلات',
  },

  services: [
    {
      id: 'dental',
      title: 'دندانپزشکی',
      emoji: '🦷',
      description: 'خدمات عمومی، تخصصی و طرح‌های عضویت',
      href: 'pages/dental/index.html',
      image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop',
      color: 'teal',
    },
    {
      id: 'medical',
      title: 'پزشکی',
      emoji: '🩺',
      description: 'ویزیت و مشاوره پزشکی عمومی و تخصصی',
      href: 'pages/medical.html',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop',
      color: 'blue',
    },
    {
      id: 'nursing',
      title: 'پرستاری',
      emoji: '👩‍⚕️',
      description: 'مراقبت‌های پرستاری و خدمات در منزل',
      href: 'pages/nursing.html',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=400&fit=crop',
      color: 'rose',
    },
    {
      id: 'laser',
      title: 'لیزر و زیبایی',
      emoji: '✨',
      description: 'خدمات لیزر و زیبایی پوست و مو',
      href: 'pages/laser.html',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop',
      color: 'purple',
    },
    {
      id: 'shop',
      title: 'فروشگاه تجهیزات',
      emoji: '🛒',
      description: 'تجهیزات پزشکی و دندانپزشکی',
      href: 'pages/shop.html',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop',
      color: 'amber',
    },
  ],

  stats: [
    { value: '۱۵+', label: 'پزشک و متخصص' },
    { value: '۵۰۰۰+', label: 'مراجع راضی' },
    { value: '۵', label: 'بخش تخصصی' },
    { value: '۲۴/۷', label: 'پشتیبانی آنلاین' },
  ],

  dentalSpecialties: [
    { id: 1, name: 'ارتودنسی', emoji: '😁', description: 'اصلاح ناهنجاری‌های دندانی و فکی' },
    { id: 2, name: 'ایمپلنت', emoji: '🦷', description: 'جایگزینی دندان‌های از دست رفته' },
    { id: 3, name: 'زیبایی دندان', emoji: '✨', description: 'لمینت، بلیچینگ و طراحی لبخند' },
    { id: 4, name: 'جراحی فک', emoji: '🔬', description: 'درمان‌های جراحی فک و صورت' },
    { id: 5, name: 'دندانپزشکی کودکان', emoji: '👶', description: 'مراقبت تخصصی از دندان کودکان' },
    { id: 6, name: 'درمان ریشه', emoji: '💉', description: 'عصب‌کشی و حفظ دندان طبیعی' },
  ],

  educationCourses: [
    {
      title: 'دوره مدیریت مطب دندانپزشکی',
      duration: '۴۰ ساعت',
      level: 'پیشرفته',
      description: 'آموزش جامع مدیریت مطب، پذیرش بیمار و سیستم‌های نوبت‌دهی',
    },
    {
      title: 'کارگاه ایمپلنت دیجیتال',
      duration: '۲۴ ساعت',
      level: 'تخصصی',
      description: 'آموزش عملی ایمپلنت با تکنولوژی دیجیتال و اسکن سه‌بعدی',
    },
    {
      title: 'گواهینامه CPR و کمک‌های اولیه',
      duration: '۱۶ ساعت',
      level: 'پایه',
      description: 'آموزش احیای قلبی ریوی و کمک‌های اولیه برای کادر درمان',
    },
  ],

  dentists: [
    {
      id: 1,
      name: 'دکتر علی رضایی',
      specialty: 'دندانپزشکی عمومی',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop',
      days: ['شنبه', 'دوشنبه', 'چهارشنبه'],
      hours: '۹ تا ۱۷',
      status: 'available',
      schedule: {
        شنبه: { visitHours: buildVisitHours(9, 17), treatmentSlots: buildTreatmentSlots(9, 17, [10, 14]) },
        دوشنبه: { visitHours: buildVisitHours(9, 17), treatmentSlots: buildTreatmentSlots(9, 17, [11, 15]) },
        چهارشنبه: { visitHours: buildVisitHours(9, 17), treatmentSlots: buildTreatmentSlots(9, 17, [9, 16]) },
      },
    },
    {
      id: 2,
      name: 'دکتر مریم احمدی',
      specialty: 'ارتودنسی',
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop',
      days: ['یکشنبه', 'سه‌شنبه', 'پنجشنبه'],
      hours: '۱۰ تا ۱۸',
      status: 'available',
      schedule: {
        یکشنبه: { visitHours: buildVisitHours(10, 18), treatmentSlots: buildTreatmentSlots(10, 18, [12]) },
        'سه‌شنبه': { visitHours: buildVisitHours(10, 18), treatmentSlots: buildTreatmentSlots(10, 18, [14, 16]) },
        پنجشنبه: { visitHours: buildVisitHours(10, 18), treatmentSlots: buildTreatmentSlots(10, 18, [10, 17]) },
      },
    },
    {
      id: 3,
      name: 'دکتر حسین محمدی',
      specialty: 'جراحی فک و صورت',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop',
      days: ['شنبه', 'یکشنبه', 'سه‌شنبه'],
      hours: '۸ تا ۱۴',
      status: 'busy',
      schedule: {
        شنبه: { visitHours: buildVisitHours(8, 14), treatmentSlots: buildTreatmentSlots(8, 14, [8, 9, 13]) },
        یکشنبه: { visitHours: buildVisitHours(8, 14), treatmentSlots: buildTreatmentSlots(8, 14, [10]) },
        'سه‌شنبه': { visitHours: buildVisitHours(8, 14), treatmentSlots: buildTreatmentSlots(8, 14, [11, 12]) },
      },
    },
    {
      id: 4,
      name: 'دکتر زهرا کریمی',
      specialty: 'دندانپزشکی کودکان',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop',
      days: ['دوشنبه', 'چهارشنبه'],
      hours: '۱۴ تا ۲۰',
      status: 'available',
      schedule: {
        دوشنبه: { visitHours: buildVisitHours(14, 20), treatmentSlots: buildTreatmentSlots(14, 20, [15]) },
        چهارشنبه: { visitHours: buildVisitHours(14, 20), treatmentSlots: buildTreatmentSlots(14, 20, [14, 18]) },
      },
    },
  ],

  physicians: [
    { id: 1, name: 'دکتر سعید نوری', specialty: 'پزشک عمومی', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop', days: ['شنبه', 'سه‌شنبه'], status: 'available' },
    { id: 2, name: 'دکتر فاطمه موسوی', specialty: 'قلب و عروق', image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop', days: ['یکشنبه', 'چهارشنبه'], status: 'available' },
    { id: 3, name: 'دکتر رضا جعفری', specialty: 'اطفال', image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop', days: ['دوشنبه', 'پنجشنبه'], status: 'available' },
  ],

  nursingServices: [
    { title: 'تزریقات و سرم‌تراپی', emoji: '💉', price: 'از ۱۵۰,۰۰۰ تومان' },
    { title: 'مراقبت از سالمند', emoji: '👴', price: 'از ۳۰۰,۰۰۰ تومان' },
    { title: 'پانسمان و زخم', emoji: '🩹', price: 'از ۱۰۰,۰۰۰ تومان' },
    { title: 'آموزش خانواده', emoji: '📋', price: 'از ۲۰۰,۰۰۰ تومان' },
  ],

  laserServices: [
    { title: 'لیزر موهای زائد', emoji: '✨', price: 'از ۲۵۰,۰۰۰ تومان' },
    { title: 'جوانسازی پوست', emoji: '🌟', price: 'از ۵۰۰,۰۰۰ تومان' },
    { title: 'رفع لک و تیرگی', emoji: '💫', price: 'از ۴۰۰,۰۰۰ تومان' },
    { title: 'لیفت ابرو و پلک', emoji: '👁️', price: 'از ۶۰۰,۰۰۰ تومان' },
  ],

  products: [
    { id: 1, name: 'دستکش لاتکس (بسته ۱۰۰ عددی)', category: 'مصرفی', price: '۱۸۰,۰۰۰', priceNum: 180000, stock: 50, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop' },
    { id: 2, name: 'ماسک سه‌لایه پزشکی', category: 'مصرفی', price: '۴۵,۰۰۰', priceNum: 45000, stock: 200, image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&h=300&fit=crop' },
    { id: 3, name: 'آینه دهان دندانپزشکی', category: 'دندانپزشکی', price: '۳۵۰,۰۰۰', priceNum: 350000, stock: 15, image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=300&fit=crop' },
    { id: 4, name: 'فشارسنج دیجیتال', category: 'پزشکی', price: '۱,۲۰۰,۰۰۰', priceNum: 1200000, stock: 8, image: 'https://images.unsplash.com/photo-1559757142-0811a9024fe1?w=400&h=300&fit=crop' },
    { id: 5, name: 'ست سرم‌تراپی', category: 'پرستاری', price: '۲۸۰,۰۰۰', priceNum: 280000, stock: 25, image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=300&fit=crop' },
    { id: 6, name: 'یونیت دندانپزشکی (مینی)', category: 'دندانپزشکی', price: '۴۵,۰۰۰,۰۰۰', priceNum: 45000000, stock: 2, image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=300&fit=crop' },
  ],

  memberships: [
    {
      id: 'regular',
      name: 'عادی',
      price: 'رایگان',
      priceNum: 0,
      features: ['دسترسی به رزرو آنلاین دندان', 'مشاهده محصولات عادی تجهیزات', 'بدون تعهد و هزینه'],
      terms: 'مناسب مراجعین جدید — بدون تخفیف VIP و بدون تسهیلات تجهیزات',
      highlighted: false,
    },
    {
      id: 'vip',
      name: 'VIP',
      price: '۱,۵۰۰,۰۰۰',
      priceNum: 1500000,
      features: ['اولویت رزرو دندانپزشکی', '۲٪ تخفیف محصولات تجهیزات', 'امکان درخواست تسهیلات تجهیزات پزشکی', 'نمایش شرایط و خدمات VIP قبل از پرداخت'],
      terms: 'پرداخت هزینه VIP برای فعال‌سازی مزایا — تخفیف محصول و تسهیلات پس از تأیید نهایی',
      highlighted: true,
    },
  ],

  shopCustomerTypes: [
    {
      id: 'regular',
      title: 'مشتری عادی',
      emoji: '🧾',
      description: 'مشاهده و خرید محصولات تجهیزات بدون هزینه عضویت',
      benefits: ['دسترسی به محصولات عادی', 'ثبت سفارش نمایشی', 'بدون تخفیف VIP'],
    },
    {
      id: 'vip',
      title: 'مشتری VIP',
      emoji: '💎',
      description: 'پرداخت عضویت VIP و دریافت ۲٪ تخفیف + تسهیلات تجهیزات',
      benefits: ['۲٪ تخفیف همه محصولات تجهیزات', 'امکان درخواست تسهیلات خرید', 'اولویت پیگیری سفارش'],
    },
  ],

  shopVip: {
    planName: 'VIP تجهیزات پاستور پلاس',
    price: '۱,۵۰۰,۰۰۰',
    priceNum: 1500000,
    discountPercent: 2,
    facilityTitle: 'تسهیلات تجهیزات پزشکی برای مشتریان VIP',
    facilityTerms: [
      'بررسی درخواست تسهیلات بر اساس مبلغ خرید و سابقه مشتری',
      'امکان پرداخت مرحله‌ای برای تجهیزات منتخب',
      'اولویت تماس کارشناس فروش پس از ثبت درخواست',
      'فعال شدن ۲٪ تخفیف روی محصولات پس از پرداخت VIP',
    ],
  },

  visitors: [
    { id: 1, name: 'ویزیتور شمال تبریز', code: 'PLUS100', commissionRate: 5, phone: '۰۹۱۴۰۰۰۰۰۰۱', status: 'active' },
    { id: 2, name: 'ویزیتور مرکز شهر', code: 'PLUS200', commissionRate: 7, phone: '۰۹۱۴۰۰۰۰۰۰۲', status: 'active' },
    { id: 3, name: 'ویزیتور تجهیزات', code: 'EQUIPVIP', commissionRate: 10, phone: '۰۹۱۴۰۰۰۰۰۰۳', status: 'active' },
  ],

  consultationTypes: [
    { id: 'text', label: 'مشاوره متنی', emoji: '💬', desc: 'پاسخ متنی ظرف ۲۴ ساعت' },
    { id: 'image', label: 'مشاوره تصویری', emoji: '📷', desc: 'ارسال عکس + بررسی تخصصی' },
    { id: 'video', label: 'مشاوره ویدیویی', emoji: '🎥', desc: 'تماس ویدیویی با پزشک' },
  ],

  consultationCategories: [
    { id: 'dental', label: 'دندانپزشکی', estimate: '۳۵۰,۰۰۰ — ۲,۰۰۰,۰۰۰ تومان', service: 'ویزیت یا درمان دندان' },
    { id: 'medical', label: 'پزشکی', estimate: '۲۵۰,۰۰۰ — ۸۰۰,۰۰۰ تومان', service: 'ویزیت پزشک عمومی' },
    { id: 'laser', label: 'لیزر و زیبایی', estimate: '۴۰۰,۰۰۰ — ۳,۰۰۰,۰۰۰ تومان', service: 'جلسه لیزر یا زیبایی' },
    { id: 'nursing', label: 'پرستاری', estimate: '۱۵۰,۰۰۰ — ۵۰۰,۰۰۰ تومان', service: 'خدمات پرستاری' },
  ],

  galleryItems: [
    {
      id: 1,
      category: 'dental',
      title: 'لمینت دندان',
      before: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=300&fit=crop',
      after: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=300&fit=crop',
    },
    {
      id: 2,
      category: 'dental',
      title: 'ارتودنسی',
      before: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&h=300&fit=crop',
      after: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=300&fit=crop',
    },
    {
      id: 3,
      category: 'laser',
      title: 'لیزر موهای زائد',
      before: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop',
      after: 'https://images.unsplash.com/photo-1512290883901-0f705dc0ddb0?w=400&h=300&fit=crop',
    },
    {
      id: 4,
      category: 'beauty',
      title: 'جوانسازی پوست',
      before: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop',
      after: 'https://images.unsplash.com/photo-1515377901643-0a4e3f4f4f4f?w=400&h=300&fit=crop&sat=-50',
    },
    {
      id: 5,
      category: 'dental',
      title: 'بلیچینگ دندان',
      before: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&h=300&fit=crop&sat=-30',
      after: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=300&fit=crop',
    },
    {
      id: 6,
      category: 'beauty',
      title: 'رفع لک پوست',
      before: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop&brightness=0.8',
      after: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop',
    },
  ],

  galleryCategories: [
    { id: 'all', label: 'همه' },
    { id: 'dental', label: 'دندانپزشکی' },
    { id: 'laser', label: 'لیزر' },
    { id: 'beauty', label: 'زیبایی' },
  ],

  clubTiers: [
    { minPoints: 0, name: 'تازه‌وارد', emoji: '🌱', discount: 0 },
    { minPoints: 100, name: 'برنزی', emoji: '🥉', discount: 5 },
    { minPoints: 300, name: 'نقره‌ای', emoji: '🥈', discount: 10 },
    { minPoints: 600, name: 'طلایی', emoji: '🥇', discount: 15 },
    { minPoints: 1000, name: 'VIP', emoji: '💎', discount: 20 },
  ],

  clubRewards: [
    { id: 1, title: 'ویزیت رایگان', points: 200, emoji: '🩺' },
    { id: 2, title: 'تخفیف ۱۰٪ درمان', points: 150, emoji: '🦷' },
    { id: 3, title: 'مشاوره آنلاین رایگان', points: 80, emoji: '💬' },
    { id: 4, title: 'محصول هدیه فروشگاه', points: 120, emoji: '🎁' },
  ],

  reminderOptions: [
    { id: '24h', label: '۲۴ ساعت قبل', hours: 24 },
    { id: '2h', label: '۲ ساعت قبل', hours: 2 },
    { id: '1d', label: 'یک روز قبل (صبح)', hours: 12 },
  ],
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PASTEUR_DATA;
}
