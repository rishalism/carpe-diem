"""Rate limiter (in-memory). Redis backend can be added later via REDIS_URL."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

AUTH_RATE_LIMIT = "10/minute"
