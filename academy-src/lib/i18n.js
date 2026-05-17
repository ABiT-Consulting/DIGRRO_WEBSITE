const urlLocale = new URLSearchParams(window.location.search).get('lang');
const browserLocales = Array.isArray(navigator.languages) && navigator.languages.length
  ? navigator.languages
  : [navigator.language || ''];

export const activeLocale = urlLocale === 'ar' || urlLocale === 'en'
  ? urlLocale
  : (browserLocales.some((lang) => String(lang).toLowerCase().startsWith('ar')) ? 'ar' : 'en');

export const isArabic = activeLocale === 'ar';

const ar = {
  'meta.title': 'أكاديمية دجرو | تدريب صناعة المحتوى والإنتاج الإعلامي بالذكاء الاصطناعي',
  'meta.description': 'احجز مقعدك في أكاديمية دجرو لبرنامج تدريبي مدته 12 ساعة في صناعة المحتوى والإنتاج الإعلامي بالذكاء الاصطناعي.',
  'brand.name': 'أكاديمية دجرو',
  'nav.hasAccount': 'لديك حساب بالفعل؟',
  'nav.login': 'تسجيل الدخول',
  'hero.eyebrow': 'تدريب مدعوم بالذكاء الاصطناعي',
  'hero.title': 'أتقن صناعة المحتوى بالذكاء الاصطناعي و<span>الإنتاج الإعلامي</span>',
  'hero.subtitle': 'من الصفر إلى الاحتراف خلال 12 ساعة',
  'hero.lede': 'برنامج عملي من الفكرة إلى الإنتاج لبناء صور الحملات، الفيديوهات القصيرة، التعليقات الصوتية، القوالب، وسير العمل الجاهز للتنفيذ.',
  'proof.certificate.title': 'شهادة',
  'proof.certificate.text': 'من Digrro Ltd UK',
  'proof.experts.title': 'خبراء الصناعة',
  'proof.experts.text': 'كموجهين ومدربين',
  'proof.skills.title': 'مهارات مطلوبة',
  'proof.skills.text': 'لسوق اليوم',
  'proof.tools.title': 'أدوات ذكاء اصطناعي حقيقية',
  'proof.tools.text': 'تستخدمها الشركات',
  'seat.kicker': 'مقاعد محدودة',
  'seat.title': '30 مقعدا فقط متاحا',
  'seat.note': 'يغلق التسجيل تلقائيا عند اكتمال المقاعد.',
  'seat.total': 'إجمالي المقاعد',
  'creation.title': 'ما الذي ستنشئه',
  'creation.cinematic': 'فيديوهات سينمائية بالذكاء الاصطناعي',
  'creation.images': 'صور بالذكاء الاصطناعي',
  'creation.voice': 'تعليقات صوتية بالذكاء الاصطناعي',
  'creation.ads': 'إعلانات وسائل التواصل',
  'creation.product': 'صور منتجات',
  'creation.templates': 'قوالب',
  'creation.avatar': 'شخصيات افتراضية بالذكاء الاصطناعي',
  'creation.reels': 'ريلز وفيديوهات قصيرة',
  'included.projects': 'مشاريع عملية',
  'included.access': 'وصول مدى الحياة',
  'included.recordings': 'تسجيلات الجلسات',
  'included.templates': 'قوالب متضمنة',
  'trainer.title': 'مدربك: طارق باشا',
  'trainer.role': 'صانع أفلام واستراتيجي محتوى بالذكاء الاصطناعي',
  'trainer.point1': 'خبرة 8+ سنوات في الإعلام وصناعة المحتوى',
  'trainer.point2': 'عمل مع علامات تجارية ووكالات وشركات ناشئة',
  'trainer.point3': 'خبير في أدوات الذكاء الاصطناعي للفيديو والصورة والصوت',
  'trainer.point4': 'درّب آلاف الطلاب حول العالم',
  'meta.language': 'اللغة',
  'meta.languageValue': 'العربية / الإنجليزية',
  'meta.duration': 'المدة',
  'meta.durationValue': '12 ساعة',
  'meta.certificate': 'الشهادة',
  'meta.included': 'متضمنة',
  'meta.access': 'الوصول',
  'meta.lifetime': 'مدى الحياة',
  'meta.level': 'المستوى',
  'meta.levelValue': 'من مبتدئ إلى محترف',
  'reserve.title': 'احجز مقعدك الآن',
  'reserve.copy': 'املأ بياناتك لتأكيد مقعدك.',
  'reserve.name': 'الاسم الكامل',
  'reserve.email': 'البريد الإلكتروني',
  'reserve.phone': 'رقم الهاتف',
  'payment.title': 'اختر طريقة الدفع',
  'payment.online': 'ادفع أونلاين <em>(موصى به)</em>',
  'payment.secure': 'ادفع بأمان بالبطاقة عبر Stripe',
  'price.label': 'سعر الدورة',
  'price.value': '200 دولار',
  'reserve.cta': 'احجز مقعدي الآن',
  'price.safe': 'دفع آمن <b>&bull;</b> 100% آمن',
  'benefits.title': 'ما الذي ستحصل عليه',
  'benefits.training': '12 ساعة تدريب مع خبير',
  'benefits.certificate': 'شهادة إتمام',
  'benefits.projects': 'مشاريع عملية',
  'benefits.recordings': 'تسجيلات الجلسات',
  'benefits.community': 'مجتمع خاص',
  'benefits.access': 'وصول مدى الحياة',
  'benefits.support': 'دعم وأسئلة وأجوبة',
  'reserve.loginText': 'لديك حساب؟',
  'trust.payment.title': 'دفع آمن',
  'trust.payment.text': 'مدفوعاتك محمية بمعايير أمان عالية.',
  'trust.guarantee.title': 'ضمان الرضا',
  'trust.guarantee.text': 'استرداد كامل خلال 7 أيام إذا لم تكن راضيا.',
  'trust.access.title': 'وصول فوري',
  'trust.access.text': 'احصل على الوصول إلى الدورة بعد نجاح الدفع.',
  'trust.community.title': 'مجتمع خاص',
  'trust.community.text': 'انضم إلى مجتمع من صناع المحتوى واحصل على دعم خاص.',
  'portal.kicker': 'بوابة الطالب',
  'portal.title': 'دوراتك في الأكاديمية',
  'portal.desc': 'سجل الدخول لعرض التسجيلات، حالة الدفع، وروابط الجلسات.',
  'portal.logout': 'تسجيل الخروج',
  'footer.copy': 'أكاديمية دجرو - تدريب ذكاء اصطناعي لفرق التسويق والمحتوى والإعلام.',
  'footer.back': 'العودة إلى الموقع الرئيسي',
  'footer.talk': 'تحدث مع دجرو',
  'modal.kicker': 'دفع مرتبط بالحساب',
  'modal.selectedPlan': 'الخطة المختارة',
  'modal.copy': 'أكمل بياناتك للتسجيل والمتابعة إلى Stripe.',
  'modal.planDetails': 'تفاصيل الخطة',
  'modal.name': 'الاسم الكامل',
  'modal.email': 'البريد الإلكتروني',
  'modal.confirmEmail': 'تأكيد البريد الإلكتروني',
  'modal.phone': 'الهاتف',
  'modal.password': 'كلمة المرور',
  'modal.passwordPlaceholder': '8 أحرف على الأقل',
  'modal.address': 'العنوان',
  'modal.country': 'الدولة',
  'modal.city': 'المدينة',
  'modal.company': 'الشركة (اختياري)',
  'modal.status': 'اختر خطة للمتابعة.',
  'modal.continueStripe': 'المتابعة إلى Stripe',
  'modal.cancel': 'إلغاء',
  'modal.hasAccount': 'لديك حساب بالفعل؟',
  'modal.loginInstead': 'سجل الدخول بدلا من ذلك',
  'login.kicker': 'تسجيل الدخول',
  'login.title': 'تسجيل الدخول إلى الأكاديمية',
  'login.copy': 'استخدم البريد الإلكتروني وكلمة المرور من تسجيلك.',
  'login.emailPlaceholder': 'you@company.com',
  'login.passwordPlaceholder': 'كلمة المرور',
  'login.forgot': 'نسيت كلمة المرور؟',
  'login.verify': 'سنتحقق من حسابك مقابل التسجيل المحفوظ.',
  'login.button': 'تسجيل الدخول',
  'login.noAccount': 'ليس لديك حساب؟',
  'login.reserveSeat': 'احجز مقعدا',
  'status.packageFull': 'هذه الباقة مكتملة. تم حجز المقاعد الثلاثين المتاحة.',
  'status.enrollmentStart': 'أكمل تسجيلك أولا. سترسل دجرو رسالة تأكيد من system@digrro.com قبل الدفع عبر Stripe.',
  'status.completeRequired': 'أكمل جميع حقول التسجيل المطلوبة قبل الدفع.',
  'status.emailMismatch': 'يجب أن يتطابق البريد الإلكتروني مع تأكيد البريد.',
  'status.phoneInvalid': 'أدخل رقم هاتف صحيحا.',
  'status.passwordShort': 'استخدم كلمة مرور من 8 أحرف على الأقل.',
  'status.saving': 'يتم حفظ تسجيلك وتجهيز الدفع الآمن عبر Stripe...',
  'status.registerError': 'تعذر إكمال التسجيل.',
  'status.noStripe': 'تم حفظ التسجيل، لكن Stripe غير مهيأ لهذه الخطة بعد.',
  'status.redirectStripe': 'تم حفظ التسجيل. يتم تحويلك إلى Stripe...',
  'status.loginRequired': 'أدخل بريدك الإلكتروني وكلمة المرور.',
  'status.verifying': 'يتم التحقق من حسابك...',
  'status.loginError': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'status.loggedIn': 'تم تسجيل الدخول.',
  'status.loggedOut': 'تم تسجيل الخروج.',
  'status.forgotEmail': 'أدخل بريدك المسجل أولا، ثم اختر نسيت كلمة المرور.',
  'status.sendingReset': 'يتم إرسال رابط إعادة تعيين كلمة المرور...',
  'status.resetSent': 'إذا كان هذا البريد مسجلا، فقد أرسلنا رابط إعادة التعيين.',
  'status.resetFailed': 'تعذر إرسال رابط إعادة التعيين.',
  'status.serviceUnavailable': 'الخدمة غير متاحة في هذه البيئة حاليا.',
  'status.requestFailed': 'فشل الطلب.',
  'status.ready': 'جاهز للتعلم',
  'status.paymentPending': 'الدفع قيد الانتظار',
  'portal.welcome': 'مرحبا {name}. تابع التسجيلات وحالة الدفع وروابط الجلسات هنا.',
  'portal.account': 'الحساب',
  'portal.enrollments': 'التسجيلات',
  'portal.unlocked': 'المفتوحة',
  'portal.email': 'البريد',
  'portal.confirmed': 'مؤكد',
  'portal.pending': 'قيد الانتظار',
  'portal.noCourses': 'لا توجد دورات بعد',
  'portal.noCoursesCopy': 'احجز مقعدك، أنشئ حسابك، وأكمل الدفع عبر Stripe لفتح الوصول إلى الجلسات.',
  'portal.startLearning': 'ابدأ التعلم',
  'portal.linkComing': 'رابط الجلسة قادم قريبا',
  'portal.completePayment': 'أكمل الدفع عبر Stripe',
  'portal.reserveAgain': 'احجز مرة أخرى',
  'course.sprint.label': 'تدريب صناعة المحتوى والإنتاج الإعلامي بالذكاء الاصطناعي',
  'course.sprint.meta': 'برنامج تدريبي لمدة 12 ساعة. 30 مقعدا فقط.',
  'course.sprint.description': 'من الفكرة إلى الإنتاج: صناعة محتوى وإعلام عملي بالذكاء الاصطناعي.',
  'course.sprint.duration': '12 ساعة',
  'course.sprint.seats': '30 مقعدا',
  'course.sprint.trainer': 'طارق باشا',
  'course.seatsRemaining': 'تبقى {remaining} من {limit} مقعدا.',
  'course.full': 'اكتمل العدد.',
};

