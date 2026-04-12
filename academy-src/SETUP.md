# Digrro Academy Setup

The academy now uses a static Vite frontend plus a small PHP backend for registration, SQLite storage, and SMTP email confirmation.

## Architecture

1. The academy page collects registration details in the browser.
2. `academy/api/register.php` validates the payload, writes the account and enrollment into SQLite, and sends the confirmation email from `system@digrro.com`.
3. `academy/api/confirm.php` marks the email as confirmed when the newcomer clicks the link from the email.
4. The frontend then redirects the user to the Wise payment link.

## Environment handling

The deployed application now expects the real `.env` file to travel with the app repository and be copied into the cPanel document root during deployment.
Because it contains live Stripe and SMTP secrets, the web root must block direct access to dotfiles.

The PHP backend reads these keys from `.env` at the deploy root:

- `Publishable key`
- `Secret key`
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

`academy:build` now copies the PHP backend files into the build output so cPanel deploy can publish them together with the academy frontend.