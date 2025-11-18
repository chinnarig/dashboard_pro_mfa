from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class UserRoleEnum(str, Enum):
    """Enum for user roles"""
    ADMIN = "Admin"
    READ = "Read"
    WRITE = "Write"

class UserCreate(BaseModel):
    """Schema for creating a new user"""
    name: str
    email: EmailStr
    password: str
    confirm_password: str
    role: UserRoleEnum = UserRoleEnum.READ
    
    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('Passwords do not match')
        return v

class UserUpdate(BaseModel):
    """Schema for updating a user"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[UserRoleEnum] = None

class UserResponse(BaseModel):
    """Schema for user response"""
    id: str
    name: str
    email: EmailStr
    role: UserRoleEnum
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True

class OrganisationUserCreate(BaseModel):
    """Schema for creating organisation-user relationship"""
    organisation_id: str
    user_id: str
    created_by: str

class OrganisationUserUpdate(BaseModel):
    """Schema for updating organisation-user relationship"""
    updated_by: str

class OrganisationUserResponse(BaseModel):
    """Schema for organisation-user relationship response"""
    organisation_id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: str
    updated_by: Optional[str] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True

class OrganisationCreate(BaseModel):
    """Schema for creating a new organisation"""
    project_id: str
    name: str
    url: Optional[str] = None
    sip_url: Optional[str] = None
    lk_url: Optional[str] = None
    lk_api_key: str
    lk_api_secret: str
    is_active: Optional[bool] = True
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number_1: Optional[str] = None
    phone_number_2: Optional[str] = None

class OrganisationUpdate(BaseModel):
    """Schema for updating an organisation"""
    project_id: Optional[str] = None
    name: Optional[str] = None
    url: Optional[str] = None
    sip_url: Optional[str] = None
    lk_url: Optional[str] = None
    lk_api_key: Optional[str] = None
    lk_api_secret: Optional[str] = None
    is_active: Optional[bool] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number_1: Optional[str] = None
    phone_number_2: Optional[str] = None

class OrganisationResponse(BaseModel):
    """Schema for organisation response"""
    id: str
    project_id: str
    name: str
    url: Optional[str] = None
    sip_url: Optional[str] = None
    lk_url: Optional[str] = None
    lk_api_key: str
    is_active: Optional[bool] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number_1: Optional[str] = None
    phone_number_2: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class OrganisationWithUserResponse(BaseModel):
    """Schema for organisation response with admin user details"""
    organisation: OrganisationResponse
    admin_user: UserResponse
    
    class Config:
        from_attributes = True

class AgentConfig(BaseModel):
    agent_name: Optional[str] = "Zlavox AI Agent"
    voice_id: str = "11labs-Cimo"
    phone_number: Optional[str] = None

class AgentUpdate(BaseModel):
    """Schema for updating an agent"""
    agent_name: Optional[str] = None
    voice_id: Optional[str] = None
    phone_number: Optional[str] = None

class VoiceInfo(BaseModel):
    voice_name: str
    voice_id: str
    gender: Optional[str] = None
    accent: Optional[str] = None
    age: Optional[str] = None
    preview_audio_url: Optional[str] = None

class AgentDetail(BaseModel):
    agent_name: str
    agent_id: str
    voice_id: str
    phone_number: str
    last_modification_timestamp: str

class CallDetail(BaseModel):
    call_id: str
    agent_name: str
    start_timestamp: str
    end_timestamp: Optional[str] = None
    duration_ms: int = 0
    call_status: str
    from_number: str
    to_number: str
    disconnection_reason: str

# ============ MFA Schemas ============

class MFASetupResponse(BaseModel):
    """Response for MFA setup"""
    secret: str
    qr_code: str
    manual_entry_key: str

class MFAEnableRequest(BaseModel):
    """Request to enable MFA"""
    code: str
    
    @field_validator('code')
    @classmethod
    def validate_code(cls, v):
        if not v or len(v) != 6:
            raise ValueError('Code must be 6 digits')
        return v

class MFAEnableResponse(BaseModel):
    """Response for MFA enable"""
    message: str
    backup_codes: List[str]

class MFAVerifyRequest(BaseModel):
    """Request to verify MFA code"""
    email: EmailStr
    password: str
    code: str

class MFAVerifyResponse(BaseModel):
    """Response for MFA verification"""
    success: bool
    message: str
    backup_code_used: Optional[bool] = False

class MFADisableRequest(BaseModel):
    """Request to disable MFA"""
    password: str
    code: Optional[str] = None

class MFAStatusResponse(BaseModel):
    """Response for MFA status"""
    mfa_enabled: bool
    last_login: Optional[datetime] = None

class BackupCodesResponse(BaseModel):
    """Response for backup codes"""
    message: str
    backup_codes: List[str]

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    detail: Optional[str] = None