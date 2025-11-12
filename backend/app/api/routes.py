from fastapi import APIRouter
from app.api.endpoints import agents, voices, calls, phone_numbers, organisations, organisation_users, users, mfa_auth

router = APIRouter()

# Include all endpoint routers
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(organisations.router, prefix="/organisations", tags=["Organisations"])
router.include_router(organisation_users.router, prefix="/organisation-users", tags=["Organisation Users"])
router.include_router(mfa_auth.router, prefix="/mfa", tags=["MFA Authentication"])
router.include_router(agents.router, prefix="/agents", tags=["Agents"])
router.include_router(voices.router, prefix="/voices", tags=["Voices"])
router.include_router(calls.router, prefix="/calls", tags=["Calls"])
router.include_router(phone_numbers.router, prefix="/phone-numbers", tags=["Phone Numbers"])