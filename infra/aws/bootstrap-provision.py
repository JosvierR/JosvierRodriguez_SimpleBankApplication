#!/usr/bin/env python3
import json, os, secrets, sys, urllib.error, urllib.request
API = "http://127.0.0.1:8080/api"
IDENTITY = "/opt/simple-bank/aws-identities.json"
ADMIN = "aws.admin"
CUSTOMER = "aws.customer.sender"
def fail(message):
    print(message, file=sys.stderr)
    sys.exit(1)
def passwords():
    data = {}
    if os.path.exists(IDENTITY):
        with open(IDENTITY, encoding="utf-8") as handle:
            data = json.load(handle)
    changed = False
    for username in (ADMIN, CUSTOMER):
        if not data.get(username):
            data[username] = secrets.token_urlsafe(24) + "Aa1!"
            changed = True
    if changed or not os.path.exists(IDENTITY):
        temporary = IDENTITY + ".tmp"
        with open(temporary, "w", encoding="utf-8") as handle:
            json.dump(data, handle)
            handle.write("\n")
        os.chmod(temporary, 0o600)
        os.replace(temporary, IDENTITY)
        os.chmod(IDENTITY, 0o600)
    return data
def request(method, path, body=None, token=None):
    payload = None if body is None else json.dumps(body).encode("utf-8")
    headers = {"Accept": "application/json"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(API + path, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {}
        return error.code, parsed
def register(username, password):
    status, _body = request("POST", "/auth/register", {
        "username": username,
        "email": username + "@aws.simplebank.test",
        "password": password,
    })
    if status not in (201, 409):
        fail("register " + username + " HTTP " + str(status))
def login(username, password):
    status, body = request("POST", "/auth/login", {"username": username, "password": password})
    token = body.get("token") if isinstance(body, dict) else None
    if status != 200 or not token:
        fail("login " + username + " HTTP " + str(status))
    return token
def is_admin(body):
    roles = body.get("roles") if isinstance(body, dict) else None
    return isinstance(roles, list) and "ADMIN" in roles
def prepare():
    data = passwords()
    register(ADMIN, data[ADMIN])
    register(CUSTOMER, data[CUSTOMER])
    token = login(ADMIN, data[ADMIN])
    status, body = request("GET", "/admin/whoami", token=token)
    if status == 200 and is_admin(body):
        print("ADMIN_READY")
        return
    if status == 403:
        print("BOOTSTRAP_REQUIRED")
        sys.exit(10)
    fail("admin whoami HTTP " + str(status))
def confirm_admin():
    token = login(ADMIN, passwords()[ADMIN])
    status, body = request("GET", "/admin/whoami", token=token)
    if status != 200 or not is_admin(body):
        fail("admin confirmation HTTP " + str(status))
    print("ADMIN_CONFIRMED")
def provision_customer():
    data = passwords()
    admin = login(ADMIN, data[ADMIN])
    status, users = request("GET", "/admin/auth-users", token=admin)
    if status != 200 or not isinstance(users, list):
        fail("auth user list HTTP " + str(status))
    customer = next((user for user in users if user.get("username") == CUSTOMER), None)
    if customer is None:
        fail("customer login was not found")
    bank_user_id = customer.get("bankUserId")
    if not bank_user_id:
        status, created = request("POST", "/users", {
            "name": "AWS Sender",
            "email": CUSTOMER + "@aws.simplebank.test",
        }, token=admin)
        if status not in (200, 201) or not created.get("id"):
            fail("create bank user HTTP " + str(status))
        bank_user_id = created["id"]
        status, _linked = request("PUT", "/admin/auth-users/" + customer["id"] + "/customer-link", {
            "bankUserId": bank_user_id,
        }, token=admin)
        if status != 200:
            fail("customer link HTTP " + str(status))
    status, accounts = request("GET", "/accounts", token=admin)
    if status != 200 or not isinstance(accounts, list):
        fail("account list HTTP " + str(status))
    checking = next((account for account in accounts if account.get("userId") == bank_user_id and account.get("accountType") == "CHECKING"), None)
    if checking is None:
        status, checking = request("POST", "/accounts", {
            "userId": bank_user_id,
            "accountType": "CHECKING",
        }, token=admin)
        if status not in (200, 201) or not checking.get("accountId"):
            fail("open checking HTTP " + str(status))
    if str(checking.get("balance", "0")) in ("0", "0.0", "0.00"):
        status, _deposit = request("POST", "/accounts/" + checking["accountId"] + "/deposit", {"amount": "100.00"}, token=admin)
        if status != 200:
            fail("deposit HTTP " + str(status))
    customer_token = login(CUSTOMER, data[CUSTOMER])
    for path in ("/me", "/dashboard", "/me/accounts"):
        status, body = request("GET", path, token=customer_token)
        if status != 200:
            fail("customer " + path + " HTTP " + str(status))
        if path == "/me/accounts" and (not isinstance(body, list) or not body):
            fail("customer accounts payload")
    status, _denied = request("GET", "/admin/whoami", token=customer_token)
    if status != 403:
        fail("customer admin whoami HTTP " + str(status))
    print("CUSTOMER_READY")
if __name__ == "__main__":
    phase = sys.argv[1] if len(sys.argv) == 2 else ""
    if phase == "prepare":
        prepare()
    elif phase == "confirm-admin":
        confirm_admin()
    elif phase == "provision-customer":
        provision_customer()
    else:
        fail("unknown phase")
