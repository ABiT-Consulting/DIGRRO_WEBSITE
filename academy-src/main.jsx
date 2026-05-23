import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import * as THREE from 'three';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronDown,
  CirclePlay,
  Clock3,
  Film,
  Gauge,
  Globe2,
  GraduationCap,
  LogIn,
  Mail,
  Mic2,
  Palette,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles,
  X,
} from 'lucide-react';
import { loadCourses } from './lib/courses.js';
import { initGoogleAnalytics } from './lib/google-analytics.js';

import cinematicPreview from './assets/academy-create-cinematic.mp4';
import reelsPreview from './assets/academy-create-reels.mp4';
import cinematicPoster from './assets/creation-cinematic-video.webp';
import reelsPoster from './assets/creation-reels-short-videos.webp';
import academyLogo from './assets/academy-logo.svg';

gsap.registerPlugin(ScrollTrigger);

const REGISTER_API = './api/register.php';
const LOGIN_API = './api/login.php';
const STUDENT_API = './api/student.php';
const REQUEST_PASSWORD_RESET_API = './api/request-password-reset.php';
const STUDENT_TOKEN_KEY = 'digrro_academy_student_token';

const locale = (() => {
  const requested = new URLSearchParams(window.location.search).get('lang');
  const browserLocales = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ''];
  if (requested === 'ar' || requested === 'en') return requested;
  return browserLocales.some((language) => String(language).toLowerCase().startsWith('ar')) ? 'ar' : 'en';
})();
const isArabic = locale === 'ar';
const responsiveImageModules = import.meta.glob('./assets/responsive/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const creationPreviewWidths = [240, 360, 520];
const trainerPortraitWidths = [240, 480, 768];
const heroCreationImageSizes = '(max-width: 460px) 122px, (max-width: 780px) 132px, 204px';
const showcaseCreationImageSizes = '(max-width: 780px) 56vw, 212px';
const heroTrainerImageSizes = '(max-width: 780px) 88px, 148px';
const trainerImageSizes = '(max-width: 780px) calc(100vw - 3.8rem), 420px';

function responsiveImage(baseName, widths = creationPreviewWidths) {
  const sources = widths.map((width) => {
    const path = `./assets/responsive/${baseName}-${width}w.jpg`;
    const src = responsiveImageModules[path];
    if (!src) throw new Error(`Missing responsive image asset: ${path}`);
    return { src, width };
  });
  return {
    src: sources[sources.length - 1].src,
    srcSet: sources.map(({ src, width }) => `${src} ${width}w`).join(', '),
  };
}

function ResponsiveImage({ image, alt = '', sizes, loading = 'lazy', fetchPriority }) {
  return (
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      {...(fetchPriority ? { fetchPriority } : {})}
    />
  );
}

function PreviewVideo({ src, poster, label, loading = 'lazy', preload = 'metadata' }) {
  const [ready, setReady] = useState(false);

  return (
    <>
      {poster && (
        <img
          className="fx-video-fallback"
          src={poster}
          alt=""
          loading={loading}
          decoding="async"
          aria-hidden="true"
        />
      )}
      <video
        className={`fx-video-element ${ready ? 'is-ready' : ''}`}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        autoPlay
        preload={preload}
        aria-label={label}
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}
        onPlaying={() => setReady(true)}
        onError={() => setReady(false)}
      />
    </>
  );
}

const text = {
  navLogin: ['Log in', 'تسجيل الدخول'],
  navAccount: ['Already have an account?', 'لديك حساب بالفعل؟'],
  languageToggle: ['العربية', 'English'],
  languageAria: ['Switch language to Arabic', 'تغيير اللغة إلى الإنجليزية'],
  heroBadge: ['AI media academy', 'أكاديمية إعلام بالذكاء الاصطناعي'],
  heroTitleA: ['Master AI Content Creation', 'أتقن صناعة المحتوى'],
  heroTitleB: ['& Media Production', 'والإنتاج الإعلامي بالذكاء الاصطناعي'],
  heroLede: [
    'A cinematic 12-hour training experience for campaign visuals, AI video, voiceovers, templates, and production-ready workflows.',
    'تجربة تدريبية سينمائية لمدة 12 ساعة لصناعة صور الحملات، الفيديو بالذكاء الاصطناعي، التعليقات الصوتية، القوالب، وسير العمل الجاهز للإنتاج.',
  ],
  primaryCta: ['Reserve my seat', 'احجز مقعدي'],
  dashboardTitle: ['Live Academy OS', 'نظام الأكاديمية المباشر'],
  dashboardSubtitle: ['Cohort control center', 'مركز إدارة الدفعة'],
  reserveTitle: ['Reserve Your Seat Now', 'احجز مقعدك الآن'],
  reserveCopy: ['Fill in your details to secure your spot.', 'أدخل بياناتك لتأكيد مقعدك.'],
  fullName: ['Full Name', 'الاسم الكامل'],
  email: ['Email Address', 'البريد الإلكتروني'],
  phone: ['Phone Number', 'رقم الهاتف'],
  payTitle: ['Secure Stripe checkout', 'دفع آمن عبر Stripe'],
  payCopy: ['Account-linked payment with instant academy access after successful checkout.', 'دفع مرتبط بالحساب مع وصول فوري للأكاديمية بعد نجاح عملية الدفع.'],
  price: ['Course Price', 'سعر الدورة'],
  safe: ['Secure payment', 'دفع آمن'],
  heroStatOne: ['12 hours', '12 ساعة'],
  heroStatTwo: ['30 seats', '30 مقعدا'],
  heroStatThree: ['Arabic / English', 'العربية / الإنجليزية'],
  creationTitle: ["What you'll create", 'ما الذي ستنشئه'],
  modulesTitle: ['Course operating system', 'نظام تشغيل الدورة'],
  modulesCopy: [
    'A focused set of practical modules. Click any card to expand the workflow.',
    'مجموعة مركزة من الوحدات العملية. اضغط على أي بطاقة لتوسيع سير العمل.',
  ],
  trainerTitle: ['Your Trainer: Tarek Bacha', 'مدربك: طارق باشا'],
  trainerRole: ['AI Filmmaker & Content Strategist', 'صانع أفلام واستراتيجي محتوى بالذكاء الاصطناعي'],
  trainerCopy: [
    'Hands-on guidance for creators, marketers, and teams that need production-ready outputs.',
    'إرشاد عملي لصناع المحتوى والمسوقين والفرق التي تحتاج إلى مخرجات جاهزة للإنتاج.',
  ],
  statsTitle: ['Proof in motion', 'أرقام تتحرك مع القيمة'],
  testimonialsTitle: ['Built for ambitious creative teams', 'مصمم للفرق الإبداعية الطموحة'],
  finalTitle: ['Enter the AI production era.', 'ادخل عصر الإنتاج بالذكاء الاصطناعي.'],
  finalCopy: [
    'Reserve your seat, create your account, and start building real AI media assets with a premium cohort.',
    'احجز مقعدك، أنشئ حسابك، وابدأ ببناء أصول إعلامية حقيقية بالذكاء الاصطناعي ضمن دفعة تدريبية مميزة.',
  ],
  modalKicker: ['Account-linked checkout', 'دفع مرتبط بالحساب'],
  modalCopy: ['Complete your details to register and continue to Stripe.', 'أكمل بياناتك للتسجيل والمتابعة إلى Stripe.'],
  confirmEmail: ['Confirm email', 'تأكيد البريد الإلكتروني'],
  password: ['Password', 'كلمة المرور'],
  passwordHint: ['Min. 8 characters', '8 أحرف على الأقل'],
  address: ['Address', 'العنوان'],
  country: ['Country', 'الدولة'],
  city: ['City', 'المدينة'],
  company: ['Company (optional)', 'الشركة (اختياري)'],
  continueStripe: ['Continue to Stripe', 'المتابعة إلى Stripe'],
  cancel: ['Cancel', 'إلغاء'],
  loginInstead: ['Login instead', 'سجل الدخول بدلا من ذلك'],
  loginTitle: ['Login to Academy', 'تسجيل الدخول إلى الأكاديمية'],
  loginCopy: ['Use the email and password from your registration.', 'استخدم البريد الإلكتروني وكلمة المرور من تسجيلك.'],
  loginButton: ['Login', 'تسجيل الدخول'],
  loginInvalid: ['Email or password is incorrect', 'البريد الإلكتروني أو كلمة المرور غير صحيحة'],
  forgot: ['Forgot password?', 'نسيت كلمة المرور؟'],
  noAccount: ["Don't have an account?", 'ليس لديك حساب؟'],
  reserveSeat: ['Reserve a seat', 'احجز مقعدا'],
  studentPortal: ['Student Portal', 'بوابة الطالب'],
  logout: ['Logout', 'تسجيل الخروج'],
  completeRequired: ['Complete all required registration fields before checkout.', 'أكمل جميع حقول التسجيل المطلوبة قبل الدفع.'],
  emailMismatch: ['Email and confirm email must match.', 'يجب أن يتطابق البريد الإلكتروني مع تأكيد البريد.'],
  passwordShort: ['Use a password with at least 8 characters.', 'استخدم كلمة مرور من 8 أحرف على الأقل.'],
  saving: ['Saving your registration and preparing secure Stripe checkout...', 'يتم حفظ تسجيلك وتجهيز الدفع الآمن عبر Stripe...'],
  resetSent: ['If this email is registered, we sent a password reset link.', 'إذا كان هذا البريد مسجلا، فقد أرسلنا رابط إعادة تعيين كلمة المرور.'],
  forgotEmail: ['Enter your registered email first.', 'أدخل بريدك المسجل أولا.'],
  verifying: ['Verifying your account...', 'يتم التحقق من حسابك...'],
  ready: ['Ready to learn', 'جاهز للتعلم'],
  classComing: ['Class link coming soon', 'رابط الجلسة قادم قريبا'],
  startLearning: ['Start learning', 'ابدأ التعلم'],
  completePayment: ['Complete Stripe payment', 'أكمل الدفع عبر Stripe'],
};

