from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import deferred
from app.core.database import Base
import uuid
import enum

class UserRole(enum.Enum):
    """Enum for user roles"""
    ADMIN = "ADMIN"
    USER = "USER"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = deferred(Column(String(255)))  # Deferred loading - won't be queried by default
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    
    # MFA fields
    mfa_enabled = Column(String(10), nullable=False, default='false')  # Using string to match existing pattern
    mfa_secret = Column(Text, nullable=True)  # Encrypted TOTP secret
    mfa_backup_codes = Column(Text, nullable=True)  # Encrypted backup codes (JSON)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<User(id={self.id}, name={self.name}, email={self.email}, role={self.role}, mfa_enabled={self.mfa_enabled})>"

class Organisation(Base):
    __tablename__ = "organisations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    phone_number_primary = Column(String)
    phone_number_secondary = Column(String)
    address = Column(String)
    api_key = Column(String, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class OrganisationUser(Base):
    __tablename__ = "organisation_users"
    
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=False)
    updated_by = Column(String(255), nullable=True)
    
    def __repr__(self):
        return f"<OrganisationUser(organisation_id={self.organisation_id}, user_id={self.user_id})>"

