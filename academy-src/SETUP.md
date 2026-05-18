# Digrro Academy Setup

The academy now uses a static Vite frontend plus a small PHP backend for registration, SQLite storage, SMTP email confirmation, and Stripe Checkout.

## Architecture

1. The academy page collects registration details in the browser.
2. `academy/api/register.php` validates the payload, writes the account and enrollment into SQLite, and sends the confirmation email from `system@digrro.com`.
3. `academy/api/confirm.php` marks the email as confirmed when the newcomer clicks the link from the email.
4. `register.php` creates a Stripe Checkout Session with the Stripe secret key from the runtime `.env`, stores the session on the enrollment, and redirects the user to Stripe.
5. `api/checkout-complete.php` verifies the returned Checkout Session with Stripe and marks paid enrollments in SQLite.
6. `academy/api/login.php` and `academy/api/student.php` power the student portal, showing enrollments, payment status, and class/material links after payment.
7. `academy/api/request-password-reset.php` sends a reset link to the registered login email, and `academy/reset-password.html` lets the student set a new password.
8. `academy/admin.html` is the trainer portal for adding courses, pricing, and the private class/material URL unlocked for paid students.

## Environment handling

The tracked `.env` file can continue to travel with the application for non-blocked settings, while local development secrets should live in `.env.local`.
Because the web root contains SMTP credentials and other runtime settings, dotfiles must stay blocked from direct HTTP access.

The backend merges these files, with non-empty `.env.local` values overriding `.env` values:

1. `.env`
2. `.env.local`

Local development can keep the Stripe test secret in `.env.local` so GitHub push protection does not block it. Use explicit test/live names so local runs cannot accidentally use the live Digrro account.

The PHP backend reads these Stripe keys:

- `STRIPE_SECRET_KEY_TEST` for local/development and test-mode Checkout Sessions
- `STRIPE_SECRET_KEY_LIVE` for production/live Checkout Sessions
- `STRIPE_SECRET_KEY`, `secret_key`, and `Secret key` as legacy aliases only when the key prefix matches the runtime environment
- `STRIPE_WEBHOOK_SECRET_TEST`, `STRIPE_WEBHOOK_SECRET_LIVE`, or `STRIPE_WEBHOOK_SECRET` for the optional Stripe webhook endpoint at `academy/api/stripe-webhook.php`
- `ACADEMY_BASE_URL`
- `ACADEMY_ENV`, `APP_ENV`, or `STRIPE_MODE` to force `development`/`test` or `production`/`live`; otherwise localhost is treated as development and public hosts as production
- `ACADEMY_STUDENT_TOKEN_SECRET` and `ACADEMY_STUDENT_TOKEN_TTL` for student portal sessions. If the student secret is omitted, `ACADEMY_ADMIN_TOKEN_SECRET` is reused.
- `ACADEMY_PASSWORD_RESET_TTL` for password reset links, default `3600` seconds.

The PHP backend reads these runtime keys from `.env` at the deploy root:

- `emailaddress`
- `password`
- `Outgoing Server`
- `SMTP Port`

For the Digrro system mailbox, use `system@digrro.com` with `mail.abitcons.com` on SMTP port `465` over SSL/TLS. Port `587` with STARTTLS is the alternate SMTP option. IMAP is `mail.abitcons.com`, port `993`, SSL/TLS.

Optional standard aliases also work in the PHP backend:

- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`

Live Stripe credentials are runtime settings on the cPanel server. Builds no longer need Stripe credentials because Checkout Sessions are created by PHP after registration.

Recommended local `.env.local` Stripe settings:

```bash
ACADEMY_ENV=development
FRONTEND_URL=http://127.0.0.1:5174
STRIPE_SECRET_KEY_TEST=sk_test_...
```

Recommended live cPanel runtime settings:

```bash
ACADEMY_ENV=production
ACADEMY_BASE_URL=https://digrro.com/academy
STRIPE_SECRET_KEY_LIVE=rk_live_...
GOOGLE_ANALYTICS_ID=G-RH6L7EDCHK
```

Google Analytics 4 is loaded on the public academy page with the Digrro web stream `G-RH6L7EDCHK`. A deployed `.env` can override it with `GOOGLE_ANALYTICS_ID`; build-time `VITE_GOOGLE_ANALYTICS_ID` also works, and `GA_MEASUREMENT_ID` / `VITE_GA_MEASUREMENT_ID` are accepted aliases.

`npm run academy:dev` uses the Vite local API and stores developer accounts in `academy-data/platform.json`. With `STRIPE_SECRET_KEY_TEST`, local registration creates Stripe test Checkout Sessions. Without a test key, local dev falls back to a mock paid checkout so live credentials are still not used.

`npm run academy:build` writes a runtime-only Stripe config into the build output. It does not call Stripe or bake local test links into the production bundle; the live cPanel `.env.local` supplies `STRIPE_SECRET_KEY_LIVE` at runtime.

## cPanel deploy behavior

The deploy script preserves two things across releases:

1. `.env`
2. `academy-data/`

That means the cPanel deployment copies the tracked `.env` file into the document root on every release and keeps the SQLite database in `academy-data/academy.sqlite` without losing it on each deployment.

The root `.htaccess` file in the deployed `dist/` output blocks direct HTTP access to `.env` and the `academy-data/` directory.

## Build commands

```bash
npm run academy:dev
npm run academy:build
```

`academy:build` then copies the PHP backend files into the build output so cPanel deploy can publish them together with the academy frontend.
