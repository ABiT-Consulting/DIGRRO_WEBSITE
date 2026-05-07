import "./styles.css";
import { getPlan, planEntries } from "./lib/plans.js";
import {
  getStripeCheckoutSummary,
} from "./lib/stripe-links.js";

function getConfiguredApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_ACADEMY_API_BASE_URL || "";

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  return import.meta.env.DEV ? "http://127.0.0.1:3000" : "";
}

function getRelativeApiUrl(fileName) {
  return new URL(`api/${fileName}`, window.location.href).toString();
}

const apiBaseUrl = getConfiguredApiBaseUrl();
const registrationApiUrl = apiBaseUrl
  ? `${apiBaseUrl}/register`
  : getRelativeApiUrl("register.php");
const checkoutUrlApiUrl = apiBaseUrl ? `${apiBaseUrl}/checkout-url` : "";
let lastModalTrigger = null;

function getFrontendHomeUrl() {
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || "";

  return frontendUrl || "/";
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

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  document.body.replaceChildren();

  const main = document.createElement("main");
  main.style.cssText =
    "min-height:100vh;display:grid;place-items:center;padding:24px;font-family:system-ui,sans-serif;background:#07111f;color:#ebf3ff;";

  const panel = document.createElement("section");
  panel.style.cssText =
    "width:min(560px,100%);padding:28px;border:1px solid rgba(126,169,255,.24);background:rgba(11,25,43,.95);border-radius:16px;box-shadow:0 24px 70px rgba(2,8,18,.4);";

  const badge = document.createElement("div");
  badge.textContent = "Verified";
  badge.style.cssText =
    "display:inline-flex;margin-bottom:14px;padding:6px 10px;border-radius:999px;background:rgba(95,228,255,.14);color:#5fe4ff;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:.06em;";

  const heading = document.createElement("h1");
  heading.textContent = "Email verified successfully ✅";
  heading.style.cssText = "margin:0 0 12px;font-size:32px;";

  const copy = document.createElement("p");
  copy.textContent =
    "You will be redirected to the payment page in 3 seconds...";
  copy.style.cssText = "margin:0;line-height:1.65;color:#b9c8df;";

  const countdown = document.createElement("div");
  countdown.textContent = "3";
  countdown.style.cssText =
    "margin-top:20px;font-size:52px;line-height:1;font-weight:900;color:#ffcc66;";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Continue to Payment";
  button.disabled = true;
  button.style.cssText =
    "margin-top:20px;border:0;border-radius:999px;padding:12px 18px;background:#ffcc66;color:#07111f;font-weight:800;cursor:pointer;";

  panel.append(badge, heading, copy, countdown, button);
  main.append(panel);
  document.body.append(main);

  fetchCheckoutUrl(token)
    .then((checkoutUrl) => {
      button.disabled = false;
      button.addEventListener("click", () => {
        window.location.href = checkoutUrl;
      });
      startPaymentCountdown(checkoutUrl, countdown);
    })
    .catch((error) => {
      console.error("[frontend] checkout URL lookup failed:", error);
      badge.textContent = "Verification issue";
      heading.textContent = "Payment link unavailable";
      copy.textContent =
        "Your email was verified, but the payment page could not be loaded. Please return to the academy page and try again.";
      countdown.textContent = "";
      button.disabled = false;
      button.textContent = "Return to Academy";
      button.addEventListener("click", () => {
        window.location.href = "/";
      });
    });

  return true;
}

async function fetchCheckoutUrl(token) {
  if (!token) {
    throw new Error("Missing verification token.");
  }

  if (!checkoutUrlApiUrl) {
    throw new Error("Checkout URL lookup is not configured.");
  }

  const url = new URL(checkoutUrlApiUrl);
  url.searchParams.set("token", token);

  const response = await fetch(url.toString());
  const payload = await response.json().catch(() => ({}));
  const checkoutUrl = payload.checkout_url || payload.checkoutUrl;

  if (!response.ok || !payload.ok || !isValidStripeRedirectUrl(checkoutUrl)) {
    throw new Error(payload.message || "Checkout URL is not available.");
  }

  return checkoutUrl;
}

function startPaymentCountdown(checkoutUrl, countdownNode) {
  let seconds = 3;
  countdownNode.textContent = String(seconds);

  const interval = setInterval(() => {
    seconds--;
    countdownNode.textContent = String(seconds);

    if (seconds === 0) {
      clearInterval(interval);
      window.location.href = checkoutUrl;
    }
  }, 1000);
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
  formStatus.textContent =
    "Enter your email, then check your inbox for the verification link.";
  submitButton.textContent = "Continue to Stripe";
  submitButton.disabled = false;
  modal.removeAttribute("inert");
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    firstInput?.focus();
  });
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

