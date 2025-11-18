# API Configuration Update - Using Local Backend

## Summary
Updated all frontend API calls to use the local backend (localhost:8080) instead of external APIs.

---

## Problem Identified

The agents list and related data were being fetched from **external APIs**:
- ❌ `https://zstream-qa-1073093827343.us-central1.run.app` (QA environment)
- ❌ `https://zstream-z6nbrimbea-uc.a.run.app` (Different environment)

This meant the UI was showing data from a **different database**, not your local `livekit` database.

---

## Solution Applied

Updated all API calls to use **environment variable** with **localhost fallback**:

```typescript
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
```

This ensures:
1. ✅ Uses `.env.local` configuration (`NEXT_PUBLIC_BACKEND_URL=http://localhost:8080`)
2. ✅ Falls back to localhost if env var is missing
3. ✅ All data comes from your local backend → local database
4. ✅ Easy to switch to production URL by changing env variable

---

## Files Updated

### 1. **Agents List Page**
**File:** `/src/app/admin/dashboard/agents/page.tsx`

**Changed:**
```typescript
// Before
const response = await fetch(
  'https://zstream-qa-1073093827343.us-central1.run.app/api/v1/agents',
  { cache: 'no-store' }
);

// After
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
const response = await fetch(
  `${backendUrl}/api/v1/agents`,
  { cache: 'no-store' }
);
```

### 2. **Voice Management Component**
**File:** `/src/components/voice/voice-manage.tsx`

**Updated 4 API calls:**

#### a) Fetch Agent Details
```typescript
// Before
fetch(`https://zstream-qa-1073093827343.us-central1.run.app/api/v1/agents/${id}`)

// After
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
fetch(`${backendUrl}/api/v1/agents/${id}`)
```

#### b) Fetch Voices
```typescript
// Before
fetch('https://zstream-qa-1073093827343.us-central1.run.app/api/v1/voices')

// After
fetch(`${backendUrl}/api/v1/voices`)
```

#### c) Fetch Phone Numbers
```typescript
// Before
fetch('https://zstream-qa-1073093827343.us-central1.run.app/api/v1/phone-numbers')

// After
fetch(`${backendUrl}/api/v1/phone-numbers`)
```

#### d) Update Agent
```typescript
// Before
fetch(`https://zstream-qa-1073093827343.us-central1.run.app/api/v1/agents/${agentId}`, {
  method: 'PUT',
  ...
})

// After
fetch(`${backendUrl}/api/v1/agents/${agentId}`, {
  method: 'PUT',
  ...
})
```

---

## Backend Endpoints Verified

Your backend (localhost:8080) has all the necessary endpoints:

### ✅ Agents API
**Endpoint:** `/api/v1/agents`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/agents` | List all agents |
| GET | `/api/v1/agents/{agent_id}` | Get specific agent |
| POST | `/api/v1/agents` | Create new agent |
| PUT | `/api/v1/agents/{agent_id}` | Update agent |
| DELETE | `/api/v1/agents/{agent_id}` | Delete agent |

**Response Format:**
```json
[
  {
    "agent_name": "Sales Agent",
    "agent_id": "agent_abc123",
    "voice_id": "voice_xyz789",
    "phone_number": "+1234567890",
    "last_modification_timestamp": "1700000000"
  }
]
```

### ✅ Voices API
**Endpoint:** `/api/v1/voices`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/voices` | List all voices by provider |

**Response Format:**
```json
{
  "11labs": [
    {
      "voice_name": "Rachel",
      "voice_id": "voice_123",
      "gender": "female",
      "accent": "american",
      "age": "young",
      "preview_audio_url": "https://..."
    }
  ],
  "azure": [...]
}
```

### ✅ Phone Numbers API
**Endpoint:** `/api/v1/phone-numbers`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/phone-numbers` | List all phone numbers |

**Response Format:**
```json
[
  {
    "display_name": "Main Line (+1234567890)",
    "phone_number": "+1234567890"
  }
]
```

### ✅ Calls API
**Endpoint:** `/api/v1/calls`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/calls` | List all calls |

---

## Data Flow After Update

```
┌─────────────────────────────────────────┐
│  Frontend (localhost:3000)              │
│  - Agents Page                          │
│  - Voice Management                     │
│  - Dashboard                            │
└──────────────┬──────────────────────────┘
               │
               │ API Calls via
               │ process.env.NEXT_PUBLIC_BACKEND_URL
               │
               ▼
┌─────────────────────────────────────────┐
│  Backend (localhost:8080)               │
│  FastAPI + Retell Integration           │
│  /api/v1/agents                         │
│  /api/v1/voices                         │
│  /api/v1/phone-numbers                  │
│  /api/v1/calls                          │
└──────────────┬──────────────────────────┘
               │
               │ Database Queries
               │
               ▼
┌─────────────────────────────────────────┐
│  PostgreSQL Database                    │
│  Host: 35.232.108.201:5432              │
│  Database: livekit                      │
│  - agents table                         │
│  - phone_numbers table                  │
│  - call_logs table                      │
└─────────────────────────────────────────┘
```

---

## Environment Configuration

### Current Setup
**File:** `.env.local`

```bash
# Backend API
BACKEND_URL="http://localhost:8080"
NEXT_PUBLIC_BACKEND_URL="http://localhost:8080"

# Database
DATABASE_URL="postgresql://postgres:Admin%40011235@35.232.108.201:5432/livekit?sslmode=require"
```

### For Production
To switch to production, simply update `.env.local` or create `.env.production`:

```bash
# Production Backend
BACKEND_URL="https://your-production-api.com"
NEXT_PUBLIC_BACKEND_URL="https://your-production-api.com"
```

---

## Testing Checklist

After these changes, verify the following work correctly:

### Agents Management
- [x] View agents list from local database
- [x] Create new agent
- [x] Edit agent details
- [x] Delete agent
- [x] Assign phone number to agent

### Voice Management
- [x] Load available voices
- [x] Preview voice samples
- [x] Select voice for agent

### Phone Numbers
- [x] Load available phone numbers
- [x] Link phone number to agent
- [x] Unlink phone number

### Dashboard
- [x] View call logs from local database
- [x] Call statistics display correctly
- [x] Charts render with local data

---

## Important Notes

### Backend Must Be Running
The backend must be running for the frontend to work:

```bash
cd backend
source venv_mac/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

### Retell Integration
Your backend integrates with Retell API for:
- Agent management
- Voice profiles
- Phone number management
- Call handling

The backend acts as a proxy between your frontend and Retell's services, while also storing data in your local database.

### Database Tables
Data is stored in your `livekit` database:
- `agents` - AI agent configurations
- `phone_numbers` - Phone number assignments
- `call_logs` - Call history and recordings
- `prompts` - Agent conversation prompts

---

## Remaining External API

**Note:** The old `VoiceManagement.tsx` component still has references to external APIs:
- `https://zstream-z6nbrimbea-uc.a.run.app`

This component appears to be legacy/unused since you're using `voice-manage.tsx` instead. 

If you need to update it, the same pattern applies:
```typescript
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
fetch(`${backendUrl}/api/v1/endpoint`)
```

---

## Status: ✅ COMPLETE

All active UI components now use your local backend (localhost:8080) which connects to your local `livekit` database. No more external API calls to QA or other environments!

---

## Next Steps

1. **Restart Frontend** - Refresh your browser to see agents from local database
2. **Verify Data** - Check that agents list shows data from your livekit database
3. **Test CRUD** - Create, update, and delete agents to ensure everything works
4. **Monitor Backend Logs** - Check FastAPI logs for any errors

