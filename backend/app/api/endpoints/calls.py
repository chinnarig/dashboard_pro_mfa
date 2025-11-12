from fastapi import APIRouter, HTTPException
from typing import Dict, List
from app.services.retell_client import get_retell_client

router = APIRouter()

@router.get("/")
async def get_calls():
    """
    Fetch complete call history.
    """
    try:
        client = get_retell_client()
        calls = client.call.list()

        # Order calls by start_timestamp descending (most recent first)
        try:
            calls = sorted(calls, key=lambda c: getattr(c, 'start_timestamp') or '', reverse=True)
        except TypeError:
            # Fallback: compare as strings if mixed types are present
            calls = sorted(calls, key=lambda c: str(getattr(c, 'start_timestamp') or ''), reverse=True)

        return [
            {
                "call_id": call.call_id,
                "agent_name": getattr(call, 'agent_name', 'N/A'),
                "start_timestamp": call.start_timestamp,
                "end_timestamp": getattr(call, 'end_timestamp', None),
                "duration_ms": getattr(call, 'duration_ms', 0),
                "call_status": getattr(call, 'call_status', 'N/A'),
                "from_number": getattr(call, 'from_number', 'N/A'),
                "to_number": getattr(call, 'to_number', 'N/A'),
                "disconnection_reason": getattr(call, 'disconnection_reason', 'N/A'),
            }
            for call in calls
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch call history: {str(e)}")

@router.get("/{call_id}")
async def get_call_details(call_id: str):
    """
    Fetch detailed information for a specific call.
    """
    try:
        client = get_retell_client()
        call = client.call.retrieve(call_id)
        
        # Format transcript if available
        formatted_transcript = ""
        if hasattr(call, 'transcript_object') and call.transcript_object:
            for entry in call.transcript_object:
                role = "User" if entry.role == "user" else "Agent"
                formatted_transcript += f"**{role}:** {entry.content}\n\n"

        # Calculate costs in pounds
        USD_TO_GBP_RATE = 0.82
        call_cost = getattr(call, 'call_cost', {})
        
        product_costs_in_pounds = []
        if hasattr(call_cost, 'product_costs'):
            for cost in call_cost.product_costs:
                cost_in_dollars = cost.cost / 100
                product_costs_in_pounds.append({
                    "product": cost.product,
                    "cost": cost_in_dollars * USD_TO_GBP_RATE
                })

        combined_cost_in_dollars = getattr(call_cost, 'combined_cost', 0) / 100
        combined_cost_in_pounds = combined_cost_in_dollars * USD_TO_GBP_RATE

        return {
            "call_id": call.call_id,
            "start_timestamp": call.start_timestamp,
            "end_timestamp": getattr(call, 'end_timestamp', None),
            "duration_ms": getattr(call, 'duration_ms', 0),
            "formatted_transcript": formatted_transcript,
            "recording_url": getattr(call, 'recording_url', None),
            "call_summary": getattr(call, 'call_analysis', {}).get('call_summary', "Not available."),
            "user_sentiment": getattr(call, 'call_analysis', {}).get('user_sentiment', "Not available."),
            "cost_details": {
                "combined_cost": combined_cost_in_pounds,
                "product_costs": product_costs_in_pounds
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch call details: {str(e)}")