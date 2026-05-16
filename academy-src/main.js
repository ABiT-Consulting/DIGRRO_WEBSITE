import './styles.css';
import { getPlan } from './lib/plans.js';
import { getStripeCheckoutLabel } from './lib/stripe-links.js';
import { loadAndRenderCourses } from './lib/courses.js';

const REGISTER_API = './api/register.php';
const LOGIN_API = './api/login.php';
const STUDENT_API = './api/student.php';
const REQUEST_PASSWORD_RESET_API = './api/request-password-reset.php';
const STUDENT_TOKEN_KEY = 'digrro_academy_student_token';
const $ = (id) => document.getElementById(id);
let lastEnrollTrigger = null;
let lastLoginTrigger = null;
const dynamicPlans = new Map();

function resolvePlan(planKey) {
  if (dynamicPlans.has(planKey)) return dynamicPlans.get(planKey);
  return getPlan(planKey);
}

function bindEnrollButtons() {
  document.querySelectorAll('[data-enroll-plan]').forEach((b) => {
    if (b.dataset.enrollBound === '1') return;
    b.dataset.enrollBound = '1';
    b.addEventListener('click', (e) => { e.preventDefault(); openEnrollment(b.getAttribute('data-enroll-plan'), b); });
  });
}

// --- helpers ---
function ref() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'academy-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}
function api(p) { return new URL(p, window.location.href).href; }
function setStatus(n, m, k) {
  if (!n) return;
  n.textContent = m;
  n.classList.remove('is-error', 'is-success');
  if (k) n.classList.add('is-' + k);
}
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
async function postJson(url, body) {
  try {
    const r = await fetch(url, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return { ok: false, message: 'Service not available in this environment yet.' };
    const d = await r.json();
    if (!r.ok || !d || !d.ok) return { ok: false, message: (d && d.message) || 'Request failed.' };
    return d;
  } catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Request failed.' }; }
}
async function getJson(url, token) {
  try {
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    const r = await fetch(url, { method: 'GET', headers });
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return { ok: false, status: r.status, message: 'Service not available in this environment yet.' };
    const d = await r.json();
    if (!r.ok || !d || !d.ok) return { ok: false, status: r.status, message: (d && d.message) || 'Request failed.' };
    return d;
  } catch (e) {
    return { ok: false, status: 0, message: e instanceof Error ? e.message : 'Request failed.' };
  }
}

// --- modal control ---
function openModal(modalId, focusId, trigger, isEnroll) {
  const m = $(modalId);
  if (!m) return;
  if (trigger instanceof HTMLElement) {
    if (isEnroll) lastEnrollTrigger = trigger; else lastLoginTrigger = trigger;
  }
  m.removeAttribute('inert');
  m.classList.add('is-open');
  m.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => { const n = $(focusId); if (n) n.focus(); });
}
function closeModal(modalId, isEnroll) {
  const m = $(modalId);
  if (!m) return;
  const a = document.activeElement;
  if (a instanceof HTMLElement && m.contains(a)) a.blur();
  m.classList.remove('is-open');
  m.setAttribute('aria-hidden', 'true');
  m.setAttribute('inert', '');
  const t = isEnroll ? lastEnrollTrigger : lastLoginTrigger;
  if (t instanceof HTMLElement && document.contains(t)) t.focus();
  if (isEnroll) lastEnrollTrigger = null; else lastLoginTrigger = null;
}
const closeEnroll = () => closeModal('enrollment-modal', true);
const closeLogin = () => closeModal('login-modal', false);
const closeAll = () => { closeEnroll(); closeLogin(); };

