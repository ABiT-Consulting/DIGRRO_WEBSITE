const LOGIN_API = './api/admin-login.php';
const COURSES_API = './api/admin-courses.php';
const TRAINERS_API = './api/admin-trainers.php';
const STUDENTS_API = './api/admin-students.php';
const ANALYTICS_API = './api/admin-analytics.php';
const TOKEN_KEY = 'digrro_academy_admin_token';
const $ = (id) => document.getElementById(id);

let courses = [];
let trainers = [];
let students = [];
let analytics = null;
let editingCourseId = null;
let editingTrainerId = null;
let editingStudentId = null;

function getToken() { return localStorage.getItem(TOKEN_KEY) || null; }
function setToken(t) { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); }

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

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
  if (token) headers.Authorization = 'Bearer ' + token;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { ok: false, status: res.status, message: 'Service not available in this environment yet.' };
    }
    const data = await res.json();
    if (res.status === 401) {
      setToken(null);
      return { ok: false, status: 401, message: data.message || 'Session expired.' };
    }
    if (!res.ok || !data || !data.ok) {
      return { ok: false, status: res.status, message: (data && data.message) || 'Request failed.' };
    }
    return { ok: true, status: res.status, ...data };
  } catch (error) {
    return { ok: false, status: 0, message: error instanceof Error ? error.message : 'Request failed.' };
  }
}

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

function showPanel(name) {
  document.querySelectorAll('[data-admin-tab]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.adminTab === name);
  });
  document.querySelectorAll('[data-admin-panel]').forEach((panel) => {
    const active = panel.dataset.adminPanel === name;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  });
}

function openModal(id, focusId) {
  const modal = $(id);
  modal.removeAttribute('inert');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    const focusTarget = $(focusId);
    if (focusTarget) focusTarget.focus();
  });
}

function closeModal(id) {
  const modal = $(id);
  const active = document.activeElement;
  if (active instanceof HTMLElement && modal.contains(active)) active.blur();
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  modal.setAttribute('inert', '');
}

function closeAllModals() {
  closeModal('course-modal');
  closeModal('trainer-modal');
  closeModal('student-modal');
  editingCourseId = null;
  editingTrainerId = null;
  editingStudentId = null;
}

function renderTrainerOptions() {
  const options = $('trainer-options');
  if (!options) return;
  options.innerHTML = trainers
    .filter((trainer) => trainer.isActive)
    .map((trainer) => '<option value="' + escapeHtml(trainer.fullName) + '"></option>')
    .join('');
}

function openCourseModal(course) {
  editingCourseId = course && course.id ? course.id : null;
  $('course-modal-title').textContent = editingCourseId ? 'Edit course' : 'New course';
  $('course-id').value = editingCourseId || '';
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
  $('course-form-delete').hidden = !editingCourseId;
  setStatus($('course-form-status'), editingCourseId ? 'Edit and save your changes.' : 'Fill in the course details and save.');
  openModal('course-modal', 'course-plan-key');
}

function openTrainerModal(trainer) {
  editingTrainerId = trainer && trainer.id ? trainer.id : null;
  $('trainer-modal-title').textContent = editingTrainerId ? 'Edit trainer' : 'New trainer';
  $('trainer-id').value = editingTrainerId || '';
  $('trainer-full-name').value = trainer ? (trainer.fullName || '') : '';
  $('trainer-email').value = trainer ? (trainer.email || '') : '';
  $('trainer-phone').value = trainer ? (trainer.phoneNumber || '') : '';
  $('trainer-password').value = '';
  $('trainer-password').placeholder = editingTrainerId ? 'Leave blank to keep current password' : 'Required for new trainers';
  $('trainer-specialty').value = trainer ? (trainer.specialty || '') : '';
  $('trainer-bio').value = trainer ? (trainer.bio || '') : '';
  $('trainer-is-active').checked = trainer ? !!trainer.isActive : true;
  $('trainer-form-delete').hidden = !editingTrainerId;
  setStatus($('trainer-form-status'), editingTrainerId ? 'Edit and save your changes.' : 'Fill in the trainer details and save.');
  openModal('trainer-modal', 'trainer-full-name');
}

