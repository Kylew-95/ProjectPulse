from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize the limiter
# We use the remote address (IP) as the default key for rate limiting
limiter = Limiter(key_func=get_remote_address)