function openEnrollment(planKey, trigger) {
  const plan = resolvePlan(planKey);
  if (!plan) return;
  if (plan.isFull) {
    setStatus(
      $('enrollment-status'),
      'This package is full. The 30 available seats have already been reserved.',
      'error'
    );
    return;
  }
  const f = $('enrollment-form'); if (f) f.reset();
  const reserveName = $('reserve-name');
  const reserveEmail = $('reserve-email');
  const reservePhone = $('reserve-phone');
  if (reserveName && $('enrollment-name')) $('enrollment-name').value = reserveName.value.trim();
  if (reserveEmail && $('enrollment-email')) {
    const email = reserveEmail.value.trim().toLowerCase();
    $('enrollment-email').value = email;
    if ($('enrollment-email-confirm')) $('enrollment-email-confirm').value = email;
  }
  if (reservePhone && $('enrollment-phone')) $('enrollment-phone').value = reservePhone.value.trim();
  if ($('selected-plan-name')) $('selected-plan-name').textContent = plan.label;
  if ($('selected-plan-amount')) $('selected-plan-amount').textContent = plan.priceText;
  if ($('selected-plan-meta')) $('selected-plan-meta').textContent = plan.meta;
  if ($('selected-plan-key')) $('selected-plan-key').value = plan.key;
  setStatus($('enrollment-status'), 'Complete your registration first. Digrro will send a confirmation from system@digrro.com before Stripe checkout.');
  const sb = $('enrollment-submit');
  if (sb) { sb.textContent = getStripeCheckoutLabel(); sb.disabled = false; }
  openModal('enrollment-modal', 'enrollment-name', trigger, true);
}
function openLogin(trigger) {
  const f = $('login-modal-form'); if (f) f.reset();
  const saved = localStorage.getItem('digrro_academy_email');
  const modalEmail = $('login-modal-email');
  if (saved && modalEmail) modalEmail.value = saved;
  setStatus($('login-modal-status'), 'We will verify your account against your saved registration.');
  openModal('login-modal', 'login-modal-email', trigger, false);
}

function paymentLabel(enrollment) {
  if (enrollment.isPaid) return 'Ready to learn';
  const status = String(enrollment.paymentStatus || '').replace(/_/g, ' ');
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Payment pending';
}

function renderStudentDashboard(dashboard) {
  const section = $('student-dashboard');
  const welcome = $('student-welcome');
  const summary = $('student-summary');
  const coursesNode = $('student-courses');
  if (!section || !dashboard || !dashboard.user || !coursesNode) return;

  const user = dashboard.user;
  const enrollments = Array.isArray(dashboard.enrollments) ? dashboard.enrollments : [];
  section.hidden = false;
  if (welcome) {
    welcome.textContent = 'Welcome, ' + (user.fullName || user.email) + '. Track enrollments, payment status, and class access here.';
  }
  if (summary) {
    const paidCount = enrollments.filter((e) => e.isPaid).length;
    summary.innerHTML =
      '<div><span class="portal-stat-label">Account</span><strong>' + escapeHtml(user.email) + '</strong></div>' +
      '<div><span class="portal-stat-label">Enrollments</span><strong>' + enrollments.length + '</strong></div>' +
      '<div><span class="portal-stat-label">Unlocked</span><strong>' + paidCount + '</strong></div>' +
      '<div><span class="portal-stat-label">Email</span><strong>' + (user.emailConfirmed ? 'Confirmed' : 'Pending') + '</strong></div>';
  }

  if (!enrollments.length) {
    coursesNode.innerHTML =
      '<article class="portal-course">' +
        '<h3>No courses yet</h3>' +
        '<p>Choose a course below, create your account, and complete Stripe checkout to unlock class access.</p>' +
        '<a class="btn btn-primary" href="#programs">View courses</a>' +
      '</article>';
    return;
  }

  coursesNode.innerHTML = enrollments.map((enrollment) => {
    const course = enrollment.course || {};
    const features = Array.isArray(course.features) ? course.features.slice(0, 3) : [];
    const statusClass = enrollment.isPaid ? 'is-success' : 'is-warning';
    const action = enrollment.isPaid
      ? (course.learningUrl
        ? '<a class="btn btn-primary" href="' + escapeHtml(course.learningUrl) + '" target="_blank" rel="noreferrer">Start learning</a>'
        : '<button class="btn btn-secondary" type="button" disabled>Class link coming soon</button>')
      : (enrollment.checkoutUrl
        ? '<a class="btn btn-primary" href="' + escapeHtml(enrollment.checkoutUrl) + '">Complete Stripe payment</a>'
        : '<a class="btn btn-secondary" href="#programs">Enroll again</a>');

    return '<article class="portal-course">' +
      '<div class="portal-course-head">' +
        '<div>' +
          '<span class="portal-status ' + statusClass + '">' + escapeHtml(paymentLabel(enrollment)) + '</span>' +
          '<h3>' + escapeHtml(course.label || enrollment.planName) + '</h3>' +
        '</div>' +
        '<strong>$' + Number(enrollment.amountUsd || 0).toLocaleString() + '</strong>' +
      '</div>' +
      '<div class="plan-flags">' +
        (course.durationText ? '<span class="plan-flag">' + escapeHtml(course.durationText) + '</span>' : '') +
        (course.audienceText ? '<span class="plan-flag">' + escapeHtml(course.audienceText) + '</span>' : '') +
        (course.teacherName ? '<span class="plan-flag">' + escapeHtml(course.teacherName) + '</span>' : '') +
      '</div>' +
      (course.description ? '<p>' + escapeHtml(course.description) + '</p>' : '') +
      (features.length ? '<ul class="plan-list">' + features.map((f) => '<li>' + escapeHtml(f) + '</li>').join('') + '</ul>' : '') +
      '<div class="portal-actions">' + action + '</div>' +
    '</article>';
  }).join('');
}

