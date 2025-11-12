from fastapi import APIRouter, HTTPException
from typing import Dict, List
from app.schemas.models import AgentConfig, AgentUpdate, AgentDetail
from app.services.retell_client import get_retell_client

router = APIRouter()

AGENT_SYSTEM_PROMPT = """
Role: You are a helpful AI assistant.
Objective: Greet the user and ask how you can help them today.
"""

@router.get("/", response_model=List[AgentDetail])
async def get_agents():
    """
    Fetch all agents, filtering for latest versions and linked numbers.
    """
    try:
        client = get_retell_client()
        phone_numbers = client.phone_number.list()
        agent_to_phone_map = {num.inbound_agent_id: num.phone_number for num in phone_numbers if num.inbound_agent_id}
        
        agents = client.agent.list()
        latest_agents = {}
        for agent in agents:
            if agent.agent_name not in latest_agents or agent.last_modification_timestamp > latest_agents[agent.agent_name].last_modification_timestamp:
                latest_agents[agent.agent_name] = agent
        
        return [
            {
                "agent_name": agent.agent_name,
                "agent_id": agent.agent_id,
                "voice_id": agent.voice_id,
                "phone_number": agent_to_phone_map.get(agent.agent_id, "Not Assigned"),
                "last_modification_timestamp": str(agent.last_modification_timestamp),
            }
            for agent in latest_agents.values()
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agents: {str(e)}")

@router.post("/", status_code=201)
async def create_agent(config: AgentConfig):
    """
    Create a new AI agent with optional phone number linking.
    """
    try:
        client = get_retell_client()
        
        # Step 1: Create LLM
        # Retell LLM creation requires a start_speaker ('user' or 'agent').
        # Defaulting to 'user' so the conversation expects the user to start.
        llm = client.llm.create(general_prompt=AGENT_SYSTEM_PROMPT, model="gpt-4o", start_speaker="user")

        # Step 2: Create Agent
        agent = client.agent.create(
            agent_name=config.agent_name,
            response_engine={"type": "retell-llm", "llm_id": llm.llm_id},
            voice_id=config.voice_id,
            enable_backchannel=True
        )

        # Step 3: Link Phone Number if provided
        if config.phone_number:
            client.phone_number.update(
                phone_number=config.phone_number,
                inbound_agent_id=agent.agent_id
            )
            
        return {
            "message": "Agent created successfully",
            "data": {
                "llm_id": llm.llm_id,
                "agent_id": agent.agent_id,
                "linked_number": config.phone_number
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{agent_id}", response_model=AgentDetail)
async def get_agent(agent_id: str):
    """
    Get a specific agent by ID.
    """
    try:
        client = get_retell_client()
        
        # Get the agent
        agent = client.agent.retrieve(agent_id)
        
        # Get phone numbers to check if this agent has a linked number
        phone_numbers = client.phone_number.list()
        agent_to_phone_map = {num.inbound_agent_id: num.phone_number for num in phone_numbers if num.inbound_agent_id}
        
        return {
            "agent_name": agent.agent_name,
            "agent_id": agent.agent_id,
            "voice_id": agent.voice_id,
            "phone_number": agent_to_phone_map.get(agent.agent_id, "Not Assigned"),
            "last_modification_timestamp": str(agent.last_modification_timestamp),
        }
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent: {str(e)}")

@router.put("/{agent_id}")
async def update_agent(agent_id: str, update_data: AgentUpdate):
    """
    Update an existing agent.
    
    You can update:
    - **agent_name**: Change the agent's display name
    - **voice_id**: Change the voice used by the agent
    - **phone_number**: Link/update the phone number assigned to this agent
    
    All fields are optional. Only provided fields will be updated.
    """
    try:
        client = get_retell_client()
        
        # First, verify the agent exists
        try:
            existing_agent = client.agent.retrieve(agent_id)
        except Exception as e:
            if "not found" in str(e).lower():
                raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")
            raise
        
        # Prepare update data - only include fields that were provided
        update_dict = update_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields provided for update")
        
        # Handle phone number separately as it's not part of agent update
        phone_number = update_dict.pop('phone_number', None)
        
        # Update agent if there are agent-specific fields
        if update_dict:
            updated_agent = client.agent.update(
                agent_id=agent_id,
                **update_dict
            )
        else:
            updated_agent = existing_agent
        
        # Update phone number if provided
        if phone_number is not None:
            # First, unlink any existing phone number from this agent
            phone_numbers = client.phone_number.list()
            for num in phone_numbers:
                if num.inbound_agent_id == agent_id:
                    client.phone_number.update(
                        phone_number=num.phone_number,
                        inbound_agent_id=None
                    )
            
            # Link the new phone number if it's not empty
            if phone_number:
                client.phone_number.update(
                    phone_number=phone_number,
                    inbound_agent_id=agent_id
                )
        
        # Get updated phone number mapping
        phone_numbers = client.phone_number.list()
        agent_to_phone_map = {num.inbound_agent_id: num.phone_number for num in phone_numbers if num.inbound_agent_id}
        
        return {
            "message": "Agent updated successfully",
            "data": {
                "agent_id": updated_agent.agent_id,
                "agent_name": updated_agent.agent_name,
                "voice_id": updated_agent.voice_id,
                "phone_number": agent_to_phone_map.get(agent_id, "Not Assigned"),
                "last_modification_timestamp": str(updated_agent.last_modification_timestamp),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update agent: {str(e)}")

@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: str):
    """
    Delete an agent.
    
    This will:
    1. Unlink any phone numbers associated with the agent
    2. Delete the agent from Retell
    
    Note: This action cannot be undone.
    """
    try:
        client = get_retell_client()
        
        # First, verify the agent exists
        try:
            client.agent.retrieve(agent_id)
        except Exception as e:
            if "not found" in str(e).lower():
                raise HTTPException(status_code=404, detail=f"Agent not found: {agent_id}")
            raise
        
        # Unlink any phone numbers associated with this agent
        try:
            phone_numbers = client.phone_number.list()
            for num in phone_numbers:
                if num.inbound_agent_id == agent_id:
                    client.phone_number.update(
                        phone_number=num.phone_number,
                        inbound_agent_id=None
                    )
        except Exception as e:
            # Log the error but continue with deletion
            print(f"Warning: Failed to unlink phone numbers: {str(e)}")
        
        # Delete the agent
        client.agent.delete(agent_id)
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete agent: {str(e)}")
