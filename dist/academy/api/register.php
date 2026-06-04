<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    academy_json_response(405, [
        'ok' => false,
        'message' => 'Method not allowed.'
    ]);
}

$payload = academy_request_payload();
$planKey = trim((string) ($payload['planKey'] ?? ''));
$plan = academy_plan($planKey);
if ($plan === null) {
    academy_json_response(400, [
        'ok' => false,
        'message' => 'Please choose a valid academy plan.'
    ]);
}

$fullName = trim((string) ($payload['fullName'] ?? ''));
$email = academy_normalize_email((string) ($payload['email'] ?? ''));
$confirmEmail = academy_normalize_email((string) ($payload['confirmEmail'] ?? ''));
$phoneNumber = trim((string) ($payload['phoneNumber'] ?? ''));
$password = (string) ($payload['password'] ?? '');
$addressLine = trim((string) ($payload['addressLine'] ?? ''));
$country = trim((string) ($payload['country'] ?? ''));
$city = trim((string) ($payload['city'] ?? ''));
$pincode = trim((string) ($payload['pincode'] ?? ''));
$company = trim((string) ($payload['company'] ?? ''));
$checkoutReference = trim((string) ($payload['checkoutReference'] ?? ''));
$promoCode = academy_normalize_promo_code((string) ($payload['promoCode'] ?? $payload['promo_code'] ?? ''));
$checkoutUrl = '';

if (
    $fullName === ''
    || $email === ''
    || $confirmEmail === ''
    || $phoneNumber === ''
    || $password === ''
    || $addressLine === ''
    || $country === ''
    || $city === ''
    || $checkoutReference === ''
) {
    academy_json_response(400, [
        'ok' => false,
        'message' => 'Complete all required registration fields before checkout.'
    ]);
}

if ($email !== $confirmEmail) {
    academy_json_response(400, [
        'ok' => false,
        'message' => 'Email and confirm email must match.'
    ]);
}

if (strlen(preg_replace('/\D+/', '', $phoneNumber) ?? '') < 7) {
    academy_json_response(400, [
        'ok' => false,
        'message' => 'Enter a valid phone number.'
    ]);
}

if (strlen($password) < 8) {
    academy_json_response(400, [
        'ok' => false,
        'message' => 'Use a password with at least 8 characters.'
    ]);
}

$stripeSecretKey = academy_stripe_secret_key();
if (!is_string($stripeSecretKey) || $stripeSecretKey === '') {
    academy_json_response(503, [
        'ok' => false,
        'message' => 'Stripe checkout is not configured right now. Add STRIPE_SECRET_KEY or secret_key to this environment and try again.'
    ]);
}

$pdo = null;

