// Vite plugin that serves the Academy API in dev + preview modes — no PHP required.
// Persists courses to a JSON file on disk and uses scrypt + HMAC for admin auth.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Stripe from 'stripe';

const DEFAULT_COURSES = [
  {
    key: 'sprint',
    label: 'AI Content Creation & Media Production Training',
    amountUsd: 200,
    durationText: '12 hours',
    audienceText: '30 seats',
    badge: 'Limited seats',
    description: 'From Prompt to Production: hands-on AI content and media creation.',
    features: [
      'Build prompt libraries, campaign images, scripts, storyboards, and short-form video assets',
      'Create brand-ready image, video, and voice outputs with Arabic and English workflows',
      'Leave with templates, QA rubrics, governance checklists, and a 30-day action plan'
    ],
    checkoutDescription: 'From Prompt to Production: a 12-hour AI content creation and media production bootcamp with hands-on image, video, voice, and campaign deliverables.',
    teacherName: 'Tarek Bacha',
    learningUrl: '',
    displayOrder: 0,
    seatLimit: 30,
    isActive: true
  }
];
const ALLOWED_PLAN_KEYS = new Set(DEFAULT_COURSES.map((course) => course.key));

function b64u(buf) {
  return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function b64uDecode(str) {
  let s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}
function nowSec() { return Math.floor(Date.now() / 1000); }

function makeStorage(dataFile) {
  function ensure() {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    let courses = [];
    if (fs.existsSync(dataFile)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        courses = Array.isArray(parsed) ? parsed : [];
      } catch {
        courses = [];
      }
    }

    const existingByKey = new Map(courses.map((course) => [course && course.key, course]).filter(([key]) => Boolean(key)));
    let nextCourseId = courses.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
    const normalizedCourses = DEFAULT_COURSES.map((course) => {
      const existing = existingByKey.get(course.key);
      const id = Number(existing?.id) || nextCourseId++;
      return { id, ...course };
    });
    const changed = JSON.stringify(courses) !== JSON.stringify(normalizedCourses);
    courses = normalizedCourses;

    if (changed) {
      fs.writeFileSync(dataFile, JSON.stringify(courses, null, 2));
    }
  }
  function readAll() {
    ensure();
    try {
      const arr = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function writeAll(arr) {
    fs.writeFileSync(dataFile, JSON.stringify(arr, null, 2));
  }
  function nextId(arr) {
    return arr.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
  }
  return { ensure, readAll, writeAll, nextId };
}

function makePlatformStorage(dataFile) {
  function ensure() {
    if (fs.existsSync(dataFile)) return;
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify({ accounts: [], enrollments: [] }, null, 2));
  }
  function read() {
    ensure();
    try {
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      return {
        accounts: Array.isArray(data.accounts) ? data.accounts : [],
        enrollments: Array.isArray(data.enrollments) ? data.enrollments : []
      };
    } catch {
      return { accounts: [], enrollments: [] };
    }
  }
  function write(data) {
    fs.writeFileSync(dataFile, JSON.stringify({
      accounts: Array.isArray(data.accounts) ? data.accounts : [],
      enrollments: Array.isArray(data.enrollments) ? data.enrollments : []
    }, null, 2));
  }
  function nextId(items) {
    return items.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
  }
  return { ensure, read, write, nextId };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 32);
  return 'scrypt:' + salt.toString('hex') + ':' + derived.toString('hex');
}

function verifyStoredPassword(password, hash) {
  if (!hash || !password) return false;
  if (hash.startsWith('scrypt:')) {
    const parts = hash.split(':');
    if (parts.length !== 3) return false;
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    const derived = crypto.scryptSync(password, salt, expected.length);
    return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
  }
  if (hash.startsWith('plain:')) return password === hash.slice('plain:'.length);
  return false;
}