const locationOptions = [
  { country: ['United Arab Emirates', 'الإمارات العربية المتحدة'], dialCode: '+971', cities: [['Dubai', 'دبي'], ['Abu Dhabi', 'أبوظبي'], ['Sharjah', 'الشارقة'], ['Ajman', 'عجمان']] },
  { country: ['Saudi Arabia', 'السعودية'], dialCode: '+966', cities: [['Riyadh', 'الرياض'], ['Jeddah', 'جدة'], ['Dammam', 'الدمام'], ['Makkah', 'مكة']] },
  { country: ['Qatar', 'قطر'], dialCode: '+974', cities: [['Doha', 'الدوحة'], ['Al Rayyan', 'الريان'], ['Lusail', 'لوسيل']] },
  { country: ['Kuwait', 'الكويت'], dialCode: '+965', cities: [['Kuwait City', 'مدينة الكويت'], ['Hawalli', 'حولي'], ['Salmiya', 'السالمية']] },
  { country: ['Bahrain', 'البحرين'], dialCode: '+973', cities: [['Manama', 'المنامة'], ['Riffa', 'الرفاع'], ['Muharraq', 'المحرق']] },
  { country: ['Oman', 'عمان'], dialCode: '+968', cities: [['Muscat', 'مسقط'], ['Salalah', 'صلالة'], ['Sohar', 'صحار']] },
  { country: ['Jordan', 'الأردن'], dialCode: '+962', cities: [['Amman', 'عمان'], ['Irbid', 'إربد'], ['Aqaba', 'العقبة']] },
  { country: ['Lebanon', 'لبنان'], dialCode: '+961', cities: [['Beirut', 'بيروت'], ['Tripoli', 'طرابلس'], ['Saida', 'صيدا']] },
  { country: ['Egypt', 'مصر'], dialCode: '+20', cities: [['Cairo', 'القاهرة'], ['Alexandria', 'الإسكندرية'], ['Giza', 'الجيزة']] },
  { country: ['Iraq', 'العراق'], dialCode: '+964', cities: [['Baghdad', 'بغداد'], ['Basra', 'البصرة'], ['Erbil', 'أربيل']] },
  { country: ['Syria', 'سوريا'], dialCode: '+963', cities: [['Damascus', 'دمشق'], ['Aleppo', 'حلب'], ['Homs', 'حمص']] },
  { country: ['Palestine', 'فلسطين'], dialCode: '+970', cities: [['Ramallah', 'رام الله'], ['Gaza', 'غزة'], ['Nablus', 'نابلس']] },
  { country: ['Morocco', 'المغرب'], dialCode: '+212', cities: [['Casablanca', 'الدار البيضاء'], ['Rabat', 'الرباط'], ['Marrakesh', 'مراكش']] },
  { country: ['Tunisia', 'تونس'], dialCode: '+216', cities: [['Tunis', 'تونس'], ['Sfax', 'صفاقس'], ['Sousse', 'سوسة']] },
  { country: ['Algeria', 'الجزائر'], dialCode: '+213', cities: [['Algiers', 'الجزائر'], ['Oran', 'وهران'], ['Constantine', 'قسنطينة']] },
  { country: ['United States', 'الولايات المتحدة'], dialCode: '+1', cities: [['New York', 'نيويورك'], ['Los Angeles', 'لوس أنجلوس'], ['Chicago', 'شيكاغو']] },
  { country: ['United Kingdom', 'المملكة المتحدة'], dialCode: '+44', cities: [['London', 'لندن'], ['Manchester', 'مانشستر'], ['Birmingham', 'برمنغهام']] },
  { country: ['Canada', 'كندا'], dialCode: '+1', cities: [['Toronto', 'تورونتو'], ['Vancouver', 'فانكوفر'], ['Montreal', 'مونتريال']] },
  { country: ['France', 'فرنسا'], dialCode: '+33', cities: [['Paris', 'باريس'], ['Lyon', 'ليون'], ['Marseille', 'مرسيليا']] },
  { country: ['Germany', 'ألمانيا'], dialCode: '+49', cities: [['Berlin', 'برلين'], ['Munich', 'ميونخ'], ['Hamburg', 'هامبورغ']] },
  { country: ['Turkey', 'تركيا'], dialCode: '+90', cities: [['Istanbul', 'إسطنبول'], ['Ankara', 'أنقرة'], ['Izmir', 'إزمير']] },
  { country: ['India', 'الهند'], dialCode: '+91', cities: [['Mumbai', 'مومباي'], ['Delhi', 'دلهي'], ['Bengaluru', 'بنغالورو']] },
  { country: ['Pakistan', 'باكستان'], dialCode: '+92', cities: [['Karachi', 'كراتشي'], ['Lahore', 'لاهور'], ['Islamabad', 'إسلام آباد']] },
];

