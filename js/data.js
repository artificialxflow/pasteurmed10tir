/**
 * داده‌های نمونه — موسسه پزشکی و سلامت پاستور
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
    nameFa: 'موسسه پزشکی و سلامت پاستور',
    nameEn: 'Pasteur Medical & Health Institute',
    shortNameFa: 'موسسه سلامت پاستور',
    shortNameEn: 'Pasteur Health Institute',
    address: 'تبریز، خیابان پاستور جدید، تقاطع شریعتی، مجتمع سلامت پاستور',
    serviceArea: 'پاسه، تبریز و حومه',
    phone: '۰۴۱-۳۳۳۳۴۴۴۴',
    whatsapp: '۰۹۱۴۱۲۳۴۵۶۷',
    welcome: 'به سامانه هوشمند موسسه پاستور خوش آمدید',
    subtitle: 'رزرو سریع نوبت دندانپزشکی و پزشکی',
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
    { id: 1, name: 'دستکش لاتکس (بسته ۱۰۰ عددی)', category: 'مصرفی', price: '۱۸۰,۰۰۰', stock: 50, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop' },
    { id: 2, name: 'ماسک سه‌لایه پزشکی', category: 'مصرفی', price: '۴۵,۰۰۰', stock: 200, image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&h=300&fit=crop' },
    { id: 3, name: 'آینه دهان دندانپزشکی', category: 'دندانپزشکی', price: '۳۵۰,۰۰۰', stock: 15, image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=300&fit=crop' },
    { id: 4, name: 'فشارسنج دیجیتال', category: 'پزشکی', price: '۱,۲۰۰,۰۰۰', stock: 8, image: 'https://images.unsplash.com/photo-1559757142-0811a9024fe1?w=400&h=300&fit=crop' },
    { id: 5, name: 'ست سرم‌تراپی', category: 'پرستاری', price: '۲۸۰,۰۰۰', stock: 25, image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=300&fit=crop' },
    { id: 6, name: 'یونیت دندانپزشکی (مینی)', category: 'دندانپزشکی', price: '۴۵,۰۰۰,۰۰۰', stock: 2, image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=300&fit=crop' },
  ],

  memberships: [
    {
      id: 'regular',
      name: 'عادی',
      price: 'رایگان',
      priceNum: 0,
      features: ['دسترسی به رزرو آنلاین', 'اطلاع‌رسانی پیامکی', 'بدون تعهد'],
      terms: 'بدون هزینه عضویت — مناسب مراجعین جدید',
      highlighted: false,
    },
    {
      id: 'bronze',
      name: 'برنزی',
      price: '۵۰۰,۰۰۰',
      priceNum: 500000,
      features: ['تخفیف ۵٪ خدمات', 'اولویت رزرو عادی', 'مشاوره تلفنی'],
      terms: 'تعهد ۶ ماهه — پرداخت یکجا',
      highlighted: false,
    },
    {
      id: 'silver',
      name: 'نقره‌ای',
      price: '۱,۰۰۰,۰۰۰',
      priceNum: 1000000,
      features: ['تخفیف ۱۰٪ خدمات', 'اولویت رزرو متوسط', '۲ ویزیت رایگان سالانه'],
      terms: 'تعهد ۱ ساله — امکان پرداخت اقساطی',
      highlighted: false,
    },
    {
      id: 'gold',
      name: 'طلایی',
      price: '۲,۰۰۰,۰۰۰',
      priceNum: 2000000,
      features: ['تخفیف ۲۰٪ خدمات', 'اولویت رزرو بالا', '۴ ویزیت رایگان سالانه'],
      terms: 'تعهد ۱ ساله — پرداخت یکجا',
      highlighted: false,
    },
    {
      id: 'vip',
      name: 'VIP',
      price: '۵,۰۰۰,۰۰۰',
      priceNum: 5000000,
      features: ['تخفیف ۳۰٪ خدمات', 'اولویت رزرو فوری', 'پزشک اختصاصی', 'خدمات در منزل'],
      terms: 'تعهد ۲ ساله — پشتیبانی ۲۴ ساعته',
      highlighted: true,
    },
  ],
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PASTEUR_DATA;
}
