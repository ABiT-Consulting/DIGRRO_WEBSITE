# Digrro Academy Setup

The academy now uses a static Vite frontend plus a small PHP backend for registration, SQLite storage, SMTP email confirmation, and Stripe checkout links.

## Architecture

1. The academy page collects registration details in the browser.
2. `academy/api/register.php` validates the payload, writes the account and enrollment into SQLite, and sends the confirmation email from `system@digrro.com`.
3. `academy/api/confirm.php` marks the email as confirmed when the newcomer clicks the link from the email.
4. Stripe payment links are generated per environment at build time and the frontend then redirects the user to Stripe checkout.

## Environment handling

The tracked `.env` file can continue to travel with the application for non-blocked settings, while local development secrets should live in `.env.local` and live Stripe builds should use GitHub Actions secrets.
Because the web root contains SMTP credentials and other runtime settings, dotfiles must stay blocked from direct HTTP access.

The build and backend loaders support these files in this order:

1. `.env.local`
2. `.env`

Local development can keep the Stripe test secret in `.env.local` so GitHub push protection does not block it.

The Stripe sync script reads these keys:

- `Publishable key`
- `Secret key`
- `ACADEMY_BASE_URL`

The PHP backend reads these runtime keys from `.env` at the deploy root:

- `emailaddress`
- `password`
- `Outgoing Server`
- `SMTP Port`

Optional standard aliases also work in the PHP backend:

- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`

Live Stripe builds should be supplied through GitHub Actions secrets, especially `STRIPE_SECRET_KEY_LIVE`. The workflow maps that secret into `STRIPE_SECRET_KEY` only during the build that refreshes the Stripe payment links.

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

`academy:dev` and `academy:build` both regenerate Stripe payment links before starting so each environment uses the Stripe credentials available to it.

`academy:build` then copies the PHP backend files into the build output so cPanel deploy can publish them together with the academy frontend.