function tr(key) {
  const value = text[key];
  if (!value) return key;
  return value[isArabic ? 1 : 0];
}

function loginErrorMessage(message) {
  const normalized = String(message || '').trim().replace(/\.$/, '');
  if (normalized === 'Email or password is incorrect') {
    return tr('loginInvalid');
  }
  return message || tr('loginInvalid');
}

function localizedPair(value) {
  return Array.isArray(value) ? value[isArabic ? 1 : 0] : value;
}

function normalizeLocationText(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function findCountryOption(value) {
  const normalized = normalizeLocationText(value);
  if (!normalized) return null;
  return locationOptions.find((option) => option.country.some((label) => normalizeLocationText(label) === normalized)) || null;
}

function countryName(option) {
  return localizedPair(option.country);
}

function cityName(city) {
  return localizedPair(city);
}

function defaultLocation() {
  return {
    country: '',
    city: '',
    phoneNumber: '',
  };
}

function cityOptionsFor(country) {
  const option = findCountryOption(country);
  return option ? option.cities.map(cityName) : [];
}

function cityForCountry(country, fallback = '') {
  const option = findCountryOption(country);
  const normalizedCity = normalizeLocationText(fallback);
  if (!option || !normalizedCity) return '';
  return option.cities.some((city) => city.some((label) => normalizeLocationText(label) === normalizedCity))
    ? fallback
    : '';
}

function phoneWithCountryCode(phoneNumber, country, previousCountry = '') {
  const option = findCountryOption(country);
  if (!option) return phoneNumber;
  const nextCode = option.dialCode;
  const trimmedPhone = String(phoneNumber || '').trim();
  const previousCode = findCountryOption(previousCountry)?.dialCode;
  const knownCodes = [...new Set(locationOptions.map((item) => item.dialCode))].sort((a, b) => b.length - a.length);
  const activeCode = previousCode && trimmedPhone.startsWith(previousCode)
    ? previousCode
    : knownCodes.find((code) => trimmedPhone.startsWith(code));
  const localNumber = activeCode ? trimmedPhone.slice(activeCode.length).trimStart() : trimmedPhone;
  if (!trimmedPhone || knownCodes.includes(trimmedPhone)) return `${nextCode} `;
  return `${nextCode} ${localNumber}`.trimEnd();
}

function switchLanguage() {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', isArabic ? 'en' : 'ar');
  window.location.href = url.href;
}

function api(path) {
  return new URL(path, window.location.href).href;
}

function ref() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'academy-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

function postJson(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (response) => {
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : {};
    if (!response.ok || !data.ok) {
      return { ok: false, message: data.message || 'Request failed.' };
    }
    return data;
  }).catch((error) => ({ ok: false, message: error instanceof Error ? error.message : 'Request failed.' }));
}

function getJson(url, token) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  return fetch(url, { method: 'GET', headers }).then(async (response) => {
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : {};
    if (!response.ok || !data.ok) {
      return { ok: false, status: response.status, message: data.message || 'Request failed.' };
    }
    return data;
  }).catch((error) => ({ ok: false, status: 0, message: error instanceof Error ? error.message : 'Request failed.' }));
}

const creationItems = [
  { title: ['Campaign templates', 'قوالب حملات'], shortTitle: ['Templates', 'قوالب'], media: responsiveImage('academy-create-templates'), type: 'image', icon: BookOpen },
  { title: ['Reels & short videos', 'ريلز وفيديوهات قصيرة'], shortTitle: ['Reels', 'ريلز'], media: reelsPreview, poster: reelsPoster, type: 'video', icon: CirclePlay },
  { title: ['AI avatars', 'شخصيات افتراضية'], shortTitle: ['AI avatars', 'شخصيات'], media: responsiveImage('academy-create-avatar'), type: 'image', icon: Users },
  { title: ['Cinematic AI videos', 'فيديوهات سينمائية بالذكاء الاصطناعي'], shortTitle: ['AI videos', 'فيديوهات'], media: cinematicPreview, poster: cinematicPoster, type: 'video', icon: Film },
  { title: ['AI image worlds', 'عوالم صور بالذكاء الاصطناعي'], shortTitle: ['AI images', 'صور'], media: responsiveImage('academy-create-images'), type: 'image', icon: Palette },
  { title: ['Voiceover systems', 'أنظمة تعليق صوتي'], shortTitle: ['Voiceovers', 'تعليق صوتي'], media: responsiveImage('academy-create-voiceover'), type: 'image', icon: Mic2 },
  { title: ['Product visuals', 'صور منتجات'], shortTitle: ['Products', 'منتجات'], media: responsiveImage('academy-create-product'), type: 'image', icon: Sparkles },
  { title: ['Social ad engines', 'محركات إعلانات اجتماعية'], shortTitle: ['Social ads', 'إعلانات'], media: responsiveImage('academy-create-social'), type: 'image', icon: BarChart3 },
];

const trainerPortrait = responsiveImage('trainer-tarek-bacha', trainerPortraitWidths);

const modules = [
  {
    title: ['Prompt architecture', 'هندسة الأوامر'],
    desc: ['Build reusable prompt systems for images, video, and scripts.', 'بناء أنظمة أوامر قابلة لإعادة الاستخدام للصور والفيديو والنصوص.'],
    icon: BrainCircuit,
    progress: 94,
  },
  {
    title: ['Visual production', 'الإنتاج البصري'],
    desc: ['Create campaign visuals, product scenes, and cinematic AI frames.', 'صناعة صور حملات ومشاهد منتجات ولقطات سينمائية بالذكاء الاصطناعي.'],
    icon: WandSparkles,
    progress: 88,
  },
  {
    title: ['Short-form video', 'الفيديو القصير'],
    desc: ['Plan, script, caption, and repurpose high-performing clips.', 'تخطيط وكتابة وتعليق وإعادة توظيف مقاطع عالية الأداء.'],
    icon: Play,
    progress: 82,
  },
  {
    title: ['Campaign workflow', 'سير عمل الحملات'],
    desc: ['Turn outputs into repeatable marketing systems for teams.', 'تحويل المخرجات إلى أنظمة تسويق قابلة للتكرار للفرق.'],
    icon: Rocket,
    progress: 91,
  },
];