try {
    $pdo = academy_pdo();
    $pdo->beginTransaction();

    $seatLimit = academy_plan_seat_limit($plan);
    if ($seatLimit > 0 && academy_enrollment_count_for_plan($pdo, (string) $plan['key']) >= $seatLimit) {
        $pdo->rollBack();
        academy_json_response(409, [
            'ok' => false,
            'message' => 'This package is full. The 30 available seats have already been reserved.'
        ]);
    }

    $account = academy_find_account($pdo, $email);
    $promo = null;
    if ($promoCode !== '') {
        try {
            $promo = academy_reserve_promo_code($pdo, $promoCode, $email, $checkoutReference);
        } catch (RuntimeException $promoError) {
            $pdo->rollBack();
            academy_json_response(400, [
                'ok' => false,
                'message' => $promoError->getMessage(),
            ]);
        }
    }

    $originalAmountUsd = (float) $plan['amountUsd'];
    $amountUsd = academy_discounted_amount_usd($plan, $promo);
    $shouldSendConfirmation = false;
    $confirmationToken = null;
    $accountId = null;

    if ($account !== null) {
        if (!password_verify($password, (string) $account['password_hash'])) {
            $pdo->rollBack();
            academy_json_response(409, [
                'ok' => false,
                'message' => 'This email is already registered. Use the correct password to continue.'
            ]);
        }

        $shouldSendConfirmation = empty($account['email_confirmed_at']);
        $confirmationToken = $shouldSendConfirmation ? bin2hex(random_bytes(32)) : (string) ($account['email_confirmation_token'] ?? '');
        $accountId = (int) $account['id'];

        $updateAccount = $pdo->prepare(
            'UPDATE academy_accounts
             SET full_name = :full_name,
                 phone_number = :phone_number,
                 address_line = :address_line,
                 country = :country,
                 city = :city,
                 pincode = :pincode,
                 company = :company,
                 email_confirmation_token = :email_confirmation_token,
                 email_confirmation_sent_at = CASE WHEN :should_send = 1 THEN CURRENT_TIMESTAMP ELSE email_confirmation_sent_at END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );

        $updateAccount->execute([
            'full_name' => $fullName,
            'phone_number' => $phoneNumber,
            'address_line' => $addressLine,
            'country' => $country,
            'city' => $city,
            'pincode' => $pincode,
            'company' => $company !== '' ? $company : null,
            'email_confirmation_token' => $confirmationToken !== '' ? $confirmationToken : null,
            'should_send' => $shouldSendConfirmation ? 1 : 0,
            'id' => $accountId,
        ]);
    } else {
        $shouldSendConfirmation = true;
        $confirmationToken = bin2hex(random_bytes(32));
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $insertAccount = $pdo->prepare(
            'INSERT INTO academy_accounts (
                email,
                email_normalized,
                full_name,
                phone_number,
                address_line,
                country,
                city,
                pincode,
                company,
                password_hash,
                email_confirmation_token,
                email_confirmation_sent_at
            ) VALUES (
                :email,
                :email_normalized,
                :full_name,
                :phone_number,
                :address_line,
                :country,
                :city,
                :pincode,
                :company,
                :password_hash,
                :email_confirmation_token,
                CURRENT_TIMESTAMP
            )'
        );

        $insertAccount->execute([
            'email' => $email,
            'email_normalized' => $email,
            'full_name' => $fullName,
            'phone_number' => $phoneNumber,
            'address_line' => $addressLine,
            'country' => $country,
            'city' => $city,
            'pincode' => $pincode,
            'company' => $company !== '' ? $company : null,
            'password_hash' => $passwordHash,
            'email_confirmation_token' => $confirmationToken,
        ]);

        $accountId = (int) $pdo->lastInsertId();
    }

    $insertEnrollment = $pdo->prepare(
        'INSERT INTO academy_enrollments (
            account_id,
            email,
            full_name,
            phone_number,
            address_line,
            country,
            city,
            pincode,
            company,
            plan_key,
            plan_name,
            amount_usd,
            original_amount_usd,
            promo_code,
            promo_discount_percent,
            checkout_url,
            checkout_reference
        ) VALUES (
            :account_id,
            :email,
            :full_name,
            :phone_number,
            :address_line,
            :country,
            :city,
            :pincode,
            :company,
            :plan_key,
            :plan_name,
            :amount_usd,
            :original_amount_usd,
            :promo_code,
            :promo_discount_percent,
            :checkout_url,
            :checkout_reference
        )'
    );

    $insertEnrollment->execute([
        'account_id' => $accountId,
        'email' => $email,
        'full_name' => $fullName,
        'phone_number' => $phoneNumber,
        'address_line' => $addressLine,
        'country' => $country,
        'city' => $city,
        'pincode' => $pincode,
        'company' => $company !== '' ? $company : null,
        'plan_key' => $plan['key'],
        'plan_name' => $plan['label'],
        'amount_usd' => $amountUsd,
        'original_amount_usd' => $originalAmountUsd,
        'promo_code' => $promo !== null ? (string) $promo['code'] : null,
        'promo_discount_percent' => $promo !== null ? (float) $promo['discount_percent'] : null,
        'checkout_url' => $checkoutUrl,
        'checkout_reference' => $checkoutReference,
    ]);

    if ($shouldSendConfirmation) {
        academy_send_confirmation_email([
            'email' => $email,
            'full_name' => $fullName,
            'email_confirmation_token' => $confirmationToken,
            'checkout_reference' => $checkoutReference,
        ], $plan);
    }

    $pdo->commit();

    try {
        $checkoutSession = academy_create_checkout_session($plan, $email, $phoneNumber, $checkoutReference, $promo);
        academy_record_checkout_session($pdo, $checkoutReference, $checkoutSession);
        $checkoutUrl = academy_normalize_stripe_checkout_url((string) $checkoutSession['url']);
    } catch (Throwable $stripeError) {
        academy_release_promo_reservation($pdo, $checkoutReference);
        if ($promo !== null) {
            $clearPromo = $pdo->prepare(
                'UPDATE academy_enrollments
                 SET amount_usd = COALESCE(original_amount_usd, amount_usd),
                     promo_code = NULL,
                     promo_discount_percent = NULL,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE checkout_reference = :checkout_reference'
            );
            $clearPromo->execute(['checkout_reference' => $checkoutReference]);
        }
        academy_json_response(502, [
            'ok' => false,
            'message' => 'Your registration was saved, but Stripe checkout could not be started. Please try again in a moment.'
        ]);
    }

    academy_json_response(200, [
        'ok' => true,
        'checkoutUrl' => $checkoutUrl,
        'message' => $shouldSendConfirmation
            ? 'Your registration is saved. We sent a confirmation email from system@digrro.com. Continuing to Stripe now.'
            : 'Your registration is saved. Continuing to Stripe now.'
    ]);
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    academy_json_response(500, [
        'ok' => false,
        'message' => 'We could not complete your academy registration right now. Please try again in a moment.'
    ]);
}
