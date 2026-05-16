// Fetches the live course list from the public API and re-renders the plans grid.
// Falls back silently if the API is unavailable (the static HTML stays in place).

const COURSES_API = './api/courses.php';

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function priceText(amount) {
  const n = Number(amount || 0);
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function seatStatus(course) {
  const limit = Number(course.seatLimit || 0);
  if (!limit) return '';
  const remaining = Number(course.seatsRemaining ?? limit);
  if (remaining <= 0 || course.isFull) return 'Cohort full: join the waitlist with Digrro before payment reopens.';
  if (remaining <= 5) return 'Last seats: only ' + remaining + ' of ' + limit + ' seats remain.';
  return 'Limited intake: ' + remaining + ' of ' + limit + ' seats remain.';
}

function renderCourseCard(course, isFeatured) {
  const wrap = document.createElement('article');
  wrap.className = 'plan' + (isFeatured ? ' featured' : '');
  wrap.setAttribute('data-plan-card', course.key);

  const features = Array.isArray(course.features) ? course.features : [];
  const flags = [];
  if (course.durationText) flags.push('<span class="plan-flag">' + escapeHtml(course.durationText) + '</span>');
  if (course.audienceText) flags.push('<span class="plan-flag">' + escapeHtml(course.audienceText) + '</span>');
  if (course.teacherName) flags.push('<span class="plan-flag">' + escapeHtml(course.teacherName) + '</span>');

  const ctaClass = isFeatured ? 'btn btn-primary btn-block' : 'btn btn-secondary btn-block';
  const ctaLabel = course.isFull ? 'Cohort full' : 'Secure your seat';
  const status = seatStatus(course);
  const disabled = course.isFull ? ' disabled aria-disabled="true"' : '';

  wrap.innerHTML =
    (course.badge ? '<span class="plan-badge">' + escapeHtml(course.badge) + '</span>' : '') +
    '<h3 class="plan-name">' + escapeHtml(course.label) + '</h3>' +
    (flags.length ? '<div class="plan-flags">' + flags.join('') + '</div>' : '') +
    '<div class="plan-price">' + priceText(course.amountUsd) + '</div>' +
    (course.description ? '<div class="plan-meta">' + escapeHtml(course.description) + '</div>' : '') +
    (status ? '<div class="seat-alert">' + escapeHtml(status) + '</div>' : '') +
    (features.length
      ? '<ul class="plan-list">' + features.map((f) => '<li>' + escapeHtml(f) + '</li>').join('') + '</ul>'
      : '') +
    '<div class="plan-action">' +
      '<button class="' + ctaClass + '" type="button" data-enroll-plan="' + escapeHtml(course.key) + '"' + disabled + '>' +
        escapeHtml(ctaLabel) +
      '</button>' +
    '</div>';

  return wrap;
}

export async function loadAndRenderCourses(onAfterRender) {
  const grid = document.querySelector('.plan-grid');
  if (!grid) return;

  try {
    const res = await fetch(COURSES_API, { headers: { Accept: 'application/json' } });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return;
    const data = await res.json();
    if (!res.ok || !data || !data.ok || !Array.isArray(data.courses)) return;
    const courses = data.courses.slice().sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    if (!courses.length) return;

    // Pick a featured plan: explicit badge wins, else the middle one.
    let featuredKey = null;
    const withBadge = courses.find((c) => c.badge && c.badge.trim() !== '');
    if (withBadge) featuredKey = withBadge.key;
    else if (courses.length >= 2) featuredKey = courses[Math.floor(courses.length / 2)].key;

    grid.innerHTML = '';
    for (const course of courses) {
      grid.appendChild(renderCourseCard(course, course.key === featuredKey));
    }

    if (typeof onAfterRender === 'function') onAfterRender(courses);
  } catch (err) {
    // Silent fallback to static HTML.
  }
}
