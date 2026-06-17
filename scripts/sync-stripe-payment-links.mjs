import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Stripe from 'stripe';
import { planEntries } from '../academy-src/lib/plans.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const envFilePaths = [
  path.join(workspaceRoot, '.env'),
  path.join(workspaceRoot, '.env.local')
];
const generatedLinksModulePath = path.join(workspaceRoot, 'academy-src', 'lib', 'generated-payment-links.js');
const generatedLinksJsonPath = path.join(workspaceRoot, 'academy-server', 'api', 'generated-payment-links.json');
const academyMetadata = {
  academy_system: 'digrro_academy'
};

function parseEnvContent(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((values, line) => {
      const delimiterIndex = line.indexOf('=');
      if (delimiterIndex === -1) {
        return values;
      }

      const key = line.slice(0, delimiterIndex).trim();
      let value = line.slice(delimiterIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      values[key] = value;
      return values;
    }, {});
}

async function loadLocalEnvFiles() {
  const mergedEnv = {};

  for (const filePath of envFilePaths) {
    if (!existsSync(filePath)) {
      continue;
    }

    const envContent = await readFile(filePath, 'utf8');
    Object.assign(mergedEnv, parseEnvContent(envContent));
  }

  return mergedEnv;
}

function pickEnv(localEnv, ...names) {
  for (const name of names) {
    const processValue = process.env[name];
    if (processValue) {
      return processValue;
    }

    const localValue = localEnv[name];
    if (localValue) {
      return localValue;
    }
  }

  return '';
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function isLocalhostUrl(value) {
  try {
    const url = new URL(value);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
  } catch (error) {
    return false;
  }
}

function inferStripeMode(secretKey) {
  if (secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_')) {
    return 'test';
  }

  if (secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_')) {
    return 'live';
  }

  return 'unknown';
}

function explicitRequestedStripeMode(localEnv) {
  const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
  const requestedMode = modeArg ? modeArg.slice('--mode='.length).toLowerCase().trim() : '';
  if (['production', 'prod', 'live'].includes(requestedMode)) {
    return 'live';
  }

  if (['development', 'dev', 'local', 'test', 'testing'].includes(requestedMode)) {
    return 'test';
  }

  const configured = String(pickEnv(localEnv, 'STRIPE_MODE', 'STRIPE_ENV', 'ACADEMY_ENV', 'APP_ENV', 'NODE_ENV')).toLowerCase();
  if (['production', 'prod', 'live'].includes(configured)) {
    return 'live';
  }

  if (['development', 'dev', 'local', 'test', 'testing'].includes(configured)) {
    return 'test';
  }

  return '';
}

function defaultAcademyBaseUrl(localEnv) {
  const configuredBaseUrl = trimTrailingSlash(pickEnv(localEnv, 'FRONTEND_URL', 'ACADEMY_BASE_URL', 'VITE_ACADEMY_BASE_URL'));
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (explicitRequestedStripeMode(localEnv) === 'live') {
    return 'https://digrro.com/academy';
  }

  const devPort = pickEnv(localEnv, 'VITE_DEV_PORT') || '5176';
  return `http://127.0.0.1:${devPort}`;
}

function inferRequestedStripeMode(localEnv, academyBaseUrl) {
  const explicitMode = explicitRequestedStripeMode(localEnv);
  if (explicitMode) {
    return explicitMode;
  }

  return isLocalhostUrl(academyBaseUrl) ? 'test' : 'live';
}

function stripeKeyMatchesMode(secretKey, requestedMode) {
  if (requestedMode === 'live') {
    return secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_');
  }

  return secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_');
}

function pickStripeSecretKey(localEnv, requestedMode) {
  const preferredNames = requestedMode === 'live'
    ? ['STRIPE_SECRET_KEY_LIVE', 'STRIPE_LIVE_SECRET_KEY', 'STRIPE_SECRET_LIVE']
    : ['STRIPE_SECRET_KEY_TEST', 'STRIPE_TEST_SECRET_KEY', 'STRIPE_SECRET_TEST'];
  const preferred = pickEnv(localEnv, ...preferredNames);
  if (preferred) {
    return preferred;
  }

  const legacyNames = ['STRIPE_SECRET_KEY', 'STRIPE_SECRET', 'Secret key', 'secret_key', 'stripe_secret_key'];
  for (const name of legacyNames) {
    const value = pickEnv(localEnv, name);
    if (value && stripeKeyMatchesMode(value, requestedMode)) {
      return value;
    }
  }

  return '';
}

function paymentLinkEnvNames(planKey, requestedMode) {
  const plan = planKey.toUpperCase();
  const mode = requestedMode.toUpperCase();
  return [
    `STRIPE_${mode}_PAYMENT_LINK_${plan}`,
    `STRIPE_PAYMENT_LINK_${plan}_${mode}`,
    `STRIPE_PAYMENT_LINK_${plan}`
  ];
}

function isStripePaymentLinkUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'buy.stripe.com';
  } catch (error) {
    return false;
  }
}

