import { stripePaymentLinks } from './generated-payment-links.js';

export const stripeCheckoutMode = stripePaymentLinks.mode || 'unconfigured';

function getValidPaymentLinkUrl(planKey) {
  const link = stripePaymentLinks.links?.[planKey];
  if (!link?.url) {
    return null;
  }

  try {
    const url = new URL(link.url);
    return url.protocol === 'https:' ? url : null;
  } catch (error) {
    return null;
  }
}

export function isStripePlanConfigured(planKey) {
  return getValidPaymentLinkUrl(planKey) !== null;
}

export const isStripeConfigured = Object.keys(stripePaymentLinks.links || {}).some(isStripePlanConfigured);

export function getStripeCheckoutLabel() {
  return isStripeConfigured ? 'Continue to Stripe' : 'Stripe unavailable';
}

export function getStripeCheckoutSummary() {
  if (!isStripeConfigured) {
    return 'Stripe checkout is not configured for this environment yet.';
  }

  return stripeCheckoutMode === 'live'
    ? 'Choose a plan, verify your email, and continue to secure Stripe checkout.'
    : 'Choose a plan, verify your email, and continue to Stripe test checkout.';
}

export function buildPaymentLink(planKey, { email, checkoutReference } = {}) {
  const url = getValidPaymentLinkUrl(planKey);
  if (!url) {
    return null;
  }

  if (email) {
    url.searchParams.set('prefilled_email', email);
  }

  if (checkoutReference) {
    url.searchParams.set('client_reference_id', checkoutReference);
  }

  url.searchParams.set('utm_source', 'digrro_academy');
  url.searchParams.set('utm_medium', 'website');
  url.searchParams.set('utm_campaign', planKey);

  return url.toString();
}
