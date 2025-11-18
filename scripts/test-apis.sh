#!/bin/bash

# =============================================
# API Testing Script for Dashboard Pro MFA
# =============================================

BASE_URL="http://localhost:8080"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Testing Dashboard Pro MFA Backend APIs"
echo "=========================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${YELLOW}Testing:${NC} $description"
    echo "  Endpoint: $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" -w "\n%{http_code}")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✓ Success${NC} (HTTP $http_code)"
        echo "$body" | jq '.' 2>/dev/null | head -n 20
    else
        echo -e "  ${RED}✗ Failed${NC} (HTTP $http_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
    echo ""
}

# =============================================
# 1. HEALTH CHECK
# =============================================
echo "================================"
echo "1. HEALTH CHECK"
echo "================================"
test_endpoint "GET" "/health" "Health check endpoint"

# =============================================
# 2. ORGANISATIONS
# =============================================
echo "================================"
echo "2. ORGANISATIONS"
echo "================================"
test_endpoint "GET" "/api/organisations" "List all organizations"
test_endpoint "GET" "/api/organisations/11111111-1111-1111-1111-111111111111" "Get Acme Corporation by ID"
test_endpoint "GET" "/api/organisations/project/acme-corp-001" "Get organization by project ID"

# =============================================
# 3. USERS
# =============================================
echo "================================"
echo "3. USERS"
echo "================================"
test_endpoint "GET" "/api/users" "List all users"
test_endpoint "GET" "/api/users/33333333-3333-3333-3333-333333333333" "Get admin user by ID"
test_endpoint "GET" "/api/users/email/admin@acme.com" "Get user by email"

# =============================================
# 4. ORGANISATION USERS
# =============================================
echo "================================"
echo "4. ORGANISATION USERS"
# =============================================
test_endpoint "GET" "/api/organisation-users/organisation/11111111-1111-1111-1111-111111111111" "Get users for Acme Corp"
test_endpoint "GET" "/api/organisation-users/organisation/22222222-2222-2222-2222-222222222222" "Get users for TechStart"

# =============================================
# 5. AGENTS
# =============================================
echo "================================"
echo "5. AGENTS"
echo "================================"
test_endpoint "GET" "/api/agents" "List all agents"
test_endpoint "GET" "/api/agents/88888888-8888-8888-8888-888888888888" "Get Customer Support Agent by ID"
test_endpoint "GET" "/api/agents/livekit/acme-support-agent-001" "Get agent by LiveKit name"

# =============================================
# 6. PHONE NUMBERS
# =============================================
echo "================================"
echo "6. PHONE NUMBERS"
echo "================================"
test_endpoint "GET" "/api/phone-numbers" "List all phone numbers"
test_endpoint "GET" "/api/phone-numbers/available" "List available phone numbers"
test_endpoint "GET" "/api/phone-numbers/cccccccc-cccc-cccc-cccc-cccccccccccc" "Get specific phone number"

# =============================================
# 7. CALLS
# =============================================
echo "================================"
echo "7. CALLS"
echo "================================"
test_endpoint "GET" "/api/calls" "List all call logs"
test_endpoint "GET" "/api/calls/16161616-1616-1616-1616-161616161616" "Get specific call log"
test_endpoint "GET" "/api/calls/agent/88888888-8888-8888-8888-888888888888" "Get calls for Customer Support Agent"

# =============================================
# 8. VOICES
# =============================================
echo "================================"
echo "8. VOICES"
echo "================================"
test_endpoint "GET" "/api/voices" "List available voices"
test_endpoint "GET" "/api/voices/elevenlabs" "Get ElevenLabs voices"

# =============================================
# 9. CREATE OPERATIONS (Testing Write)
# =============================================
echo "================================"
echo "9. CREATE OPERATIONS (Testing)"
echo "================================"

# Create a test agent
agent_data='{
  "name": "Test API Agent",
  "description": "Created via API test",
  "phone_number": "+1-415-555-9999",
  "livekit_agent_name": "test-api-agent-'$(date +%s)'",
  "voice_provider": "openai",
  "voice_id": "alloy",
  "language": "en-US",
  "llm_provider": "openai",
  "llm_model": "gpt-3.5-turbo",
  "system_prompt": "Test agent prompt",
  "temperature": 0.7,
  "max_tokens": 500,
  "status": "testing",
  "is_phone_active": false
}'
test_endpoint "POST" "/api/agents" "Create a new test agent" "$agent_data"

# =============================================
# SUMMARY
# =============================================
echo "=========================================="
echo "API Testing Complete!"
echo "=========================================="
echo ""
echo "Backend is running at: $BASE_URL"
echo "API Documentation: $BASE_URL/docs"
echo "Alternative docs: $BASE_URL/redoc"
echo ""
echo "Test Users Created:"
echo "  - admin@acme.com (Password: Admin@123) - Admin with MFA"
echo "  - writer@acme.com (Password: Writer@123) - Write role"
echo "  - reader@acme.com (Password: Reader@123) - Read role"
echo "  - admin@techstart.io (Password: TechAdmin@123) - Admin"
echo ""