const trainerTools = [
  {
    label: 'OpenAI',
    logo: (
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 8.5c5.1-5.1 13.9-.9 13.1 6.3" />
          <path d="M37.1 14.8c7 1.9 7.5 11.7.7 14.3" />
          <path d="M37.8 29.1c1.9 7-6.4 12.5-12.1 8.1" />
          <path d="M25.7 37.2c-5.1 5.1-13.9.9-13.1-6.3" />
          <path d="M12.6 30.9c-7-1.9-7.5-11.7-.7-14.3" />
          <path d="M11.9 16.6C10 9.6 18.3 4.1 24 8.5" />
          <path d="M18 16.9 30.1 24 18 31.1V16.9Z" />
        </g>
      </svg>
    ),
  },
  {
    label: 'Midjourney',
    logo: (
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 35.5h32" />
          <path d="M23.5 8.5v27" />
          <path d="M23.5 11.5c-6.8 5.9-10.5 13.2-12 23.5 5.7-2.7 10.2-7.8 12-23.5Z" />
          <path d="M24.4 12.5c7.9 3.5 12.4 10.7 14.4 22.5-6.7-2.2-11.7-7.2-14.4-22.5Z" />
        </g>
      </svg>
    ),
  },
  {
    label: 'Runway',
    logo: (
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M9 10h17.4c7.8 0 12.6 4.3 12.6 10.9 0 4.8-2.7 8.3-7.2 9.9L40 38H29.7l-7.4-6.7h-4.4V38H9V10Zm8.9 7.5v6.8h7.6c2.9 0 4.5-1.2 4.5-3.4 0-2.1-1.6-3.4-4.5-3.4h-7.6Z" />
      </svg>
    ),
  },
  {
    label: 'ElevenLabs',
    logo: (
      <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <g fill="currentColor">
          <rect x="10" y="10" width="5.5" height="28" rx="2.75" />
          <rect x="20.8" y="7" width="5.5" height="34" rx="2.75" />
          <rect x="31.5" y="13" width="5.5" height="22" rx="2.75" />
        </g>
      </svg>
    ),
  },
];

const testimonials = [
  ['The course feels like stepping into a future studio.', 'تشعر الدورة وكأنك تدخل استوديو المستقبل.'],
  ['Practical, premium, and immediately useful for content teams.', 'عملية وفاخرة ومفيدة مباشرة لفرق المحتوى.'],
  ['The workflow changed how we plan campaign assets.', 'غيّر سير العمل طريقة تخطيطنا لأصول الحملات.'],
  ['Exactly the kind of AI media training teams need now.', 'هذا بالضبط نوع تدريب الإعلام بالذكاء الاصطناعي الذي تحتاجه الفرق الآن.'],
];

const repeatItems = (items, repeatCount) => Array.from(
  { length: repeatCount },
  () => items,
).flat();

const testimonialLoopItems = repeatItems(testimonials, 4);
const trainerHighlights = [
  ['Real media and content production experience', 'خبرة عملية في الإعلام وصناعة المحتوى'],
  ['AI tools for video, image, and voice', 'أدوات ذكاء اصطناعي للفيديو والصورة والصوت'],
  ['Campaign-ready outputs for teams', 'مخرجات جاهزة للحملات والفرق'],
  ['Hands-on journey from prompt to production', 'منهج عملي من البداية إلى الإنتاج'],
];

function usePageMotion() {
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) return undefined;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    let rafId = 0;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const reveal = gsap.utils.toArray('.fx-reveal');
    reveal.forEach((element) => {
      gsap.fromTo(element, { opacity: 0, y: 48, scale: 0.96, filter: 'blur(10px)' }, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 84%' },
      });
    });

    gsap.utils.toArray('.fx-progress-bar').forEach((element) => {
      gsap.fromTo(element, { scaleX: 0 }, {
        scaleX: 1,
        transformOrigin: isArabic ? 'right center' : 'left center',
        duration: 1.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 88%' },
      });
    });

    gsap.to('.fx-parallax', {
      yPercent: -10,
      ease: 'none',
      scrollTrigger: { trigger: '.fx-hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [reducedMotion]);
}

function ThreeBackground() {
  const refCanvas = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!refCanvas.current) return undefined;
    const canvas = refCanvas.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 7;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.BufferGeometry();
    const count = window.innerWidth < 720 ? 80 : 150;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      colors[i * 3] = 0.25 + Math.random() * 0.25;
      colors[i * 3 + 1] = 0.55 + Math.random() * 0.35;
      colors[i * 3 + 2] = 1;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const torus = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.9, 0.015, 140, 10),
      new THREE.MeshBasicMaterial({ color: 0x5ee7ff, transparent: true, opacity: 0.22 }),
    );
    torus.position.set(3.2, 1.4, -1);
    scene.add(torus);

    const mouse = { x: 0, y: 0 };
    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth - 0.5) * 0.45;
      mouse.y = (event.clientY / window.innerHeight - 0.5) * 0.35;
      document.documentElement.style.setProperty('--mouse-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${event.clientY}px`);
    };
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!reducedMotion) {
        points.rotation.y += 0.0009;
        points.rotation.x += 0.00035;
        torus.rotation.x += 0.003;
        torus.rotation.y += 0.004;
        camera.position.x += (mouse.x - camera.position.x) * 0.02;
        camera.position.y += (-mouse.y - camera.position.y) * 0.02;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      torus.geometry.dispose();
      torus.material.dispose();
      renderer.dispose();
    };
  }, [reducedMotion]);

  return <canvas ref={refCanvas} className="fx-three-canvas" aria-hidden="true" />;
}

