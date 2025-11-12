from functools import lru_cache
from retell import Retell
from app.core.config import settings

@lru_cache()
def get_retell_client() -> Retell:
    """
    Returns a singleton instance of the Retell client.
    Uses caching to avoid creating multiple instances.
    """
    return Retell(api_key=settings.RETELL_API_KEY)