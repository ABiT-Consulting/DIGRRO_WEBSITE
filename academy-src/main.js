import './styles.css';
import { getPlan, planEntries } from './lib/plans.js';

const registrationApiPath = './api/register.php';
let lastModalTrigger = null;

function buildCheckoutReference() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `academy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getRegistrationApiUrl() {
  return new URL(registrationApiPath, window.location.href).href;
}

function openModal(planKey, triggerElement = null) {
  const plan = getPlan(planKey);
  if (!plan) {
    return;
  }

  const modal = document.getElementById('enrollment-modal');
  const form = document.getElementById('enrollment-form');
  const planName = document.getElementById('selected-plan-name');
  const planAmount = document.getElementById('selected-plan-amount');
  const planMeta = document.getElementById('selected-plan-meta');
  const planKeyInput = document.getElementById('selected-plan-key');
  const formStatus = document.getElementById('enrollment-status');
  const submitButton = document.getElementById('enrollment-submit');
  const firstInput = document.getElementById('enrollment-name');

  if (triggerElement instanceof HTMLElement) {
    lastModalTrigger = triggerElement;
  }

  form?.reset();
  planName.textContent = plan.label;
  planAmount.textContent = plan.priceText;
  planMeta.textContent = plan.meta;
  planKeyInput.value = plan.key;
  formStatus.textContent = 'Complete your academy registration first. Digrro will send your confirmation email from system@digrro.com before you continue to Wise.';
  submitButton.textContent = 'Continue to Wise';
  submitButton.disabled = false;
  modal.removeAttribute('inert');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    firstInput?.focus();
  });
}

function closeModal() {
  const modal = document.getElementById('enrollment-modal');
  const activeElement = document.activeElement;

  if (activeElement instanceof HTMLElement && modal?.contains(activeElement)) {
    activeElement.blur();
  }

  modal?.classList.remove('is-open');
  modal?.setAttribute('aria-hidden', 'true');
  modal?.setAttribute('inert', '');

  if (lastModalTrigger instanceof HTMLElement && document.contains(lastModalTrigger)) {
    lastModalTrigger.focus();
  }

  lastModalTrigger = null;
}

async function submitRegistration(plan, registrationDetails, checkoutReference) {
  try {
    const response = await fetch(getRegistrationApiUrl(), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        planKey: plan.key,
        checkoutReference,
        ...registrationDetails
      })
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        message: 'The registration backend is not available in this environment yet.'
      };
    }

    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        message: payload?.message || 'We could not complete your registration right now.'
      };
    }

    return payload;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'We could not reach the registration backend.'
    };
  }
}

function renderPaymentStatus() {
  const statusText = document.getElementById('wise-status-text');
  if (!statusText) {
    return;
  }

  statusText.textContent = 'Choose a plan, complete your registration details, confirm your email from Digrro, and continue to Wise.';
}

function bindButtons() {
  document.querySelectorAll('[data-enroll-plan]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const plan = getPlan(button.getAttribute('data-enroll-plan'));
      if (!plan) {
        return;
      }

      openModal(plan.key, button);
    });
  });

  document.querySelectorAll('[data-plan-link]').forEach((anchor) => {
    const plan = getPlan(anchor.getAttribute('data-plan-link'));
    if (!plan) {
      return;
    }
    anchor.href = plan.wiseUrl;
  });

  const stickyButton = document.querySelector('[data-sticky-pay]');
  if (stickyButton) {
    const bestPlan = planEntries.find((entry) => entry.key === 'bootcamp') || planEntries[0];
    stickyButton.addEventListener('click', (event) => {
      event.preventDefault();
      openModal(bestPlan.key, stickyButton);
    });
  }
}

function bindModal() {
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', closeModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
}

async function handleEnrollmentSubmit(event) {
  event.preventDefault();

  const statusNode = document.getElementById('enrollment-status');
  const submitButton = document.getElementById('enrollment-submit');
  const plan = getPlan(document.getElementById('selected-plan-key').value);
  const fullName = document.getElementById('enrollment-name').value.trim();
  const email = document.getElementById('enrollment-email').value.trim().toLowerCase();
  const confirmEmail = document.getElementById('enrollment-email-confirm').value.trim().toLowerCase();
  const phoneNumber = document.getElementById('enrollment-phone').value.trim();
  const password = document.getElementById('enrollment-password').value;
  const addressLine = document.getElementById('enrollment-address').value.trim();
  const country = document.getElementById('enrollment-country').value.trim();
  const city = document.getElementById('enrollment-city').value.trim();
  const pincode = document.getElementById('enrollment-pincode').value.trim();
  const company = document.getElementById('enrollment-company').value.trim();
  const checkoutReference = buildCheckoutReference();
  const registrationDetails = {
    fullName,
    email,
    phoneNumber,
    password,
    addressLine,
    country,
    city,
    pincode,
    company
  };

  if (!plan) {
    statusNode.textContent = 'Please choose a valid training plan.';
    return;
  }

  if (!fullName || !email || !confirmEmail || !phoneNumber || !addressLine || !country || !city || !pincode) {
    statusNode.textContent = 'Complete all required registration fields before checkout.';
    return;
  }

  if (email !== confirmEmail) {
    statusNode.textContent = 'Email and confirm email must match.';
    return;
  }

  if (phoneNumber.replace(/\D/g, '').length < 7) {
    statusNode.textContent = 'Enter a valid phone number.';
    return;
  }

  if (password.length < 8) {
    statusNode.textContent = 'Use a password with at least 8 characters.';
    return;
  }

  submitButton.disabled = true;
  statusNode.textContent = 'Saving your registration and sending your confirmation email...';
  localStorage.setItem('digrro_academy_email', email);
  localStorage.setItem('digrro_academy_checkout_reference', checkoutReference);
  localStorage.setItem('digrro_academy_selected_plan', plan.key);

  const registrationResult = await submitRegistration(plan, registrationDetails, checkoutReference);
  if (!registrationResult.ok) {
    statusNode.textContent = registrationResult.message || 'We could not complete your academy registration.';
    submitButton.disabled = false;
    return;
  }

  statusNode.textContent = registrationResult.message || 'Registration saved. Redirecting to Wise...';
  window.location.href = registrationResult.checkoutUrl || plan.wiseUrl;
}

function init() {
  bindButtons();
  bindModal();
  renderPaymentStatus();
  document.getElementById('enrollment-form')?.addEventListener('submit', handleEnrollmentSubmit);
}

init();