#!/bin/bash
# Paste this entire file into EC2 user data. It contains no passwords.
set -euo pipefail
umask 077
exec > >(tee -a /var/log/simple-bank-bootstrap.log) 2>&1

PHASE=start
RESTORED=0
APP_SHA="dafc89b4b804cddaa2f443a55b05d48ffa3bd921"
APP_DIR="/opt/simple-bank/app"
IMAGE="josvier-simple-bank-api:${APP_SHA:0:12}"

restore_bootstrap() {
  [ "${RESTORED}" -eq 1 ] && return 0
  RESTORED=1
  [ -f /opt/simple-bank/backend.env ] || return 0
  grep -q '^BOOTSTRAP_ADMIN_ENABLED=true' /opt/simple-bank/backend.env || return 0
  declare -F set_bootstrap >/dev/null 2>&1 || return 0
  set_bootstrap false "" || return 0
  declare -F start_api >/dev/null 2>&1 || return 0
  start_api >/dev/null 2>&1 || true
}

on_error() {
  echo "BOOTSTRAP FAILED"
  echo "phase=${PHASE}"
  echo "line=${2}"
  echo "exit=${1}"
  restore_bootstrap || true
}
trap 'ec=$?; on_error "${ec}" "${LINENO}"' ERR

echo "BOOTSTRAP START"
os_name="$(awk -F= '/^PRETTY_NAME=/{gsub(/"/,"",$2); print $2}' /etc/os-release)"
echo "OS ${os_name}"
arch="$(uname -m)"
echo "architecture ${arch}"
mem_kb="$(awk '/MemTotal/ {print $2}' /proc/meminfo)"
echo "memory MB $((mem_kb / 1024))"
free_mb="$(df -Pm / | awk 'NR==2 {print $4}')"
echo "disk free ${free_mb} MB"
if [ "${arch}" != "x86_64" ]; then
  echo "This bootstrap requires x86_64."
  exit 1
fi
if [ "${free_mb}" -lt 8192 ]; then
  echo "Need at least 8192 MB free on / for Mongo, the Maven build, and the API image."
  exit 1
fi

PHASE=packages
dnf install -y docker git jq python3 openssl
PHASE=curl
if ! command -v curl >/dev/null 2>&1; then
  dnf install -y curl-minimal
fi
command -v curl >/dev/null
PHASE=docker
systemctl enable --now docker
docker info >/dev/null
echo "Docker version $(docker version --format '{{.Server.Version}}')"
echo "Git version $(git --version)"
echo "Python version $(python3 --version)"
echo "curl version $(curl --version | awk 'NR==1 {print $1, $2}')"

PHASE=swap
if [ "${mem_kb}" -le 2097152 ]; then
  if swapon --show 2>/dev/null | grep -q '/swapfile'; then
    echo "swap already active"
  elif [ -f /swapfile ]; then
    chmod 600 /swapfile
    swapon /swapfile || mkswap /swapfile >/dev/null
    swapon /swapfile
    grep -q '[[:space:]]/swapfile[[:space:]]' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "swap activated"
  else
    dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "swap created"
  fi
fi

install -d -m 700 /opt/simple-bank
PHASE=source
if [ ! -d "${APP_DIR}/.git" ]; then
  rm -rf "${APP_DIR}"
  git clone --quiet https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication.git "${APP_DIR}"
fi
git -C "${APP_DIR}" fetch --quiet origin
git -C "${APP_DIR}" checkout --quiet --detach "${APP_SHA}"
test "$(git -C "${APP_DIR}" rev-parse HEAD)" = "${APP_SHA}"
if [ -f "${APP_DIR}/infra/aws/deploy-release.sh" ]; then
  install -m 755 "${APP_DIR}/infra/aws/deploy-release.sh" /opt/simple-bank/deploy-release.sh
fi

