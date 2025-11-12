from fastapi import APIRouter, HTTPException
from typing import Dict, List
from app.services.retell_client import get_retell_client

router = APIRouter()

@router.get("/")
async def get_phone_numbers():
    """
    Fetch all available phone numbers from the provider.
    """
    try:
        client = get_retell_client()
        numbers = client.phone_number.list()
        return [
            {
                "display_name": f"{n.nickname} ({n.phone_number})", 
                "phone_number": n.phone_number
            } 
            for n in numbers
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch phone numbers: {str(e)}")