function openStudentModal(student) {
  editingStudentId = student && student.id ? student.id : null;
  $('student-modal-title').textContent = editingStudentId ? 'Edit student' : 'New student';
  $('student-id').value = editingStudentId || '';
  $('student-full-name').value = student ? (student.fullName || '') : '';
  $('student-email').value = student ? (student.email || '') : '';
  $('student-phone').value = student ? (student.phoneNumber || '') : '';
  $('student-password').value = '';
  $('student-password').placeholder = editingStudentId ? 'Leave blank to keep current password' : 'Required for new students';
  $('student-address').value = student ? (student.addressLine || '') : '';
  $('student-country').value = student ? (student.country || '') : '';
  $('student-city').value = student ? (student.city || '') : '';
  $('student-company').value = student ? (student.company || '') : '';
  $('student-email-confirmed').checked = student ? !!student.emailConfirmed : true;
  $('student-form-delete').hidden = !editingStudentId;
  setStatus($('student-form-status'), editingStudentId ? 'Edit and save your changes.' : 'Fill in the student details and save.');
  openModal('student-modal', 'student-full-name');
}

function renderCourses() {
  const list = $('admin-courses-list');
  list.innerHTML = '';
  if (!courses.length) {
    list.innerHTML = '<article class="card"><h3>No courses yet</h3><p style="margin-top:.5rem;">Click New course to add one.</p></article>';
    return;
  }

  for (const course of courses) {
    const card = document.createElement('article');
    card.className = 'card admin-card';
    const status = course.isActive
      ? '<span class="tag is-good">Active</span>'
      : '<span class="tag">Hidden</span>';
    const badge = course.badge ? '<span class="plan-badge admin-static-badge">' + escapeHtml(course.badge) + '</span>' : '';
    card.innerHTML =
      '<div class="admin-card-top">' +
        '<div><h3>' + escapeHtml(course.label) + '</h3>' +
        '<p>key: ' + escapeHtml(course.key) + '</p></div>' +
        '<div class="admin-card-tags">' + status + badge + '</div>' +
      '</div>' +
      '<div class="admin-mini-tags">' +
        (course.durationText ? '<span class="plan-flag">' + escapeHtml(course.durationText) + '</span>' : '') +
        (course.audienceText ? '<span class="plan-flag">' + escapeHtml(course.audienceText) + '</span>' : '') +
        (course.teacherName ? '<span class="plan-flag">' + escapeHtml(course.teacherName) + '</span>' : '') +
      '</div>' +
      '<div class="admin-price">$' + Number(course.amountUsd || 0).toLocaleString() + '</div>' +
      (course.description ? '<p class="admin-card-desc">' + escapeHtml(course.description) + '</p>' : '') +
      '<div class="admin-card-actions">' +
        '<button class="btn btn-secondary" type="button" data-edit-course="' + course.id + '">Edit</button>' +
        '<button class="btn btn-ghost danger-action" type="button" data-delete-course="' + course.id + '">Delete</button>' +
      '</div>';
    list.appendChild(card);
  }

  list.querySelectorAll('[data-edit-course]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = parseInt(button.getAttribute('data-edit-course'), 10);
      const course = courses.find((item) => item.id === id);
      if (course) openCourseModal(course);
    });
  });
  list.querySelectorAll('[data-delete-course]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = parseInt(button.getAttribute('data-delete-course'), 10);
      const course = courses.find((item) => item.id === id);
      if (course && confirm('Delete "' + course.label + '"? This cannot be undone.')) deleteCourse(id);
    });
  });
}

