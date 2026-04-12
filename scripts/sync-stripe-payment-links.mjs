import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

function inferStripeMode(secretKey) {
  if (secretKey.startsWith('sk_test_')) {
    return 'test';
  }

  if (secretKey.startsWith('sk_live_')) {
    return 'live';
  }

  return 'unknown';
}

function buildRedirectUrl(academyBaseUrl, planKey) {
  return `${academyBaseUrl}/?checkout=success&plan=${encodeURIComponent(planKey)}`;
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
  const redirectUrl = buildRedirectUrl(academyBaseUrl, plan.key);
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
    return stripe.paymentLinks.retrieve(existingLink.id);
  }

  return stripe.paymentLinks.create({
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    after_completion: {
      type: 'redirect',
      redirect: {
        url: redirectUrl
      }
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
  const devPort = Number(pickEnv(localEnv, 'VITE_DEV_PORT')) || 5174;
  const stripeSecretKey = pickEnv(localEnv, 'STRIPE_SECRET_KEY', 'Secret key');
  const academyBaseUrl = trimTrailingSlash(pickEnv(localEnv, 'ACADEMY_BASE_URL', 'VITE_ACADEMY_BASE_URL')) || `http://localhost:${devPort}`;

  if (!stripeSecretKey) {
    throw new Error('Missing Stripe secret key. Set STRIPE_SECRET_KEY or keep the legacy entry `Secret key=...` in .env.local for development, or provide STRIPE_SECRET_KEY_LIVE in GitHub Actions for live builds.');
  }

  const stripeMode = inferStripeMode(stripeSecretKey);
  const stripe = new Stripe(stripeSecretKey);
  const links = {};

  for (const plan of planEntries) {
    const product = await ensureProduct(stripe, plan);
    const price = await ensurePrice(stripe, product.id, plan);
    const paymentLink = await ensurePaymentLink(stripe, price.id, plan, academyBaseUrl);

    links[plan.key] = {
      productId: product.id,
      priceId: price.id,
      paymentLinkId: paymentLink.id,
      redirectUrl: buildRedirectUrl(academyBaseUrl, plan.key),
      url: paymentLink.url
    };

    console.log(`Stripe ${stripeMode} link ready for ${plan.key}: ${paymentLink.url}`);
  }

  const generatedConfig = {
    mode: stripeMode,
    generatedAt: new Date().toISOString(),
    academyBaseUrl,
    links
  };

  await writeFile(generatedLinksModulePath, toModuleFile(generatedConfig), 'utf8');
  await writeFile(generatedLinksJsonPath, JSON.stringify(generatedConfig, null, 2) + '\n', 'utf8');
  console.log(`Saved generated Stripe payment links to ${generatedLinksModulePath}`);
  console.log(`Saved generated Stripe payment links JSON to ${generatedLinksJsonPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});