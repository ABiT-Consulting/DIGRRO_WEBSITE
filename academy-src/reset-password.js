import './styles.css';

const RESET_PASSWORD_API = './api/reset-password.php';
const STUDENT_TOKEN_KEY = 'digrro_academy_student_token';
const $ = (id) => document.getElementById(id);

function api(path) {
  return new URL(path, window.location.href).href;
}

function setStatus(node, message, kind) {
  if (!node) return;
  node.textContent = message;
  node.classList.remove('is-error', 'is-success');
  if (kind) node.classList.add('is-' + kind);
}

async function requestJson(url, options) {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { ok: false, message: 'Service not available in this environment yet.' };
    }
    const data = await response.json();
    if (!response.ok || !data || !data.ok) {
      return { ok: false, message: (data && data.message) || 'Request failed.' };
    }
    return data;
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Request failed.' };
  }
}

function disableForm(disabled) {
  ['reset-password', 'reset-confirm-password', 'reset-password-submit'].forEach((id) => {
    const node = $(id);
    if (node) node.disabled = disabled;
  });
}

const token = new URLSearchParams(window.location.search).get('token') || '';
const form = $('reset-password-form');
const status = $('reset-password-status');
const submit = $('reset-password-submit');

async function validateToken() {
  if (!token) {
    setStatus(status, 'Reset link is missing. Request a new password reset from the login form.', 'error');
    disableForm(true);
    return;
  }

  const result = await requestJson(api(RESET_PASSWORD_API + '?token=' + encodeURIComponent(token)), {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });

  if (!result.ok) {
    setStatus(status, result.message || 'This reset link is invalid or has expired.', 'error');
    disableForm(true);
    return;
  }

  setStatus(status, 'Enter and confirm your new password.');
  disableForm(false);
  const password = $('reset-password');
  if (password) password.focus();
}

async function handleSubmit(event) {
  event.preventDefault();
  const password = $('reset-password').value;
  const confirmPassword = $('reset-confirm-password').value;

  if (password.length < 8) {
    setStatus(status, 'Use a password with at least 8 characters.', 'error');
    return;
  }

  if (password !== confirmPassword) {
    setStatus(status, 'Password and confirm password must match.', 'error');
    return;
  }

  if (submit) submit.disabled = true;
  setStatus(status, 'Resetting your password...');

  const result = await requestJson(api(RESET_PASSWORD_API), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token, password, confirmPassword })
  });

  if (!result.ok) {
    if (submit) submit.disabled = false;
    setStatus(status, result.message || 'Could not reset your password.', 'error');
    return;
  }

  localStorage.removeItem(STUDENT_TOKEN_KEY);
  setStatus(status, result.message || 'Your password has been reset.', 'success');
  disableForm(true);
  window.setTimeout(() => {
    window.location.href = './#login';
  }, 1800);
}

if (form) form.addEventListener('submit', handleSubmit);
disableForm(true);
validateToken();
