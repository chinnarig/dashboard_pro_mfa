from fastapi import APIRouter, HTTPException
from typing import Dict, List
from collections import defaultdict
from app.core.config import settings
from app.schemas.models import VoiceInfo
from app.services.retell_client import get_retell_client

router = APIRouter()

@router.get("/", response_model=Dict[str, List[VoiceInfo]])
async def get_voices():
    """
    Fetch all available voices, segregated by provider.
    
    Returns a dictionary where:
    - Keys are voice providers (e.g., "11labs", "azure")
    - Values are lists of voice profiles with details
    """
    try:
        client = get_retell_client()
        voices = client.voice.list()
        segregated_voices = defaultdict(list)
        
        for v in voices:
            provider = v.provider
            voice_info = VoiceInfo(
                voice_name=v.voice_name,
                voice_id=v.voice_id,
                gender=getattr(v, 'gender', None),
                accent=getattr(v, 'accent', None),
                age=getattr(v, 'age', None),
                preview_audio_url=getattr(v, 'preview_audio_url', None)
            )
            segregated_voices[provider].append(voice_info)
            
        return segregated_voices
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch voices: {str(e)}")