from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.db.models import CallLog
from pydantic import BaseModel

router = APIRouter()

# --- Request/Response Models ---
class CreateCallLogRequest(BaseModel):
    livekit_room_id: str
    session_id: str
    agent_id: Optional[str] = None
    direction: str  # 'inbound' or 'outbound'
    caller_phone: str
    agent_phone: Optional[str] = None
    status: str = "initiated"  # 'initiated', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy'

class UpdateCallLogRequest(BaseModel):
    status: Optional[str] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    disconnect_reason: Optional[str] = None
    transcript: Optional[dict] = None
    analysis: Optional[dict] = None
    recording_url: Optional[str] = None
    disposition_code: Optional[str] = None
    disposition_notes: Optional[str] = None

@router.get("/")
async def get_calls(db: Session = Depends(get_db)):
    """
    Fetch complete call history from the database.
    """
    try:
        # Fetch calls from database, ordered by start_time descending (most recent first)
        calls = db.query(CallLog).order_by(CallLog.start_time.desc()).all()

        return [
            {
                "call_id": call.livekit_room_id,
                "agent_name": call.agent.name if call.agent else "N/A",
                "start_timestamp": call.start_time.isoformat() if call.start_time else None,
                "end_timestamp": call.end_time.isoformat() if call.end_time else None,
                "duration_ms": (call.duration_seconds * 1000) if call.duration_seconds else 0,
                "call_status": call.status or "N/A",
                "from_number": call.caller_phone or "N/A",
                "to_number": call.agent_phone or "N/A",
                "disconnection_reason": call.disconnect_reason or "N/A",
                "direction": call.direction,
            }
            for call in calls
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch call history: {str(e)}")

@router.get("/{call_id}")
async def get_call_details(call_id: str, db: Session = Depends(get_db)):
    """
    Fetch detailed information for a specific call from the database.
    """
    try:
        # Fetch call from database by livekit_room_id
        call = db.query(CallLog).filter(CallLog.livekit_room_id == call_id).first()
        
        if not call:
            raise HTTPException(status_code=404, detail=f"Call not found: {call_id}")
        
        # Format transcript if available (stored as JSON)
        formatted_transcript = ""
        if call.transcript:
            # Assuming transcript is stored as a list of objects with 'role' and 'content'
            if isinstance(call.transcript, list):
                for entry in call.transcript:
                    role = "User" if entry.get("role") == "user" else "Agent"
                    content = entry.get("content", "")
                    formatted_transcript += f"**{role}:** {content}\n\n"
            elif isinstance(call.transcript, dict):
                # Handle if transcript is stored differently
                formatted_transcript = str(call.transcript)
        
        # Extract analysis data if available
        analysis = call.analysis or {}
        call_summary = analysis.get("call_summary", "Not available.") if isinstance(analysis, dict) else "Not available."
        user_sentiment = analysis.get("user_sentiment", "Not available.") if isinstance(analysis, dict) else "Not available."

        return {
            "call_id": call.livekit_room_id,
            "agent_name": call.agent.name if call.agent else "N/A",
            "start_timestamp": call.start_time.isoformat() if call.start_time else None,
            "end_timestamp": call.end_time.isoformat() if call.end_time else None,
            "duration_ms": (call.duration_seconds * 1000) if call.duration_seconds else 0,
            "formatted_transcript": formatted_transcript,
            "recording_url": None,  # Add if you have recording URLs stored
            "call_summary": call_summary,
            "user_sentiment": user_sentiment,
            "call_status": call.status,
            "from_number": call.caller_phone,
            "to_number": call.agent_phone,
            "direction": call.direction,
            "disconnect_reason": call.disconnect_reason,
            "disposition_code": call.disposition_code,
            "disposition_notes": call.disposition_notes,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch call details: {str(e)}")

@router.post("/")
async def create_call_log(request: CreateCallLogRequest, db: Session = Depends(get_db)):
    """
    Create a new call log entry when a call starts.
    Status will be 'active' initially, transcript and analysis will be added when call ends.
    """
    try:
        # Create new call log entry
        new_call = CallLog(
            livekit_room_id=request.livekit_room_id,
            session_id=request.session_id,
            agent_id=request.agent_id,
            direction=request.direction,
            caller_phone=request.caller_phone,
            agent_phone=request.agent_phone,
            start_time=datetime.utcnow(),
            status=request.status,
        )
        
        db.add(new_call)
        db.commit()
        db.refresh(new_call)
        
        return {
            "success": True,
            "message": "Call log created successfully",
            "call_log_id": str(new_call.id),
            "livekit_room_id": new_call.livekit_room_id,
            "session_id": new_call.session_id,
            "status": new_call.status,
            "start_time": new_call.start_time.isoformat() if new_call.start_time else None,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create call log: {str(e)}")

@router.put("/{session_id}")
async def update_call_log(session_id: str, request: UpdateCallLogRequest, db: Session = Depends(get_db)):
    """
    Update an existing call log entry by session_id.
    Used to update status, add transcript, analysis, and other data when call ends.
    """
    try:
        # Find the call log by session_id
        call_log = db.query(CallLog).filter(CallLog.session_id == session_id).first()
        
        if not call_log:
            raise HTTPException(status_code=404, detail=f"Call log not found for session_id: {session_id}")
        
        # Update fields if provided
        if request.status is not None:
            call_log.status = request.status
        
        if request.end_time is not None:
            call_log.end_time = request.end_time
        
        if request.duration_seconds is not None:
            call_log.duration_seconds = request.duration_seconds
        
        if request.disconnect_reason is not None:
            call_log.disconnect_reason = request.disconnect_reason
        
        if request.transcript is not None:
            call_log.transcript = request.transcript
        
        if request.analysis is not None:
            call_log.analysis = request.analysis
        
        if request.recording_url is not None:
            call_log.recording_url = request.recording_url
        
        if request.disposition_code is not None:
            call_log.disposition_code = request.disposition_code
        
        if request.disposition_notes is not None:
            call_log.disposition_notes = request.disposition_notes
        
        # Update the updated_at timestamp
        call_log.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(call_log)
        
        return {
            "success": True,
            "message": "Call log updated successfully",
            "call_log_id": str(call_log.id),
            "session_id": call_log.session_id,
            "livekit_room_id": call_log.livekit_room_id,
            "status": call_log.status,
            "start_time": call_log.start_time.isoformat() if call_log.start_time else None,
            "end_time": call_log.end_time.isoformat() if call_log.end_time else None,
            "duration_seconds": call_log.duration_seconds,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update call log: {str(e)}")