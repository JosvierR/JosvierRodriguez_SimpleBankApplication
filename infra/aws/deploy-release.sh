#!/bin/bash
# Update the API container to an exact public commit. Mongo volume and generated secrets stay in place.
set -euo pipefail
umask 077
sha="${1:-}"
if ! printf '%s' "$sha" | grep -Eq '^[0-9a-f]{40}$'; then
  echo "release SHA must be 40 hexadecimal characters"
  exit 1
fi
for _ in $(seq 1 90); do
  if [ -f /opt/simple-bank/bootstrap.done ]; then
    break
  fi
  sleep 10
done
test -f /opt/simple-bank/bootstrap.done
test -f /opt/simple-bank/backend.env
app_dir="/opt/simple-bank/app"
git -C "$app_dir" fetch --quiet origin "$sha"
git -C "$app_dir" checkout --quiet --detach "$sha"
test "$(git -C "$app_dir" rev-parse HEAD)" = "$sha"
python3 - "$sha" <<'PY'
import pathlib, sys
sha = sys.argv[1]
path = pathlib.Path("/opt/simple-bank/backend.env")
lines = []
found = False
for line in path.read_text(encoding="utf-8").splitlines():
    if line.startswith("APP_REVISION="):
        lines.append("APP_REVISION=" + sha)
        found = True
    else:
        lines.append(line)
if not found:
    lines.append("APP_REVISION=" + sha)
path.write_text("\n".join(lines) + "\n", encoding="utf-8")
path.chmod(0o600)
PY
grep -q '^BOOTSTRAP_ADMIN_ENABLED=false$' /opt/simple-bank/backend.env
grep -q '^DEMO_SEED_ENABLED=false$' /opt/simple-bank/backend.env
image="josvier-simple-bank-api:${sha:0:12}"
docker build -t "$image" "$app_dir"
docker rm -f simple-bank-api >/dev/null 2>&1 || true
docker run -d --name simple-bank-api \
  --network simple-bank-net \
  --restart unless-stopped \
  --env-file /opt/simple-bank/backend.env \
  -p 8080:8080 \
  "$image" >/dev/null
for _ in $(seq 1 90); do
  ready="$(curl --silent --show-error --fail --max-time 15 http://127.0.0.1:8080/api/public/ready || true)"
  config="$(curl --silent --show-error --fail --max-time 15 http://127.0.0.1:8080/api/public/config || true)"
  if printf '%s' "$ready" | grep -q '"status":"UP"' \
    && printf '%s' "$ready" | grep -q '"environment":"production"' \
    && printf '%s' "$ready" | grep -q "$sha" \
    && printf '%s' "$config" | grep -q '"demoMode":false'; then
    echo "release=${sha}"
    exit 0
  fi
  sleep 10
done
docker logs --tail 80 simple-bank-api 2>&1 | grep -Eiv 'mongodb(\+srv)?://|password|jwt|authorization:|bearer ' || true
exit 1
