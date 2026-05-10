import './styles.css';

const LOGIN_API = './api/admin-login.php';
const COURSES_API = './api/admin-courses.php';
const TOKEN_KEY = 'digrro_academy_admin_token';
const $ = (id) => document.getElementById(id);

let courses = [];
let editingId = null;

function getToken() { return localStorage.getItem(TOKEN_KEY) || null; }
function setToken(t) { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); }

function setStatus(node, message, kind) {
  if (!node) return;
  node.textContent = message;
  node.classList.remove('is-error', 'is-success');
  if (kind) node.classList.add('is-' + kind);
}

async function api(method, url, body) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  try {
    const res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return { ok: false, status: res.status, message: 'Service not available in this environment yet.' };
    }
    const data = await res.json();
    if (res.status === 401) { setToken(null); return { ok: false, status: 401, message: data.message || 'Session expired.' }; }
    if (!res.ok || !data || !data.ok) {
      return { ok: false, status: res.status, message: (data && data.message) || 'Request failed.' };
    }
    return { ok: true, status: res.status, ...data };
  } catch (e) {
    return { ok: false, status: 0, message: e instanceof Error ? e.message : 'Request failed.' };
  }
}

// ---------- View toggling ----------
function showLogin() {
  $('admin-login-view').hidden = false;
  $('admin-dashboard-view').hidden = true;
  $('admin-logout').hidden = true;
}
function showDashboard() {
  $('admin-login-view').hidden = true;
  $('admin-dashboard-view').hidden = false;
  $('admin-logout').hidden = false;
}

// ---------- Modal ----------
function openCourseModal(course) {
  editingId = course && course.id ? course.id : null;
  $('course-modal-title').textContent = editingId ? 'Edit course' : 'New course';
  $('course-id').value = editingId || '';
  $('course-plan-key').value = course ? (course.key || '') : '';
  $('course-amount').value = course ? (course.amountUsd || 0) : '';
  $('course-label').value = course ? (course.label || '') : '';
  $('course-duration').value = course ? (course.durationText || '') : '';
  $('course-audience').value = course ? (course.audienceText || '') : '';
  $('course-teacher').value = course ? (course.teacherName || '') : '';
  $('course-badge').value = course ? (course.badge || '') : '';
  $('course-display-order').value = course ? (course.displayOrder || 0) : 0;
  $('course-description').value = course ? (course.description || '') : '';
  $('course-features').value = course && course.features ? course.features.join('\n') : '';
  $('course-checkout-description').value = course ? (course.checkoutDescription || '') : '';
  $('course-learning-url').value = course ? (course.learningUrl || '') : '';
  $('course-is-active').checked = course ? !!course.isActive : true;
  $('course-form-delete').hidden = !editingId;
  setStatus($('course-form-status'), editingId ? 'Edit and save your changes.' : 'Fill in the course details and save.');

  const m = $('course-modal');
  m.removeAttribute('inert');
  m.classList.add('is-open');
  m.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => $('course-plan-key').focus());
}

function closeCourseModal() {
  const m = $('course-modal');
  const a = document.activeElement;
  if (a instanceof HTMLElement && m.contains(a)) a.blur();
  m.classList.remove('is-open');
  m.setAttribute('aria-hidden', 'true');
  m.setAttribute('inert', '');
  editingId = null;
}

// ---------- Render courses list ----------
function renderCourses() {
  const list = $('admin-courses-list');
  if (!list) return;
  list.innerHTML = '';
  if (!courses.length) {
    list.innerHTML = '<article class="card"><h3 style="font-size:1rem;font-weight:600;">No courses yet</h3><p style="margin-top:.5rem;">Click "New course" to add one.</p></article>';
    return;
  }
  for (const c of courses) {
    const wrap = document.createElement('article');
    wrap.className = 'card';
    const status = c.isActive ? '<span class="tag" style="color:#86efac;border-color:rgba(74,222,128,0.3);">Active</span>' : '<span class="tag">Hidden</span>';
    const badge = c.badge ? '<span class="plan-badge" style="position:static;">' + escapeHtml(c.badge) + '</span>' : '';
    wrap.innerHTML =
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem;">' +
        '<div><h3 style="font-size:1rem;font-weight:600;">' + escapeHtml(c.label) + '</h3>' +
        '<div style="margin-top:.25rem;font-size:.8rem;color:var(--text-subtle);">key: ' + escapeHtml(c.key) + '</div></div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:.4rem;">' + status + badge + '</div>' +
      '</div>' +
      '<div style="margin-top:.85rem;display:flex;flex-wrap:wrap;gap:.4rem;">' +
        (c.durationText ? '<span class="plan-flag">' + escapeHtml(c.durationText) + '</span>' : '') +
        (c.audienceText ? '<span class="plan-flag">' + escapeHtml(c.audienceText) + '</span>' : '') +
        (c.teacherName ? '<span class="plan-flag">' + escapeHtml(c.teacherName) + '</span>' : '') +
      '</div>' +
      '<div style="margin-top:.75rem;font-size:1.4rem;font-weight:700;letter-spacing:0;">$' + Number(c.amountUsd || 0).toLocaleString() + '</div>' +
      (c.description ? '<div style="margin-top:.25rem;font-size:.85rem;color:var(--text-subtle);">' + escapeHtml(c.description) + '</div>' : '') +
      '<div style="margin-top:1rem;display:flex;gap:.5rem;">' +
        '<button class="btn btn-secondary" type="button" data-edit="' + c.id + '">Edit</button>' +
        '<button class="btn btn-ghost" type="button" data-delete="' + c.id + '" style="color:#fca5a5;">Delete</button>' +
      '</div>';
    list.appendChild(wrap);
  }
  list.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
    const id = parseInt(b.getAttribute('data-edit'), 10);
    const c = courses.find((x) => x.id === id);
    if (c) openCourseModal(c);
  }));
  list.querySelectorAll('[data-delete]').forEach((b) => b.addEventListener('click', () => {
    const id = parseInt(b.getAttribute('data-delete'), 10);
    const c = courses.find((x) => x.id === id);
    if (c && confirm('Delete "' + c.label + '"? This cannot be undone.')) deleteCourse(id);
  }));
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// ---------- API actions ----------
async function loadCourses() {
  const status = $('admin-courses-status');
  setStatus(status, 'Loading courses...');
  const result = await api('GET', COURSES_API);
  if (!result.ok) {
    if (result.status === 401) { showLogin(); setStatus($('admin-login-status'), 'Session expired. Please log in again.', 'error'); return; }
    setStatus(status, result.message || 'Could not load courses.', 'error');
    return;
  }
  courses = result.courses || [];
  setStatus(status, courses.length ? courses.length + ' course(s) loaded.' : 'No courses yet.', 'success');
  renderCourses();
}