PHASE=secrets
if [ ! -s /opt/simple-bank/runtime.env ]; then
  mongo_root="$(openssl rand -hex 24)"
  mongo_app="$(openssl rand -hex 24)"
  jwt_secret="$(openssl rand -base64 48 | tr -d '\n')"
  cat > /opt/simple-bank/runtime.env <<EOF
MONGO_ROOT_PASSWORD=${mongo_root}
MONGO_APP_PASSWORD=${mongo_app}
JWT_SECRET=${jwt_secret}
EOF
  unset mongo_root mongo_app jwt_secret
fi
chmod 600 /opt/simple-bank/runtime.env
set -a
# shellcheck disable=SC1091
. /opt/simple-bank/runtime.env
set +a
JWT_SECRET="${JWT_SECRET}" python3 - <<'PY'
import base64, os
if len(base64.b64decode(os.environ["JWT_SECRET"])) < 32:
    raise SystemExit("jwt material is too short")
PY

PHASE=mongo
docker network inspect simple-bank-net >/dev/null 2>&1 || docker network create simple-bank-net >/dev/null
docker volume inspect simple-bank-mongo-data >/dev/null 2>&1 || docker volume create simple-bank-mongo-data >/dev/null
pulled=0
for _ in 1 2 3 4 5; do
  if docker pull mongo:7; then
    pulled=1
    break
  fi
  sleep 10
done
test "${pulled}" -eq 1
if [ ! -s /opt/simple-bank/mongo-keyfile ]; then
  openssl rand -base64 512 | tr -d '\n' > /opt/simple-bank/mongo-keyfile
fi
chown 999:999 /opt/simple-bank/mongo-keyfile
chmod 400 /opt/simple-bank/mongo-keyfile
if ! docker ps -a --format '{{.Names}}' | grep -qx simple-bank-mongo; then
  docker run -d --name simple-bank-mongo \
    --network simple-bank-net \
    --restart unless-stopped \
    -v simple-bank-mongo-data:/data/db \
    -v /opt/simple-bank/mongo-keyfile:/etc/mongo-keyfile:ro \
    -e MONGO_INITDB_ROOT_USERNAME=root \
    -e MONGO_INITDB_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD}" \
    mongo:7 --replSet rs0 --keyFile /etc/mongo-keyfile --bind_ip_all >/dev/null
fi
docker start simple-bank-mongo >/dev/null
ok=0
for _ in $(seq 1 60); do
  if docker exec -e MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD}" simple-bank-mongo \
    bash -lc 'mongosh --quiet --host 127.0.0.1 --port 27017 -u root -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin --eval "quit(db.runCommand({ping:1}).ok===1?0:1)"' >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 5
done
test "${ok}" -eq 1
umask 077
cat > /opt/simple-bank/init-rs.js <<'EOF'
try { quit(rs.status().ok === 1 ? 0 : 2); }
catch (e) { quit(e.code === 94 || e.codeName === "NotYetInitialized" ? 42 : 3); }
EOF
chmod 600 /opt/simple-bank/init-rs.js
docker cp /opt/simple-bank/init-rs.js simple-bank-mongo:/tmp/init-rs.js >/dev/null
if docker exec -e MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD}" simple-bank-mongo \
  bash -lc 'mongosh --quiet --host 127.0.0.1 --port 27017 -u root -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin --file /tmp/init-rs.js' >/dev/null 2>&1; then
  rs_rc=0
else
  rs_rc=$?
fi
rm -f /opt/simple-bank/init-rs.js
if [ "${rs_rc}" -eq 42 ]; then
  cat > /opt/simple-bank/init-rs.js <<'EOF'
const r = rs.initiate({_id: "rs0", members: [{_id: 0, host: "simple-bank-mongo:27017"}]});
quit(r.ok === 1 || r.codeName === "AlreadyInitialized" ? 0 : 1);
EOF
  docker cp /opt/simple-bank/init-rs.js simple-bank-mongo:/tmp/init-rs.js >/dev/null
  docker exec -e MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD}" simple-bank-mongo \
    bash -lc 'mongosh --quiet --host 127.0.0.1 --port 27017 -u root -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin --file /tmp/init-rs.js' >/dev/null
  rm -f /opt/simple-bank/init-rs.js
