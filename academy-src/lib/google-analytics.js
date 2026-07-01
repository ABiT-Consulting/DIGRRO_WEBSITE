import { resolveApiUrl } from './api-url.js';

const BUILD_GOOGLE_ANALYTICS_ID = String(
  import.meta.env.VITE_GOOGLE_ANALYTICS_ID || import.meta.env.VITE_GA_MEASUREMENT_ID || '',
).trim();
const DEFAULT_GOOGLE_ANALYTICS_ID = 'G-RH6L7EDCHK';

const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;

let initialized = false;
let initializationStarted = false;

function pagePath() {
  return `${window.location.pathname}${window.location.search}`;
}

function normalizeMeasurementId(value) {
  const measurementId = String(value || '').trim();
  return GA4_MEASUREMENT_ID_PATTERN.test(measurementId) ? measurementId : '';
}

function installGoogleAnalytics(measurementId) {
  if (initialized) return;

  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    page_path: pagePath(),
    page_title: document.title,
  });
}

async function loadRuntimeMeasurementId() {
  const response = await fetch(resolveApiUrl('./api/public-config.php'), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) {
    return '';
  }

  const data = await response.json();
  return normalizeMeasurementId(data.googleAnalyticsId);
}

export function initGoogleAnalytics() {
  if (initialized || initializationStarted || typeof window === 'undefined' || typeof document === 'undefined') return;

  const buildMeasurementId = normalizeMeasurementId(BUILD_GOOGLE_ANALYTICS_ID);
  if (buildMeasurementId) {
    installGoogleAnalytics(buildMeasurementId);
    return;
  }

  initializationStarted = true;
  loadRuntimeMeasurementId()
    .then((runtimeMeasurementId) => {
      installGoogleAnalytics(runtimeMeasurementId || DEFAULT_GOOGLE_ANALYTICS_ID);
    })
    .catch(() => {
      installGoogleAnalytics(DEFAULT_GOOGLE_ANALYTICS_ID);
    })
    .finally(() => {
      if (!initialized) initializationStarted = false;
    });
}

export function trackGoogleAnalyticsEvent(action, parameters = {}) {
  if (!initialized || typeof window.gtag !== 'function') return;
  window.gtag('event', action, parameters);
}