function renderTrainers() {
  const list = $('admin-trainers-list');
  list.innerHTML = '';
  if (!trainers.length) {
    list.innerHTML = '<article class="card"><h3>No trainers yet</h3><p style="margin-top:.5rem;">Click New trainer to register one.</p></article>';
    return;
  }

  for (const trainer of trainers) {
    const card = document.createElement('article');
    card.className = 'card admin-card';
    card.innerHTML =
      '<div class="admin-card-top">' +
        '<div><h3>' + escapeHtml(trainer.fullName) + '</h3>' +
        '<p>' + escapeHtml(trainer.email) + '</p></div>' +
        (trainer.isActive ? '<span class="tag is-good">Active</span>' : '<span class="tag">Inactive</span>') +
      '</div>' +
      '<div class="admin-mini-tags">' +
        (trainer.phoneNumber ? '<span class="plan-flag">' + escapeHtml(trainer.phoneNumber) + '</span>' : '') +
        (trainer.specialty ? '<span class="plan-flag">' + escapeHtml(trainer.specialty) + '</span>' : '') +
      '</div>' +
      (trainer.bio ? '<p class="admin-card-desc">' + escapeHtml(trainer.bio) + '</p>' : '') +
      '<div class="admin-card-actions">' +
        '<button class="btn btn-secondary" type="button" data-edit-trainer="' + trainer.id + '">Edit</button>' +
        '<button class="btn btn-ghost danger-action" type="button" data-delete-trainer="' + trainer.id + '">Delete</button>' +
      '</div>';
    list.appendChild(card);
  }

  list.querySelectorAll('[data-edit-trainer]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = parseInt(button.getAttribute('data-edit-trainer'), 10);
      const trainer = trainers.find((item) => item.id === id);
      if (trainer) openTrainerModal(trainer);
    });
  });
  list.querySelectorAll('[data-delete-trainer]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = parseInt(button.getAttribute('data-delete-trainer'), 10);
      const trainer = trainers.find((item) => item.id === id);
      if (trainer && confirm('Delete "' + trainer.fullName + '"? This cannot be undone.')) deleteTrainer(id);
    });
  });
}

function renderStudents() {
  const list = $('admin-students-list');
  list.innerHTML = '';
  if (!students.length) {
    list.innerHTML = '<article class="card"><h3>No students yet</h3><p style="margin-top:.5rem;">Students will appear here after registration, or you can add one manually.</p></article>';
    return;
  }

  for (const student of students) {
    const card = document.createElement('article');
    card.className = 'card admin-card';
    const paid = Number(student.paidEnrollmentCount || 0);
    const total = Number(student.enrollmentCount || 0);
    card.innerHTML =
      '<div class="admin-card-top">' +
        '<div><h3>' + escapeHtml(student.fullName) + '</h3>' +
        '<p>' + escapeHtml(student.email) + '</p></div>' +
        (student.emailConfirmed ? '<span class="tag is-good">Confirmed</span>' : '<span class="tag">Unconfirmed</span>') +
      '</div>' +
      '<div class="admin-mini-tags">' +
        (student.phoneNumber ? '<span class="plan-flag">' + escapeHtml(student.phoneNumber) + '</span>' : '') +
        (student.company ? '<span class="plan-flag">' + escapeHtml(student.company) + '</span>' : '') +
        '<span class="plan-flag">' + paid + ' paid / ' + total + ' enrollment(s)</span>' +
      '</div>' +
      '<div class="admin-card-actions">' +
        '<button class="btn btn-secondary" type="button" data-edit-student="' + student.id + '">Edit</button>' +
        '<button class="btn btn-ghost danger-action" type="button" data-delete-student="' + student.id + '">Delete</button>' +
      '</div>';
    list.appendChild(card);
  }

  list.querySelectorAll('[data-edit-student]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = parseInt(button.getAttribute('data-edit-student'), 10);
      const student = students.find((item) => item.id === id);
      if (student) openStudentModal(student);
    });
  });
  list.querySelectorAll('[data-delete-student]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = parseInt(button.getAttribute('data-delete-student'), 10);
      const student = students.find((item) => item.id === id);
      if (student && confirm('Delete "' + student.fullName + '" and all enrollments? This cannot be undone.')) deleteStudent(id);
    });
  });
}

function metricCard(label, value, hint) {
  return (
    '<article class="admin-metric-card">' +
      '<span>' + escapeHtml(label) + '</span>' +
      '<strong>' + escapeHtml(value) + '</strong>' +
      (hint ? '<small>' + escapeHtml(hint) + '</small>' : '') +
    '</article>'
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return '';
  return Object.entries(metadata)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => key + ': ' + value)
    .join(', ');
}

