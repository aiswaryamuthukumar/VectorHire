import hashlib
import hmac
import os
import secrets
import time


OTP_TTL_SECONDS = 10 * 60

_otp_store = {}
_verified_store = {}


def _hash_otp(otp):
    secret = os.getenv("OTP_SECRET", "vectorhire-local-otp-secret")
    return hashlib.sha256(f"{secret}:{otp}".encode("utf-8")).hexdigest()


def _normalize_purpose(purpose):
    return purpose.strip().lower()


def _key(purpose, recipient):
    return (_normalize_purpose(purpose), recipient.strip().lower())


def generate_otp():
    return f"{secrets.randbelow(900000) + 100000}"


def store_otp(purpose, recipient, otp):
    _otp_store[_key(purpose, recipient)] = {
        "otp_hash": _hash_otp(otp),
        "expires_at": time.time() + OTP_TTL_SECONDS,
    }


def verify_otp(purpose, recipient, otp):
    key = _key(purpose, recipient)
    entry = _otp_store.get(key)

    if not entry or entry["expires_at"] < time.time():
        _otp_store.pop(key, None)
        return False

    if not hmac.compare_digest(entry["otp_hash"], _hash_otp((otp or "").strip())):
        return False

    _otp_store.pop(key, None)
    _verified_store[key] = time.time() + OTP_TTL_SECONDS
    return True


def is_verified(purpose, recipient):
    key = _key(purpose, recipient)
    expires_at = _verified_store.get(key)

    if not expires_at or expires_at < time.time():
        _verified_store.pop(key, None)
        return False

    return True