async function saveCourse(event) {
  event.preventDefault();
  const status = $('course-form-status');
  const submit = $('course-form-submit');
  const features = $('course-features').value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

  const payload = {
    planKey: $('course-plan-key').value.trim(),
    label: $('course-label').value.trim(),
    amountUsd: parseFloat($('course-amount').value),
    durationText: $('course-duration').value.trim(),
    audienceText: $('course-audience').value.trim(),
    teacherName: $('course-teacher').value.trim(),
    badge: $('course-badge').value.trim(),
    description: $('course-description').value.trim(),
    features,
    checkoutDescription: $('course-checkout-description').value.trim(),
    learningUrl: $('course-learning-url').value.trim(),
    displayOrder: parseInt($('course-display-order').value || '0', 10) || 0,
    isActive: $('course-is-active').checked
  };

  if (!payload.planKey || !payload.label || isNaN(payload.amountUsd) || payload.amountUsd < 0) {
    return setStatus(status, 'Plan key, name, and a valid price are required.', 'error');
  }

  submit.disabled = true;
  setStatus(status, 'Saving...');

  const result = editingId
    ? await api('PUT', COURSES_API + '?id=' + encodeURIComponent(editingId), payload)
    : await api('POST', COURSES_API, payload);

  submit.disabled = false;
  if (!result.ok) return setStatus(status, result.message || 'Could not save.', 'error');
  setStatus(status, 'Saved.', 'success');
  closeCourseModal();
  await loadCourses();
}

async function deleteCourse(id) {
  const status = $('admin-courses-status');
  const result = await api('DELETE', COURSES_API + '?id=' + encodeURIComponent(id));
  if (!result.ok) { setStatus(status, result.message || 'Could not delete.', 'error'); return; }
  await loadCourses();
}

async function handleLogin(event) {
  event.preventDefault();
  const status = $('admin-login-status');
  const submit = $('admin-login-submit');
  const email = $('admin-email').value.trim();
  const password = $('admin-password').value;

  if (!email || !password) return setStatus(status, 'Enter email and password.', 'error');
  submit.disabled = true;
  setStatus(status, 'Verifying...');
  const result = await api('POST', LOGIN_API, { email, password });
  submit.disabled = false;
  if (!result.ok) return setStatus(status, result.message || 'Login failed.', 'error');
  setToken(result.token);
  setStatus(status, 'Welcome.', 'success');
  showDashboard();
  await loadCourses();
}

function handleLogout() {
  setToken(null);
  courses = [];
  showLogin();
  setStatus($('admin-login-status'), 'You have been logged out.');
}

// ---------- Init ----------
function init() {
  $('admin-login-form').addEventListener('submit', handleLogin);
  $('admin-logout').addEventListener('click', handleLogout);
  $('admin-new-course').addEventListener('click', () => openCourseModal(null));
  $('course-form').addEventListener('submit', saveCourse);
  $('course-modal-close').addEventListener('click', closeCourseModal);
  $('course-form-cancel').addEventListener('click', closeCourseModal);
  document.querySelectorAll('[data-close-modal]').forEach((n) => n.addEventListener('click', closeCourseModal));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCourseModal(); });
  $('course-form-delete').addEventListener('click', () => {
    if (editingId && confirm('Delete this course? This cannot be undone.')) {
      const id = editingId;
      closeCourseModal();
      deleteCourse(id);
    }
  });

  if (getToken()) {
    showDashboard();
    loadCourses();
  } else {
    showLogin();
  }
}

init();