function renderAnalytics() {
  const summaryNode = $('admin-analytics-summary');
  const dailyNode = $('admin-analytics-daily');
  const eventsNode = $('admin-analytics-events');
  const summary = analytics && analytics.summary ? analytics.summary : {};
  const daily = analytics && Array.isArray(analytics.daily) ? analytics.daily : [];
  const recentEvents = analytics && Array.isArray(analytics.recentEvents) ? analytics.recentEvents : [];
  const days = summary.days || 30;

  summaryNode.innerHTML = [
    metricCard('Visitors', formatNumber(summary.visitors), 'Unique sessions in ' + days + ' days'),
    metricCard('Page views', formatNumber(summary.pageViews), 'Academy page loads'),
    metricCard('Subscribe clicks', formatNumber(summary.subscribeClicks), 'Reserve buttons clicked'),
    metricCard('Registration attempts', formatNumber(summary.registrationAttempts), 'Submitted subscribe form'),
    metricCard('Successful registrations', formatNumber(summary.registrationSuccesses), 'Saved before checkout'),
    metricCard('Failed registrations', formatNumber(summary.registrationFailures), 'Rejected or failed attempts'),
    metricCard('Checkout redirects', formatNumber(summary.checkoutRedirects), 'Sent to Stripe'),
    metricCard('Subscribers', formatNumber(summary.studentAccounts), 'Student accounts'),
    metricCard('Enrollments', formatNumber(summary.enrollments), 'Reserved course records'),
    metricCard('Paid enrollments', formatNumber(summary.paidEnrollments), 'Completed payments'),
  ].join('');

  dailyNode.innerHTML = daily.length
    ? '<table class="admin-table"><thead><tr><th>Date</th><th>Visitors</th><th>Views</th><th>Clicks</th><th>Registrations</th></tr></thead><tbody>' +
      daily.map((row) => (
        '<tr>' +
          '<td>' + escapeHtml(row.day) + '</td>' +
          '<td>' + formatNumber(row.visitors) + '</td>' +
          '<td>' + formatNumber(row.pageViews) + '</td>' +
          '<td>' + formatNumber(row.subscribeClicks) + '</td>' +
          '<td>' + formatNumber(row.successfulRegistrations) + '</td>' +
        '</tr>'
      )).join('') +
      '</tbody></table>'
    : '<p class="admin-empty">No tracked activity yet.</p>';

  eventsNode.innerHTML = recentEvents.length
    ? '<table class="admin-table"><thead><tr><th>Time</th><th>Event</th><th>Session</th><th>Details</th></tr></thead><tbody>' +
      recentEvents.map((event) => (
        '<tr>' +
          '<td>' + escapeHtml(event.occurredAt) + '</td>' +
          '<td>' + escapeHtml(event.eventName) + '</td>' +
          '<td>' + escapeHtml(event.sessionId) + '</td>' +
          '<td>' + escapeHtml(formatMetadata(event.metadata)) + '</td>' +
        '</tr>'
      )).join('') +
      '</tbody></table>'
    : '<p class="admin-empty">No recent events yet.</p>';
}

async function loadCourses() {
  setStatus($('admin-courses-status'), 'Loading courses...');
  const result = await api('GET', COURSES_API);
  if (!result.ok) {
    if (result.status === 401) { showLogin(); setStatus($('admin-login-status'), 'Session expired. Please log in again.', 'error'); return; }
    setStatus($('admin-courses-status'), result.message || 'Could not load courses.', 'error');
    return;
  }
  courses = result.courses || [];
  setStatus($('admin-courses-status'), courses.length ? courses.length + ' course(s) loaded.' : 'No courses yet.', 'success');
  renderCourses();
}

async function loadTrainers() {
  setStatus($('admin-trainers-status'), 'Loading trainers...');
  const result = await api('GET', TRAINERS_API);
  if (!result.ok) {
    if (result.status === 401) { showLogin(); setStatus($('admin-login-status'), 'Session expired. Please log in again.', 'error'); return; }
    setStatus($('admin-trainers-status'), result.message || 'Could not load trainers.', 'error');
    return;
  }
  trainers = result.trainers || [];
  setStatus($('admin-trainers-status'), trainers.length ? trainers.length + ' trainer(s) loaded.' : 'No trainers yet.', 'success');
  renderTrainers();
  renderTrainerOptions();
}

