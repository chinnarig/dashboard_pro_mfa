from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import deferred, relationship
from app.core.database import Base
import uuid
import enum

class UserRole(enum.Enum):
    """Enum for user roles"""
    ADMIN = "Admin"
    READ = "Read"
    WRITE = "Write"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = deferred(Column('password_hash', String(255), nullable=True))  # Deferred loading - won't be queried by default
    org_project_id = Column(UUID(as_uuid=True), ForeignKey("org_projects.z_id", ondelete="SET NULL"), nullable=True)
    role = Column(String(50), nullable=True, default='Read')  # 'Admin', 'Read', 'Write'
    
    # Profile fields
    full_name = Column(String(255), nullable=True)
    username = Column(String(100), unique=True, nullable=True)
    image = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    phone_number = Column(String(50), nullable=True)
    
    # MFA fields
    mfa_enabled = Column(Boolean, nullable=False, default=False)
    mfa_secret = Column(String(255), nullable=True)  # Encrypted TOTP secret
    mfa_backup_codes = Column(Text, nullable=True)  # Encrypted backup codes
    mfa_enabled_at = Column(DateTime(timezone=True), nullable=True)
    
    # SSO fields
    sso_provider = Column(String(50), nullable=True)
    sso_provider_id = Column(String(255), nullable=True)
    sso_email = Column(String(255), nullable=True)
    sso_metadata = Column(Text, nullable=True)  # JSON
    
    # Authentication method
    auth_method = Column(String(20), nullable=True, default='password')
    last_sso_login_at = Column(DateTime(timezone=True), nullable=True)
    
    # Security fields
    is_active = Column(Boolean, nullable=False, default=True)
    is_email_verified = Column(Boolean, nullable=False, default=False)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_login_ip = Column(String(50), nullable=True)
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role}, mfa_enabled={self.mfa_enabled})>"

class Organisation(Base):
    __tablename__ = "org_projects"
    
    id = Column('z_id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(String(100), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    url = Column(String(255), nullable=True)
    sip_url = Column(Text, nullable=True)
    lk_url = Column(Text, nullable=True)
    lk_api_key = Column(String(255), unique=True, nullable=False)
    lk_api_secret = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    address = Column(Text, nullable=True)
    email = Column(String(255), nullable=True)
    phone_number_1 = Column(String(50), nullable=True)
    phone_number_2 = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class OrganisationUser(Base):
    __tablename__ = "organisation_users"
    
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("org_projects.z_id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=False)
    updated_by = Column(String(255), nullable=True)
    
    def __repr__(self):
        return f"<OrganisationUser(organisation_id={self.organisation_id}, user_id={self.user_id})>"


class Agent(Base):
    """Agent model for AI voice agents"""
    __tablename__ = "agents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    phone_number = Column(String(50), nullable=True, index=True)
    livekit_agent_name = Column('livekit_agent_name', String(255), unique=True, nullable=False, index=True)
    
    # Voice config
    voice_provider = Column(String(50), nullable=True)
    voice_id = Column(String(255), nullable=True)
    language = Column(String(10), nullable=False, default='en-US')
    
    # LLM config
    llm_provider = Column(String(50), nullable=True)
    llm_model = Column(String(100), nullable=True)
    system_prompt = Column(Text, nullable=True)
    temperature = Column(String(10), nullable=True, default='0.7')
    max_tokens = Column(Integer, nullable=True, default=1000)
    
    # Status
    status = Column(String(20), nullable=False, default='active', index=True)
    is_phone_active = Column(Boolean, nullable=False, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # Relationships
    call_logs = relationship("CallLog", back_populates="agent")
    
    def __repr__(self):
        return f"<Agent(id={self.id}, name={self.name}, status={self.status})>"


class CallLog(Base):
    """Call log model for storing call history"""
    __tablename__ = "call_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # LiveKit
    livekit_room_id = Column('livekit_room_id', String(255), nullable=False, index=True)
    session_id = Column('session_id', String(255), nullable=True, unique=True, index=True)
    
    # Agent
    agent_id = Column('agent_id', UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True, index=True)
    
    # Call details
    direction = Column(String(20), nullable=False, index=True)
    caller_phone = Column('caller_phone', String(50), nullable=False, index=True)
    agent_phone = Column('agent_phone', String(50), nullable=True)
    
    # Timing
    start_time = Column('start_time', DateTime(timezone=True), nullable=False, index=True)
    end_time = Column('end_time', DateTime(timezone=True), nullable=True)
    duration_seconds = Column('duration_seconds', Integer, nullable=True)
    
    # Status
    status = Column(String(50), nullable=True, index=True)
    disconnect_reason = Column('disconnect_reason', String(100), nullable=True)
    
    # Disposition
    disposition_code = Column('disposition_code', String(50), nullable=True, index=True)
    disposition_notes = Column('disposition_notes', Text, nullable=True)
    
    # Transcript & Analysis
    transcript = Column(JSONB, nullable=True)
    analysis = Column(JSONB, nullable=True)
    
    created_at = Column('created_at', DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column('updated_at', DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)
    
    # Relationships
    agent = relationship("Agent", back_populates="call_logs")
    
    def __repr__(self):
        return f"<CallLog(id={self.id}, livekit_room_id={self.livekit_room_id}, caller_phone={self.caller_phone})>"