elif [ "${rs_rc}" -ne 0 ]; then
  echo "unable to read replica set status"
  exit 1
fi
ok=0
for _ in $(seq 1 60); do
  if docker exec -e MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD}" simple-bank-mongo \
    bash -lc 'mongosh --quiet --host 127.0.0.1 --port 27017 -u root -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin --eval "quit(db.hello().isWritablePrimary===true?0:1)"' >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 5
done
test "${ok}" -eq 1
echo "mongo_replica_set=PASS"
umask 077
cat > /opt/simple-bank/create-user.js <<EOF
const appDb = db.getSiblingDB("simple_bank_aws");
if (appDb.getUser("simplebank_app") == null) {
  appDb.createUser({
    user: "simplebank_app",
    pwd: "${MONGO_APP_PASSWORD}",
    roles: [{ role: "readWrite", db: "simple_bank_aws" }]
  });
}
EOF
chmod 600 /opt/simple-bank/create-user.js
docker cp /opt/simple-bank/create-user.js simple-bank-mongo:/tmp/create-user.js >/dev/null
mongo_ready=0
for _ in $(seq 1 60); do
  if docker exec -e MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD}" simple-bank-mongo \
    bash -lc 'mongosh --quiet -u root -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin --file /tmp/create-user.js' >/dev/null 2>&1; then
    mongo_ready=1
    break
  fi
  sleep 5
done
docker exec simple-bank-mongo rm -f /tmp/create-user.js >/dev/null 2>&1 || true
rm -f /opt/simple-bank/create-user.js
test "${mongo_ready}" -eq 1
echo "mongo=PASS"

PHASE=backend-env
db_name="simple_bank_aws"
mongo_scheme="mongodb"
mongo_uri="${mongo_scheme}://simplebank_app:${MONGO_APP_PASSWORD}@simple-bank-mongo:27017/${db_name}?authSource=${db_name}&replicaSet=rs0"
cat > /opt/simple-bank/backend.env <<EOF
SPRING_PROFILES_ACTIVE=production
MONGODB_DATABASE=${db_name}
MONGODB_URI=${mongo_uri}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION_MS=3600000
DEMO_SEED_ENABLED=false
DEMO_SEED_RESET=false
BOOTSTRAP_ADMIN_ENABLED=false
BOOTSTRAP_ADMIN_USERNAME=
APP_REVISION=${APP_SHA}
CORS_ALLOWED_ORIGINS=
EOF
chmod 600 /opt/simple-bank/backend.env
unset mongo_uri

PHASE=image
if ! docker image inspect "${IMAGE}" >/dev/null 2>&1; then
  docker build -t "${IMAGE}" "${APP_DIR}"
fi
docker image inspect "${IMAGE}" >/dev/null
echo "image=PASS"

start_api() {
  docker rm -f simple-bank-api >/dev/null 2>&1 || true
  docker run -d --name simple-bank-api \
    --network simple-bank-net \
    --restart unless-stopped \
    --env-file /opt/simple-bank/backend.env \
    -p 8080:8080 \
    "${IMAGE}" >/dev/null
}

wait_healthy() {
  local ready
  for _ in $(seq 1 90); do
    ready="$(curl --silent --show-error --fail --max-time 15 http://127.0.0.1:8080/api/public/ready || true)"
    if printf '%s' "${ready}" | grep -q '"status":"UP"' \
      && printf '%s' "${ready}" | grep -q '"environment":"production"' \
      && printf '%s' "${ready}" | grep -q "${APP_SHA}" \
      && curl --silent --show-error --fail --max-time 15 http://127.0.0.1:8080/api/public/health | grep -q '"status":"UP"' \
      && curl --silent --show-error --fail --max-time 15 http://127.0.0.1:8080/api/public/config | grep -q '"demoMode":false'; then
      echo "health=PASS ready=PASS"
      return 0
    fi
    sleep 10
  done
  echo "health=FAIL"
  docker ps --format '{{.Names}} {{.Status}} {{.Ports}}' || true
  if docker ps -a --format '{{.Names}}' | grep -qx simple-bank-api; then
    docker logs --tail 60 simple-bank-api 2>&1 | grep -Eiv 'mongodb(\+srv)?://|password|jwt|authorization:|bearer ' || true
  fi
  return 1
}