async function loadStudents() {
  setStatus($('admin-students-status'), 'Loading students...');
  const result = await api('GET', STUDENTS_API);
  if (!result.ok) {
    if (result.status === 401) { showLogin(); setStatus($('admin-login-status'), 'Session expired. Please log in again.', 'error'); return; }
    setStatus($('admin-students-status'), result.message || 'Could not load students.', 'error');
    return;
  }
  students = result.students || [];
  setStatus($('admin-students-status'), students.length ? students.length + ' student(s) loaded.' : 'No students yet.', 'success');
  renderStudents();
}

async function loadAnalytics() {
  setStatus($('admin-analytics-status'), 'Loading analytics...');
  const result = await api('GET', ANALYTICS_API + '?days=30');
  if (!result.ok) {
    if (result.status === 401) { showLogin(); setStatus($('admin-login-status'), 'Session expired. Please log in again.', 'error'); return; }
    setStatus($('admin-analytics-status'), result.message || 'Could not load analytics.', 'error');
    return;
  }
  analytics = result;
  const summary = analytics.summary || {};
  setStatus(
    $('admin-analytics-status'),
    formatNumber(summary.visitors) + ' visitor(s), ' + formatNumber(summary.subscribeClicks) + ' subscribe click(s), ' + formatNumber(summary.registrationAttempts) + ' registration attempt(s) in the last ' + (summary.days || 30) + ' days.',
    'success'
  );
  renderAnalytics();
}

async function loadDashboard() {
  await Promise.all([loadCourses(), loadTrainers(), loadStudents(), loadAnalytics()]);
}

async function saveCourse(event) {
  event.preventDefault();
  const status = $('course-form-status');
  const submit = $('course-form-submit');
  const features = $('course-features').value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
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
  const result = editingCourseId
    ? await api('PUT', COURSES_API + '?id=' + encodeURIComponent(editingCourseId), payload)
    : await api('POST', COURSES_API, payload);
  submit.disabled = false;

  if (!result.ok) return setStatus(status, result.message || 'Could not save course.', 'error');
  closeModal('course-modal');
  editingCourseId = null;
  await loadCourses();
}

async function saveTrainer(event) {
  event.preventDefault();
  const status = $('trainer-form-status');
  const submit = $('trainer-form-submit');
  const payload = {
    fullName: $('trainer-full-name').value.trim(),
    email: $('trainer-email').value.trim(),
    phoneNumber: $('trainer-phone').value.trim(),
    password: $('trainer-password').value,
    specialty: $('trainer-specialty').value.trim(),
    bio: $('trainer-bio').value.trim(),
    isActive: $('trainer-is-active').checked
  };

  if (!payload.fullName || !payload.email || (!editingTrainerId && payload.password.length < 8)) {
    return setStatus(status, 'Trainer name, email, and an 8-character password are required.', 'error');
  }

  submit.disabled = true;
  setStatus(status, 'Saving...');
  const result = editingTrainerId
    ? await api('PUT', TRAINERS_API + '?id=' + encodeURIComponent(editingTrainerId), payload)
    : await api('POST', TRAINERS_API, payload);
  submit.disabled = false;

  if (!result.ok) return setStatus(status, result.message || 'Could not save trainer.', 'error');
  closeModal('trainer-modal');
  editingTrainerId = null;
  await loadTrainers();
}

async function saveStudent(event) {
  event.preventDefault();
  const status = $('student-form-status');
  const submit = $('student-form-submit');
  const payload = {
    fullName: $('student-full-name').value.trim(),
    email: $('student-email').value.trim(),
    phoneNumber: $('student-phone').value.trim(),
    password: $('student-password').value,
    addressLine: $('student-address').value.trim(),
    country: $('student-country').value.trim(),
    city: $('student-city').value.trim(),
    company: $('student-company').value.trim(),
    emailConfirmed: $('student-email-confirmed').checked
  };

  if (!payload.fullName || !payload.email || (!editingStudentId && payload.password.length < 8)) {
    return setStatus(status, 'Student name, email, and an 8-character password are required.', 'error');
  }

  submit.disabled = true;
  setStatus(status, 'Saving...');
  const result = editingStudentId
    ? await api('PUT', STUDENTS_API + '?id=' + encodeURIComponent(editingStudentId), payload)
    : await api('POST', STUDENTS_API, payload);
  submit.disabled = false;

  if (!result.ok) return setStatus(status, result.message || 'Could not save student.', 'error');
  closeModal('student-modal');
  editingStudentId = null;
  await loadStudents();
}

