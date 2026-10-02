#!/usr/bin/env python3
"""Create the synthetic AWS course identities without printing secrets."""

import json
import os
import secrets
import sys
import urllib.error
import urllib.request

API_BASE = os.environ["AWS_API_BASE"].rstrip("/")
PASSWORD_FILE = os.environ["SIMPLE_BANK_AWS_IDENTITY_FILE"]
ADMIN = "aws.admin"
CUSTOMER = "aws.customer.sender"


def fail(message):
    print(message, file=sys.stderr)
    sys.exit(1)


def load_passwords():
    if os.path.exists(PASSWORD_FILE):
        with open(PASSWORD_FILE, encoding="utf-8") as handle:
            data = json.load(handle)
    else:
        data = {}
    changed = False
    for username in (ADMIN, CUSTOMER):
        if not data.get(username):
            data[username] = secrets.token_urlsafe(24) + "Aa1!"
            changed = True
    if changed:
        directory = os.path.dirname(PASSWORD_FILE) or "."
        os.makedirs(directory, exist_ok=True)
        temporary = PASSWORD_FILE + ".tmp"
        with open(temporary, "w", encoding="utf-8") as handle:
            json.dump(data, handle)
            handle.write("\n")
        os.chmod(temporary, 0o600)
        os.replace(temporary, PASSWORD_FILE)
        os.chmod(PASSWORD_FILE, 0o600)
    return data


def request(method, path, body=None, token=None):
    payload = None if body is None else json.dumps(body).encode("utf-8")
    headers = {"Accept": "application/json"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(API_BASE + path, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"error": "non-json response"}
        return error.code, parsed


def register(username, password):
    status, _body = request(
        "POST",
        "/auth/register",
        {
            "username": username,
            "email": f"{username}@aws.simplebank.test",
            "password": password,
        },
    )
    if status not in (201, 409):
        fail(f"register {username} HTTP {status}")


def login(username, password):
    status, body = request(
        "POST",
        "/auth/login",
        {"username": username, "password": password},
    )
    token = body.get("token") if isinstance(body, dict) else None
    if status != 200 or not token:
        fail(f"login {username} HTTP {status}")
    return token


def is_admin(body):
    roles = body.get("roles") if isinstance(body, dict) else None
    return isinstance(roles, list) and "ADMIN" in roles


def prepare():
    passwords = load_passwords()
    register(ADMIN, passwords[ADMIN])
    register(CUSTOMER, passwords[CUSTOMER])
    token = login(ADMIN, passwords[ADMIN])
    status, body = request("GET", "/admin/whoami", token=token)
    if status == 200 and is_admin(body):
        print("ADMIN_READY")
        return
    if status == 403:
        print("BOOTSTRAP_REQUIRED")
        sys.exit(10)
    fail(f"admin whoami HTTP {status}")


def confirm_admin():
    passwords = load_passwords()
    token = login(ADMIN, passwords[ADMIN])
    status, body = request("GET", "/admin/whoami", token=token)
    if status != 200 or not is_admin(body):
        fail(f"admin confirmation HTTP {status}")
    print("ADMIN_CONFIRMED")


def provision_customer():
    passwords = load_passwords()
    admin = login(ADMIN, passwords[ADMIN])
    status, users = request("GET", "/admin/auth-users", token=admin)
    if status != 200 or not isinstance(users, list):
        fail(f"auth user list HTTP {status}")
    customer = next((user for user in users if user.get("username") == CUSTOMER), None)
    if customer is None:
        fail("customer login was not found")
    bank_user_id = customer.get("bankUserId")
    if not bank_user_id:
        status, created = request(
            "POST",
            "/users",
            {"name": "AWS Sender", "email": f"{CUSTOMER}@aws.simplebank.test"},
            token=admin,
        )
        if status not in (200, 201) or not created.get("id"):
            fail(f"create bank user HTTP {status}")
        bank_user_id = created["id"]
        status, _linked = request(
            "PUT",
            f"/admin/auth-users/{customer['id']}/customer-link",
            {"bankUserId": bank_user_id},
            token=admin,
        )
        if status != 200:
            fail(f"customer link HTTP {status}")
    status, accounts = request("GET", "/accounts", token=admin)
    if status != 200 or not isinstance(accounts, list):
        fail(f"account list HTTP {status}")
    owned = [account for account in accounts if account.get("userId") == bank_user_id]
    checking = next((account for account in owned if account.get("accountType") == "CHECKING"), None)
    if checking is None:
        status, checking = request(
            "POST",
            "/accounts",
            {"userId": bank_user_id, "accountType": "CHECKING"},
            token=admin,
        )
        if status not in (200, 201) or not checking.get("accountId"):
            fail(f"open checking HTTP {status}")
    balance = str(checking.get("balance", "0"))
    if balance in ("0", "0.0", "0.00"):
        status, _deposit = request(
            "POST",
            f"/accounts/{checking['accountId']}/deposit",
            {"amount": "100.00"},
            token=admin,
        )
        if status != 200:
            fail(f"deposit HTTP {status}")
    customer_token = login(CUSTOMER, passwords[CUSTOMER])
    status, _me = request("GET", "/me", token=customer_token)
    if status != 200:
        fail(f"customer /me HTTP {status}")
    status, mine = request("GET", "/me/accounts", token=customer_token)
    if status != 200 or not isinstance(mine, list) or not mine:
        fail(f"customer accounts HTTP {status}")
    status, _denied = request("GET", "/admin/whoami", token=customer_token)
    if status != 403:
        fail(f"customer admin whoami HTTP {status}")
    print("CUSTOMER_READY")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        fail("usage: provision-identities.py prepare|confirm-admin|provision-customer")
    phase = sys.argv[1]
    if phase == "prepare":
        prepare()
    elif phase == "confirm-admin":
        confirm_admin()
    elif phase == "provision-customer":
        provision_customer()
    else:
        fail(f"unknown phase {phase}")
