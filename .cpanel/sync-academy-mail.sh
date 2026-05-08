#!/usr/bin/env bash
set -euo pipefail

deploy_path="${1:-}"
env_file="${deploy_path%/}/.env"
status_file="${deploy_path%/}/academy/api/mail-sync-status.json"

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/ }"
  value="${value//$'\r'/ }"
  printf '%s' "$value"
}

write_status() {
  local ok="$1"
  local step="$2"
  local message="$3"
  local user="${4:-}"
  local now
  now="$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date)"

  if [[ -n "${status_file:-}" && -d "$(dirname "$status_file")" ]]; then
    printf '{"ok":%s,"step":"%s","message":"%s","smtpUser":"%s","checkedAt":"%s"}\n' \
      "$ok" \
      "$(json_escape "$step")" \
      "$(json_escape "$message")" \
      "$(json_escape "$user")" \
      "$(json_escape "$now")" > "$status_file"
  fi
}

if [[ -z "$deploy_path" || ! -f "$env_file" ]]; then
  write_status false "env" ".env was not found."
  echo "WARNING: Academy SMTP sync skipped because .env was not found."
  exit 0
fi

read_env_value() {
  local key="$1"
  awk -F= -v wanted="$key" '
    $1 == wanted {
      value = substr($0, index($0, "=") + 1)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      gsub(/^["'\''"]|["'\''"]$/, "", value)
      print value
      exit
    }
  ' "$env_file"
}

pick_env_value() {
  local value key
  for key in "$@"; do
    value="$(read_env_value "$key")"
    if [[ -n "$value" ]]; then
      printf '%s' "$value"
      return 0
    fi
  done
}

smtp_user="$(pick_env_value EMAIL_USER SMTP_USERNAME emailaddress || true)"
smtp_pass="$(pick_env_value EMAIL_PASS SMTP_PASSWORD password || true)"

if [[ -z "$smtp_user" || -z "$smtp_pass" ]]; then
  write_status false "credentials" "Email credentials are incomplete in .env." "$smtp_user"
  echo "WARNING: Academy SMTP sync skipped because email credentials are incomplete in .env."
  exit 0
fi

if [[ "$smtp_user" != *@digrro.com ]]; then
  write_status false "mailbox" "SMTP user is not a digrro.com mailbox." "$smtp_user"
  echo "WARNING: Academy SMTP sync skipped because the SMTP user is not a digrro.com mailbox."
  exit 0
fi

if (( ${#smtp_pass} < 8 )); then
  write_status false "password" "Configured mailbox password is too short." "$smtp_user"
  echo "WARNING: Academy SMTP sync skipped because the configured mailbox password is too short."
  exit 0
fi

uapi_cmd="$(command -v uapi || true)"
if [[ -z "$uapi_cmd" && -x /usr/local/cpanel/bin/uapi ]]; then
  uapi_cmd="/usr/local/cpanel/bin/uapi"
fi

if [[ -z "$uapi_cmd" ]]; then
  write_status false "uapi" "cPanel uapi is not available." "$smtp_user"
  echo "WARNING: Academy SMTP sync skipped because cPanel uapi is not available."
  exit 0
fi

uapi_output="$("$uapi_cmd" --output=json Email passwd_pop email="$smtp_user" password="$smtp_pass" 2>&1 || true)"
if printf '%s' "$uapi_output" | grep -q '"status"[[:space:]]*:[[:space:]]*1'; then
  verify_output="$("$uapi_cmd" --output=json Email verify_password email="$smtp_user" password="$smtp_pass" 2>&1 || true)"
  if printf '%s' "$verify_output" | grep -q '"data"[[:space:]]*:[[:space:]]*1'; then
    write_status true "uapi" "cPanel accepted and verified the mailbox password sync." "$smtp_user"
    echo "Academy SMTP mailbox password synced and verified for ${smtp_user}."
  else
    write_status false "verify" "cPanel accepted password sync but did not verify it: ${verify_output:0:500}" "$smtp_user"
    echo "WARNING: Academy SMTP mailbox password sync could not be verified for ${smtp_user}."
  fi
else
  write_status false "uapi" "cPanel rejected mailbox password sync: ${uapi_output:0:500}" "$smtp_user"
  echo "WARNING: Academy SMTP mailbox password sync failed for ${smtp_user}."
fi