async function deleteCourse(id) {
  const result = await api('DELETE', COURSES_API + '?id=' + encodeURIComponent(id));
  if (!result.ok) { setStatus($('admin-courses-status'), result.message || 'Could not delete course.', 'error'); return; }
  await loadCourses();
}

async function deleteTrainer(id) {
  const result = await api('DELETE', TRAINERS_API + '?id=' + encodeURIComponent(id));
  if (!result.ok) { setStatus($('admin-trainers-status'), result.message || 'Could not delete trainer.', 'error'); return; }
  await loadTrainers();
}

async function deleteStudent(id) {
  const result = await api('DELETE', STUDENTS_API + '?id=' + encodeURIComponent(id));
  if (!result.ok) { setStatus($('admin-students-status'), result.message || 'Could not delete student.', 'error'); return; }
  await loadStudents();
}

async function handleLogin(event) {
  event.preventDefault();
  const status = $('admin-login-status');
  const submit = $('admin-login-submit');
  const username = $('admin-username').value.trim();
  const password = $('admin-password').value;

  if (!username || !password) return setStatus(status, 'Enter username and password.', 'error');
  submit.disabled = true;
  setStatus(status, 'Verifying...');
  const result = await api('POST', LOGIN_API, { username, password });
  submit.disabled = false;
  if (!result.ok) return setStatus(status, result.message || 'Login failed.', 'error');
  setToken(result.token);
  setStatus(status, 'Welcome.', 'success');
  showDashboard();
  await loadDashboard();
}

function handleLogout() {
  setToken(null);
  courses = [];
  trainers = [];
  students = [];
  analytics = null;
  showLogin();
  setStatus($('admin-login-status'), 'You have been logged out.');
}

function init() {
  $('admin-login-form').addEventListener('submit', handleLogin);
  $('admin-logout').addEventListener('click', handleLogout);
  $('admin-new-course').addEventListener('click', () => openCourseModal(null));
  $('admin-new-trainer').addEventListener('click', () => openTrainerModal(null));
  $('admin-new-student').addEventListener('click', () => openStudentModal(null));
  $('admin-refresh-analytics').addEventListener('click', loadAnalytics);
  $('course-form').addEventListener('submit', saveCourse);
  $('trainer-form').addEventListener('submit', saveTrainer);
  $('student-form').addEventListener('submit', saveStudent);

  document.querySelectorAll('[data-admin-tab]').forEach((button) => {
    button.addEventListener('click', () => showPanel(button.dataset.adminTab));
  });

  [
    ['course-modal-close', 'course-modal'],
    ['course-form-cancel', 'course-modal'],
    ['trainer-modal-close', 'trainer-modal'],
    ['trainer-form-cancel', 'trainer-modal'],
    ['student-modal-close', 'student-modal'],
    ['student-form-cancel', 'student-modal']
  ].forEach(([buttonId, modalId]) => $(buttonId).addEventListener('click', () => closeModal(modalId)));

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', closeAllModals);
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeAllModals(); });

  $('course-form-delete').addEventListener('click', () => {
    if (editingCourseId && confirm('Delete this course? This cannot be undone.')) {
      const id = editingCourseId;
      closeModal('course-modal');
      editingCourseId = null;
      deleteCourse(id);
    }
  });
  $('trainer-form-delete').addEventListener('click', () => {
    if (editingTrainerId && confirm('Delete this trainer? This cannot be undone.')) {
      const id = editingTrainerId;
      closeModal('trainer-modal');
      editingTrainerId = null;
      deleteTrainer(id);
    }
  });
  $('student-form-delete').addEventListener('click', () => {
    if (editingStudentId && confirm('Delete this student and all enrollments? This cannot be undone.')) {
      const id = editingStudentId;
      closeModal('student-modal');
      editingStudentId = null;
      deleteStudent(id);
    }
  });

  if (getToken()) {
    showDashboard();
    loadDashboard();
  } else {
    showLogin();
  }
}

init();