function inferPaymentLinkModeFromUrls(links) {
  const urls = Object.values(links).map((link) => link.url || '');
  if (urls.some((url) => url.includes('/test_'))) {
    return 'test';
  }

  return 'live';
}

function hasCompletePaymentLinks(config) {
  if (!config || typeof config !== 'object' || !config.links || typeof config.links !== 'object') {
    return false;
  }

  return planEntries.every((plan) => isStripePaymentLinkUrl(config.links?.[plan.key]?.url));
}

function generatedLinksMatchMode(config, requestedMode) {
  if (!hasCompletePaymentLinks(config)) {
    return false;
  }

  const linkMode = inferPaymentLinkModeFromUrls(config.links);
  return requestedMode === 'live' ? linkMode === 'live' : linkMode === 'test';
}

async function readGeneratedLinksJson() {
  if (!existsSync(generatedLinksJsonPath)) {
    return null;
  }

  try {
    return JSON.parse(await readFile(generatedLinksJsonPath, 'utf8'));
  } catch (error) {
    return null;
  }
}

async function importGeneratedLinksModule() {
  if (!existsSync(generatedLinksModulePath)) {
    return null;
  }

  try {
    const moduleUrl = pathToFileURL(generatedLinksModulePath).href;
    const generatedModule = await import(moduleUrl);
    return generatedModule.stripePaymentLinks || null;
  } catch (error) {
    return null;
  }
}

async function loadExistingGeneratedLinks(requestedMode) {
  const jsonConfig = await readGeneratedLinksJson();
  if (generatedLinksMatchMode(jsonConfig, requestedMode)) {
    return jsonConfig;
  }

  const moduleConfig = await importGeneratedLinksModule();
  if (generatedLinksMatchMode(moduleConfig, requestedMode)) {
    return moduleConfig;
  }

  return null;
}

function normalizeExistingLinks(config, academyBaseUrl) {
  const existingBaseUrl = trimTrailingSlash(config.academyBaseUrl);
  const requestedBaseUrl = trimTrailingSlash(academyBaseUrl);
  const fallbackBaseUrl = !isLocalhostUrl(existingBaseUrl) && existingBaseUrl
    ? existingBaseUrl
    : (!isLocalhostUrl(requestedBaseUrl) ? requestedBaseUrl : '');
  const links = {};

  for (const plan of planEntries) {
    links[plan.key] = {
      productId: config.links[plan.key].productId || null,
      priceId: config.links[plan.key].priceId || null,
      paymentLinkId: config.links[plan.key].paymentLinkId || null,
      url: trimTrailingSlash(config.links[plan.key].url)
    };
  }

  return {
    mode: config.mode || 'existing',
    generatedAt: new Date().toISOString(),
    academyBaseUrl: fallbackBaseUrl,
    links
  };
}

