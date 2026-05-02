<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$token = trim((string) ($_GET['token'] ?? ''));
$checkoutReference = trim((string) ($_GET['ref'] ?? ''));
$title = 'Email verification';
$message = 'This confirmation link is invalid or has expired.';
$success = false;
$checkoutUrl = '';

if ($token !== '') {
    try {
        $pdo = academy_pdo();
        $lookup = $pdo->prepare('SELECT id, full_name, email_confirmed_at FROM academy_accounts WHERE email_confirmation_token = :token LIMIT 1');
        $lookup->execute(['token' => $token]);
        $account = $lookup->fetch();

        if (is_array($account)) {
            $update = $pdo->prepare(
                'UPDATE academy_accounts
                 SET email_confirmed_at = COALESCE(email_confirmed_at, CURRENT_TIMESTAMP),
                     email_confirmation_token = NULL,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $update->execute(['id' => (int) $account['id']]);

            $success = true;
            $title = 'Email verified';
            $message = 'Your email has been verified. Redirecting you to secure payment in a moment.';

            if ($checkoutReference !== '') {
                $enrollmentLookup = $pdo->prepare(
                    'SELECT checkout_url
                     FROM academy_enrollments
                     WHERE account_id = :account_id
                       AND checkout_reference = :checkout_reference
                     ORDER BY id DESC
                     LIMIT 1'
                );
                $enrollmentLookup->execute([
                    'account_id' => (int) $account['id'],
                    'checkout_reference' => $checkoutReference,
                ]);
            } else {
                $enrollmentLookup = $pdo->prepare(
                    'SELECT checkout_url
                     FROM academy_enrollments
                     WHERE account_id = :account_id
                     ORDER BY id DESC
                     LIMIT 1'
                );
                $enrollmentLookup->execute(['account_id' => (int) $account['id']]);
            }

            $enrollment = $enrollmentLookup->fetch();
            if (is_array($enrollment) && is_string($enrollment['checkout_url'] ?? null)) {
                $checkoutUrl = trim($enrollment['checkout_url']);
            }
        }
    } catch (Throwable $error) {
        $message = 'We could not confirm your email right now. Please try the link again later.';
    }
}

$academyUrl = academy_academy_base_url() . '/';
?><!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Digrro Academy Email Confirmation</title>
    <?php if ($success && $checkoutUrl !== ''): ?>
      <meta http-equiv="refresh" content="3;url=<?php echo academy_escape_html($checkoutUrl); ?>" />
    <?php endif; ?>
    <style>
      :root {
        color-scheme: dark;
        --bg: #07111f;
        --panel: rgba(11, 25, 43, 0.95);
        --line: rgba(126, 169, 255, 0.24);
        --text: #ebf3ff;
        --muted: #97abc9;
        --accent: #ffcc66;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 1.5rem;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        color: var(--text);
        background: linear-gradient(160deg, #040a13 0%, #07111f 45%, #0a1830 100%);
      }

      .card {
        width: min(560px, 100%);
        padding: 2rem;
        border-radius: 24px;
        border: 1px solid var(--line);
        background: var(--panel);
        box-shadow: 0 30px 80px rgba(2, 8, 18, 0.45);
      }

      h1 {
        margin: 0 0 1rem;
        font-size: 2rem;
      }

      p {
        margin: 0;
        line-height: 1.7;
        color: var(--muted);
      }

      .status {
        display: inline-flex;
        margin-bottom: 1rem;
        padding: 0.45rem 0.75rem;
        border-radius: 999px;
        background: <?php echo $success ? 'rgba(95, 228, 255, 0.14)' : 'rgba(255, 204, 102, 0.14)'; ?>;
        color: <?php echo $success ? '#5fe4ff' : '#ffcc66'; ?>;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        font-size: 0.76rem;
      }

      .button {
        display: inline-flex;
        margin-top: 1.5rem;
        padding: 0.95rem 1.25rem;
        border-radius: 999px;
        color: #04111f;
        background: linear-gradient(135deg, var(--accent), #ffe4a8 45%, #5fe4ff);
        font-weight: 700;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="status"><?php echo $success ? 'Verified' : 'Attention'; ?></div>
      <h1><?php echo academy_escape_html($title); ?></h1>
      <p><?php echo academy_escape_html($message); ?></p>
      <?php if ($success && $checkoutUrl !== ''): ?>
        <a class="button" href="<?php echo academy_escape_html($checkoutUrl); ?>">Continue to Payment</a>
        <script>
          window.setTimeout(function () {
            window.location.href = <?php echo json_encode($checkoutUrl, JSON_UNESCAPED_SLASHES); ?>;
          }, 2500);
        </script>
      <?php else: ?>
        <a class="button" href="<?php echo academy_escape_html($academyUrl); ?>">Return to Digrro Academy</a>
      <?php endif; ?>
    </main>
  </body>
</html>
