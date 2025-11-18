from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.schemas.models import (
    OrganisationCreate, OrganisationUpdate, OrganisationResponse, 
    OrganisationWithUserResponse, UserResponse
)
from app.core.database import get_db
from app.db import crud
from typing import List

router = APIRouter()

@router.post("/", response_model=OrganisationWithUserResponse, status_code=status.HTTP_201_CREATED)
async def create_organisation(organisation: OrganisationCreate, db: Session = Depends(get_db)):
    """
    Create a new organisation with an admin user.
    
    This endpoint performs the following operations in a single transaction:
    1. Creates a new organisation
    2. Creates an admin user with the same email and password
    3. Links the user to the organisation
    
    - **name**: Organisation name (also used as admin user's name)
    - **email**: Organisation and admin user email address
    - **password_hash**: Password for organisation and admin user
    - **confirm_password**: Must match password_hash
    - **phone_number_primary**: Primary contact phone number
    - **phone_number_secondary**: Secondary contact phone number (optional)
    - **address**: Organisation address
    - **api_key**: API key for the organisation
    
    Returns both the organisation and the created admin user details.
    Note: IDs are auto-generated at the database level
    """
    try:
        # Check if email already exists
        existing_org = crud.get_organisation_by_email(db, organisation.email)
        if existing_org:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        existing_user = crud.get_user_by_email(db, organisation.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered as a user"
            )
        
        # Create organisation with admin user in a single transaction
        db_organisation, db_user = crud.create_organisation_with_admin_user(db, organisation)
        
        # Convert to response models
        org_response = OrganisationResponse(
            id=str(db_organisation.id),
            name=db_organisation.name,
            email=db_organisation.email,
            phone_number_primary=db_organisation.phone_number_primary,
            phone_number_secondary=db_organisation.phone_number_secondary,
            address=db_organisation.address,
            api_key=db_organisation.api_key
        )
        
        user_response = UserResponse(
            id=str(db_user.id),
            name=db_user.name,
            email=db_user.email,
            role=db_user.role,
            created_at=db_user.created_at,
            updated_at=db_user.updated_at
        )
        
        return OrganisationWithUserResponse(
            organisation=org_response,
            admin_user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create organisation: {str(e)}"
        )

@router.get("/", response_model=List[OrganisationResponse])
async def list_organisations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    List all organisations with pagination.
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 100)
    """
    try:
        organisations = crud.get_organisations(db, skip=skip, limit=limit)
        return [
            OrganisationResponse(
                id=str(org.id),
                project_id=org.project_id,
                name=org.name,
                url=org.url,
                sip_url=org.sip_url,
                lk_url=org.lk_url,
                lk_api_key=org.lk_api_key,
                is_active=org.is_active,
                address=org.address,
                email=org.email,
                phone_number_1=org.phone_number_1,
                phone_number_2=org.phone_number_2,
                created_at=org.created_at,
                updated_at=org.updated_at
            )
            for org in organisations
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve organisations: {str(e)}"
        )

@router.get("/{organisation_id}", response_model=OrganisationResponse)
async def get_organisation(organisation_id: str, db: Session = Depends(get_db)):
    """
    Get a specific organisation by ID.
    """
    try:
        organisation = crud.get_organisation(db, organisation_id)
        if not organisation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organisation not found"
            )
        
        return OrganisationResponse(
            id=str(organisation.id),
            project_id=organisation.project_id,
            name=organisation.name,
            url=organisation.url,
            sip_url=organisation.sip_url,
            lk_url=organisation.lk_url,
            lk_api_key=organisation.lk_api_key,
            is_active=organisation.is_active,
            address=organisation.address,
            email=organisation.email,
            phone_number_1=organisation.phone_number_1,
            phone_number_2=organisation.phone_number_2,
            created_at=organisation.created_at,
            updated_at=organisation.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve organisation: {str(e)}"
        )

@router.patch("/{organisation_id}", response_model=OrganisationResponse)
async def update_organisation(
    organisation_id: str, 
    update_data: OrganisationUpdate, 
    db: Session = Depends(get_db)
):
    """
    Update an organisation's information.
    
    All fields are optional. Only provided fields will be updated.
    
    - **name**: Organisation name (optional)
    - **email**: Organisation email address (optional)
    - **password_hash**: Hashed password for authentication (optional)
    - **phone_number_primary**: Primary contact phone number (optional)
    - **phone_number_secondary**: Secondary contact phone number (optional)
    - **address**: Organisation address (optional)
    - **api_key**: API key for the organisation (optional)
    """
    try:
        # Check if organisation exists
        existing_org = crud.get_organisation(db, organisation_id)
        if not existing_org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organisation not found"
            )
        
        # Convert update_data to dict, excluding unset fields
        update_dict = update_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided for update"
            )
        
        # Update organisation in database
        updated_org = crud.update_organisation(db, organisation_id, update_dict)
        
        if not updated_org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organisation not found"
            )
        
        return OrganisationResponse(
            id=str(updated_org.id),
            name=updated_org.name,
            email=updated_org.email,
            phone_number_primary=updated_org.phone_number_primary,
            phone_number_secondary=updated_org.phone_number_secondary,
            address=updated_org.address,
            api_key=updated_org.api_key
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update organisation: {str(e)}"
        )

@router.delete("/{organisation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organisation(organisation_id: str, db: Session = Depends(get_db)):
    """
    Delete an organisation.
    
    This will also delete all associated organisation-user relationships due to CASCADE delete.
    """
    try:
        deleted = crud.delete_organisation(db, organisation_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organisation not found"
            )
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete organisation: {str(e)}"
        )