async function writeGeneratedConfig(config, label) {
  await writeFile(generatedLinksModulePath, toModuleFile(config), 'utf8');
  await writeFile(generatedLinksJsonPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  console.log(`Saved ${label} to ${generatedLinksModulePath}`);
  console.log(`Saved ${label} JSON to ${generatedLinksJsonPath}`);
}

async function writeExistingLinksFallback(academyBaseUrl, reason, requestedMode) {
  const existingConfig = await loadExistingGeneratedLinks(requestedMode);
  if (!existingConfig) {
    return false;
  }

  console.warn(`${reason} Reusing the existing generated Stripe payment links.`);
  await writeGeneratedConfig(normalizeExistingLinks(existingConfig, academyBaseUrl), 'existing Stripe payment links');
  return true;
}

async function writeRuntimeOnlyConfig(academyBaseUrl, reason, requestedMode) {
  console.warn(`${reason} Writing ${requestedMode} runtime-only config without static Stripe Payment Links.`);
  await writeGeneratedConfig({
    mode: `${requestedMode}-runtime`,
    generatedAt: new Date().toISOString(),
    academyBaseUrl,
    links: {}
  }, `${requestedMode} runtime-only Stripe config`);
}

function buildManualLinks(localEnv, academyBaseUrl, requestedMode) {
  const links = {};
  const missingEnvNames = [];

  for (const plan of planEntries) {
    const envNames = paymentLinkEnvNames(plan.key, requestedMode);
    const paymentLinkUrl = trimTrailingSlash(pickEnv(localEnv, ...envNames));

    if (!paymentLinkUrl) {
      missingEnvNames.push(envNames[0]);
      continue;
    }

    if (!isStripePaymentLinkUrl(paymentLinkUrl)) {
      throw new Error(`${envNames[0]} must be a Stripe Payment Link URL that starts with https://buy.stripe.com/.`);
    }

    links[plan.key] = {
      productId: null,
      priceId: null,
      paymentLinkId: null,
      url: paymentLinkUrl
    };
  }

  return {
    links,
    missingEnvNames
  };
}

async function ensureProduct(stripe, plan) {
  const products = await stripe.products.list({ active: true, limit: 100 });
  const existingProduct = products.data.find(
    (product) =>
      product.metadata?.academy_system === academyMetadata.academy_system
      && product.metadata?.academy_plan_key === plan.key
  );

  if (existingProduct) {
    return existingProduct;
  }

  return stripe.products.create({
    name: `Digrro Academy | ${plan.label}`,
    description: plan.checkoutDescription || plan.meta,
    metadata: {
      ...academyMetadata,
      academy_plan_key: plan.key
    }
  });
}

async function ensurePrice(stripe, productId, plan) {
  const amountCents = Math.round(plan.amountUsd * 100);
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const existingPrice = prices.data.find(
    (price) => price.currency === 'usd' && price.type === 'one_time' && price.unit_amount === amountCents
  );

  if (existingPrice) {
    return existingPrice;
  }

  return stripe.prices.create({
    currency: 'usd',
    unit_amount: amountCents,
    product: productId,
    metadata: {
      ...academyMetadata,
      academy_plan_key: plan.key,
      academy_amount_cents: String(amountCents)
    }
  });
}

async function ensurePaymentLink(stripe, priceId, plan, academyBaseUrl) {
  const amountCents = Math.round(plan.amountUsd * 100);
  const paymentLinks = await stripe.paymentLinks.list({ limit: 100 });
  const existingLink = paymentLinks.data.find(
    (link) =>
      link.active
      && link.metadata?.academy_system === academyMetadata.academy_system
      && link.metadata?.academy_plan_key === plan.key
      && link.metadata?.academy_amount_cents === String(amountCents)
      && link.metadata?.academy_base_url === academyBaseUrl
  );

  if (existingLink) {
    return stripe.paymentLinks.update(existingLink.id, {
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: {}
      }
    });
  }

  return stripe.paymentLinks.create({
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    after_completion: {
      type: 'hosted_confirmation',
      hosted_confirmation: {}
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    customer_creation: 'always',
    phone_number_collection: {
      enabled: true
    },
    submit_type: 'pay',
    metadata: {
      ...academyMetadata,
      academy_plan_key: plan.key,
      academy_amount_cents: String(amountCents),
      academy_base_url: academyBaseUrl
    }
  });
}

function toModuleFile(config) {
  return `// Auto-generated by \`npm run academy:stripe:sync\`.\nexport const stripePaymentLinks = ${JSON.stringify(config, null, 2)};\n`;
}

async function main() {
  const localEnv = await loadLocalEnvFiles();
  const academyBaseUrl = defaultAcademyBaseUrl(localEnv);

  const requestedMode = inferRequestedStripeMode(localEnv, academyBaseUrl);
  if (process.argv.includes('--runtime-only')) {
    await writeRuntimeOnlyConfig(academyBaseUrl, 'Static Payment Links are disabled for this build.', requestedMode);
    return;
  }

  const stripeSecretKey = pickStripeSecretKey(localEnv, requestedMode);
  const manualConfig = buildManualLinks(localEnv, academyBaseUrl, requestedMode);
  if (manualConfig.missingEnvNames.length === 0) {
    const generatedConfig = {
      mode: inferPaymentLinkModeFromUrls(manualConfig.links),
      generatedAt: new Date().toISOString(),
      academyBaseUrl,
      links: manualConfig.links
    };

    await writeGeneratedConfig(generatedConfig, 'manual Stripe payment links');
    return;
  }

  if (!stripeSecretKey) {
    const reason = `Missing ${requestedMode} Stripe configuration (${manualConfig.missingEnvNames.join(', ')}).`;
    if (await writeExistingLinksFallback(academyBaseUrl, reason, requestedMode)) {
      return;
    }

    if (requestedMode === 'test') {
      await writeRuntimeOnlyConfig(academyBaseUrl, reason, requestedMode);
      return;
    }

    await writeRuntimeOnlyConfig(academyBaseUrl, reason, requestedMode);
    return;
  }

  const stripeMode = inferStripeMode(stripeSecretKey);
  if (stripeMode !== requestedMode) {
    throw new Error(`Configured Stripe key is ${stripeMode}, but ${requestedMode} mode was requested. Use STRIPE_SECRET_KEY_${requestedMode === 'live' ? 'LIVE' : 'TEST'} or adjust ACADEMY_ENV.`);
  }

  const stripe = new Stripe(stripeSecretKey);
  const links = {};

  try {
    for (const plan of planEntries) {
      const product = await ensureProduct(stripe, plan);
      const price = await ensurePrice(stripe, product.id, plan);
      const paymentLink = await ensurePaymentLink(stripe, price.id, plan, academyBaseUrl);

      links[plan.key] = {
        productId: product.id,
        priceId: price.id,
        paymentLinkId: paymentLink.id,
        url: paymentLink.url
      };

      console.log(`Stripe ${stripeMode} link ready for ${plan.key}: ${paymentLink.url}`);
    }
  } catch (error) {
    const reason = `Stripe sync failed: ${error instanceof Error ? error.message : error}.`;
    if (await writeExistingLinksFallback(academyBaseUrl, reason, requestedMode)) {
      return;
    }

    if (requestedMode === 'test') {
      await writeRuntimeOnlyConfig(academyBaseUrl, reason, requestedMode);
      return;
    }

    throw error;
  }

  const generatedConfig = {
    mode: stripeMode,
    generatedAt: new Date().toISOString(),
    academyBaseUrl,
    links
  };

  await writeGeneratedConfig(generatedConfig, 'generated Stripe payment links');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
