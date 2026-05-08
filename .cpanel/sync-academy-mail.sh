#!/usr/bin/env bash
set -euo pipefail

deploy_path="${1:-}"
env_file="${deploy_path%/}/.env"

if [[ -z "$deploy_path" || ! -f "$env_file" ]]; then
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
  echo "WARNING: Academy SMTP sync skipped because email credentials are incomplete in .env."
  exit 0
fi

if [[ "$smtp_user" != *@digrro.com ]]; then
  echo "WARNING: Academy SMTP sync skipped because the SMTP user is not a digrro.com mailbox."
  exit 0
fi

if (( ${#smtp_pass} < 8 )); then
  echo "WARNING: Academy SMTP sync skipped because the configured mailbox password is too short."
  exit 0
fi

uapi_cmd="$(command -v uapi || true)"
if [[ -z "$uapi_cmd" && -x /usr/local/cpanel/bin/uapi ]]; then
  uapi_cmd="/usr/local/cpanel/bin/uapi"
fi

if [[ -z "$uapi_cmd" ]]; then
  echo "WARNING: Academy SMTP sync skipped because cPanel uapi is not available."
  exit 0
fi

if "$uapi_cmd" --output=json Email passwd_pop email="$smtp_user" password="$smtp_pass" >/dev/null; then
  echo "Academy SMTP mailbox password synced for ${smtp_user}."
else
  echo "WARNING: Academy SMTP mailbox password sync failed for ${smtp_user}."
fi