function createCheckoutReference(planKey) {
  const timestamp = Date.now().toString(36);
  if (window.crypto?.randomUUID) {
    return `${planKey}-${timestamp}-${window.crypto.randomUUID()}`;
  }

  return `${planKey}-${timestamp}-${Math.random().toString(36).slice(2, 12)}`;
}

function getFormValue(formData, key) {
  return String(formData.get(key) || "").trim();
}

function getRegistrationPayload(form, planKey) {
  const formData = new FormData(form);

  return {
    planKey,
    fullName: getFormValue(formData, "fullName"),
    email: getFormValue(formData, "email").toLowerCase(),
    confirmEmail: getFormValue(formData, "confirmEmail").toLowerCase(),
    phoneNumber: getFormValue(formData, "phoneNumber"),
    password: String(formData.get("password") || ""),
    addressLine: getFormValue(formData, "address"),
    country: getFormValue(formData, "country"),
    city: getFormValue(formData, "city"),
    pincode: getFormValue(formData, "pincode"),
    company: getFormValue(formData, "company"),
    checkoutReference: createCheckoutReference(planKey),
    sendConfirmationEmail: true,
  };
}

async function submitRegistration(requestPayload) {
  try {
    const response = await fetch(registrationApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Plan-Key": requestPayload.planKey,
      },
      body: JSON.stringify(requestPayload),
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return { ok: false };
    }

    const responsePayload = await response.json();
    const requestSucceeded = Boolean(
      responsePayload?.ok || responsePayload?.success,
    );
    if (!response.ok || !requestSucceeded) {
      return {
        ok: false,
        message:
          responsePayload?.message ||
          "Registration backend did not accept the request.",
      };
    }

    return { ...responsePayload, ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Registration backend is unavailable.",
    };
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

  const form = event.currentTarget;
  const statusNode = document.getElementById("enrollment-status");
  const submitButton = document.getElementById("enrollment-submit");
  const plan = getPlan(document.getElementById("selected-plan-key").value);

  if (!plan) {
    statusNode.textContent = "Please choose a valid training plan.";
    return;
  }

  const registrationPayload = getRegistrationPayload(form, plan.key);

  if (!registrationPayload.email) {
    statusNode.textContent = "Enter your email before checkout.";
    return;
  }

  if (
    registrationPayload.confirmEmail &&
    registrationPayload.email !== registrationPayload.confirmEmail
  ) {
    statusNode.textContent = "Email and confirm email must match.";
    return;
  }

  submitButton.disabled = true;
  statusNode.textContent = "Sending verification email...";

  const registrationResult = await submitRegistration(registrationPayload);

  if (registrationResult.alreadyExists === true) {
    statusNode.textContent =
      registrationResult.message || "This email is already registered";
    submitButton.textContent = "Already registered";
    window.setTimeout(() => {
      window.location.href = getFrontendHomeUrl();
    }, 1200);
    return;
  }

  if (registrationResult.alreadyPaid) {
    statusNode.textContent =
      registrationResult.message || "Payment already completed.";
    submitButton.textContent = "Payment complete";
    return;
  }

  if (registrationResult.ok) {
    if (
      registrationResult.emailVerificationRequired === false &&
      isValidStripeRedirectUrl(registrationResult.checkoutUrl)
    ) {
      statusNode.textContent =
        registrationResult.message || "Your email is verified. Opening Stripe...";
      submitButton.textContent = "Opening Stripe";
      window.location.href = registrationResult.checkoutUrl;
      return;
    }

    if (registrationResult.emailVerificationSent === false) {
      if (isValidStripeRedirectUrl(registrationResult.checkoutUrl)) {
        statusNode.textContent =
          "Your registration is saved. Email delivery is unavailable right now, so we are opening secure Stripe checkout.";
        submitButton.textContent = "Opening Stripe";
        window.location.href = registrationResult.checkoutUrl;
        return;
      }

      statusNode.textContent =
        registrationResult.message ||
        "Your registration is saved, but the email could not be sent. Please try again.";
      submitButton.textContent = "Try again";
      submitButton.disabled = false;
      return;
    }

    statusNode.textContent =
      registrationResult.message ||
      "Verification email sent. Please check your inbox.";
    submitButton.textContent = "Check your email";
    return;
  }

  statusNode.textContent =
    registrationResult.message ||
    "Registration backend is unavailable. Please try again in a moment.";
  submitButton.disabled = false;
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
