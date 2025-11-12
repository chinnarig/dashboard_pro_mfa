import os
import uvicorn
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from retell import Retell
from dotenv import load_dotenv
from collections import defaultdict
from pathlib import Path
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)

# --- ROBUST PATH LOADING ---
current_dir = Path(__file__).parent
dotenv_path = current_dir.parent / ".env"
logger.info(f"Loading configuration from: {current_dir}")
logger.info(f"Environment file path: {dotenv_path}")
load_dotenv(dotenv_path=dotenv_path)

if os.getenv("RETELL_API_KEY"):
    logger.info("RETELL_API_KEY found in environment")
else:
    logger.warning("RETELL_API_KEY not found in environment!")

# Get settings
from app.core.config import settings

# Import API routes
from app.api.routes import router as api_router

# Initialize FastAPI
app = FastAPI(
    title=f"Zlavox API Stream ({settings.ENVIRONMENT.upper()})",
    description="API for managing Retell.ai voice agents and calls",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

logger.info("CORS middleware configured to allow all origins")

# Include API routers
app.include_router(api_router, prefix="/api/v1")
logger.info("API routers included successfully")

# Add logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"Incoming {request.method} request to {request.url}")
    
    response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000
    logger.info(f"Request completed in {process_time:.2f}ms with status {response.status_code}")
    
    return response

# Initialize Retell client
logger.info("Initializing Retell client...")
client = Retell(api_key=os.getenv("RETELL_API_KEY"))
logger.info("Retell client initialized successfully")

# --- Define the data model for incoming requests ---
class AgentConfig(BaseModel):
    """
    Configuration model for creating a new agent.
    
    Attributes:
        agent_name: Name of the agent to create
        voice_id: ID of the voice to use for the agent
        phone_number: Phone number to associate with the agent (format: +1234567890)
        system_prompt: Custom prompt that defines the agent's behavior and personality
        start_speaker: Who starts the conversation ("agent" or "user")
    """
    agent_name: str = "Zlavox AI Agent"
    voice_id: str = "11labs-Cimo"
    phone_number: str = Field(
        default=None,
        description="Phone number in E.164 format (e.g., +1234567890)",
        example="+12065550123"
    )
    system_prompt: str = Field(
        default=None,
        description="Custom prompt that defines the agent's behavior",
        example="You are a helpful AI assistant who specializes in customer service."
    )
    start_speaker: str = Field(
        default="agent",
        description="Who starts the conversation",
        example="agent"
    )

AGENT_SYSTEM_PROMPT = """
Role: You are a helpful AI assistant.
Objective: Greet the user and ask how you can help them today.
"""

# --- GET VOICES ENDPOINT ---
@app.get("/api/v1/voices", tags=["Voices"])
async def get_voices():
    """Fetches all available voices, segregated by provider."""
    logger.info("Fetching available voices...")
    try:
        voices = client.voice.list()
        logger.info(f"Retrieved {len(voices)} voices from Retell API")
        
        segregated_voices = defaultdict(list)
        for v in voices:
            provider = v.provider
            voice_info = {
                "voice_name": v.voice_name,
                "voice_id": v.voice_id,
                "gender": getattr(v, 'gender', None),
                "accent": getattr(v, 'accent', None),
                "age": getattr(v, 'age', None),
                "preview_audio_url": getattr(v, 'preview_audio_url', None)
            }
            segregated_voices[provider].append(voice_info)
        
        logger.info(f"Voices segregated by {len(segregated_voices)} providers")
        for provider, voices_list in segregated_voices.items():
            logger.debug(f"Provider {provider}: {len(voices_list)} voices")
            
        return segregated_voices
    except Exception as e:
        logger.error(f"Error fetching voices: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch voices: {str(e)}")

# --- GET PHONE NUMBERS ENDPOINT ---
@app.get("/api/v1/phone-numbers")
async def get_phone_numbers():
    """Fetches all available phone numbers from the provider."""
    try:
        numbers = client.phone_number.list()
        return [{"display_name": f"{n.nickname} ({n.phone_number})", "phone_number": n.phone_number} for n in numbers]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch phone numbers: {str(e)}")

# --- GET AGENTS ENDPOINT ---
@app.get("/api/v1/agents")
async def get_agents():
    """Fetches all agents, filters for the latest version of each."""
    try:
        phone_numbers = client.phone_number.list()
        agent_to_phone_map = {num.inbound_agent_id: num.phone_number for num in phone_numbers if num.inbound_agent_id}
        
        agents = client.agent.list()
        
        latest_agents = {}
        for agent in agents:
            if agent.agent_name not in latest_agents or agent.last_modification_timestamp > latest_agents[agent.agent_name].last_modification_timestamp:
                latest_agents[agent.agent_name] = agent
        
        agent_details = []
        for agent in latest_agents.values():
            agent_details.append({
                "agent_name": agent.agent_name,
                "agent_id": agent.agent_id,
                "voice_id": agent.voice_id,
                "phone_number": agent_to_phone_map.get(agent.agent_id, "Not Assigned"),
                "last_modification_timestamp": agent.last_modification_timestamp,
            })
        return agent_details
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agents: {str(e)}")

# --- GET CALLS ENDPOINT ---
@app.get("/api/v1/calls")
async def get_calls():
    """Fetches the call history."""
    try:
        calls = client.call.list()
        call_details = []
        for call in calls:
            call_details.append({
                "call_id": call.call_id,
                "agent_name": getattr(call, 'agent_name', 'N/A'),
                "start_timestamp": call.start_timestamp,
                "end_timestamp": getattr(call, 'end_timestamp', None),
                "duration_ms": getattr(call, 'duration_ms', 0),
                "call_status": getattr(call, 'call_status', 'N/A'),
                "from_number": getattr(call, 'from_number', 'N/A'),
                "to_number": getattr(call, 'to_number', 'N/A'),
                "disconnection_reason": getattr(call, 'disconnection_reason', 'N/A'),
            })
        return call_details
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch call history: {str(e)}")

# --- GET CALL DETAILS ENDPOINT ---
@app.get("/api/v1/call/{call_id}")
async def get_call_details(call_id: str):
    """Fetches the full, detailed object for a single call."""
    try:
        call = client.call.retrieve(call_id)
        formatted_transcript = ""
        if hasattr(call, 'transcript_object') and call.transcript_object:
            for entry in call.transcript_object:
                role = "User" if entry.role == "user" else "Agent"
                formatted_transcript += f"**{role}:** {entry.content}\n\n"

        call_analysis = getattr(call, 'call_analysis', {})
        call_cost = getattr(call, 'call_cost', {})

        USD_TO_GBP_RATE = 0.82

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
            "call_summary": getattr(call_analysis, 'call_summary', "Not available."),
            "user_sentiment": getattr(call_analysis, 'user_sentiment', "Not available."),
            "cost_details": {
                "combined_cost": combined_cost_in_pounds,
                "product_costs": product_costs_in_pounds
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch call details: {str(e)}")

# --- CORE LOGIC: Create and Link Agent ---
def create_and_link_agent(agent_name: str, voice_id: str, phone_number: str, system_prompt: Optional[str] = None, start_speaker: str = "agent"):
    """Creates the LLM, the agent, and links the phone number.
    
    Args:
        agent_name: Name of the agent to create
        voice_id: ID of the voice to use
        phone_number: Phone number to link
        system_prompt: Custom system prompt (optional)
        start_speaker: Who starts the conversation ("agent" or "user")
    """
    try:
        # Step 1: Create LLM
        prompt_to_use = system_prompt or AGENT_SYSTEM_PROMPT
        print("Creating LLM...")
        llm = client.llm.create(
            general_prompt=prompt_to_use,
            model="gpt-4o",
            start_speaker="agent"  # Specify who starts the conversation
        )

        # Step 2: Create Agent
        print(f"Creating Agent with name '{agent_name}'...")
        agent = client.agent.create(
            agent_name=agent_name,
            response_engine={"type": "retell-llm", "llm_id": llm.llm_id},
            voice_id=voice_id,
            enable_backchannel=True
        )
        print(f"Agent created with ID: {agent.agent_id}")

        # Step 3: Link Phone Number
        if phone_number:
            print(f"Linking agent {agent.agent_id} to {phone_number}...")
            client.phone_number.update(
                phone_number=phone_number,
                inbound_agent_id=agent.agent_id
            )
            print(f"✅ Phone number updated successfully!")
        
        return {"llm_id": llm.llm_id, "agent_id": agent.agent_id, "linked_number": phone_number or "Not linked"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- CREATE AGENT ENDPOINT ---
@app.post("/api/v1/create-agent", 
    summary="Create a new agent",
    description="Creates a new Retell.ai agent with specified voice and phone number",
    response_description="Returns the created agent's details including LLM ID and agent ID"
)
async def handle_create_agent(config: AgentConfig = AgentConfig()):
    """
    Create a new Retell.ai agent with custom configuration.
    
    The agent can be configured with:
    - Custom name
    - Specific voice
    - Phone number for inbound calls
    - Custom system prompt for personality
    - Who initiates the conversation
    
    Returns:
        dict: Contains the created agent's details including LLM ID and agent ID
    """
    logger.info(f"Creating new agent with name: {config.agent_name}")
    logger.info(f"Configuration: voice_id={config.voice_id}, phone_number={config.phone_number}")
    
    try:
        result = create_and_link_agent(
            agent_name=config.agent_name,
            voice_id=config.voice_id,
            phone_number=config.phone_number,
            system_prompt=config.system_prompt,
            start_speaker=config.start_speaker
        )
        logger.info(f"Agent created successfully: {result}")
        return {"message": "Agent created successfully", "data": result}
    except Exception as e:
        logger.error(f"Failed to create agent: {str(e)}", exc_info=True)
        raise

# --- HEALTH CHECK ENDPOINT (required for Cloud Run) ---
@app.get("/", include_in_schema=False)  # Root health check
async def root_health_check():
    """Root health check endpoint for Cloud Run."""
    return {"status": "healthy"}

@app.get("/health")  # Regular health check
async def health_check():
    """Health check endpoint for Cloud Run."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "environment": os.getenv("ENVIRONMENT", "dev")
    }

@app.on_event("startup")
async def startup_event():
    """Log important information on application startup."""
    logger.info("="*50)
    logger.info("Starting Zlavox API Stream")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"Working Directory: {os.getcwd()}")
    logger.info(f"Python Path: {os.getenv('PYTHONPATH', 'Not set')}")
    logger.info(f"Port: {os.getenv('PORT', '8080')}")
    logger.info("="*50)
    
    # Ensure we're ready for health checks
    logger.info("Preparing for health checks...")
    try:
        # Initialize any required services
        if not os.getenv("RETELL_API_KEY"):
            logger.warning("RETELL_API_KEY not set - some features may be limited")
        logger.info("Application ready for health checks")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown event."""
    logger.info("Shutting down Zlavox API Stream")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    logger.info(f"Starting server on port {port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)