function makeAuth(env) {
  function adminEmail() { return (env.ACADEMY_ADMIN_EMAIL || '').toLowerCase().trim(); }
  function adminHash() { return env.ACADEMY_ADMIN_PASSWORD_HASH || ''; }
  function tokenSecret() { return env.ACADEMY_ADMIN_TOKEN_SECRET || ''; }
  function ttl() { return parseInt(env.ACADEMY_ADMIN_TOKEN_TTL || '28800', 10) || 28800; }
  function configured() { return adminEmail() && adminHash() && tokenSecret(); }

  function verifyPassword(password, hash) {
    return verifyStoredPassword(password, hash);
  }

  function issueToken(email) {
    const secret = tokenSecret();
    if (!secret) throw new Error('ACADEMY_ADMIN_TOKEN_SECRET not set');
    const payload = { email, role: 'admin', iat: nowSec(), exp: nowSec() + ttl() };
    const enc = b64u(JSON.stringify(payload));
    const sig = b64u(crypto.createHmac('sha256', secret).update(enc).digest());
    return enc + '.' + sig;
  }

  function verifyToken(token) {
    const secret = tokenSecret();
    if (!secret || !token) return null;
    const parts = String(token).split('.');
    if (parts.length !== 2) return null;
    const expected = crypto.createHmac('sha256', secret).update(parts[0]).digest();
    const provided = b64uDecode(parts[1]);
    if (provided.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(expected, provided)) return null;
    try {
      const payload = JSON.parse(b64uDecode(parts[0]).toString('utf8'));
      if (payload.role !== 'admin') return null;
      if (Number(payload.exp) < nowSec()) return null;
      return payload;
    } catch { return null; }
  }

  return { adminEmail, adminHash, configured, verifyPassword, issueToken, verifyToken, ttl };
}

