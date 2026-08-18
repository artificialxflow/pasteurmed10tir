/**
 * داده‌های نمونه — پاستور پلاس
 */

export type DoctorStatus = 'available' | 'busy' | 'inactive';
export type VisitorStatus = 'active' | 'inactive';

export interface Institute {
  nameFa: string;
  nameEn: string;
  shortNameFa: string;
  shortNameEn: string;
  address: string;
  /** Google Maps place / directions URL */
  mapUrl: string;
  /** Embeddable Google Maps URL for iframe */
  mapEmbedUrl: string;
  latitude: number;
  longitude: number;
  serviceArea: string;
  phone: string;
  phoneDigits: string;
  phoneAlt: string;
  phoneAltDigits: string;
  whatsapp: string;
  whatsappDigits: string;
  contactHours: string;
  welcome: string;
  subtitle: string;
}

export interface Service {
  id: string;
  title: string;
  emoji: string;
  description: string;
  href: string;
  image: string;
  color: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface Specialty {
  id: number | string;
  name: string;
  emoji: string;
  description: string;
}

export interface EducationCourse {
  title: string;
  duration: string;
  level: string;
  description: string;
}

export interface TreatmentSlot {
  start: number;
  end: number;
  label: string;
  booked: boolean;
}

export interface DaySchedule {
  visitHours: number[];
  treatmentSlots: TreatmentSlot[];
}

export interface Dentist {
  id: number;
  name: string;
  specialty: string;
  image: string;
  days: string[];
  hours: string;
  status: DoctorStatus;
  schedule: Record<string, DaySchedule>;
}

export interface Physician {
  id: number;
  name: string;
  specialty: string;
  specialtyId?: string;
  image: string;
  days: string[];
  status: DoctorStatus;
}

export interface NursingItem {
  id: string;
  title: string;
  priceNum: number;
  price?: string;
  unit?: string;
  active?: boolean;
}

export interface NursingService {
  id: string;
  title: string;
  emoji: string;
  price: string;
  description: string;
  image?: string;
  items: NursingItem[];
  active?: boolean;
}

export interface LaserService {
  id: string;
  title: string;
  emoji: string;
  price: string;
  priceNum?: number;
  description?: string;
  active?: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  category: string;
  categoryId?: number | null;
  categorySlug?: string | null;
  price: string;
  priceNum: number;
  stock: number;
  image: string;
  images?: string[];
  active?: boolean;
  sortOrder?: number;
}

export interface Membership {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  loanTermLabel: string;
  loanLimit: number;
  downPaymentPercent: number;
  features: string[];
  terms: string;
  highlighted: boolean;
}

export interface MembershipPricing {
  regularPerPerson: number;
  regularTwoYearPerPerson: number;
  vipPerPerson: number;
  vipTwoYearPerPerson: number;
  twoYearDiscountPercent: number;
}

export interface MembershipDurationOption {
  id: string;
  title: string;
  years: number;
  discountPercent: number;
}

export interface MembershipCoveragePlan {
  id: string;
  title: string;
  duration: string;
  regularPerPerson: number;
  vipPerPerson: number;
  regularValidity: string;
  vipValidity: string;
  discountPercent: number;
}

export interface ShopCustomerType {
  id: string;
  title: string;
  emoji: string;
  description: string;
  benefits: string[];
}

export interface ShopVip {
  planName: string;
  price: string;
  priceNum: number;
  discountPercent: number;
  facilityTitle: string;
  facilityTerms: string[];
}

export interface Visitor {
  id: number;
  name: string;
  code: string;
  commissionRate: number;
  phone: string;
  status: VisitorStatus;
}

export interface ConsultationType {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  priceNum?: number;
  price?: string;
}

export interface ConsultationCategory {
  id: string;
  label: string;
  estimate: string;
  estimateMin?: number;
  service: string;
}

export type SpecialtyTariffs = Record<string, Record<string, number>>;

export interface PasteurSettings {
  dentalReservationFee: number;
}

export interface GalleryItem {
  id: number;
  category: string;
  title: string;
  before: string;
  after: string;
}

export interface GalleryCategory {
  id: string;
  label: string;
}

export interface ClubTier {
  minPoints: number;
  name: string;
  emoji: string;
  discount: number;
}

export interface ClubReward {
  id: number;
  title: string;
  points: number;
  emoji: string;
}

export interface ClubMission {
  title: string;
  reward: string;
}

export interface ReminderOption {
  id: string;
  label: string;
  hours: number;
}

export interface PasteurData {
  institute: Institute;
  services: Service[];
  stats: Stat[];
  dentalSpecialties: Specialty[];
  medicalSpecialties: Specialty[];
  educationCourses: EducationCourse[];
  dentists: Dentist[];
  physicians: Physician[];
  nursingServices: NursingService[];
  laserServices: LaserService[];
  products: Product[];
  memberships: Membership[];
  membershipPricing: MembershipPricing;
  membershipDurationOptions: MembershipDurationOption[];
  membershipCommonServices: string[];
  membershipCoveragePlans: MembershipCoveragePlan[];
  shopCustomerTypes: ShopCustomerType[];
  shopVip: ShopVip;
  visitors: Visitor[];
  consultationTypes: ConsultationType[];
  consultationCategories: ConsultationCategory[];
  specialtyTariffs: SpecialtyTariffs;
  settings: PasteurSettings;
  galleryItems: GalleryItem[];
  galleryCategories: GalleryCategory[];
  clubTiers: ClubTier[];
  clubRewards: ClubReward[];
  clubMissions: ClubMission[];
  clubRules: string[];
  memberOnlyOffers: string[];
  reminderOptions: ReminderOption[];
}

export function buildTreatmentSlots(
  startHour: number,
  endHour: number,
  bookedStarts: number[] = [],
): TreatmentSlot[] {
  const slots: TreatmentSlot[] = [];
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

export function buildVisitHours(startHour: number, endHour: number): number[] {
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);
  return hours;
}

export const PASTEUR_DATA = {
  institute: {
    nameFa: 'پاستور پلاس',
    nameEn: 'Pasteur Plus',
    shortNameFa: 'پاستور پلاس',
    shortNameEn: 'Pasteur Plus',
    address: 'تبریز، تقاطع خیابان قطران، خیام اول، خیابان زبردست، درمانگاه شبانه‌روزی پاستور',
    latitude: 38.066516,
    longitude: 46.269864,
    mapUrl:
      "https://www.google.com/maps/place/38%C2%B003'59.5%22N+46%C2%B016'11.5%22E/@38.066516,46.269864,16z/data=!4m4!3m3!8m2!3d38.066516!4d46.269864",
    mapEmbedUrl:
      'https://maps.google.com/maps?q=38.066516,46.269864&z=16&hl=fa&output=embed',
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
      href: '/dental',
      image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop',
      color: 'teal',
    },
    {
      id: 'medical',
      title: 'پزشکی',
      emoji: '🩺',
      description: 'مشاوره و ویزیت آنلاین پزشکی',
      href: '/medical',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop',
      color: 'blue',
    },
    {
      id: 'nursing',
      title: 'پرستاری',
      emoji: '👩‍⚕️',
      description: 'خدمات پرستاری و اجاره تجهیزات پزشکی',
      href: '/nursing',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=400&fit=crop',
      color: 'rose',
    },
    {
      id: 'laser',
      title: 'لیزر و زیبایی',
      emoji: '✨',
      description: 'خدمات لیزر و زیبایی پوست و مو',
      href: '/laser',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop',
      color: 'purple',
    },
    {
      id: 'shop',
      title: 'فروشگاه تجهیزات',
      emoji: '🛒',
      description: 'تجهیزات پزشکی و دندانپزشکی',
      href: '/shop',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop',
      color: 'amber',
    },
    {
      id: 'surgery',
      title: 'جراحی',
      emoji: '🔪',
      description: 'مشاوره پیش از عمل و بررسی نیاز به جراحی',
      href: '/medical/specialty',
      image: 'https://images.unsplash.com/photo-1551190822-a933c784bdaf?w=600&h=400&fit=crop',
      color: 'blue',
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

  medicalSpecialties: [
    { id: 'urology', name: 'اورولوژی', emoji: '🩺', description: 'مشاوره و ویزیت تخصصی بیماری‌های کلیه، مثانه و دستگاه ادراری' },
    { id: 'infectious', name: 'عفونی', emoji: '🦠', description: 'بررسی و درمان عفونت‌ها و بیماری‌های واگیردار' },
    { id: 'cardiology', name: 'قلب و عروق', emoji: '❤️', description: 'مشاوره تخصصی بیماری‌های قلبی و عروقی' },
    { id: 'pediatrics', name: 'اطفال', emoji: '👶', description: 'مشاوره و ویزیت تخصصی کودکان و نوزادان' },
    { id: 'internal', name: 'داخلی', emoji: '🫁', description: 'بررسی بیماری‌های داخلی و مشکلات عمومی بدن' },
    { id: 'surgery', name: 'جراحی', emoji: '🔪', description: 'مشاوره پیش از عمل و بررسی نیاز به جراحی' },
    { id: 'orthopedics', name: 'ارتوپدی', emoji: '🦴', description: 'مشاوره تخصصی استخوان، مفاصل و آسیب‌های ورزشی' },
    { id: 'dermatology', name: 'پوست و مو', emoji: '🧴', description: 'بررسی بیماری‌های پوستی، مو و ناخن' },
    { id: 'neurology', name: 'مغز و اعصاب', emoji: '🧠', description: 'مشاوره تخصصی سردرد، تشنج و اختلالات عصبی' },
    { id: 'psychiatry', name: 'روانپزشکی', emoji: '🧘', description: 'مشاوره تخصصی اضطراب، افسردگی و سلامت روان' },
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
    { id: 1, name: 'دکتر سعید نوری', specialty: 'پزشک عمومی', specialtyId: 'internal', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop', days: ['شنبه', 'سه‌شنبه'], status: 'available' },
    { id: 2, name: 'دکتر فاطمه موسوی', specialty: 'قلب و عروق', specialtyId: 'cardiology', image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop', days: ['یکشنبه', 'چهارشنبه'], status: 'available' },
    { id: 3, name: 'دکتر رضا جعفری', specialty: 'اطفال', specialtyId: 'pediatrics', image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop', days: ['دوشنبه', 'پنجشنبه'], status: 'available' },
    { id: 4, name: 'دکتر مهدی اکبری', specialty: 'اورولوژی', specialtyId: 'urology', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop', days: ['شنبه', 'دوشنبه'], status: 'available' },
    { id: 5, name: 'دکتر ساناز حیدری', specialty: 'عفونی', specialtyId: 'infectious', image: 'https://images.unsplash.com/photo-1582750433449-648ed127fbfe?w=200&h=200&fit=crop', days: ['یکشنبه', 'سه‌شنبه'], status: 'available' },
    { id: 6, name: 'دکتر پرویز صادقی', specialty: 'جراحی', specialtyId: 'surgery', image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop', days: ['چهارشنبه', 'پنجشنبه'], status: 'available' },
    { id: 7, name: 'دکتر نرگس طاهری', specialty: 'پوست و مو', specialtyId: 'dermatology', image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop', days: ['شنبه', 'چهارشنبه'], status: 'available' },
    { id: 8, name: 'دکتر امیر کاظمی', specialty: 'ارتوپدی', specialtyId: 'orthopedics', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop', days: ['دوشنبه', 'پنجشنبه'], status: 'available' },
    { id: 9, name: 'دکتر لیلا باقری', specialty: 'مغز و اعصاب', specialtyId: 'neurology', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop', days: ['یکشنبه', 'پنجشنبه'], status: 'available' },
    { id: 10, name: 'دکتر حمید فرهادی', specialty: 'روانپزشکی', specialtyId: 'psychiatry', image: 'https://images.unsplash.com/photo-1582750433449-648ed127fbfe?w=200&h=200&fit=crop', days: ['سه‌شنبه', 'چهارشنبه'], status: 'available' },
  ],

  nursingServices: [
    {
      id: 'nursing-icu',
      title: 'مراقبت از بیماران ICU و CCU در منزل',
      emoji: '🫀',
      price: 'تماس برای هماهنگی',
      description: 'اعزام پرستار مجرب برای مراقبت‌های ویژه بیماران ICU و CCU در منزل، با هماهنگی پزشک معالج.',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&h=320&fit=crop',
      active: true,
      items: [
        {
          id: 'icu-shift-8',
          title: 'شیفت ۸ ساعته',
          priceNum: 850000,
          price: '۸۵۰,۰۰۰ تومان',
          unit: 'هر شیفت',
          active: true,
        },
        {
          id: 'icu-shift-12',
          title: 'شیفت ۱۲ ساعته',
          priceNum: 1200000,
          price: '۱,۲۰۰,۰۰۰ تومان',
          unit: 'هر شیفت',
          active: true,
        },
      ],
    },
    {
      id: 'nursing-injection',
      title: 'تزریقات و سایر امور پرستاری در منزل',
      emoji: '💉',
      price: 'تماس برای هماهنگی',
      description: 'اعزام نیروی پرستاری برای تزریقات، سرم‌تراپی و امور پایه مراقبتی در منزل.',
      active: true,
      items: [
        {
          id: 'injection-iv',
          title: 'تزریق وریدی',
          priceNum: 180000,
          price: '۱۸۰,۰۰۰ تومان',
          unit: 'هر بار',
          active: true,
        },
        {
          id: 'injection-serum',
          title: 'سرم‌تراپی',
          priceNum: 350000,
          price: '۳۵۰,۰۰۰ تومان',
          unit: 'هر جلسه',
          active: true,
        },
      ],
    },
    {
      id: 'nursing-wound',
      title: 'زخم و امور پانسمان در منزل',
      emoji: '🩹',
      price: 'تماس برای هماهنگی',
      description: 'رسیدگی به زخم، تعویض پانسمان و پیگیری مراقبت‌های مورد نیاز بیمار در منزل.',
      active: true,
      items: [
        {
          id: 'wound-dressing',
          title: 'تعویض پانسمان',
          priceNum: 220000,
          price: '۲۲۰,۰۰۰ تومان',
          unit: 'هر بار',
          active: true,
        },
      ],
    },
    {
      id: 'nursing-equipment',
      title: 'اجاره تجهیزات پزشکی',
      emoji: '🏥',
      price: 'استعلام قیمت',
      description: 'هماهنگی اجاره تجهیزات پزشکی مورد نیاز بیمار با پیگیری کارشناسان پاستور پلاس.',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&h=320&fit=crop',
      active: true,
      items: [
        {
          id: 'equip-oxygen',
          title: 'اکسیژن‌ساز قابل حمل',
          priceNum: 450000,
          price: '۴۵۰,۰۰۰ تومان',
          unit: 'ماهانه',
          active: true,
        },
        {
          id: 'equip-bed',
          title: 'تخت بیمارستانی',
          priceNum: 380000,
          price: '۳۸۰,۰۰۰ تومان',
          unit: 'ماهانه',
          active: true,
        },
      ],
    },
  ],

  laserServices: [
    {
      id: 'laser-hair',
      title: 'لیزر موهای زائد',
      emoji: '✨',
      price: 'از ۲۵۰,۰۰۰ تومان',
      priceNum: 250000,
      description: 'لیزر موهای زائد با دستگاه‌های پیشرفته برای نواحی مختلف بدن',
      active: true,
    },
    {
      id: 'laser-rejuvenation',
      title: 'جوانسازی پوست',
      emoji: '🌟',
      price: 'از ۵۰۰,۰۰۰ تومان',
      priceNum: 500000,
      description: 'جوانسازی و بازسازی پوست با تکنولوژی لیزر',
      active: true,
    },
    {
      id: 'laser-spots',
      title: 'رفع لک و تیرگی',
      emoji: '💫',
      price: 'از ۴۰۰,۰۰۰ تومان',
      priceNum: 400000,
      description: 'درمان لک، تیرگی و ملasma با لیزر',
      active: true,
    },
    {
      id: 'laser-brow',
      title: 'لیفت ابرو و پلک',
      emoji: '👁️',
      price: 'از ۶۰۰,۰۰۰ تومان',
      priceNum: 600000,
      description: 'لیفت و جوانسازی ابرو و پلک',
      active: true,
    },
    {
      id: 'laser-abdomen',
      title: 'لیزر شکم',
      emoji: '🔥',
      price: 'از ۳۵۰,۰۰۰ تومان',
      priceNum: 350000,
      description: 'لیزر موهای زائد ناحیه شکم',
      active: true,
    },
    {
      id: 'laser-chest',
      title: 'لیزر سینه',
      emoji: '💪',
      price: 'از ۳۵۰,۰۰۰ تومان',
      priceNum: 350000,
      description: 'لیزر موهای زائد ناحیه سینه',
      active: true,
    },
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
      downPaymentPercent: 30,
      features: [
        'پیش‌پرداخت ۳۰٪ برای فعال‌سازی وام درمانی',
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
      downPaymentPercent: 20,
      features: [
        'پیش‌پرداخت ۲۰٪ برای فعال‌سازی وام درمانی',
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
    { id: 'text', label: 'مشاوره متنی', emoji: '💬', desc: 'پاسخ متنی در بستر اپلیکیشن', priceNum: 120000, price: '۱۲۰,۰۰۰ تومان' },
    { id: 'image', label: 'مشاوره تصویری', emoji: '📷', desc: 'ارسال عکس داخل اپلیکیشن برای بررسی تخصصی', priceNum: 150000, price: '۱۵۰,۰۰۰ تومان' },
    { id: 'video', label: 'ویزیت تصویری / تلفنی', emoji: '🎥', desc: 'اولویت با بستر اپلیکیشن؛ در صورت نیاز از روبیکا هماهنگ می‌شود', priceNum: 350000, price: '۳۵۰,۰۰۰ تومان' },
    { id: 'phone', label: 'ویزیت تلفنی', emoji: '☎️', desc: 'هماهنگی تماس تلفنی با پزشک یا کارشناس مربوطه', priceNum: 250000, price: '۲۵۰,۰۰۰ تومان' },
  ],

  consultationCategories: [
    { id: 'dental', label: 'دندانپزشکی', estimate: '۳۵۰,۰۰۰ — ۲,۰۰۰,۰۰۰ تومان', estimateMin: 350000, service: 'ویزیت یا درمان دندان' },
    { id: 'medical', label: 'پزشکی عمومی', estimate: '۲۵۰,۰۰۰ — ۸۰۰,۰۰۰ تومان', estimateMin: 250000, service: 'مشاوره یا ویزیت آنلاین پزشکی عمومی' },
    { id: 'medical-specialty', label: 'پزشکی تخصصی', estimate: 'از ۲۵۰,۰۰۰ تومان', estimateMin: 250000, service: 'مشاوره یا ویزیت تخصصی پزشکی' },
    { id: 'medical-home', label: 'ویزیت پزشک در منزل', estimate: 'از ۵۰۰,۰۰۰ تومان', estimateMin: 500000, service: 'اعزام پزشک یا هماهنگی ویزیت در منزل' },
    { id: 'dental-home', label: 'اعزام دندانپزشک به منزل', estimate: 'از ۴۰۰,۰۰۰ تومان', estimateMin: 400000, service: 'اعزام دندانپزشک به منزل' },
    { id: 'dental-corporate', label: 'اعزام دندانپزشک به مجموعه طرف قرارداد', estimate: 'از ۶۰۰,۰۰۰ تومان', estimateMin: 600000, service: 'اعزام دندانپزشک به مجموعه‌های طرف قرارداد' },
    { id: 'laser', label: 'لیزر و زیبایی', estimate: '۴۰۰,۰۰۰ — ۳,۰۰۰,۰۰۰ تومان', estimateMin: 400000, service: 'جلسه لیزر یا زیبایی' },
    { id: 'nursing', label: 'پرستاری', estimate: '۱۵۰,۰۰۰ — ۵۰۰,۰۰۰ تومان', estimateMin: 150000, service: 'خدمات پرستاری' },
  ],

  specialtyTariffs: {
    urology: { text: 140000, image: 170000, video: 380000, phone: 290000 },
    infectious: { text: 130000, image: 160000, video: 340000, phone: 270000 },
    cardiology: { text: 160000, image: 190000, video: 420000, phone: 320000 },
    pediatrics: { text: 125000, image: 155000, video: 330000, phone: 260000 },
    internal: { text: 120000, image: 150000, video: 350000, phone: 250000 },
    surgery: { text: 180000, image: 210000, video: 450000, phone: 350000 },
    orthopedics: { text: 150000, image: 180000, video: 400000, phone: 310000 },
    dermatology: { text: 140000, image: 170000, video: 370000, phone: 285000 },
    neurology: { text: 170000, image: 200000, video: 430000, phone: 330000 },
    psychiatry: { text: 155000, image: 185000, video: 390000, phone: 300000 },
  },

  settings: {
    dentalReservationFee: 200000,
  },

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
} as const;