function format(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => (
    values[key] == null ? '' : String(values[key])
  ));
}

export function t(key, fallback = '', values = {}) {
  const dictionary = isArabic ? ar : {};
  const text = dictionary[key] || fallback || key;
  return format(text, values);
}

function setText(selector, key, fallback) {
  const node = document.querySelector(selector);
  if (node) node.textContent = t(key, fallback);
}

function setHtml(selector, key, fallback) {
  const node = document.querySelector(selector);
  if (node) node.innerHTML = t(key, fallback);
}

function setAttr(selector, attr, key, fallback) {
  const node = document.querySelector(selector);
  if (node) node.setAttribute(attr, t(key, fallback));
}

function setField(selector, key, fallback) {
  setText(`${selector} span`, key, fallback);
  setAttr(`${selector} input`, 'placeholder', key, fallback);
}

export function applyPageLocale() {
  document.documentElement.lang = activeLocale;
  document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
  document.body.classList.toggle('is-rtl', isArabic);

  if (!isArabic) return;

  document.title = t('meta.title');
  setAttr('meta[name="description"]', 'content', 'meta.description');
  setAttr('meta[property="og:title"]', 'content', 'meta.title');
  setAttr('meta[property="og:description"]', 'content', 'meta.description');

  setText('.brand span', 'brand.name');
  setText('.account-link > span', 'nav.hasAccount');
  document.querySelectorAll('[data-open-login]').forEach((node) => {
    if (node.matches('a')) node.textContent = t('nav.login');
    if (node.matches('button')) node.setAttribute('aria-label', t('nav.login'));
  });

  setHtml('.eyebrow', `<span class="icon-spark"></span> ${t('hero.eyebrow')}`);
  setHtml('.hero-copy h1', 'hero.title');
  setText('.hero-subtitle', 'hero.subtitle');
  setText('.hero-lede', 'hero.lede');

  setText('.proof-grid > div:nth-child(1) strong', 'proof.certificate.title');
  setText('.proof-grid > div:nth-child(1) small', 'proof.certificate.text');
  setText('.proof-grid > div:nth-child(2) strong', 'proof.experts.title');
  setText('.proof-grid > div:nth-child(2) small', 'proof.experts.text');
  setText('.proof-grid > div:nth-child(3) strong', 'proof.skills.title');
  setText('.proof-grid > div:nth-child(3) small', 'proof.skills.text');
  setText('.proof-grid > div:nth-child(4) strong', 'proof.tools.title');
  setText('.proof-grid > div:nth-child(4) small', 'proof.tools.text');

  setAttr('.seat-card', 'aria-label', 'seat.kicker');
  setText('.seat-kicker', 'seat.kicker');
  setText('.seat-main strong', 'seat.title');
  setText('.seat-main p', 'seat.note');
  setText('.seat-count span', 'seat.total');

  setText('#creation-title', 'creation.title');
  setText('.creation-card.cinematic span', 'creation.cinematic');
  setText('.creation-card.images span', 'creation.images');
  setText('.creation-card.voice span', 'creation.voice');
  setText('.creation-card.ads span', 'creation.ads');
  setText('.creation-card.product span', 'creation.product');
  setText('.creation-card.templates span', 'creation.templates');
  setText('.creation-card.avatar span', 'creation.avatar');
  setText('.creation-card.reels span', 'creation.reels');
  setText('.included-strip span:nth-child(1)', 'included.projects');
  setText('.included-strip span:nth-child(2)', 'included.access');
  setText('.included-strip span:nth-child(3)', 'included.recordings');
  setText('.included-strip span:nth-child(4)', 'included.templates');

  setAttr('.trainer-card', 'aria-label', 'trainer.title');
  setHtml('.trainer-card h2', `${t('trainer.title')} <span class="verified-dot"></span>`);
  setText('.trainer-card p', 'trainer.role');
  setText('.check-list li:nth-child(1)', 'trainer.point1');
  setText('.check-list li:nth-child(2)', 'trainer.point2');
  setText('.check-list li:nth-child(3)', 'trainer.point3');
  setText('.check-list li:nth-child(4)', 'trainer.point4');

  document.querySelector('.course-meta-row span:nth-child(1)')?.replaceChildren(
    Object.assign(document.createElement('b'), { className: 'meta-icon globe' }),
    document.createTextNode(` ${t('meta.language')} `),
    Object.assign(document.createElement('strong'), { textContent: t('meta.languageValue') })
  );
  document.querySelector('.course-meta-row span:nth-child(2)')?.replaceChildren(
    Object.assign(document.createElement('b'), { className: 'meta-icon clock' }),
    document.createTextNode(` ${t('meta.duration')} `),
    Object.assign(document.createElement('strong'), { textContent: t('meta.durationValue') })
  );
  document.querySelector('.course-meta-row span:nth-child(3)')?.replaceChildren(
    Object.assign(document.createElement('b'), { className: 'meta-icon badge' }),
    document.createTextNode(` ${t('meta.certificate')} `),
    Object.assign(document.createElement('strong'), { textContent: t('meta.included') })
  );
  document.querySelector('.course-meta-row span:nth-child(4)')?.replaceChildren(
    Object.assign(document.createElement('b'), { className: 'meta-icon infinity' }),
    document.createTextNode(` ${t('meta.access')} `),
    Object.assign(document.createElement('strong'), { textContent: t('meta.lifetime') })
  );
  document.querySelector('.course-meta-row span:nth-child(5)')?.replaceChildren(
    Object.assign(document.createElement('b'), { className: 'meta-icon level' }),
    document.createTextNode(` ${t('meta.level')} `),
    Object.assign(document.createElement('strong'), { textContent: t('meta.levelValue') })
  );

  setAttr('.reserve-card', 'aria-label', 'reserve.title');
  setText('.reserve-card > h2', 'reserve.title');
  setText('.reserve-card > p', 'reserve.copy');
  setField('.reserve-form label:nth-child(1)', 'reserve.name');
  setField('.reserve-form label:nth-child(2)', 'reserve.email');
  setField('.reserve-form label:nth-child(3)', 'reserve.phone');
  setText('.payment-box h3', 'payment.title');
  setHtml('.payment-option strong', 'payment.online');
  setText('.payment-option small', 'payment.secure');
  setText('.price-line span', 'price.label');
  setText('.price-line strong', 'price.value');
  setText('.btn-reserve', 'reserve.cta');
  setHtml('.price-box p', `<span class="lock-icon"></span> ${t('price.safe')}`);
  setText('.benefits-box h3', 'benefits.title');
  setHtml('.benefits-box li:nth-child(1)', `<span class="mini-icon clock"></span>${t('benefits.training')}`);
  setHtml('.benefits-box li:nth-child(2)', `<span class="mini-icon badge"></span>${t('benefits.certificate')}`);
  setHtml('.benefits-box li:nth-child(3)', `<span class="mini-icon projects"></span>${t('benefits.projects')}`);
  setHtml('.benefits-box li:nth-child(4)', `<span class="mini-icon play"></span>${t('benefits.recordings')}`);
  setHtml('.benefits-box li:nth-child(5)', `<span class="mini-icon community"></span>${t('benefits.community')}`);
  setHtml('.benefits-box li:nth-child(6)', `<span class="mini-icon infinity"></span>${t('benefits.access')}`);
  setHtml('.benefits-box li:nth-child(7)', `<span class="mini-icon support"></span>${t('benefits.support')}`);
  setHtml('.reserve-login', `${t('reserve.loginText')} <a class="link" href="#login" data-open-login>${t('nav.login')}</a>`);

  setText('.trust-row article:nth-child(1) h3', 'trust.payment.title');
  setText('.trust-row article:nth-child(1) p', 'trust.payment.text');
  setText('.trust-row article:nth-child(2) h3', 'trust.guarantee.title');
  setText('.trust-row article:nth-child(2) p', 'trust.guarantee.text');
  setText('.trust-row article:nth-child(3) h3', 'trust.access.title');
  setText('.trust-row article:nth-child(3) p', 'trust.access.text');
  setText('.trust-row article:nth-child(4) h3', 'trust.community.title');
  setText('.trust-row article:nth-child(4) p', 'trust.community.text');

  setText('.portal-head .section-kicker', 'portal.kicker');
  setText('.portal-head .section-title', 'portal.title');
  setText('#student-welcome', 'portal.desc');
  setText('#student-logout', 'portal.logout');
  setText('.footer-copy', 'footer.copy');
  setText('.footer-actions .btn-ghost', 'footer.back');
  setText('.footer-actions .btn-secondary', 'footer.talk');

  setText('#enrollment-modal .section-kicker', 'modal.kicker');
  setText('#selected-plan-name', 'modal.selectedPlan');
  setText('#enrollment-modal .modal-head p', 'modal.copy');
  setText('#selected-plan-meta', 'modal.planDetails');
  setText('label[for="enrollment-name"]', 'modal.name');
  setText('label[for="enrollment-email"]', 'modal.email');
  setText('label[for="enrollment-email-confirm"]', 'modal.confirmEmail');
  setText('label[for="enrollment-phone"]', 'modal.phone');
  setText('label[for="enrollment-password"]', 'modal.password');
  setAttr('#enrollment-password', 'placeholder', 'modal.passwordPlaceholder');
  setText('label[for="enrollment-address"]', 'modal.address');
  setText('label[for="enrollment-country"]', 'modal.country');
  setText('label[for="enrollment-city"]', 'modal.city');
  setText('label[for="enrollment-company"]', 'modal.company');
  setText('#enrollment-status', 'modal.status');
  setText('#enrollment-submit', 'modal.continueStripe');
  setText('#modal-cancel', 'modal.cancel');
  setAttr('#modal-close', 'aria-label', 'modal.cancel');
  setHtml('#enrollment-form .modal-foot', `${t('modal.hasAccount')} <a class="link" href="#login" data-open-login data-close-and-login>${t('modal.loginInstead')}</a>`);

  setText('#login-modal .section-kicker', 'login.kicker');
  setText('#login-modal-title', 'login.title');
  setText('#login-modal .modal-head p', 'login.copy');
  setText('label[for="login-modal-email"]', 'modal.email');
  setAttr('#login-modal-email', 'placeholder', 'login.emailPlaceholder');
  setText('label[for="login-modal-password"]', 'modal.password');
  setAttr('#login-modal-password', 'placeholder', 'login.passwordPlaceholder');
  setText('[data-forgot-password]', 'login.forgot');
  setText('#login-modal-status', 'login.verify');
  setText('#login-modal-submit', 'login.button');
  setAttr('#login-modal-close', 'aria-label', 'modal.cancel');
  setHtml('#login-modal-form .modal-foot', `${t('login.noAccount')} <a class="link" href="#login" data-close-modal>${t('login.reserveSeat')}</a>`);
}

export function localizePlan(plan) {
  if (!isArabic || !plan) return plan;
  const key = plan.key || 'sprint';
  return {
    ...plan,
    label: t(`course.${key}.label`, plan.label),
    priceText: t('price.value', plan.priceText),
    meta: t(`course.${key}.meta`, plan.meta),
    description: t(`course.${key}.description`, plan.description || ''),
    durationText: t(`course.${key}.duration`, plan.durationText || ''),
    audienceText: t(`course.${key}.seats`, plan.audienceText || ''),
    teacherName: t(`course.${key}.trainer`, plan.teacherName || ''),
  };
}