function makeStudentAuth(env) {
  function tokenSecret() {
    return env.ACADEMY_STUDENT_TOKEN_SECRET || env.ACADEMY_ADMIN_TOKEN_SECRET || 'dev-student-secret';
  }
  function ttl() { return parseInt(env.ACADEMY_STUDENT_TOKEN_TTL || '2592000', 10) || 2592000; }
  function issueToken(account) {
    const payload = {
      accountId: Number(account.id),
      email: account.emailNormalized || account.email,
      role: 'student',
      iat: nowSec(),
      exp: nowSec() + ttl()
    };
    const enc = b64u(JSON.stringify(payload));
    const sig = b64u(crypto.createHmac('sha256', tokenSecret()).update(enc).digest());
    return enc + '.' + sig;
  }
  function verifyToken(token) {
    if (!token) return null;
    const parts = String(token).split('.');
    if (parts.length !== 2) return null;
    const expected = crypto.createHmac('sha256', tokenSecret()).update(parts[0]).digest();
    const provided = b64uDecode(parts[1]);
    if (provided.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(expected, provided)) return null;
    try {
      const payload = JSON.parse(b64uDecode(parts[0]).toString('utf8'));
      if (payload.role !== 'student') return null;
      if (Number(payload.exp) < nowSec()) return null;
      return payload;
    } catch { return null; }
  }
  return { issueToken, verifyToken, ttl };
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath, contentType) {
  if (!fs.existsSync(filePath)) return false;
  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const txt = Buffer.concat(chunks).toString('utf8');
      if (!txt) return resolve({});
      try { resolve(JSON.parse(txt)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function getBearer(req) {
  const h = req.headers.authorization || req.headers.Authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice(7).trim();
}

function priceText(amount) {
  return '$' + Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function seatLimit(course) {
  return Math.max(0, Number(course?.seatLimit || 0));
}

function enrollmentCountForPlan(data, planKey) {
  return data.enrollments.filter((enrollment) => enrollment.planKey === planKey).length;
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function runtimeEnvironment(env) {
  const configured = String(env.ACADEMY_ENV || env.APP_ENV || env.STRIPE_MODE || env.STRIPE_ENV || '').toLowerCase().trim();
  if (['production', 'prod', 'live'].includes(configured)) return 'production';
  if (['development', 'dev', 'local', 'test', 'testing'].includes(configured)) return 'development';

  const baseUrl = trimTrailingSlash(env.FRONTEND_URL || env.ACADEMY_BASE_URL || env.VITE_ACADEMY_BASE_URL || '');
  try {
    const url = new URL(baseUrl);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1') {
      return 'development';
    }
  } catch {}

  return 'production';
}

function stripeKeyMatchesEnvironment(key, environment) {
  if (environment === 'production') {
    return key.startsWith('sk_live_') || key.startsWith('rk_live_');
  }

  return key.startsWith('sk_test_') || key.startsWith('rk_test_');
}

function firstEnv(env, names) {
  for (const name of names) {
    const value = env[name];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return '';
}

function stripeSecretKey(env) {
  const environment = runtimeEnvironment(env);
  const preferred = environment === 'production'
    ? firstEnv(env, ['STRIPE_SECRET_KEY_LIVE', 'STRIPE_LIVE_SECRET_KEY', 'STRIPE_SECRET_LIVE'])
    : firstEnv(env, ['STRIPE_SECRET_KEY_TEST', 'STRIPE_TEST_SECRET_KEY', 'STRIPE_SECRET_TEST']);

  if (preferred) return preferred;

  const legacy = [
    'STRIPE_SECRET_KEY',
    'STRIPE_SECRET',
    'stripe_secret_key',
    'secret_key',
    'Secret key'
  ];

  for (const name of legacy) {
    const value = firstEnv(env, [name]);
    if (value && stripeKeyMatchesEnvironment(value, environment)) {
      return value;
    }
  }

  return '';
}

function academyBaseUrl(env) {
  return trimTrailingSlash(env.FRONTEND_URL || env.ACADEMY_BASE_URL || env.VITE_ACADEMY_BASE_URL || 'http://127.0.0.1:5174');
}

function normalizeStripeCheckoutUrl(value) {
  return String(value || '').replace(/^https:\/\/checkout\.stripe\.com\//, 'https://buy.stripe.com/');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

async function createCheckoutSession(env, plan, email, phoneNumber, checkoutReference) {
  const secretKey = stripeSecretKey(env);
  if (!secretKey) return null;

  const baseUrl = academyBaseUrl(env);
  const amountCents = Math.round(Number(plan.amountUsd || 0) * 100);
  const metadata = {
    academy_system: 'digrro_academy',
    academy_plan_key: String(plan.key || ''),
    academy_checkout_reference: checkoutReference,
    academy_email: email
  };
  const stripe = new Stripe(secretKey, { apiVersion: '2026-02-25.clover' });
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${baseUrl}/api/checkout-complete.php?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/?checkout=cancelled&plan=${encodeURIComponent(plan.key)}`,
    client_reference_id: checkoutReference,
    customer_email: email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: `Digrro Academy | ${plan.label}`,
            description: plan.checkoutDescription || plan.label,
            metadata
          }
        }
      }
    ],
    metadata,
    payment_intent_data: { metadata },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    phone_number_collection: { enabled: true },
    submit_type: 'pay',
    custom_text: {
      submit: {
        message: 'Your Digrro Academy registration will stay linked to this email address.'
      }
    }
  });

  return {
    id: session.id,
    paymentStatus: session.payment_status || 'unpaid',
    url: normalizeStripeCheckoutUrl(session.url || '')
  };
}

async function retrieveCheckoutSession(env, sessionId) {
  const secretKey = stripeSecretKey(env);
  if (!secretKey) return null;

  const stripe = new Stripe(secretKey, { apiVersion: '2026-02-25.clover' });
  return stripe.checkout.sessions.retrieve(sessionId);
}

function applyCheckoutSession(data, session) {
  const sessionId = String(session?.id || '');
  const metadata = session?.metadata || {};
  const checkoutReference = String(session?.client_reference_id || metadata.academy_checkout_reference || '');
  const paymentStatus = String(session?.payment_status || 'unpaid');
  const paymentIntentId = typeof session?.payment_intent === 'string' ? session.payment_intent : '';
  const paid = paymentStatus === 'paid' || paymentStatus === 'no_payment_required';
  const enrollment = data.enrollments.find((item) =>
    (sessionId && item.stripeCheckoutSessionId === sessionId) ||
    (checkoutReference && item.checkoutReference === checkoutReference)
  );

  if (!enrollment) return false;

  enrollment.stripeCheckoutSessionId = sessionId || enrollment.stripeCheckoutSessionId || '';
  enrollment.stripePaymentIntentId = paymentIntentId || enrollment.stripePaymentIntentId || '';
  enrollment.paymentStatus = paymentStatus;
  if (paid) {
    enrollment.academicStatus = 'payment_received';
    enrollment.paidAt = enrollment.paidAt || new Date().toISOString();
  }
  enrollment.updatedAt = new Date().toISOString();
  return true;
}

function checkoutCompleteHtml({ title, statusLabel, message, success }) {
  const accent = success ? '#5fe4ff' : '#ffcc66';
  const academyUrl = './';
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Digrro Academy Payment</title>
    <style>
      :root { color-scheme: dark; --bg: #07111f; --panel: rgba(11,25,43,.95); --line: rgba(126,169,255,.24); --text: #ebf3ff; --muted: #97abc9; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; color: var(--text); background: linear-gradient(160deg, #040a13 0%, #07111f 45%, #0a1830 100%); }
      .card { width: min(560px, 100%); padding: 2rem; border-radius: 24px; border: 1px solid var(--line); background: var(--panel); box-shadow: 0 30px 80px rgba(2, 8, 18, .45); }
      h1 { margin: 0 0 1rem; font-size: 2rem; }
      p { margin: 0; line-height: 1.7; color: var(--muted); }
      .status { display: inline-flex; margin-bottom: 1rem; padding: .45rem .75rem; border-radius: 999px; background: ${success ? 'rgba(95,228,255,.14)' : 'rgba(255,204,102,.14)'}; color: ${accent}; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; font-size: .76rem; }
      .button { display: inline-flex; margin-top: 1.5rem; padding: .95rem 1.25rem; border-radius: 999px; color: #04111f; background: ${accent}; font-weight: 700; text-decoration: none; }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="status">${escapeHtml(statusLabel)}</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <a class="button" href="${escapeHtml(academyUrl)}">Return to Digrro Academy</a>
    </main>
  </body>
</html>`;
}

function publicView(course) {
  return {
    key: course.key,
    label: course.label,
    amountUsd: Number(course.amountUsd || 0),
    priceText: priceText(course.amountUsd),
    durationText: course.durationText || '',
    audienceText: course.audienceText || '',
    teacherName: course.teacherName || '',
    badge: course.badge || '',
    description: course.description || '',
    features: Array.isArray(course.features) ? course.features : [],
    displayOrder: Number(course.displayOrder || 0),
    seatLimit: seatLimit(course)
  };
}

function validate(payload) {
  const errors = [];
  const key = String(payload.planKey || payload.key || '').trim().toLowerCase();
  const label = String(payload.label || '').trim();
  const amount = parseFloat(payload.amountUsd ?? payload.amount_usd);
  if (!/^[a-z0-9_\-]+$/.test(key)) errors.push('Plan key must be alphanumeric (letters, digits, dashes, underscores).');
  if (!label) errors.push('Label is required.');
  if (isNaN(amount) || amount < 0) errors.push('Amount must be a non-negative number.');
  let features = payload.features ?? [];
  if (typeof features === 'string') {
    features = features.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(features)) features = [];
  features = features.map((f) => String(f).trim()).filter(Boolean);
  return {
    errors,
    data: {
      key,
      label,
      amountUsd: amount,
      durationText: String(payload.durationText || '').trim(),
      audienceText: String(payload.audienceText || '').trim(),
      teacherName: String(payload.teacherName || payload.teacher_name || '').trim(),
      badge: String(payload.badge || '').trim(),
      description: String(payload.description || '').trim(),
      features,
      checkoutDescription: String(payload.checkoutDescription || '').trim(),
      learningUrl: String(payload.learningUrl || payload.learning_url || '').trim(),
      displayOrder: parseInt(payload.displayOrder ?? payload.display_order ?? 0, 10) || 0,
      isActive: payload.isActive !== false && payload.is_active !== false && payload.isActive !== 'false'
    }
  };
}

function dashboardCourseSummary(course, enrollment, includeLearningUrl) {
  const summary = {
    key: course?.key || enrollment.planKey || '',
    label: course?.label || enrollment.planName || '',
    amountUsd: Number(course?.amountUsd ?? enrollment.amountUsd ?? 0),
    durationText: course?.durationText || '',
    audienceText: course?.audienceText || '',
    teacherName: course?.teacherName || '',
    description: course?.description || '',
    features: Array.isArray(course?.features) ? course.features : []
  };
  if (includeLearningUrl) summary.learningUrl = course?.learningUrl || '';
  return summary;
}

function studentDashboard(data, courses, account) {
  const enrollments = data.enrollments
    .filter((e) => Number(e.accountId) === Number(account.id))
    .sort((a, b) => Number(b.id) - Number(a.id))
    .map((enrollment) => {
      const course = courses.find((c) => c.key === enrollment.planKey);
      const paid = enrollment.paymentStatus === 'paid' || enrollment.academicStatus === 'payment_received' || !!enrollment.paidAt;
      return {
        id: enrollment.id,
        planKey: enrollment.planKey,
        planName: enrollment.planName,
        amountUsd: Number(enrollment.amountUsd || 0),
        paymentStatus: enrollment.paymentStatus || 'payment_pending',
        academicStatus: enrollment.academicStatus || 'awaiting_payment',
        isPaid: paid,
        checkoutUrl: paid ? '' : (enrollment.checkoutUrl || ''),
        createdAt: enrollment.createdAt || '',
        paidAt: enrollment.paidAt || '',
        course: dashboardCourseSummary(course, enrollment, paid)
      };
    });

  return {
    user: {
      id: account.id,
      email: account.email,
      fullName: account.fullName,
      emailConfirmed: true,
      company: account.company || ''
    },
    enrollments,
    availableCourses: courses.filter((c) => c.isActive).map((c) => dashboardCourseSummary(c, {}, false))
  };
}

function findValidResetAccount(data, token) {
  if (!token) return null;
  const account = data.accounts.find((a) => a.passwordResetToken === token);
  if (!account || account.passwordResetUsedAt) return null;
  const expiresAt = Date.parse(account.passwordResetExpiresAt || '');
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  return account;
}

function normalizeApiPath(url) {
  if (url.startsWith('/academy/api/')) {
    return url.slice('/academy'.length);
  }

  return url;
}

export function academyApiPlugin(opts = {}) {
  const env = opts.env || {};
  const dataFile = path.resolve(opts.dataFile || './academy-data/courses.json');
  const platformFile = path.resolve(opts.platformFile || path.join(path.dirname(dataFile), 'platform.json'));
  const workspaceRoot = path.dirname(path.dirname(dataFile));
  const store = makeStorage(dataFile);
  const platform = makePlatformStorage(platformFile);
  const auth = makeAuth(env);
  const studentAuth = makeStudentAuth(env);

  async function handle(req, res, next) {
    const rawUrl = (req.url || '').split('?')[0];
    const url = normalizeApiPath(rawUrl);
    if (url === '/white_logo_digrro.png') {
      return sendFile(res, path.join(workspaceRoot, 'dist', 'white_logo_digrro.png'), 'image/png')
        || sendFile(res, path.join(workspaceRoot, 'white_logo_digrro.png'), 'image/png')
        || next();
    }
    if (url === '/favicon.png') {
      return sendFile(res, path.join(workspaceRoot, 'dist', 'favicon.png'), 'image/png')
        || sendFile(res, path.join(workspaceRoot, 'favicon.png'), 'image/png')
        || next();
    }
    if (!url.startsWith('/api/')) return next();

    try {
      // Public courses
      if (url === '/api/courses' || url === '/api/courses.php') {
        if (req.method !== 'GET') return send(res, 405, { ok: false, message: 'Method not allowed.' });
        const list = store.readAll()
          .filter((c) => c.isActive && ALLOWED_PLAN_KEYS.has(c.key))
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
          .map(publicView);
        return send(res, 200, { ok: true, courses: list });
      }

      // Admin login
      if (url === '/api/admin-login' || url === '/api/admin-login.php') {
        if (req.method !== 'POST') return send(res, 405, { ok: false, message: 'Method not allowed.' });
        if (!auth.configured()) {
          return send(res, 503, {
            ok: false,
            message: 'Trainer portal is not configured. Run: npm run academy:hash YOUR_PASSWORD, then set ACADEMY_ADMIN_EMAIL / ACADEMY_ADMIN_PASSWORD_HASH / ACADEMY_ADMIN_TOKEN_SECRET in .env'
          });
        }
        const body = await readBody(req);
        const email = String(body.email || '').toLowerCase().trim();
        const password = String(body.password || '');
        if (!email || !password) return send(res, 400, { ok: false, message: 'Email and password are required.' });
        if (email !== auth.adminEmail() || !auth.verifyPassword(password, auth.adminHash())) {
          return send(res, 401, { ok: false, message: 'Email or password is incorrect.' });
        }
        return send(res, 200, {
          ok: true,
          message: 'Logged in.',
          token: auth.issueToken(email),
          expiresIn: auth.ttl()
        });
      }

      // Admin courses CRUD (token-protected)
      if (url === '/api/admin-courses' || url === '/api/admin-courses.php') {
        const tokenPayload = auth.verifyToken(getBearer(req));
        if (!tokenPayload) return send(res, 401, { ok: false, message: 'Admin authentication required.' });

        const u = new URL('http://x' + req.url);
        const idStr = u.searchParams.get('id');
        const id = idStr && /^\d+$/.test(idStr) ? parseInt(idStr, 10) : null;

        if (req.method === 'GET') {
          return send(res, 200, { ok: true, courses: store.readAll() });
        }

        if (req.method === 'POST') {
          const body = await readBody(req);
          const v = validate(body);
          if (v.errors.length) return send(res, 400, { ok: false, message: v.errors.join(' ') });
          const all = store.readAll();
          if (all.find((c) => c.key === v.data.key)) {
            return send(res, 409, { ok: false, message: 'A course with that plan key already exists.' });
          }
          const created = { id: store.nextId(all), ...v.data };
          all.push(created);
          store.writeAll(all);
          return send(res, 201, { ok: true, course: created });
        }

        if (req.method === 'PUT' || req.method === 'PATCH') {
          if (!id) return send(res, 400, { ok: false, message: 'Course id is required.' });
          const body = await readBody(req);
          const v = validate(body);
          if (v.errors.length) return send(res, 400, { ok: false, message: v.errors.join(' ') });
          const all = store.readAll();
          const idx = all.findIndex((c) => c.id === id);
          if (idx === -1) return send(res, 404, { ok: false, message: 'Course not found.' });
          if (all.find((c) => c.key === v.data.key && c.id !== id)) {
            return send(res, 409, { ok: false, message: 'A course with that plan key already exists.' });
          }
          all[idx] = { id, ...v.data };
          store.writeAll(all);
          return send(res, 200, { ok: true, course: all[idx] });
        }

        if (req.method === 'DELETE') {
          if (!id) return send(res, 400, { ok: false, message: 'Course id is required.' });
          const all = store.readAll();
          const idx = all.findIndex((c) => c.id === id);
          if (idx === -1) return send(res, 404, { ok: false, message: 'Course not found.' });
          all.splice(idx, 1);
          store.writeAll(all);
          return send(res, 200, { ok: true, message: 'Course removed.' });
        }
        return send(res, 405, { ok: false, message: 'Method not allowed.' });
      }

      // Student registration and login for local Vite preview.
      if (url === '/api/register' || url === '/api/register.php') {
        if (req.method !== 'POST') return send(res, 405, { ok: false, message: 'Method not allowed.' });
        const body = await readBody(req);
        const planKey = String(body.planKey || '').trim().toLowerCase();
        const courses = store.readAll();
        const plan = courses.find((c) => c.key === planKey && c.isActive && ALLOWED_PLAN_KEYS.has(c.key));
        if (!plan) return send(res, 400, { ok: false, message: 'Please choose a valid academy plan.' });

        const fullName = String(body.fullName || '').trim();
        const email = String(body.email || '').toLowerCase().trim();
        const confirmEmail = String(body.confirmEmail || '').toLowerCase().trim();
        const phoneNumber = String(body.phoneNumber || '').trim();
        const password = String(body.password || '');
        const checkoutReference = String(body.checkoutReference || '').trim() || crypto.randomUUID();
        if (!fullName || !email || !confirmEmail || !phoneNumber || password.length < 8) {
          return send(res, 400, { ok: false, message: 'Complete all required registration fields before checkout.' });
        }
        if (email !== confirmEmail) return send(res, 400, { ok: false, message: 'Email and confirm email must match.' });

        const data = platform.read();
        const limit = seatLimit(plan);
        if (limit > 0 && enrollmentCountForPlan(data, plan.key) >= limit) {
          return send(res, 409, { ok: false, message: 'This package is full. The 30 available seats have already been reserved.' });
        }

        let account = data.accounts.find((a) => a.emailNormalized === email);
        if (account && !verifyStoredPassword(password, account.passwordHash)) {
          return send(res, 409, { ok: false, message: 'This email is already registered. Use the correct password to continue.' });
        }
        if (!account) {
          account = {
            id: platform.nextId(data.accounts),
            email,
            emailNormalized: email,
            fullName,
            phoneNumber,
            company: String(body.company || '').trim(),
            passwordHash: hashPassword(password),
            createdAt: new Date().toISOString()
          };
          data.accounts.push(account);
        }

        let checkoutSession = null;
        try {
          checkoutSession = await createCheckoutSession(env, plan, email, phoneNumber, checkoutReference);
        } catch (error) {
          return send(res, 502, {
            ok: false,
            message: 'Local Stripe test checkout could not be created. Check STRIPE_SECRET_KEY_TEST in .env.local.'
          });
        }

        const mockCheckoutUrl = './?checkout=dev-paid&plan=' + encodeURIComponent(plan.key) + '#login';
        const checkoutUrl = checkoutSession?.url || mockCheckoutUrl;
        const isMockCheckout = !checkoutSession;

        data.enrollments.push({
          id: platform.nextId(data.enrollments),
          accountId: account.id,
          email,
          fullName,
          phoneNumber,
          planKey: plan.key,
          planName: plan.label,
          amountUsd: Number(plan.amountUsd || 0),
          checkoutReference,
          checkoutUrl,
          stripeCheckoutSessionId: checkoutSession?.id || '',
          stripePaymentIntentId: '',
          paymentStatus: isMockCheckout ? 'paid' : checkoutSession.paymentStatus,
          academicStatus: isMockCheckout ? 'payment_received' : 'awaiting_payment',
          paidAt: isMockCheckout ? new Date().toISOString() : '',
          createdAt: new Date().toISOString()
        });
        platform.write(data);

        return send(res, 200, {
          ok: true,
          checkoutUrl,
          message: isMockCheckout
            ? 'Local preview registration saved with mock payment. Set STRIPE_SECRET_KEY_TEST to test Stripe Checkout locally.'
            : 'Local registration saved. Redirecting to Stripe test checkout.'
        });
      }

      if (url === '/api/checkout-complete' || url === '/api/checkout-complete.php') {
        if (req.method !== 'GET') return send(res, 405, { ok: false, message: 'Method not allowed.' });
        const u = new URL('http://x' + req.url);
        const sessionId = String(u.searchParams.get('session_id') || '').trim();
        let page = {
          title: 'Digrro Academy payment',
          statusLabel: 'Attention',
          message: 'We could not verify this Stripe payment link.',
          success: false
        };

        if (sessionId) {
          try {
            const session = await retrieveCheckoutSession(env, sessionId);
            const data = platform.read();
            const matched = session ? applyCheckoutSession(data, session) : false;
            if (matched) platform.write(data);

            if (session && (session.payment_status === 'paid' || session.payment_status === 'no_payment_required')) {
              page = {
                title: 'Digrro Academy payment',
                statusLabel: 'Payment received',
                message: matched
                  ? 'Your local test payment is confirmed and your academy enrollment has been updated.'
                  : 'Your test payment is confirmed, but it could not be matched to a local enrollment.',
                success: true
              };
            } else {
              page = {
                title: 'Digrro Academy payment',
                statusLabel: 'Payment pending',
                message: 'Stripe has not marked this local test payment as paid yet. If you completed payment, wait a moment and refresh this page.',
                success: false
              };
            }
          } catch {
            page.message = 'Could not verify this local Stripe test payment. Check STRIPE_SECRET_KEY_TEST in .env.local.';
          }
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(checkoutCompleteHtml(page));
        return;
      }

      if (url === '/api/login' || url === '/api/login.php') {
        if (req.method !== 'POST') return send(res, 405, { ok: false, message: 'Method not allowed.' });
        const body = await readBody(req);
        const email = String(body.email || '').toLowerCase().trim();
        const password = String(body.password || '');
        const data = platform.read();
        const account = data.accounts.find((a) => a.emailNormalized === email);
        if (!account || !verifyStoredPassword(password, account.passwordHash)) {
          return send(res, 401, { ok: false, message: 'Email or password is incorrect.' });
        }
        const courses = store.readAll();
        return send(res, 200, {
          ok: true,
          message: 'Logged in.',
          token: studentAuth.issueToken(account),
          expiresIn: studentAuth.ttl(),
          dashboard: studentDashboard(data, courses, account)
        });
      }

      if (url === '/api/request-password-reset' || url === '/api/request-password-reset.php') {
        if (req.method !== 'POST') return send(res, 405, { ok: false, message: 'Method not allowed.' });
        const body = await readBody(req);
        const email = String(body.email || '').toLowerCase().trim();
        if (!email) return send(res, 400, { ok: false, message: 'Enter the email used for your academy registration.' });

        const message = 'If this email is registered, we sent a password reset link.';
        const data = platform.read();
        const account = data.accounts.find((a) => a.emailNormalized === email);
        if (!account) return send(res, 200, { ok: true, message });

        const token = crypto.randomBytes(32).toString('hex');
        account.passwordResetToken = token;
        account.passwordResetSentAt = new Date().toISOString();
        account.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        account.passwordResetUsedAt = '';
        platform.write(data);

        const resetUrl = './reset-password.html?token=' + encodeURIComponent(token);
        console.info('Local academy password reset link:', resetUrl);
        return send(res, 200, { ok: true, message, resetUrl });
      }

      if (url === '/api/reset-password' || url === '/api/reset-password.php') {
        const u = new URL('http://x' + req.url);
        if (req.method === 'GET') {
          const token = String(u.searchParams.get('token') || '');
          const data = platform.read();
          const account = findValidResetAccount(data, token);
          if (!account) return send(res, 400, { ok: false, message: 'This reset link is invalid or has expired.' });
          return send(res, 200, { ok: true, message: 'Reset link is valid.' });
        }

        if (req.method !== 'POST') return send(res, 405, { ok: false, message: 'Method not allowed.' });
        const body = await readBody(req);
        const token = String(body.token || '').trim();
        const password = String(body.password || '');
        const confirmPassword = String(body.confirmPassword || '');
        if (password.length < 8) return send(res, 400, { ok: false, message: 'Use a password with at least 8 characters.' });
        if (password !== confirmPassword) return send(res, 400, { ok: false, message: 'Password and confirm password must match.' });

        const data = platform.read();
        const account = findValidResetAccount(data, token);
        if (!account) return send(res, 400, { ok: false, message: 'This reset link is invalid or has expired.' });

        account.passwordHash = hashPassword(password);
        account.passwordResetToken = '';
        account.passwordResetExpiresAt = '';
        account.passwordResetUsedAt = new Date().toISOString();
        platform.write(data);

        return send(res, 200, {
          ok: true,
          message: 'Your password has been reset. You can log in with the new password now.'
        });
      }

      if (url === '/api/student' || url === '/api/student.php') {
        if (req.method !== 'GET') return send(res, 405, { ok: false, message: 'Method not allowed.' });
        const tokenPayload = studentAuth.verifyToken(getBearer(req));
        if (!tokenPayload) return send(res, 401, { ok: false, message: 'Student authentication required.' });
        const data = platform.read();
        const account = data.accounts.find((a) => Number(a.id) === Number(tokenPayload.accountId));
        if (!account) return send(res, 401, { ok: false, message: 'Student account was not found.' });
        return send(res, 200, {
          ok: true,
          dashboard: studentDashboard(data, store.readAll(), account)
        });
      }

      return next();
    } catch (err) {
      send(res, 500, { ok: false, message: err && err.message ? err.message : 'Server error.' });
    }
  }

  return {
    name: 'academy-api',
    configureServer(server) {
      store.ensure();
      platform.ensure();
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      store.ensure();
      platform.ensure();
      server.middlewares.use(handle);
    }
  };
}