function MagneticButton({ children, variant = 'primary', className = '', ...props }) {
  const refButton = useRef(null);
  const [ripples, setRipples] = useState([]);
  const reducedMotion = useReducedMotion();

  const onMove = (event) => {
    if (reducedMotion || !refButton.current) return;
    const rect = refButton.current.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    refButton.current.style.transform = `translate(${x * 0.1}px, ${y * 0.12}px)`;
  };
  const onLeave = () => {
    if (refButton.current) refButton.current.style.transform = 'translate(0, 0)';
  };
  const onClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ripple = {
      id: Date.now(),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setRipples((items) => [...items.slice(-2), ripple]);
    window.setTimeout(() => setRipples((items) => items.filter((item) => item.id !== ripple.id)), 700);
    props.onClick?.(event);
  };

  return (
    <button
      {...props}
      ref={refButton}
      type={props.type || 'button'}
      className={`fx-button fx-button-${variant} ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <span className="fx-button-content">{children}</span>
      {ripples.map((ripple) => (
        <span key={ripple.id} className="fx-ripple" style={{ left: ripple.x, top: ripple.y }} />
      ))}
    </button>
  );
}

function TiltCard({ children, className = '', onClick }) {
  const refCard = useRef(null);
  const reducedMotion = useReducedMotion();

  const onMouseMove = (event) => {
    if (reducedMotion || !refCard.current) return;
    const rect = refCard.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    refCard.current.style.setProperty('--tilt-x', `${-y * 7}deg`);
    refCard.current.style.setProperty('--tilt-y', `${x * 8}deg`);
    refCard.current.style.setProperty('--card-glow-x', `${event.clientX - rect.left}px`);
    refCard.current.style.setProperty('--card-glow-y', `${event.clientY - rect.top}px`);
  };
  const onMouseLeave = () => {
    if (!refCard.current) return;
    refCard.current.style.setProperty('--tilt-x', '0deg');
    refCard.current.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <motion.article
      ref={refCard}
      className={`fx-tilt-card ${className}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      whileHover={reducedMotion ? undefined : { y: -8 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
      {children}
    </motion.article>
  );
}

function AnimatedCounter({ value, suffix = '' }) {
  const refValue = useRef(null);
  useEffect(() => {
    const node = refValue.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const obj = { value: 0 };
      gsap.to(obj, {
        value,
        duration: 1.4,
        ease: 'power3.out',
        onUpdate: () => {
          node.textContent = `${Math.round(obj.value).toLocaleString()}${suffix}`;
        },
      });
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, suffix]);
  return <span ref={refValue}>0{suffix}</span>;
}

function Header({ onLogin }) {
  return (
    <header className="fx-nav">
      <a className="fx-brand" href="../index.html" aria-label="Digrro Academy">
        <img src={academyLogo} alt="Digrro Academy" />
      </a>
      <nav className="fx-nav-actions" aria-label="Academy navigation">
        <button className="fx-language-button" type="button" onClick={switchLanguage} aria-label={tr('languageAria')}>
          <Globe2 size={16} />
          <span>{tr('languageToggle')}</span>
        </button>
        <span>{tr('navAccount')}</span>
        <button className="fx-nav-link" type="button" onClick={onLogin}>{tr('navLogin')}</button>
        <button className="fx-icon-button" type="button" onClick={onLogin} aria-label={tr('navLogin')}>
          <LogIn size={18} />
        </button>
      </nav>
    </header>
  );
}

function DashboardMockup({ course }) {
  return (
    <motion.div
      className="fx-dashboard fx-parallax"
      initial={{ opacity: 0, y: 40, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, delay: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="fx-dashboard-top">
        <div>
          <span>{tr('dashboardSubtitle')}</span>
          <strong>{tr('dashboardTitle')}</strong>
        </div>
        <div className="fx-live-dot"><span />Live</div>
      </div>
      <div className="fx-data-grid">
        <div><span>{tr('heroStatOne')}</span><strong>94%</strong></div>
        <div><span>{tr('heroStatTwo')}</span><strong>{course?.seatsRemaining ?? 30}</strong></div>
        <div><span>{tr('heroStatThree')}</span><strong>2x</strong></div>
      </div>
      <div className="fx-chart">
        {[46, 78, 55, 88, 64, 96, 72].map((height, index) => (
          <span key={index} style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="fx-dashboard-flow">
        {['Prompt', 'Image', 'Voice', 'Video'].map((item, index) => (
          <div key={item}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{item}</strong>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function HeroTrainerCard() {
  return (
    <TiltCard className="fx-hero-trainer">
      <div className="fx-hero-trainer-image">
        <ResponsiveImage image={trainerPortrait} alt="Tarek Bacha" sizes={heroTrainerImageSizes} loading="eager" fetchPriority="high" />
      </div>
      <div className="fx-hero-trainer-content">
        <h3>{tr('trainerTitle')} <BadgeCheck size={18} /></h3>
        <p>{tr('trainerRole')}</p>
        <ul>
          {trainerHighlights.map((item) => (
            <li key={item[0]}><Check size={15} />{item[isArabic ? 1 : 0]}</li>
          ))}
        </ul>
      </div>
    </TiltCard>
  );
}

function HeroCreationPreview() {
  const renderPreviewCard = (item, keySuffix) => {
    const Icon = item.icon;
    const title = item.shortTitle?.[isArabic ? 1 : 0] || item.title[isArabic ? 1 : 0];
    return (
      <div className="fx-hero-creation-card" key={`${item.title[0]}-${keySuffix}`}>
        <div className="fx-hero-creation-media">
          {item.type === 'video' ? (
            <PreviewVideo
              src={item.media}
              poster={item.poster}
              label={item.title[isArabic ? 1 : 0]}
              loading="eager"
              preload="metadata"
            />
          ) : (
            <ResponsiveImage image={item.media} alt="" sizes={heroCreationImageSizes} loading="eager" />
          )}
        </div>
        <span><Icon size={13} />{title}</span>
      </div>
    );
  };

  return (
    <div className="fx-hero-creation">
      <div className="fx-hero-creation-head">
        <span>{tr('creationTitle')}</span>
      </div>
      <div className="fx-hero-creation-rail" aria-label={tr('creationTitle')}>
        <div className="fx-hero-creation-track">
          <div className="fx-hero-creation-set">
            {creationItems.map((item, itemIndex) => renderPreviewCard(item, itemIndex))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ course, reserve, setReserve, openEnroll }) {
  return (
    <section className="fx-hero" id="top">
      <div className="fx-aurora" aria-hidden="true" />
      <div className="fx-grid-glow" aria-hidden="true" />
      <div className="fx-cursor-glow" aria-hidden="true" />
      <div className="fx-hero-inner">
        <motion.div
          className="fx-hero-copy"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12 } },
          }}
        >
          <motion.span className="fx-pill" variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}>
            <Sparkles size={16} /> {tr('heroBadge')}
          </motion.span>
          <motion.h1 variants={{ hidden: { opacity: 0, y: 34, filter: 'blur(14px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)' } }}>
            {tr('heroTitleA')} <span>{tr('heroTitleB')}</span>
          </motion.h1>
          <motion.p className="fx-hero-lede" variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}>
            {tr('heroLede')}
          </motion.p>
          <motion.div className="fx-hero-actions" variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}>
            <MagneticButton onClick={openEnroll}>
              {tr('primaryCta')} <ArrowRight size={18} />
            </MagneticButton>
          </motion.div>
          <motion.div className="fx-hero-stats" variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}>
            <span><Clock3 size={17} />{tr('heroStatOne')}</span>
            <span><Users size={17} />{tr('heroStatTwo')}</span>
            <span><Globe2 size={17} />{tr('heroStatThree')}</span>
          </motion.div>
          <HeroCreationPreview />
        </motion.div>
        <div className="fx-hero-side">
          <HeroTrainerCard />
          <ReservePanel course={course} reserve={reserve} setReserve={setReserve} openEnroll={openEnroll} />
        </div>
      </div>
    </section>
  );
}

function ReservePanel({ course, reserve, setReserve, openEnroll }) {
  const reserveCountryOptionsId = 'reserve-country-options';
  const reserveCityOptionsId = 'reserve-city-options';
  const reserveCityOptions = cityOptionsFor(reserve.country);
  const updateReserveCountry = (country) => {
    setReserve((current) => ({
      ...current,
      country,
      city: cityForCountry(country, current.city),
      phoneNumber: phoneWithCountryCode(current.phoneNumber, country, current.country),
    }));
  };

  return (
    <motion.aside className="fx-reserve-panel" initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.55 }}>
      <div className="fx-panel-shine" />
      <ShieldCheck className="fx-reserve-icon" size={34} />
      <h2>{tr('reserveTitle')}</h2>
      <p>{tr('reserveCopy')}</p>
      <div className="fx-form-stack">
        <label>
          <span>{tr('fullName')}</span>
          <input value={reserve.fullName} onChange={(e) => setReserve({ ...reserve, fullName: e.target.value })} placeholder={tr('fullName')} />
        </label>
        <label>
          <span>{tr('email')}</span>
          <input id="reserve-email" value={reserve.email} onChange={(e) => setReserve({ ...reserve, email: e.target.value })} placeholder={tr('email')} type="email" />
        </label>
        <div className="fx-form-pair">
          <label className="fx-combo-field">
            <span>{tr('country')}</span>
            <input
              value={reserve.country}
              onChange={(e) => updateReserveCountry(e.target.value)}
              placeholder={tr('country')}
              list={reserveCountryOptionsId}
              autoComplete="country-name"
            />
            <ChevronDown className="fx-combo-indicator" size={15} />
          </label>
          <label className="fx-combo-field">
            <span>{tr('city')}</span>
            <input
              value={reserve.city}
              onChange={(e) => setReserve({ ...reserve, city: e.target.value })}
              placeholder={tr('city')}
              list={reserveCityOptionsId}
              autoComplete="address-level2"
            />
            <ChevronDown className="fx-combo-indicator" size={15} />
          </label>
        </div>
        <label>
          <span>{tr('phone')}</span>
          <input id="reserve-phone" value={reserve.phoneNumber} onChange={(e) => setReserve({ ...reserve, phoneNumber: e.target.value })} placeholder={tr('phone')} type="tel" inputMode="tel" />
        </label>
      </div>
      <datalist id={reserveCountryOptionsId}>
        {locationOptions.map((option) => <option key={option.country[0]} value={countryName(option)} />)}
      </datalist>
      <datalist id={reserveCityOptionsId}>
        {reserveCityOptions.map((city) => <option key={city} value={city} />)}
      </datalist>
      <div className="fx-price-row">
        <span>{tr('price')}</span>
        <strong>{course?.priceText || '$200'}</strong>
      </div>
      <MagneticButton className="w-full" onClick={openEnroll}>
        {tr('primaryCta')} <Rocket size={18} />
      </MagneticButton>
    </motion.aside>
  );
}

function CreationShowcase() {
  const renderCreationCard = (item, keySuffix) => (
    <TiltCard key={`${item.title[0]}-${keySuffix}`} className="fx-creation-card">
      <h3>{item.title[isArabic ? 1 : 0]}</h3>
      <div className="fx-creation-media">
        {item.type === 'video' ? (
          <PreviewVideo
            src={item.media}
            poster={item.poster}
            label={item.title[isArabic ? 1 : 0]}
            loading="lazy"
            preload="none"
          />
        ) : (
          <ResponsiveImage image={item.media} alt="" sizes={showcaseCreationImageSizes} loading="lazy" />
        )}
        <div className="fx-video-preview"><Play size={18} /></div>
      </div>
    </TiltCard>
  );

  return (
    <section className="fx-section fx-showcase-section">
      <div className="fx-section-head fx-reveal">
        <span className="fx-kicker"><CirclePlay size={16} /> Showcase</span>
        <h2>{tr('creationTitle')}</h2>
      </div>
      <div className="fx-showcase-frame">
        <div className="fx-horizontal-showcase fx-reveal" aria-label={tr('creationTitle')}>
          <div className="fx-showcase-track">
            <div className="fx-showcase-set">
              {creationItems.map((item, itemIndex) => renderCreationCard(item, itemIndex))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Modules() {
  const [active, setActive] = useState(0);
  return (
    <section className="fx-section">
      <div className="fx-section-head fx-reveal">
        <span className="fx-kicker"><Gauge size={16} /> Academy stack</span>
        <h2>{tr('modulesTitle')}</h2>
        <p>{tr('modulesCopy')}</p>
      </div>
      <div className="fx-modules-grid">
        {modules.map((module, index) => {
          const Icon = module.icon;
          const isActive = active === index;
          return (
            <TiltCard key={module.title[0]} className={`fx-module-card fx-reveal ${isActive ? 'is-active' : ''}`} onClick={() => setActive(index)}>
              <div className="fx-module-head">
                <span><Icon size={22} /></span>
                <ChevronDown size={19} className={isActive ? 'rotate-180' : ''} />
              </div>
              <h3>{module.title[isArabic ? 1 : 0]}</h3>
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                  >
                    {module.desc[isArabic ? 1 : 0]}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="fx-module-progress">
                <div><span className="fx-progress-bar" style={{ '--progress': module.progress / 100 }} /></div>
                <strong>{module.progress}%</strong>
              </div>
            </TiltCard>
          );
        })}
      </div>
    </section>
  );
}

function Trainer() {
  return (
    <section className="fx-section fx-sticky-story">
      <div className="fx-sticky-copy fx-reveal">
        <span className="fx-kicker"><GraduationCap size={16} /> Mentor-led</span>
        <h2>{tr('trainerTitle')}</h2>
        <p>{tr('trainerCopy')}</p>
      </div>
      <TiltCard className="fx-trainer-card fx-reveal">
        <div className="fx-trainer-image">
          <ResponsiveImage image={trainerPortrait} alt="Tarek Bacha" sizes={trainerImageSizes} loading="lazy" />
        </div>
        <div>
          <h3>{tr('trainerTitle')} <BadgeCheck size={20} /></h3>
          <p>{tr('trainerRole')}</p>
          <ul>
            {[
              isArabic ? 'خبرة عملية في الإعلام وصناعة المحتوى' : 'Real media and content production experience',
              isArabic ? 'أدوات ذكاء اصطناعي للفيديو والصورة والصوت' : 'AI tools for video, image, and voice',
              isArabic ? 'مخرجات جاهزة للحملات والفرق' : 'Campaign-ready outputs for teams',
              isArabic ? 'منهج عملي من البداية إلى الإنتاج' : 'Hands-on journey from prompt to production',
            ].map((item) => <li key={item}><Check size={16} />{item}</li>)}
          </ul>
          <div className="fx-tool-logo-row" aria-label={isArabic ? 'شعارات أدوات الذكاء الاصطناعي المستخدمة' : 'AI tool logos used in the training'}>
            {trainerTools.map((tool) => (
              <span className="fx-tool-logo" key={tool.label} role="img" aria-label={tool.label} title={tool.label}>
                {tool.logo}
              </span>
            ))}
          </div>
        </div>
      </TiltCard>
    </section>
  );
}

function StatsAndTestimonials() {
  return (
    <section className="fx-section fx-reveal">
      <div className="fx-stats-grid">
        <div className="fx-section-copy">
          <span className="fx-kicker"><BarChart3 size={16} /> Intelligence layer</span>
          <h2>{tr('statsTitle')}</h2>
        </div>
        {[
          [12, 'h', isArabic ? 'تدريب عملي' : 'Hands-on training'],
          [30, '', isArabic ? 'مقعد فقط' : 'Seats only'],
          [7, 'd', isArabic ? 'ضمان رضا' : 'Satisfaction guarantee'],
        ].map(([value, suffix, label]) => (
          <div className="fx-stat-card" key={label}>
            <div className="fx-radial" />
            <strong><AnimatedCounter value={value} suffix={suffix} /></strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="fx-testimonials">
        <h2>{tr('testimonialsTitle')}</h2>
        <div className="fx-marquee">
          {[0, 1].map((setIndex) => (
            <div className="fx-marquee-set" aria-hidden={setIndex === 1 ? 'true' : undefined} key={`testimonial-set-${setIndex}`}>
              {testimonialLoopItems.map((item, index) => (
                <article key={`${item[0]}-${setIndex}-${index}`}>
                  <span className="fx-avatar">{String.fromCharCode(65 + (index % 5))}</span>
                  <p>{item[isArabic ? 1 : 0]}</p>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StudentDashboard({ dashboard, onLogout }) {
  if (!dashboard?.user) return null;
  const enrollments = Array.isArray(dashboard.enrollments) ? dashboard.enrollments : [];
  return (
    <section className="fx-section fx-dashboard-section" id="student-dashboard">
      <div className="fx-portal fx-reveal">
        <div className="fx-portal-head">
          <div>
            <span className="fx-kicker">{tr('studentPortal')}</span>
            <h2>{isArabic ? `مرحبا ${dashboard.user.fullName || dashboard.user.email}` : `Welcome, ${dashboard.user.fullName || dashboard.user.email}`}</h2>
          </div>
          <MagneticButton variant="secondary" onClick={onLogout}>{tr('logout')}</MagneticButton>
        </div>
        <div className="fx-portal-grid">
          {enrollments.map((enrollment) => {
            const course = enrollment.course || {};
            const action = enrollment.isPaid
              ? (course.learningUrl
                ? <a className="fx-button fx-button-primary" href={course.learningUrl} target="_blank" rel="noreferrer">{tr('startLearning')}</a>
                : <button className="fx-button fx-button-secondary" type="button" disabled>{tr('classComing')}</button>)
              : (enrollment.checkoutUrl
                ? <a className="fx-button fx-button-primary" href={enrollment.checkoutUrl}>{tr('completePayment')}</a>
                : null);
            return (
              <article className="fx-portal-course" key={enrollment.id}>
                <span className="fx-status">{enrollment.isPaid ? tr('ready') : enrollment.paymentStatus}</span>
                <h3>{isArabic ? 'تدريب صناعة المحتوى والإنتاج الإعلامي بالذكاء الاصطناعي' : (course.label || enrollment.planName)}</h3>
                <p>{isArabic ? 'وصولك التدريبي مرتبط بهذا الحساب.' : 'Your training access is linked to this account.'}</p>
                <div>{action}</div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ openEnroll }) {
  return (
    <section className="fx-section fx-final-cta fx-reveal">
      <div className="fx-spotlight" aria-hidden="true" />
      <h2>{tr('finalTitle')}</h2>
      <p>{tr('finalCopy')}</p>
      <MagneticButton onClick={openEnroll}>
        {tr('primaryCta')} <ArrowRight size={18} />
      </MagneticButton>
    </section>
  );
}

function EnrollmentModal({ open, onClose, course, reserve, onDashboard }) {
  const [form, setForm] = useState(() => ({
    ...defaultLocation(),
    fullName: '',
    email: '',
    confirmEmail: '',
    password: '',
    addressLine: '',
    company: '',
  }));
  const [status, setStatus] = useState('');
  const [kind, setKind] = useState('');
  const [loading, setLoading] = useState(false);
  const modalCountryOptionsId = 'enrollment-country-options';
  const modalCityOptionsId = 'enrollment-city-options';
  const modalCityOptions = cityOptionsFor(form.country);
  const updateFormCountry = (country) => {
    setForm((current) => ({
      ...current,
      country,
      city: cityForCountry(country, current.city),
      phoneNumber: phoneWithCountryCode(current.phoneNumber, country, current.country),
    }));
  };
  const updateFormField = (name, value) => {
    if (name === 'country') {
      updateFormCountry(value);
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  };

  useEffect(() => {
    if (!open) return;
    setForm((current) => {
      const country = reserve.country || current.country;
      const city = reserve.city || (!reserve.country ? current.city : '');
      return {
        ...current,
        fullName: reserve.fullName || current.fullName,
        email: reserve.email || current.email,
        confirmEmail: reserve.email || current.confirmEmail,
        country,
        city: cityForCountry(country, city),
        phoneNumber: reserve.phoneNumber || phoneWithCountryCode(current.phoneNumber, country, current.country),
      };
    });
    setStatus(tr('modalCopy'));
    setKind('');
  }, [open, reserve]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.fullName || !form.email || !form.confirmEmail || !form.phoneNumber || !form.password || !form.addressLine || !form.country || !form.city) {
      setStatus(tr('completeRequired'));
      setKind('error');
      return;
    }
    if (form.email.trim().toLowerCase() !== form.confirmEmail.trim().toLowerCase()) {
      setStatus(tr('emailMismatch'));
      setKind('error');
      return;
    }
    if (form.password.length < 8) {
      setStatus(tr('passwordShort'));
      setKind('error');
      return;
    }

    setLoading(true);
    setStatus(tr('saving'));
    setKind('');
    const result = await postJson(api(REGISTER_API), {
      planKey: course?.key || 'sprint',
      checkoutReference: ref(),
      ...form,
      email: form.email.trim().toLowerCase(),
      confirmEmail: form.confirmEmail.trim().toLowerCase(),
    });
    setLoading(false);
    if (!result.ok) {
      setStatus(result.message || 'Registration failed.');
      setKind('error');
      return;
    }
    localStorage.setItem('digrro_academy_email', form.email.trim().toLowerCase());
    if (result.checkoutUrl) window.location.href = result.checkoutUrl;
    else {
      setStatus(result.message || 'Registration saved.');
      setKind('success');
      onDashboard?.();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fx-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="fx-modal-backdrop" type="button" onClick={onClose} aria-label={tr('cancel')} />
          <motion.div className="fx-modal-card" initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }}>
            <button className="fx-modal-close" type="button" onClick={onClose} aria-label={tr('cancel')}><X size={20} /></button>
            <span className="fx-kicker">{tr('modalKicker')}</span>
            <h2>{isArabic ? 'تدريب صناعة المحتوى والإنتاج الإعلامي بالذكاء الاصطناعي' : course?.label || 'AI Content Creation & Media Production Training'}</h2>
            <p>{tr('modalCopy')}</p>
            <form className="fx-modal-form" onSubmit={submit}>
              {[
                ['fullName', tr('fullName'), 'text'],
                ['email', tr('email'), 'email'],
                ['confirmEmail', tr('confirmEmail'), 'email'],
                ['phoneNumber', tr('phone'), 'tel'],
                ['password', tr('password'), 'password'],
                ['addressLine', tr('address'), 'text'],
                ['country', tr('country'), 'text'],
                ['city', tr('city'), 'text'],
                ['company', tr('company'), 'text'],
              ].map(([name, label, type]) => (
                <label key={name} className={`${name === 'fullName' || name === 'addressLine' || name === 'company' ? 'is-wide' : ''} ${name === 'country' || name === 'city' ? 'fx-combo-field' : ''}`}>
                  <span>{label}</span>
                  <input
                    id={name === 'email' ? 'enrollment-email' : name === 'confirmEmail' ? 'enrollment-email-confirm' : name === 'phoneNumber' ? 'enrollment-phone' : undefined}
                    value={form[name]}
                    type={type}
                    list={name === 'country' ? modalCountryOptionsId : name === 'city' ? modalCityOptionsId : undefined}
                    autoComplete={name === 'country' ? 'country-name' : name === 'city' ? 'address-level2' : undefined}
                    inputMode={name === 'phoneNumber' ? 'tel' : undefined}
                    placeholder={name === 'password' ? tr('passwordHint') : label}
                    onChange={(event) => updateFormField(name, event.target.value)}
                  />
                  {(name === 'country' || name === 'city') && <ChevronDown className="fx-combo-indicator" size={15} />}
                </label>
              ))}
              <datalist id={modalCountryOptionsId}>
                {locationOptions.map((option) => <option key={option.country[0]} value={countryName(option)} />)}
              </datalist>
              <datalist id={modalCityOptionsId}>
                {modalCityOptions.map((city) => <option key={city} value={city} />)}
              </datalist>
              <div className={`fx-status-box ${kind ? `is-${kind}` : ''}`}>{status}</div>
              <div className="fx-modal-actions">
                <MagneticButton type="submit" disabled={loading}>{loading ? tr('saving') : tr('continueStripe')}</MagneticButton>
                <MagneticButton variant="secondary" onClick={onClose}>{tr('cancel')}</MagneticButton>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LoginModal({ open, onClose, onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [kind, setKind] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail(localStorage.getItem('digrro_academy_email') || '');
    setStatus(tr('loginCopy'));
    setKind('');
  }, [open]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus(tr('verifying'));
    setKind('');
    const result = await postJson(api(LOGIN_API), { email: email.trim().toLowerCase(), password });
    setLoading(false);
    if (!result.ok) {
      setStatus(loginErrorMessage(result.message));
      setKind('error');
      return;
    }
    if (result.token) localStorage.setItem(STUDENT_TOKEN_KEY, result.token);
    localStorage.setItem('digrro_academy_email', email.trim().toLowerCase());
    onLoggedIn(result.dashboard);
    onClose();
    window.setTimeout(() => document.querySelector('#student-dashboard')?.scrollIntoView({ behavior: 'smooth' }), 120);
  };

  const forgot = async (event) => {
    event.preventDefault();
    if (!email) {
      setStatus(tr('forgotEmail'));
      setKind('error');
      return;
    }
    const result = await postJson(api(REQUEST_PASSWORD_RESET_API), { email: email.trim().toLowerCase() });
    setStatus(result.message || tr('resetSent'));
    setKind(result.ok ? 'success' : 'error');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fx-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="fx-modal-backdrop" type="button" onClick={onClose} aria-label={tr('cancel')} />
          <motion.div className="fx-modal-card is-narrow" initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }}>
            <button className="fx-modal-close" type="button" onClick={onClose} aria-label={tr('cancel')}><X size={20} /></button>
            <span className="fx-kicker">{tr('navLogin')}</span>
            <h2>{tr('loginTitle')}</h2>
            <p>{tr('loginCopy')}</p>
            <form className="fx-modal-form single" onSubmit={submit}>
              <label>
                <span>{tr('email')}</span>
                <input id="login-modal-email" value={email} type="email" onChange={(event) => setEmail(event.target.value)} placeholder={tr('email')} />
              </label>
              <label>
                <span>{tr('password')}</span>
                <input value={password} type="password" onChange={(event) => setPassword(event.target.value)} placeholder={tr('password')} />
              </label>
              <button className="fx-text-link" type="button" onClick={forgot}>{tr('forgot')}</button>
              <div className={`fx-status-box ${kind ? `is-${kind}` : ''}`}>{status}</div>
              <MagneticButton type="submit" disabled={loading}>{loading ? tr('verifying') : tr('loginButton')}</MagneticButton>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function App() {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [reserve, setReserve] = useState(() => ({ fullName: '', email: '', ...defaultLocation() }));
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  usePageMotion();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.body.classList.toggle('is-rtl', isArabic);
    document.title = isArabic
      ? 'أكاديمية دجرو | تدريب صناعة المحتوى والإنتاج الإعلامي بالذكاء الاصطناعي'
      : 'Digrro Academy | AI Content Creation & Media Production Training';
    initGoogleAnalytics();
  }, []);

  useEffect(() => {
    loadCourses()
      .then((list) => setCourses(Array.isArray(list) ? list : []))
      .finally(() => setLoadingCourses(false));
    const token = localStorage.getItem(STUDENT_TOKEN_KEY);
    if (token) {
      getJson(api(STUDENT_API), token).then((result) => {
        if (result.ok) setDashboard(result.dashboard);
        else localStorage.removeItem(STUDENT_TOKEN_KEY);
      });
    }
  }, []);

  const course = useMemo(() => {
    const loaded = courses.find((item) => item.key === 'sprint') || courses[0];
    if (!loaded) {
      return {
        key: 'sprint',
        label: 'AI Content Creation & Media Production Training',
        amountUsd: 200,
        priceText: '$200',
        seatLimit: 30,
        seatsRemaining: 30,
      };
    }
    return loaded;
  }, [courses]);

  const openEnroll = () => setEnrollmentOpen(true);
  const logout = () => {
    localStorage.removeItem(STUDENT_TOKEN_KEY);
    setDashboard(null);
  };

  return (
    <div className="fx-academy">
      <ThreeBackground />
      <Header onLogin={() => setLoginOpen(true)} />
      <main>
        <Hero course={course} reserve={reserve} setReserve={setReserve} openEnroll={openEnroll} />
        {loadingCourses && <div className="fx-loading-skeleton" aria-hidden="true"><span /><span /><span /></div>}
        <StudentDashboard dashboard={dashboard} onLogout={logout} />
        <FinalCta openEnroll={openEnroll} />
      </main>
      <footer className="fx-footer">
        <span>{isArabic ? 'أكاديمية دجرو - تدريب بالذكاء الاصطناعي لصناع المحتوى والفرق.' : 'Digrro Academy - AI training for creators and teams.'}</span>
        <a href="https://wa.me/971544649231?text=Hi%20Digrro%20team%2C%20I%20want%20to%20learn%20more%20about%20Digrro%20Academy." target="_blank" rel="noreferrer">
          {isArabic ? 'تحدث مع دجرو' : 'Talk to Digrro'}
        </a>
      </footer>
      <EnrollmentModal open={enrollmentOpen} onClose={() => setEnrollmentOpen(false)} course={course} reserve={reserve} onDashboard={() => setDashboard(null)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLoggedIn={setDashboard} />
    </div>
  );
}

createRoot(document.getElementById('academy-root')).render(<App />);