function logoutStudent() {
  localStorage.removeItem(STUDENT_TOKEN_KEY);
  const section = $('student-dashboard');
  if (section) section.hidden = true;
  setStatus($('login-status'), 'You have been logged out.');
}

async function loadSavedStudent() {
  const token = localStorage.getItem(STUDENT_TOKEN_KEY);
  if (!token) return;
  const result = await getJson(api(STUDENT_API), token);
  if (!result.ok) {
    localStorage.removeItem(STUDENT_TOKEN_KEY);
    return;
  }
  renderStudentDashboard(result.dashboard);
}

// --- enrollment submit ---
async function handleEnrollSubmit(event) {
  event.preventDefault();
  const status = $('enrollment-status');
  const submit = $('enrollment-submit');
  const plan = resolvePlan($('selected-plan-key').value);
  const fullName = $('enrollment-name').value.trim();
  const email = $('enrollment-email').value.trim().toLowerCase();
  const confirmEmail = $('enrollment-email-confirm').value.trim().toLowerCase();
  const phoneNumber = $('enrollment-phone').value.trim();
  const password = $('enrollment-password').value;
  const addressLine = $('enrollment-address').value.trim();
  const country = $('enrollment-country').value.trim();
  const city = $('enrollment-city').value.trim();
  const pincode = $('enrollment-pincode') ? $('enrollment-pincode').value.trim() : '';
  const company = $('enrollment-company').value.trim();
  const cref = ref();

  if (!plan) return setStatus(status, 'Please choose a valid training plan.', 'error');
  if (!fullName || !email || !confirmEmail || !phoneNumber || !addressLine || !country || !city || !pincode) {
    return setStatus(status, 'Complete all required registration fields before checkout.', 'error');
  }
  if (email !== confirmEmail) return setStatus(status, 'Email and confirm email must match.', 'error');
  if (phoneNumber.replace(/\D/g, '').length < 7) return setStatus(status, 'Enter a valid phone number.', 'error');
  if (password.length < 8) return setStatus(status, 'Use a password with at least 8 characters.', 'error');

  submit.disabled = true;
  setStatus(status, 'Saving your registration and preparing secure Stripe checkout...');
  localStorage.setItem('digrro_academy_email', email);
  localStorage.setItem('digrro_academy_checkout_reference', cref);
  localStorage.setItem('digrro_academy_selected_plan', plan.key);

  const result = await postJson(api(REGISTER_API), {
    planKey: plan.key, checkoutReference: cref,
    fullName, email, confirmEmail, phoneNumber, password,
    addressLine, country, city, pincode, company
  });

  if (!result.ok) { setStatus(status, result.message || 'We could not complete your registration.', 'error'); submit.disabled = false; return; }
  if (!result.checkoutUrl) { setStatus(status, 'Registration saved, but Stripe checkout is not configured for this plan yet.', 'success'); submit.disabled = false; return; }
  setStatus(status, result.message || 'Registration saved. Redirecting to Stripe...', 'success');
  window.location.href = result.checkoutUrl;
}

