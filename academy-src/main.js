import "./styles.css";
import { getPlan, planEntries } from "./lib/plans.js";
import {
  buildPaymentLink,
  getStripeCheckoutLabel,
  getStripeCheckoutSummary,
  isStripeConfigured,
  isStripePlanConfigured,
} from "./lib/stripe-links.js";

const registrationApiPath = "./api/register.php";
const registrationApiTimeoutMs = 4500;
const emailVerificationApiUrl = "http://127.0.0.1:3000/register";
let lastModalTrigger = null;

function buildCheckoutReference() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `academy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function requestEmailVerification(email, checkoutUrl) {
  console.log("Sending email verification request to backend:", email);

  const response = await fetch(emailVerificationApiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, checkoutUrl }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || "Email verification request failed.");
  }

  console.log("Backend accepted email verification request:", payload);
  return payload;
}

function isValidStripeRedirectUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "buy.stripe.com";
  } catch (error) {
    return false;
  }
}

function handleVerifiedSuccessRoute() {
  if (window.location.pathname !== "/verified-success") {
    return false;
  }

  console.log("[frontend] /verified-success route detected");

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const redirectUrl = params.get("redirect") || "";
  const canRedirectToPayment = !status && isValidStripeRedirectUrl(redirectUrl);

  document.body.replaceChildren();

  const main = document.createElement("main");
  main.style.cssText =
    "min-height:100vh;display:grid;place-items:center;padding:24px;font-family:system-ui,sans-serif;background:#07111f;color:#ebf3ff;";

  const panel = document.createElement("section");
  panel.style.cssText =
    "width:min(560px,100%);padding:28px;border:1px solid rgba(126,169,255,.24);background:rgba(11,25,43,.95);border-radius:16px;box-shadow:0 24px 70px rgba(2,8,18,.4);";

  const badge = document.createElement("div");
  badge.textContent = canRedirectToPayment ? "Verified" : "Verification issue";
  badge.style.cssText =
    "display:inline-flex;margin-bottom:14px;padding:6px 10px;border-radius:999px;background:rgba(95,228,255,.14);color:#5fe4ff;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:.06em;";

  const heading = document.createElement("h1");
  heading.textContent = canRedirectToPayment
    ? "Email verified"
    : "We could not verify this link";
  heading.style.cssText = "margin:0 0 12px;font-size:32px;";

  const copy = document.createElement("p");
  copy.textContent = canRedirectToPayment
    ? "Your email has been verified. Redirecting you to secure payment in 2 seconds."
    : "The verification link was invalid or could not be processed. Please register again to request a new link.";
  copy.style.cssText = "margin:0;line-height:1.65;color:#b9c8df;";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = canRedirectToPayment
    ? "Continue to Payment"
    : "Return to Academy";
  button.style.cssText =
    "margin-top:20px;border:0;border-radius:999px;padding:12px 18px;background:#ffcc66;color:#07111f;font-weight:800;cursor:pointer;";
  button.addEventListener("click", () => {
    if (canRedirectToPayment) {
      console.log("[frontend] manual payment redirect:", redirectUrl);
      window.location.href = redirectUrl;
      return;
    }

    window.location.href = "/";
  });

  if (canRedirectToPayment) {
    localStorage.setItem("digrro_academy_email_verified", "true");
    window.setTimeout(() => {
      console.log("[frontend] automatic payment redirect:", redirectUrl);
      window.location.href = redirectUrl;
    }, 2000);
  }

  panel.append(badge, heading, copy, button);
  main.append(panel);
  document.body.append(main);

  return true;
}

function openModal(planKey, triggerElement = null) {
  const plan = getPlan(planKey);
  if (!plan) {
    return;
  }

  const modal = document.getElementById("enrollment-modal");
  const form = document.getElementById("enrollment-form");
  const planName = document.getElementById("selected-plan-name");
  const planAmount = document.getElementById("selected-plan-amount");
  const planMeta = document.getElementById("selected-plan-meta");
  const planKeyInput = document.getElementById("selected-plan-key");
  const formStatus = document.getElementById("enrollment-status");
  const submitButton = document.getElementById("enrollment-submit");
  const firstInput = document.getElementById("enrollment-name");

  if (triggerElement instanceof HTMLElement) {
    lastModalTrigger = triggerElement;
  }

  form?.reset();
  planName.textContent = plan.label;
  planAmount.textContent = plan.priceText;
  planMeta.textContent = plan.meta;
  planKeyInput.value = plan.key;
  const isSelectedPlanConfigured = isStripePlanConfigured(plan.key);
  formStatus.textContent = isSelectedPlanConfigured
    ? "Complete your academy registration details, then continue to secure Stripe checkout."
    : "Stripe checkout is not configured yet for this environment.";
  submitButton.textContent = getStripeCheckoutLabel();
  submitButton.disabled = !isSelectedPlanConfigured;
  modal.removeAttribute("inert");
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    firstInput?.focus();
  });
}

function getRegistrationApiUrl() {
  return new URL(registrationApiPath, window.location.href).href;
}

function closeModal() {
  const modal = document.getElementById("enrollment-modal");
  const activeElement = document.activeElement;

  if (activeElement instanceof HTMLElement && modal?.contains(activeElement)) {
    activeElement.blur();
  }

  modal?.classList.remove("is-open");
  modal?.setAttribute("aria-hidden", "true");
  modal?.setAttribute("inert", "");

  if (
    lastModalTrigger instanceof HTMLElement &&
    document.contains(lastModalTrigger)
  ) {
    lastModalTrigger.focus();
  }

  lastModalTrigger = null;
}

async function submitRegistration(
  plan,
  registrationDetails,
  checkoutReference,
) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, registrationApiTimeoutMs);

  try {
    const response = await fetch(getRegistrationApiUrl(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        planKey: plan.key,
        checkoutReference,
        sendConfirmationEmail: true,
        ...registrationDetails,
      }),
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return { ok: false };
    }

    const payload = await response.json();
    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        message:
          payload?.message ||
          "Registration backend did not accept the request.",
      };
    }

    return payload;
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Registration backend is unavailable.",
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function renderPaymentStatus() {
  const statusText = document.getElementById("stripe-status-text");
  if (!statusText) {
    return;
  }

  statusText.textContent = getStripeCheckoutSummary();
}

function bindButtons() {
  document.querySelectorAll("[data-enroll-plan]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const plan = getPlan(button.getAttribute("data-enroll-plan"));
      if (!plan) {
        return;
      }

      openModal(plan.key, button);
    });
  });

  document.querySelectorAll("[data-plan-link]").forEach((anchor) => {
    const plan = getPlan(anchor.getAttribute("data-plan-link"));
    if (!plan) {
      return;
    }

    anchor.href = "#payment";
    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(plan.key, anchor);
    });
  });

  const stickyButton = document.querySelector("[data-sticky-pay]");
  if (stickyButton) {
    const bestPlan =
      planEntries.find((entry) => entry.key === "bootcamp") || planEntries[0];
    stickyButton.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(bestPlan.key, stickyButton);
    });
  }
}

function bindModal() {
  document.getElementById("modal-close")?.addEventListener("click", closeModal);
  document
    .getElementById("modal-cancel")
    ?.addEventListener("click", closeModal);
  document
    .getElementById("modal-backdrop")
    ?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
}

async function handleEnrollmentSubmit(event) {
  event.preventDefault();

  const statusNode = document.getElementById("enrollment-status");
  const submitButton = document.getElementById("enrollment-submit");
  const plan = getPlan(document.getElementById("selected-plan-key").value);
  const fullName = document.getElementById("enrollment-name").value.trim();
  const email = document
    .getElementById("enrollment-email")
    .value.trim()
    .toLowerCase();
  const confirmEmail = document
    .getElementById("enrollment-email-confirm")
    .value.trim()
    .toLowerCase();
  const phoneNumber = document.getElementById("enrollment-phone").value.trim();
  const password = document.getElementById("enrollment-password").value;
  const addressLine = document
    .getElementById("enrollment-address")
    .value.trim();
  const country = document.getElementById("enrollment-country").value.trim();
  const city = document.getElementById("enrollment-city").value.trim();
  const pincode = document.getElementById("enrollment-pincode").value.trim();

  if (!plan) {
    statusNode.textContent = "Please choose a valid training plan.";
    return;
  }

  if (!isStripeConfigured) {
    statusNode.textContent =
      "Stripe checkout is not configured right now. Add the Stripe secret key for this environment and try again.";
    return;
  }

  if (
    !fullName ||
    !email ||
    !confirmEmail ||
    !phoneNumber ||
    !addressLine ||
    !country ||
    !city ||
    !pincode
  ) {
    statusNode.textContent =
      "Complete all required registration fields before checkout.";
    return;
  }

  if (email !== confirmEmail) {
    statusNode.textContent = "Email and confirm email must match.";
    return;
  }

  if (phoneNumber.replace(/\D/g, "").length < 7) {
    statusNode.textContent = "Enter a valid phone number.";
    return;
  }

  if (password.length < 8) {
    statusNode.textContent = "Use a password with at least 8 characters.";
    return;
  }

  const checkoutReference = buildCheckoutReference();
  const fallbackCheckoutUrl = buildPaymentLink(plan.key, {
    email,
    checkoutReference,
  });

  if (!fallbackCheckoutUrl) {
    statusNode.textContent =
      "Stripe checkout is not configured for this plan yet.";
    return;
  }

  submitButton.disabled = true;
  statusNode.textContent = "Sending verification email...";
  localStorage.setItem("digrro_academy_email", email);
  localStorage.setItem("digrro_academy_checkout_reference", checkoutReference);
  localStorage.setItem("digrro_academy_selected_plan", plan.key);

  try {
    await requestEmailVerification(email, fallbackCheckoutUrl);
    statusNode.textContent =
      "Verification email sent. Check your inbox before continuing to Stripe.";
  } catch (error) {
    console.error("Email verification request failed:", error);
    statusNode.textContent =
      error instanceof Error
        ? error.message
        : "Could not send the verification email.";
    submitButton.disabled = false;
  }
}

function init() {
  if (handleVerifiedSuccessRoute()) {
    return;
  }

  bindButtons();
  bindModal();
  renderPaymentStatus();
  document
    .getElementById("enrollment-form")
    ?.addEventListener("submit", handleEnrollmentSubmit);
}

init();
