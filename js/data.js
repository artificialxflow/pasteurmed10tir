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
    address: 'تبریز، تقاطع خیابان قطران، خیام اول، خیابان زبردست، درمانگاه شبانه‌روزی پاستور',
    serviceArea: 'تبریز و حومه',
    phone: '۰۴۱۳۴۴۴۹۳۱۳',
    phoneDigits: '04134449313',
    phoneAlt: '۰۴۱۳۴۴۱۴۲۳۵',
    phoneAltDigits: '04134414235',
    whatsapp: '۰۹۳۵۴۳۳۴۴۱۲',
    whatsappDigits: '989354334412',
    contactHours: 'پاسخگویی تلفنی و واتساپ در ساعات کاری درمانگاه',
    welcome: 'به سامانه خدمات مرکز پاستور خوش آمدید',
    subtitle: 'دندانپزشکی، پزشکی، پرستاری، مشاوره و تجهیزات پزشکی',
  },

  services: [
    {
      id: 'dental',
      title: 'دندانپزشکی',
      emoji: '🦷',
      description: 'رزرو دندانپزشک، خدمات تخصصی و آموزش‌های بیمار',
      href: 'pages/dental/index.html',
      image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop',
      color: 'teal',
    },
    {
      id: 'medical',
      title: 'پزشکی',
      emoji: '🩺',
      description: 'مشاوره و ویزیت آنلاین پزشکی',
      href: 'pages/medical.html',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop',
      color: 'blue',
    },
    {
      id: 'nursing',
      title: 'پرستاری',
      emoji: '👩‍⚕️',
      description: 'خدمات پرستاری و اجاره تجهیزات پزشکی',
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
      title: 'مراقبت‌های بعد از ایمپلنت',
      duration: 'ویدیوی آموزشی',
      level: 'ایمپلنت',
      description: 'نکات مهم تغذیه، بهداشت دهان، مصرف دارو و زمان مراجعه بعد از ایمپلنت.',
    },
    {
      title: 'آموزش بعد از جرم‌گیری',
      duration: 'ویدیوی آموزشی',
      level: 'جرم‌گیری',
      description: 'راهنمای حساسیت دندان، تغذیه مناسب و روش صحیح مسواک و نخ دندان بعد از جرم‌گیری.',
    },
    {
      title: 'مراقبت بعد از عصب‌کشی و درمان ریشه',
      duration: 'ویدیوی آموزشی',
      level: 'درمان ریشه',
      description: 'توضیح درد طبیعی بعد از درمان، مراقبت از پانسمان موقت و زمان مناسب برای ترمیم نهایی.',
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
    {
      title: 'تزریقات و سایر امور پرستاری در منزل',
      emoji: '💉',
      price: 'تماس برای هماهنگی',
      description: 'اعزام نیروی پرستاری برای تزریقات، سرم‌تراپی و امور پایه مراقبتی در منزل.',
    },
    {
      title: 'زخم و امور پانسمان در منزل',
      emoji: '🩹',
      price: 'تماس برای هماهنگی',
      description: 'رسیدگی به زخم، تعویض پانسمان و پیگیری مراقبت‌های مورد نیاز بیمار در منزل.',
    },
    {
      title: 'اجاره تجهیزات پزشکی',
      emoji: '🏥',
      price: 'استعلام قیمت',
      description: 'هماهنگی اجاره تجهیزات پزشکی مورد نیاز بیمار با پیگیری کارشناسان پاستور پلاس.',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&h=320&fit=crop',
    },
  ],

  laserServices: [
    { title: 'لیزر موهای زائد', emoji: '✨', price: 'از ۲۵۰,۰۰۰ تومان' },
    { title: 'جوانسازی پوست', emoji: '🌟', price: 'از ۵۰۰,۰۰۰ تومان' },
    { title: 'رفع لک و تیرگی', emoji: '💫', price: 'از ۴۰۰,۰۰۰ تومان' },
    { title: 'لیفت ابرو و پلک', emoji: '👁️', price: 'از ۶۰۰,۰۰۰ تومان' },
  ],

  products: [
    { id: 1, name: 'آینه دهان دندانپزشکی', category: 'دندانپزشکی', price: '۳۵۰,۰۰۰', priceNum: 350000, stock: 15, image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=300&fit=crop' },
    { id: 2, name: 'یونیت دندانپزشکی (مینی)', category: 'دندانپزشکی', price: '۴۵,۰۰۰,۰۰۰', priceNum: 45000000, stock: 2, image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=300&fit=crop' },
    { id: 3, name: 'اتوکلاو دندانپزشکی رومیزی', category: 'دندانپزشکی', price: '۳۸,۰۰۰,۰۰۰', priceNum: 38000000, stock: 3, image: 'https://images.unsplash.com/photo-1588776814546-daab30f310ce?w=400&h=300&fit=crop' },
    { id: 4, name: 'فشارسنج دیجیتال', category: 'پزشکی', price: '۱,۲۰۰,۰۰۰', priceNum: 1200000, stock: 8, image: 'https://images.unsplash.com/photo-1559757142-0811a9024fe1?w=400&h=300&fit=crop' },
    { id: 5, name: 'اکسیژن‌ساز خانگی', category: 'پزشکی', price: '۲۶,۰۰۰,۰۰۰', priceNum: 26000000, stock: 4, image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=400&h=300&fit=crop' },
    { id: 6, name: 'تخت معاینه پزشکی', category: 'پزشکی', price: '۹,۵۰۰,۰۰۰', priceNum: 9500000, stock: 5, image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop' },
  ],

  memberships: [
    {
      id: 'regular',
      name: 'عادی',
      price: '۱,۰۰۰,۰۰۰',
      priceNum: 1000000,
      loanTermLabel: '۱۵ ماهه',
      loanLimit: 150000000,
      features: [
        'وام درمانی ۱۲٪ تا سقف ۱۵۰ میلیون تومان — بازپرداخت ۱۵ ماهه',
        'پرداخت بخشی از هزینه‌های درمان تا سقف ۵٪',
        'جرم‌گیری سالانه با تخفیف ۳۰٪ برای هر نفر',
        'شرایط پرداخت ۳ تا ۶ ماهه برای خدمات دندانپزشکی منتخب',
        'تخفیف ویژه رادیولوژی فک و صورت',
      ],
      terms: 'مناسب بیماران عادی با خدمات ضروری دندانپزشکی. مدت ۱۵ ماهه مربوط به بازپرداخت وام درمانی است، نه مدت حق عضویت.',
      highlighted: false,
    },
    {
      id: 'vip',
      name: 'VIP',
      price: '۱,۶۰۰,۰۰۰',
      priceNum: 1600000,
      loanTermLabel: '۲۴ ماهه',
      loanLimit: 300000000,
      features: [
        'وام درمانی ۱۲٪ تا سقف ۳۰۰ میلیون تومان — بازپرداخت ۲۴ ماهه',
        'پرداخت بخشی از هزینه‌های درمان تا سقف ۱۰٪',
        'اسکان رایگان ویژه مشترکین غیربومی',
        'OPG رایگان',
        'جرم‌گیری رایگان در سال برای هر نفر',
        'خدمات ایمپلنت، لمینت سرامیکی و کامپوزیت',
        'شرایط پرداخت ۳ تا ۱۲ ماهه برای ایمپلنت، لمینت و کامپوزیت',
      ],
      terms: 'پرداخت هزینه VIP برای فعال‌سازی مزایای ویژه. مدت ۲۴ ماهه مربوط به بازپرداخت وام درمانی VIP است، نه مدت حق عضویت.',
      highlighted: true,
    },
  ],

  membershipPricing: {
    regularPerPerson: 1000000,
    regularTwoYearPerPerson: 1600000,
    vipPerPerson: 1600000,
    vipTwoYearPerPerson: 2560000,
    twoYearDiscountPercent: 20,
  },

  membershipDurationOptions: [
    { id: 'one-year', title: 'یک‌ساله', years: 1, discountPercent: 0 },
    { id: 'two-year', title: 'دوساله با ۲۰٪ تخفیف', years: 2, discountPercent: 20 },
  ],

  membershipCommonServices: [
    'طرف قرارداد با بیمه‌های تکمیلی و پذیرش به‌صورت آنلاین',
    'پشتیبانی ۲۴ ساعته و رزرو آنلاین',
    'مشاوره و ویزیت رایگان',
    'بدون دوره انتظار و امکان استفاده از خدمات پس از ثبت‌نام',
    'لیست قیمت خدمات دندانپزشکی طبق تعرفه‌های سندیکای مصوب دولت',
    'ارائه خدمات به بیماران فاقد بیمه پایه و تکمیلی',
    'امکان انتخاب عضویت یک‌ساله یا دوساله هنگام پرداخت',
    'حضور متخصصان متعهد و مجرب در خدمات دندانپزشکی',
    'قرعه‌کشی هفتگی و ارائه جوایز به مشترکین تحت درمان',
    'تخفیف فلورایدتراپی تا سقف ۱۰٪',
  ],

  membershipCoveragePlans: [
    {
      id: 'one-year',
      title: 'عضویت یک‌ساله',
      duration: '۱ ساله',
      regularPerPerson: 1000000,
      vipPerPerson: 1600000,
      regularValidity: '۱ ساله',
      vipValidity: '۱ ساله',
      discountPercent: 0,
    },
    {
      id: 'two-year',
      title: 'عضویت دوساله',
      duration: '۲ ساله',
      regularPerPerson: 1600000,
      vipPerPerson: 2560000,
      regularValidity: '۲ ساله',
      vipValidity: '۲ ساله',
      discountPercent: 20,
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
    price: '۳,۰۰۰,۰۰۰',
    priceNum: 3000000,
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
    { id: 'text', label: 'مشاوره متنی', emoji: '💬', desc: 'پاسخ متنی در بستر اپلیکیشن' },
    { id: 'image', label: 'مشاوره تصویری', emoji: '📷', desc: 'ارسال عکس داخل اپلیکیشن برای بررسی تخصصی' },
    { id: 'video', label: 'ویزیت تصویری / تلفنی', emoji: '🎥', desc: 'اولویت با بستر اپلیکیشن؛ در صورت نیاز از روبیکا هماهنگ می‌شود' },
    { id: 'phone', label: 'ویزیت تلفنی', emoji: '☎️', desc: 'هماهنگی تماس تلفنی با پزشک یا کارشناس مربوطه' },
  ],

  consultationCategories: [
    { id: 'dental', label: 'دندانپزشکی', estimate: '۳۵۰,۰۰۰ — ۲,۰۰۰,۰۰۰ تومان', service: 'ویزیت یا درمان دندان' },
    { id: 'medical', label: 'پزشکی عمومی', estimate: '۲۵۰,۰۰۰ — ۸۰۰,۰۰۰ تومان', service: 'مشاوره یا ویزیت آنلاین پزشکی عمومی' },
    { id: 'medical-specialty', label: 'پزشکی تخصصی', estimate: 'پس از بررسی تخصص مشخص می‌شود', service: 'مشاوره یا ویزیت تخصصی پزشکی' },
    { id: 'medical-home', label: 'ویزیت پزشک در منزل', estimate: 'پس از هماهنگی کارشناس اعلام می‌شود', service: 'اعزام پزشک یا هماهنگی ویزیت در منزل' },
    { id: 'dental-home', label: 'اعزام دندانپزشک به منزل', estimate: 'پس از بررسی شرایط بیمار اعلام می‌شود', service: 'اعزام دندانپزشک به منزل' },
    { id: 'dental-corporate', label: 'اعزام دندانپزشک به مجموعه طرف قرارداد', estimate: 'بر اساس تعداد نفرات و محل مجموعه اعلام می‌شود', service: 'اعزام دندانپزشک به مجموعه‌های طرف قرارداد' },
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
    { id: 1, title: '۵٪ تخفیف خدمات لیزر یا دندانپزشکی', points: 500, emoji: '🎟️' },
    { id: 2, title: '۱۰٪ تخفیف خدمات لیزر یا دندانپزشکی', points: 1000, emoji: '🦷' },
    { id: 3, title: '۱۵٪ تخفیف دندانپزشکی یا یک جلسه لیزر رایگان', points: 1500, emoji: '✨' },
    { id: 4, title: '۲۰٪ تخفیف دندانپزشکی، جرم‌گیری رایگان یا ۵۰٪ لیزر', points: 2000, emoji: '💎' },
    { id: 5, title: '۵۰٪ تخفیف دندانپزشکی یا ۵۰٪ خدمات زیبایی', points: 3000, emoji: '🏆' },
  ],

  clubMissions: [
    { title: 'ثبت رزرو یا پرداخت موفق', reward: '۵۰ امتیاز' },
    { title: 'ثبت مشاوره و ویزیت', reward: '۲۰ امتیاز' },
    { title: 'دعوت از دوست با کد معرف', reward: '۱۰۰ امتیاز' },
  ],

  clubRules: [
    'امتیازها بر اساس شماره موبایل کاربر نگهداری می‌شوند.',
    'دریافت پاداش باعث کسر امتیاز همان پاداش از موجودی می‌شود.',
    'استفاده از تخفیف‌ها نیازمند هماهنگی و تایید کارشناس پاستور پلاس است.',
  ],

  memberOnlyOffers: [
    'اولویت هماهنگی نوبت برای اعضای باشگاه',
    'اطلاع‌رسانی تخفیف‌های دوره‌ای دندانپزشکی و لیزر',
    'پیشنهادهای ویژه عضویت عادی و VIP مجموعه‌ها',
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