// --- login submit ---
async function handleLoginSubmit(event, src) {
  event.preventDefault();
  const email = src.emailInput.value.trim().toLowerCase();
  const password = src.passwordInput.value;
  const status = src.statusNode;
  const submit = src.submitButton;

  if (!email || !password) return setStatus(status, 'Enter your email and password.', 'error');
  if (password.length < 8) return setStatus(status, 'Password must be at least 8 characters.', 'error');

  submit.disabled = true;
  setStatus(status, 'Verifying your account...');
  const result = await postJson(api(LOGIN_API), { email, password });
  submit.disabled = false;

  if (!result.ok) return setStatus(status, result.message || 'Email or password is incorrect.', 'error');
  localStorage.setItem('digrro_academy_email', email);
  if (result.token) localStorage.setItem(STUDENT_TOKEN_KEY, result.token);
  renderStudentDashboard(result.dashboard);
  closeLogin();
  setStatus(status, result.message || 'Logged in.', 'success');
  const dashboard = $('student-dashboard');
  if (dashboard) dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function handleForgot(event) {
  event.preventDefault();
  const link = event.currentTarget;
  if (link instanceof HTMLElement && link.getAttribute('aria-disabled') === 'true') return;

  const form = link instanceof HTMLElement ? link.closest('form') : null;
  const emailInput = form ? form.querySelector('input[type="email"]') : null;
  const status = form ? form.querySelector('.form-status') : null;
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

  if (!email) {
    setStatus(status, 'Enter your registered email first, then choose Forgot password.', 'error');
    if (emailInput) emailInput.focus();
    return;
  }

  if (link instanceof HTMLElement) {
    link.setAttribute('aria-disabled', 'true');
    link.classList.add('is-disabled');
  }
  setStatus(status, 'Sending a password reset link...');

  const result = await postJson(api(REQUEST_PASSWORD_RESET_API), { email });

  if (link instanceof HTMLElement) {
    link.removeAttribute('aria-disabled');
    link.classList.remove('is-disabled');
  }

  setStatus(
    status,
    result.message || (result.ok ? 'If this email is registered, we sent a password reset link.' : 'Could not send reset link.'),
    result.ok ? 'success' : 'error'
  );
}

// --- init ---
function init() {
  bindEnrollButtons();

  loadAndRenderCourses((courses) => {
    for (const c of courses) {
      const limit = Number(c.seatLimit || 0);
      const remaining = Number(c.seatsRemaining ?? limit);
      const seatMeta = limit
        ? (c.isFull || remaining <= 0 ? 'Cohort full.' : remaining + ' of ' + limit + ' seats remain.')
        : '';
      dynamicPlans.set(c.key, {
        key: c.key,
        label: c.label,
        priceText: c.priceText || ('$' + Number(c.amountUsd || 0).toLocaleString()),
        meta: [c.description || c.audienceText || '', seatMeta].filter(Boolean).join(' '),
        amountUsd: c.amountUsd,
        checkoutDescription: c.checkoutDescription || '',
        seatLimit: limit,
        seatsRemaining: remaining,
        isFull: !!c.isFull
      });
    }
    bindEnrollButtons();
  });

  document.querySelectorAll('[data-open-login]').forEach((t) => {
    t.addEventListener('click', (e) => {
      if (t.hasAttribute('data-close-and-login')) { e.preventDefault(); closeEnroll(); openLogin(t); return; }
      e.preventDefault();
      openLogin(t);
    });
  });

  document.querySelectorAll('[data-forgot-password]').forEach((l) => l.addEventListener('click', handleForgot));

  if ($('modal-close')) $('modal-close').addEventListener('click', closeEnroll);
  if ($('modal-cancel')) $('modal-cancel').addEventListener('click', closeEnroll);
  if ($('login-modal-close')) $('login-modal-close').addEventListener('click', closeLogin);
  document.querySelectorAll('[data-close-modal]').forEach((n) => n.addEventListener('click', closeAll));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });

  if ($('enrollment-form')) $('enrollment-form').addEventListener('submit', handleEnrollSubmit);
  if ($('student-logout')) $('student-logout').addEventListener('click', logoutStudent);

  const heroForm = $('login-form');
  if (heroForm) heroForm.addEventListener('submit', (e) => handleLoginSubmit(e, {
    emailInput: $('login-email'), passwordInput: $('login-password'),
    statusNode: $('login-status'), submitButton: $('login-submit')
  }));

  const modalForm = $('login-modal-form');
  if (modalForm) modalForm.addEventListener('submit', (e) => handleLoginSubmit(e, {
    emailInput: $('login-modal-email'), passwordInput: $('login-modal-password'),
    statusNode: $('login-modal-status'), submitButton: $('login-modal-submit')
  }));

  const saved = localStorage.getItem('digrro_academy_email');
  const heroEmail = $('login-email');
  if (saved && heroEmail && !heroEmail.value) heroEmail.value = saved;

  loadSavedStudent();
}

init();