set_bootstrap() {
  python3 - "$1" "$2" <<'PY'
import pathlib, sys
enabled, username = sys.argv[1], sys.argv[2]
path = pathlib.Path("/opt/simple-bank/backend.env")
lines = []
for line in path.read_text(encoding="utf-8").splitlines():
    if line.startswith("BOOTSTRAP_ADMIN_ENABLED="):
        lines.append(f"BOOTSTRAP_ADMIN_ENABLED={enabled}")
    elif line.startswith("BOOTSTRAP_ADMIN_USERNAME="):
        lines.append(f"BOOTSTRAP_ADMIN_USERNAME={username}")
    else:
        lines.append(line)
path.write_text("\n".join(lines) + "\n", encoding="utf-8")
path.chmod(0o600)
PY
}

git -C "${APP_DIR}" show "origin/ReactFrontend-BankApp-Making-RestCall-To-Backend:infra/aws/bootstrap-provision.py" > /opt/simple-bank/provision.py
chmod 700 /opt/simple-bank/provision.py
PHASE=api
start_api
wait_healthy
if python3 /opt/simple-bank/provision.py prepare; then
  prepare_status=0
else
  prepare_status=$?
fi
if [ "${prepare_status}" -eq 10 ]; then
  PHASE=bootstrap-admin
  set_bootstrap true aws.admin
  start_api
  wait_healthy
  python3 /opt/simple-bank/provision.py confirm-admin
  set_bootstrap false ""
  start_api
  wait_healthy
elif [ "${prepare_status}" -ne 0 ]; then
  echo "identity preparation failed"
  false
fi
python3 /opt/simple-bank/provision.py confirm-admin
echo "mongo_transactions=PASS"
if grep -q '^BOOTSTRAP_ADMIN_ENABLED=true' /opt/simple-bank/backend.env; then
  PHASE=bootstrap-admin
  set_bootstrap false ""
  start_api
  wait_healthy
fi
grep -q '^BOOTSTRAP_ADMIN_ENABLED=false' /opt/simple-bank/backend.env
PHASE=customer
python3 /opt/simple-bank/provision.py provision-customer
echo "admin=PASS customer=PASS bootstrap=OFF demo_seed=OFF"

PHASE=persistence
docker restart simple-bank-mongo >/dev/null
docker restart simple-bank-api >/dev/null
wait_healthy
python3 /opt/simple-bank/provision.py confirm-admin
python3 /opt/simple-bank/provision.py provision-customer
grep -q '^BOOTSTRAP_ADMIN_ENABLED=false' /opt/simple-bank/backend.env
grep -q '^DEMO_SEED_ENABLED=false' /opt/simple-bank/backend.env
if docker port simple-bank-mongo 27017/tcp 2>/dev/null | grep -q .; then
  echo "MongoDB port 27017 is published"
  exit 1
fi
echo "mongo_persistence=PASS"

cat > /opt/simple-bank/aws-status.txt <<EOF
SIMPLE BANK AWS BACKEND READY
source=${APP_SHA}
database=simple_bank_aws
mongo=PASS
mongo_replica_set=PASS
mongo_transactions=PASS
mongo_persistence=PASS
health=PASS
ready=PASS
admin=PASS
customer=PASS
bootstrap=OFF
demo_seed=OFF
EOF
chmod 644 /opt/simple-bank/aws-status.txt
: > /opt/simple-bank/bootstrap.done
echo "SIMPLE BANK AWS BACKEND READY"
