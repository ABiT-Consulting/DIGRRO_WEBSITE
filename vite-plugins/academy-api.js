// Vite plugin that serves the Academy API in dev + preview modes — no PHP required.
// Persists courses to a JSON file on disk and uses scrypt + HMAC for admin auth.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_COURSES = [
  {
    key: 'sprint',
    label: 'AI Marketing Sprint',
    amountUsd: 200,
    durationText: '4 hours',
    audienceText: 'Live workshop',
    badge: '',
    description: 'Per seat or $1,750 private team',
    features: [
      'AI prompting for campaigns and content',
      'Hooks, offers and content planning',
      'Quick-start prompt pack'
    ],
    checkoutDescription: 'Live AI marketing workshop for campaign planning, copy, and content workflow acceleration.',
    teacherName: 'Digrro Faculty',
    learningUrl: '',
    displayOrder: 1,
    isActive: true
  },
  {
    key: 'bootcamp',
    label: 'AI Content and Video Bootcamp',
    amountUsd: 650,
    durationText: '4 weeks',
    audienceText: '8 live sessions',
    badge: 'Most chosen',
    description: 'Early bird, $850 standard',
    features: [
      'Content systems and operations',
      'AI scripting, editing, captions, repurposing',
      'Capstone and certificate pathway'
    ],
    checkoutDescription: 'Four-week bootcamp for AI content systems, short-form video, and execution workflows.',
    teacherName: 'Digrro Faculty',
    learningUrl: '',
    displayOrder: 2,
    isActive: true
  },
  {
    key: 'corporate',
    label: 'Corporate Academy',
    amountUsd: 4800,
    durationText: 'Private',
    audienceText: 'Custom agenda',
    badge: '',
    description: 'Up to 15 seats, custom from $7,500',
    features: [
      'Discovery and role-based design',
      'Private sessions and SOP handoff',
      'Management rollout support'
    ],
    checkoutDescription: 'Private corporate AI training program with customized delivery, templates, and team enablement.',
    teacherName: 'Digrro Faculty',
    learningUrl: '',
    displayOrder: 3,
    isActive: true
  }
];

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
    if (fs.existsSync(dataFile)) return;
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    const seeded = DEFAULT_COURSES.map((c, i) => ({ id: i + 1, ...c }));
    fs.writeFileSync(dataFile, JSON.stringify(seeded, null, 2));
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
    displayOrder: Number(course.displayOrder || 0)
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
    const url = (req.url || '').split('?')[0];
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
          .filter((c) => c.isActive)
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
            message: 'Teacher portal is not configured. Run: npm run academy:hash YOUR_PASSWORD, then set ACADEMY_ADMIN_EMAIL / ACADEMY_ADMIN_PASSWORD_HASH / ACADEMY_ADMIN_TOKEN_SECRET in .env'
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
        const plan = courses.find((c) => c.key === planKey && c.isActive);
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
          checkoutUrl: './?checkout=dev-paid&plan=' + encodeURIComponent(plan.key) + '#login',
          paymentStatus: 'paid',
          academicStatus: 'payment_received',
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
        platform.write(data);

        return send(res, 200, {
          ok: true,
          checkoutUrl: './?checkout=dev-paid&plan=' + encodeURIComponent(plan.key) + '#login',
          message: 'Local preview registration saved. In production, this redirects to Stripe Checkout.'
        });
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
