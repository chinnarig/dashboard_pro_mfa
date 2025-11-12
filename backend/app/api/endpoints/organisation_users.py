from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.schemas.models import OrganisationUserCreate, OrganisationUserUpdate, OrganisationUserResponse
from app.core.database import get_db
from app.db import crud
from typing import List

router = APIRouter()

@router.post("/", response_model=OrganisationUserResponse, status_code=status.HTTP_201_CREATED)
async def create_organisation_user_relationship(
    relationship: OrganisationUserCreate, 
    db: Session = Depends(get_db)
):
    """
    Create a new organisation-user relationship.
    
    - **organisation_id**: ID of the organisation
    - **user_id**: ID of the user
    - **created_by**: ID of the user who created this relationship
    
    Note: created_at and updated_at are auto-generated at the database level
    """
    try:
        db_org_user = crud.create_organisation_user(db, relationship)
        
        return OrganisationUserResponse(
            organisation_id=str(db_org_user.organisation_id),
            user_id=str(db_org_user.user_id),
            created_at=db_org_user.created_at,
            updated_at=db_org_user.updated_at,
            created_by=db_org_user.created_by,
            updated_by=db_org_user.updated_by
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create organisation-user relationship: {str(e)}"
        )

@router.get("/organisation/{organisation_id}", response_model=List[OrganisationUserResponse])
async def get_users_by_organisation(organisation_id: str, db: Session = Depends(get_db)):
    """
    Get all users associated with a specific organisation.
    """
    try:
        org_users = crud.get_users_by_organisation(db, organisation_id)
        
        return [
            OrganisationUserResponse(
                organisation_id=str(ou.organisation_id),
                user_id=str(ou.user_id),
                created_at=ou.created_at,
                updated_at=ou.updated_at,
                created_by=ou.created_by,
                updated_by=ou.updated_by
            )
            for ou in org_users
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve users for organisation: {str(e)}"
        )

@router.get("/user/{user_id}", response_model=List[OrganisationUserResponse])
async def get_organisations_by_user(user_id: str, db: Session = Depends(get_db)):
    """
    Get all organisations associated with a specific user.
    """
    try:
        org_users = crud.get_organisations_by_user(db, user_id)
        
        return [
            OrganisationUserResponse(
                organisation_id=str(ou.organisation_id),
                user_id=str(ou.user_id),
                created_at=ou.created_at,
                updated_at=ou.updated_at,
                created_by=ou.created_by,
                updated_by=ou.updated_by
            )
            for ou in org_users
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve organisations for user: {str(e)}"
        )

@router.get("/{organisation_id}/{user_id}", response_model=OrganisationUserResponse)
async def get_organisation_user_relationship(
    organisation_id: str, 
    user_id: str, 
    db: Session = Depends(get_db)
):
    """
    Get a specific organisation-user relationship.
    """
    try:
        org_user = crud.get_organisation_user(db, organisation_id, user_id)
        
        if not org_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organisation-user relationship not found"
            )
        
        return OrganisationUserResponse(
            organisation_id=str(org_user.organisation_id),
            user_id=str(org_user.user_id),
            created_at=org_user.created_at,
            updated_at=org_user.updated_at,
            created_by=org_user.created_by,
            updated_by=org_user.updated_by
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update organisation-user relationship: {str(e)}"
        )

@router.patch("/{organisation_id}/{user_id}", response_model=OrganisationUserResponse)
async def update_organisation_user_relationship(
    organisation_id: str, 
    user_id: str, 
    update_data: OrganisationUserUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an organisation-user relationship.
    
    - **updated_by**: ID of the user who is updating this relationship
    
    Note: updated_at is auto-generated at the database level
    """
    try:
        org_user = crud.update_organisation_user(db, organisation_id, user_id, update_data)
        
        if not org_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organisation-user relationship not found"
            )
        
        return OrganisationUserResponse(
            organisation_id=str(org_user.organisation_id),
            user_id=org_user.user_id,
            created_at=org_user.created_at,
            updated_at=org_user.updated_at,
            created_by=org_user.created_by,
            updated_by=org_user.updated_by
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update organisation-user relationship: {str(e)}"
        )

@router.delete("/{organisation_id}/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organisation_user_relationship(
    organisation_id: str, 
    user_id: str, 
    db: Session = Depends(get_db)
):
    """
    Delete an organisation-user relationship.
    """
    try:
        deleted = crud.delete_organisation_user(db, organisation_id, user_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organisation-user relationship not found"
            )
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete organisation-user relationship: {str(e)}"
        )

@router.get("/", response_model=List[OrganisationUserResponse])
async def list_all_organisation_user_relationships(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    List all organisation-user relationships with pagination.
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 100)
    """
    try:
        org_users = crud.get_all_organisation_users(db, skip=skip, limit=limit)
        
        return [
            OrganisationUserResponse(
                organisation_id=str(ou.organisation_id),
                user_id=str(ou.user_id),
                created_at=ou.created_at,
                updated_at=ou.updated_at,
                created_by=ou.created_by,
                updated_by=ou.updated_by
            )
            for ou in org_users
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve organisation-user relationships: {str(e)}"
        )
