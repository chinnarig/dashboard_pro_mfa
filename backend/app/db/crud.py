from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.models import Organisation, OrganisationUser, User
from app.schemas.models import (
    OrganisationCreate, OrganisationUserCreate, OrganisationUserUpdate,
    UserCreate, UserUpdate
)
from fastapi import HTTPException, status
from typing import List, Optional
import uuid

# User CRUD operations

def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user in the database"""
    try:
        # Hash the password here (you should use a proper hashing library like bcrypt)
        # For now, we'll store it as is, but in production use proper password hashing
        db_user = User(
            name=user.name,
            email=user.email,
            password_hash=user.password,  # TODO: Hash this password with bcrypt
            role=user.role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError as e:
        db.rollback()
        if "email" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {str(e)}"
        )

def get_user(db: Session, user_id: str) -> Optional[User]:
    """Get a user by ID"""
    try:
        user_uuid = uuid.UUID(user_id)
        return db.query(User).filter(User.id == user_uuid).first()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Get all users with pagination"""
    return db.query(User).offset(skip).limit(limit).all()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get a user by email"""
    return db.query(User).filter(User.email == email).first()

def update_user(db: Session, user_id: str, update_data: dict) -> Optional[User]:
    """Update a user"""
    user = get_user(db, user_id)
    if not user:
        return None
    
    for key, value in update_data.items():
        if value is not None:
            if key == 'password':
                # Hash password before storing
                setattr(user, 'password_hash', value)  # TODO: Hash this password
            elif hasattr(user, key):
                setattr(user, key, value)
    
    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Update failed: {str(e)}"
        )

def delete_user(db: Session, user_id: str) -> bool:
    """Delete a user"""
    user = get_user(db, user_id)
    if not user:
        return False
    
    db.delete(user)
    db.commit()
    return True


# Organisation CRUD operations

def create_organisation_with_admin_user(db: Session, organisation: OrganisationCreate) -> tuple[Organisation, User]:
    """
    Create a new organisation along with an admin user and link them together.
    This is a transactional operation - if any step fails, everything is rolled back.
    
    Returns: tuple of (organisation, user)
    """
    try:
        # Step 1: Create the organisation
        db_organisation = Organisation(
            name=organisation.name,
            email=organisation.email,
            password_hash=organisation.password_hash,
            phone_number_primary=organisation.phone_number_primary,
            phone_number_secondary=organisation.phone_number_secondary,
            address=organisation.address,
            api_key=organisation.api_key
        )
        db.add(db_organisation)
        db.flush()  # Flush to get the organisation ID without committing
        
        # Step 2: Create the admin user with same email and password
        from app.db.models import UserRole
        db_user = User(
            name=organisation.name,  # Use organisation name as user name
            email=organisation.email,
            password_hash=organisation.password_hash,  # Same password as organisation
            role=UserRole.ADMIN  # Default role is ADMIN
        )
        db.add(db_user)
        db.flush()  # Flush to get the user ID without committing
        
        # Step 3: Create the organisation-user relationship
        db_org_user = OrganisationUser(
            organisation_id=db_organisation.id,
            user_id=db_user.id,
            created_by=str(db_user.id)  # The user creates their own relationship
        )
        db.add(db_org_user)
        
        # Commit all changes together
        db.commit()
        db.refresh(db_organisation)
        db.refresh(db_user)
        
        return db_organisation, db_user
        
    except IntegrityError as e:
        db.rollback()
        if "email" in str(e.orig).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists"
            )
        elif "api_key" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="API key already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create organisation with admin user: {str(e)}"
        )


def create_organisation(db: Session, organisation: OrganisationCreate) -> Organisation:
    """Create a new organisation in the database"""
    try:
        db_organisation = Organisation(
            name=organisation.name,
            email=organisation.email,
            password_hash=organisation.password_hash,
            phone_number_primary=organisation.phone_number_primary,
            phone_number_secondary=organisation.phone_number_secondary,
            address=organisation.address,
            api_key=organisation.api_key
        )
        db.add(db_organisation)
        db.commit()
        db.refresh(db_organisation)
        return db_organisation
    except IntegrityError as e:
        db.rollback()
        if "email" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists"
            )
        elif "api_key" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="API key already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {str(e)}"
        )

def get_organisation(db: Session, organisation_id: str) -> Optional[Organisation]:
    """Get an organisation by ID"""
    try:
        org_uuid = uuid.UUID(organisation_id)
        return db.query(Organisation).filter(Organisation.id == org_uuid).first()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid organisation ID format"
        )

def get_organisations(db: Session, skip: int = 0, limit: int = 100) -> List[Organisation]:
    """Get all organisations with pagination"""
    return db.query(Organisation).offset(skip).limit(limit).all()

def get_organisation_by_email(db: Session, email: str) -> Optional[Organisation]:
    """Get an organisation by email"""
    return db.query(Organisation).filter(Organisation.email == email).first()

def get_organisation_by_api_key(db: Session, api_key: str) -> Optional[Organisation]:
    """Get an organisation by API key"""
    return db.query(Organisation).filter(Organisation.api_key == api_key).first()

def update_organisation(db: Session, organisation_id: str, update_data: dict) -> Optional[Organisation]:
    """Update an organisation"""
    org = get_organisation(db, organisation_id)
    if not org:
        return None
    
    for key, value in update_data.items():
        if value is not None and hasattr(org, key):
            setattr(org, key, value)
    
    try:
        db.commit()
        db.refresh(org)
        return org
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Update failed: {str(e)}"
        )

def delete_organisation(db: Session, organisation_id: str) -> bool:
    """Delete an organisation"""
    org = get_organisation(db, organisation_id)
    if not org:
        return False
    
    db.delete(org)
    db.commit()
    return True


# OrganisationUser CRUD operations

def create_organisation_user(db: Session, org_user: OrganisationUserCreate) -> OrganisationUser:
    """Create a new organisation-user relationship"""
    try:
        org_uuid = uuid.UUID(org_user.organisation_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid organisation ID format"
        )
    
    # Check if organisation exists
    org = db.query(Organisation).filter(Organisation.id == org_uuid).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organisation not found"
        )
    
    # Check if relationship already exists
    existing = db.query(OrganisationUser).filter(
        OrganisationUser.organisation_id == org_uuid,
        OrganisationUser.user_id == org_user.user_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already associated with this organisation"
        )
    
    try:
        db_org_user = OrganisationUser(
            organisation_id=org_uuid,
            user_id=org_user.user_id,
            created_by=org_user.created_by
        )
        db.add(db_org_user)
        db.commit()
        db.refresh(db_org_user)
        return db_org_user
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {str(e)}"
        )

def get_organisation_user(db: Session, organisation_id: str, user_id: str) -> Optional[OrganisationUser]:
    """Get a specific organisation-user relationship"""
    try:
        org_uuid = uuid.UUID(organisation_id)
        return db.query(OrganisationUser).filter(
            OrganisationUser.organisation_id == org_uuid,
            OrganisationUser.user_id == user_id
        ).first()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid organisation ID format"
        )

def get_users_by_organisation(db: Session, organisation_id: str) -> List[OrganisationUser]:
    """Get all users for a specific organisation"""
    try:
        org_uuid = uuid.UUID(organisation_id)
        return db.query(OrganisationUser).filter(
            OrganisationUser.organisation_id == org_uuid
        ).all()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid organisation ID format"
        )

def get_organisations_by_user(db: Session, user_id: str) -> List[OrganisationUser]:
    """Get all organisations for a specific user"""
    return db.query(OrganisationUser).filter(
        OrganisationUser.user_id == user_id
    ).all()

def get_all_organisation_users(db: Session, skip: int = 0, limit: int = 100) -> List[OrganisationUser]:
    """Get all organisation-user relationships with pagination"""
    return db.query(OrganisationUser).offset(skip).limit(limit).all()

def update_organisation_user(db: Session, organisation_id: str, user_id: str, 
                            update_data: OrganisationUserUpdate) -> Optional[OrganisationUser]:
    """Update an organisation-user relationship"""
    org_user = get_organisation_user(db, organisation_id, user_id)
    if not org_user:
        return None
    
    org_user.updated_by = update_data.updated_by
    
    try:
        db.commit()
        db.refresh(org_user)
        return org_user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Update failed: {str(e)}"
        )

def delete_organisation_user(db: Session, organisation_id: str, user_id: str) -> bool:
    """Delete an organisation-user relationship"""
    org_user = get_organisation_user(db, organisation_id, user_id)
    if not org_user:
        return False
    
    db.delete(org_user)
    db.commit()
    return True
