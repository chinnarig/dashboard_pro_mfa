from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.schemas.models import UserCreate, UserUpdate, UserResponse
from app.core.database import get_db
from app.db import crud
from typing import List

router = APIRouter()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user.
    
    - **name**: User's full name
    - **email**: User's email address (must be unique)
    - **password**: User's password
    - **confirm_password**: Must match password
    - **role**: User role - ADMIN or USER (default: USER)
    
    Note: ID is auto-generated at the database level
    """
    try:
        # Check if email already exists
        existing_user = crud.get_user_by_email(db, user.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        # Create user in database
        db_user = crud.create_user(db, user)
        
        # Convert to response model
        return UserResponse(
            id=str(db_user.id),
            name=db_user.name,
            email=db_user.email,
            role=db_user.role,
            created_at=db_user.created_at,
            updated_at=db_user.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.get("/", response_model=List[UserResponse])
async def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    List all users with pagination.
    
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Maximum number of records to return (default: 100)
    """
    try:
        users = crud.get_users(db, skip=skip, limit=limit)
        return [
            UserResponse(
                id=str(user.id),
                name=user.name,
                email=user.email,
                role=user.role,
                created_at=user.created_at,
                updated_at=user.updated_at
            )
            for user in users
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve users: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """
    Get a specific user by ID.
    """
    try:
        user = crud.get_user(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user: {str(e)}"
        )

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str, 
    update_data: UserUpdate, 
    db: Session = Depends(get_db)
):
    """
    Update a user's information.
    
    All fields are optional. Only provided fields will be updated.
    
    - **name**: User's full name (optional)
    - **email**: User's email address (optional)
    - **password**: User's password (optional)
    - **role**: User role - ADMIN or USER (optional)
    """
    try:
        # Check if user exists
        existing_user = crud.get_user(db, user_id)
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Convert update_data to dict, excluding unset fields
        update_dict = update_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided for update"
            )
        
        # Update user in database
        updated_user = crud.update_user(db, user_id, update_dict)
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            id=str(updated_user.id),
            name=updated_user.name,
            email=updated_user.email,
            role=updated_user.role,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, db: Session = Depends(get_db)):
    """
    Delete a user.
    
    This will also delete all associated organisation-user relationships due to CASCADE delete.
    """
    try:
        deleted = crud.delete_user(db, user_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )
