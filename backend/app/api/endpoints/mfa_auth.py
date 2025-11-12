"""
MFA Authentication Endpoints
Handles two-factor authentication setup, verification, and management
"""

from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.orm import Session
from app.schemas.models import (
    MFASetupResponse, MFAEnableRequest, MFAEnableResponse,
    MFAVerifyRequest, MFAVerifyResponse, MFADisableRequest,
    MFAStatusResponse, BackupCodesResponse, MessageResponse
)
from app.core.database import get_db
from app.db import crud
from app.api.auth.mfa_utils import (
    generate_mfa_secret, get_totp_uri, generate_qr_code,
    encrypt_data, decrypt_data, verify_totp_code,
    generate_backup_codes, encrypt_backup_codes, decrypt_backup_codes,
    verify_backup_code, format_secret_for_manual_entry
)
from passlib.context import CryptContext
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


# Helper to get current user from email (simplified - in production use proper auth)
def get_user_by_email_auth(email: str, db: Session):
    """Get user by email for authentication"""
    user = crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.post(
    "/setup",
    response_model=MFASetupResponse,
    summary="Setup MFA",
    description="Generate MFA secret and QR code for authenticator app setup",
    tags=["MFA Authentication"]
)
async def setup_mfa(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Generate MFA secret and QR code for setup.
    
    This endpoint:
    1. Generates a new TOTP secret
    2. Creates a QR code for scanning
    3. Provides a manual entry key
    4. Stores the encrypted secret temporarily
    
    **Note**: MFA is not enabled until the /enable endpoint is called with a valid code.
    """
    try:
        logger.info(f"MFA setup requested for email: {email}")
        
        user = get_user_by_email_auth(email, db)
        
        # Check if MFA is already enabled
        if user.mfa_enabled == 'true':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA is already enabled for this account"
            )
        
        # Generate new secret
        secret = generate_mfa_secret()
        logger.info(f"Generated MFA secret for user: {user.id}")
        
        # Generate provisioning URI
        uri = get_totp_uri(secret, user.email)
        
        # Generate QR code
        qr_code = generate_qr_code(uri)
        
        # Store encrypted secret temporarily
        user.mfa_secret = encrypt_data(secret)
        db.commit()
        
        logger.info(f"MFA setup completed for user: {user.id}")
        
        return MFASetupResponse(
            secret=secret,
            qr_code=qr_code,
            manual_entry_key=format_secret_for_manual_entry(secret)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MFA setup error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to setup MFA: {str(e)}"
        )


@router.post(
    "/enable",
    response_model=MFAEnableResponse,
    summary="Enable MFA",
    description="Verify setup code and enable MFA for the user",
    tags=["MFA Authentication"]
)
async def enable_mfa(
    email: str,
    request: MFAEnableRequest,
    db: Session = Depends(get_db)
):
    """
    Enable MFA after verifying the setup code.
    
    This endpoint:
    1. Verifies the TOTP code from the authenticator app
    2. Generates 8 backup codes
    3. Enables MFA for the user
    4. Returns the backup codes (must be saved by user)
    
    **Important**: Backup codes are shown only once. Users must save them securely.
    """
    try:
        logger.info(f"MFA enable requested for email: {email}")
        
        user = get_user_by_email_auth(email, db)
        
        if user.mfa_enabled == 'true':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA is already enabled"
            )
        
        if not user.mfa_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA setup not initiated. Call /setup first"
            )
        
        # Decrypt secret
        secret = decrypt_data(user.mfa_secret)
        
        # Verify code
        if not verify_totp_code(secret, request.code):
            logger.warning(f"Invalid MFA code attempt for user: {user.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid MFA code"
            )
        
        # Generate backup codes
        backup_codes = generate_backup_codes()
        
        # Enable MFA
        user.mfa_enabled = 'true'
        user.mfa_backup_codes = encrypt_backup_codes(backup_codes)
        db.commit()
        
        logger.info(f"MFA enabled successfully for user: {user.id}")
        
        return MFAEnableResponse(
            message="MFA enabled successfully. Please save your backup codes securely.",
            backup_codes=backup_codes
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MFA enable error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enable MFA: {str(e)}"
        )


@router.post(
    "/verify",
    response_model=MFAVerifyResponse,
    summary="Verify MFA Code",
    description="Verify MFA code during login (accepts TOTP or backup code)",
    tags=["MFA Authentication"]
)
async def verify_mfa(
    request: MFAVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify MFA code during login.
    
    This endpoint:
    1. Verifies the user's password
    2. Checks if MFA is enabled
    3. Verifies the TOTP code OR backup code
    4. Updates last login timestamp
    5. Removes used backup codes
    
    **Accepts**: 6-digit TOTP codes or backup codes (XXXX-XXXX format)
    """
    try:
        logger.info(f"MFA verification requested for email: {request.email}")
        
        user = get_user_by_email_auth(request.email, db)
        
        # Verify password
        if not user.password_hash or not verify_password(request.password, user.password_hash):
            logger.warning(f"Invalid password for user: {user.id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        if user.mfa_enabled != 'true':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA is not enabled for this account"
            )
        
        # Decrypt MFA secret
        mfa_secret = decrypt_data(user.mfa_secret)
        
        # Verify TOTP code
        is_valid_totp = verify_totp_code(mfa_secret, request.code)
        
        # If TOTP fails, try backup codes
        is_valid_backup = False
        if not is_valid_totp and user.mfa_backup_codes:
            is_valid_backup, updated_codes = verify_backup_code(
                user.mfa_backup_codes,
                request.code
            )
            if is_valid_backup:
                # Update backup codes (one was used)
                user.mfa_backup_codes = updated_codes
                logger.info(f"Backup code used for user: {user.id}")
        
        if not is_valid_totp and not is_valid_backup:
            logger.warning(f"Invalid MFA code for user: {user.id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MFA code"
            )
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        logger.info(f"MFA verification successful for user: {user.id}")
        
        return MFAVerifyResponse(
            success=True,
            message="MFA verification successful",
            backup_code_used=is_valid_backup
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MFA verification error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify MFA: {str(e)}"
        )


@router.post(
    "/disable",
    response_model=MessageResponse,
    summary="Disable MFA",
    description="Disable MFA for the user (requires password and optional MFA code)",
    tags=["MFA Authentication"]
)
async def disable_mfa(
    email: str,
    request: MFADisableRequest,
    db: Session = Depends(get_db)
):
    """
    Disable MFA for the user.
    
    This endpoint:
    1. Verifies the user's password (required)
    2. Optionally verifies MFA code or backup code
    3. Disables MFA and removes secrets
    
    **Security**: Password is always required. MFA code is optional but recommended.
    """
    try:
        logger.info(f"MFA disable requested for email: {email}")
        
        user = get_user_by_email_auth(email, db)
        
        if user.mfa_enabled != 'true':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA is not enabled"
            )
        
        # Verify password
        if not user.password_hash or not verify_password(request.password, user.password_hash):
            logger.warning(f"Invalid password for MFA disable: {user.id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )
        
        # If code provided, verify it
        if request.code:
            secret = decrypt_data(user.mfa_secret)
            
            # Try TOTP
            is_valid_totp = verify_totp_code(secret, request.code)
            
            # Try backup code
            is_valid_backup = False
            if not is_valid_totp and user.mfa_backup_codes:
                is_valid_backup, _ = verify_backup_code(
                    user.mfa_backup_codes,
                    request.code
                )
            
            if not is_valid_totp and not is_valid_backup:
                logger.warning(f"Invalid MFA code for disable: {user.id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid MFA code"
                )
        
        # Disable MFA
        user.mfa_enabled = 'false'
        user.mfa_secret = None
        user.mfa_backup_codes = None
        db.commit()
        
        logger.info(f"MFA disabled successfully for user: {user.id}")
        
        return MessageResponse(
            message="MFA has been disabled successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MFA disable error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to disable MFA: {str(e)}"
        )


@router.post(
    "/backup-codes",
    response_model=BackupCodesResponse,
    summary="Regenerate Backup Codes",
    description="Generate new backup codes (invalidates old ones)",
    tags=["MFA Authentication"]
)
async def regenerate_backup_codes(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Regenerate backup codes for the user.
    
    This endpoint:
    1. Generates 8 new backup codes
    2. Invalidates all previous backup codes
    3. Returns the new codes (must be saved by user)
    
    **Warning**: Old backup codes will no longer work after regeneration.
    """
    try:
        logger.info(f"Backup codes regeneration requested for email: {email}")
        
        user = get_user_by_email_auth(email, db)
        
        if user.mfa_enabled != 'true':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA is not enabled"
            )
        
        # Generate new backup codes
        backup_codes = generate_backup_codes()
        
        # Update user
        user.mfa_backup_codes = encrypt_backup_codes(backup_codes)
        db.commit()
        
        logger.info(f"Backup codes regenerated for user: {user.id}")
        
        return BackupCodesResponse(
            message="Backup codes regenerated successfully. Please save them securely.",
            backup_codes=backup_codes
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Backup codes regeneration error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate backup codes: {str(e)}"
        )


@router.get(
    "/status",
    response_model=MFAStatusResponse,
    summary="Get MFA Status",
    description="Check if MFA is enabled for the user",
    tags=["MFA Authentication"]
)
async def get_mfa_status(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Get MFA status for a user.
    
    Returns:
    - mfa_enabled: Whether MFA is enabled
    - last_login: Last login timestamp
    """
    try:
        user = get_user_by_email_auth(email, db)
        
        return MFAStatusResponse(
            mfa_enabled=(user.mfa_enabled == 'true'),
            last_login=user.last_login
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MFA status error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get MFA status: {str(e)}"
        )
