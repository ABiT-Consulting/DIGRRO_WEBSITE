<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$sessionId = trim((string) ($_GET['session_id'] ?? ''));
$title = 'Digrro Academy payment';
$message = 'We could not verify this Stripe payment link.';
$statusLabel = 'Attention';
$success = false;

if ($sessionId !== '') {
    try {
        $session = academy_retrieve_checkout_session($sessionId);
        $matchedEnrollment = academy_apply_checkout_session_to_enrollment(academy_pdo(), $session);

        if (academy_checkout_session_is_paid($session)) {
            $success = true;
            $statusLabel = 'Payment received';
            $message = $matchedEnrollment
                ? 'Your payment is confirmed and your Digrro Academy enrollment has been updated.'
                : 'Your payment is confirmed, but we could not match it to an academy enrollment. Please contact Digrro with your Stripe receipt.';
        } else {
            $statusLabel = 'Payment pending';
            $message = 'Stripe has not marked this payment as paid yet. If you completed payment, wait a moment and refresh this page.';
        }
    } catch (Throwable $error) {
        $message = 'We could not verify your Stripe payment right now. Please keep your Stripe receipt and contact Digrro if this continues.';
    }
}

$academyUrl = academy_academy_base_url() . '/';
?><!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Digrro Academy Payment</title>
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
      <div class="status"><?php echo academy_escape_html($statusLabel); ?></div>
      <h1><?php echo academy_escape_html($title); ?></h1>
      <p><?php echo academy_escape_html($message); ?></p>
      <a class="button" href="<?php echo academy_escape_html($academyUrl); ?>">Return to Digrro Academy</a>
    </main>
  </body>
</html>
