# Configuration Summary

## Database Configuration ✅

All services are correctly configured to use the **`livekit`** database:

### Backend (FastAPI)
**File:** `/backend/app/core/config.py`
```python
DATABASE_URL: str = "postgresql://postgres:Admin%40011235@35.232.108.201:5432/livekit?sslmode=require"
```

**File:** `/backend/.env`
```bash
DATABASE_URL="postgresql://postgres:Admin%40011235@35.232.108.201:5432/livekit?sslmode=require"
```

### Frontend (Next.js)
**File:** `.env.local`
```bash
DATABASE_URL="postgresql://postgres:Admin%40011235@35.232.108.201:5432/livekit?sslmode=require"
```

**File:** `prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## API Configuration ✅

All UI services are correctly configured to point to **localhost backend APIs**:

### Environment Variables
**File:** `.env.local`
```bash
# Backend API (FastAPI service running on localhost)
BACKEND_URL="http://localhost:8080"
NEXT_PUBLIC_BACKEND_URL="http://localhost:8080"
```

### Backend Configuration Module
**File:** `src/lib/backend-config.ts`
```typescript
export const BACKEND_CONFIG = {
  // Base URL for the FastAPI backend service
  baseUrl: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080',
  
  // API version prefix
  apiVersion: '/api/v1',
  
  // Request timeout in milliseconds
  timeout: 30000,
}
```

### API Client
**File:** `src/lib/api-client.ts`
- Uses the backend configuration from environment variables
- All API calls automatically route to localhost:8080

---

## Service Endpoints

| Service | Port | URL | Database |
|---------|------|-----|----------|
| Frontend (Next.js) | 3000 | http://localhost:3000 | livekit |
| Backend (FastAPI) | 8080 | http://localhost:8080 | livekit |
| Database (PostgreSQL) | 5432 | 35.232.108.201:5432 | **livekit** |

---

## Test Credentials

| User | Email | Password | Role | MFA |
|------|-------|----------|------|-----|
| Admin | admin@acme.com | Admin@123 | Admin | Enabled |
| John Smith | john@acme.com | User@123 | Read | Disabled |
| Jane Doe | jane@acme.com | User@123 | Write | Disabled |
| Bob Wilson | bob@techstart.com | User@123 | Write | Disabled |

---

## How Frontend Connects to Backend

1. **Component makes API call** → Uses `backendApi` from `backend-config.ts`
2. **Backend config reads env** → `NEXT_PUBLIC_BACKEND_URL` = `http://localhost:8080`
3. **Request constructed** → `http://localhost:8080/api/v1/[endpoint]`
4. **FastAPI receives request** → Processes and queries PostgreSQL at 35.232.108.201:5432
5. **Response returned** → JSON data sent back to frontend

### Example Usage in Components:

```typescript
import { backendApi } from '@/lib/backend-config';

// GET request
const data = await backendApi.get('/organisations');

// POST request
const newAgent = await backendApi.post('/agents', {
  name: 'New Agent',
  description: 'Test agent'
});
```

---

## Configuration Checklist

- [x] Backend configured to use `livekit` database
- [x] Frontend Prisma configured to use `livekit` database
- [x] Backend URL set to `http://localhost:8080` in `.env.local`
- [x] `NEXT_PUBLIC_BACKEND_URL` set to `http://localhost:8080`
- [x] Backend config falls back to localhost:8080
- [x] All API endpoints route through backend config
- [x] Database credentials correctly URL-encoded
- [x] SSL mode enabled for database connection
- [x] Test data loaded with proper role values (Admin/Read/Write)
- [x] Password hashes generated with bcrypt
- [x] Header component updated to recognize Admin role

---

## Verification Commands

### Check Backend Connection
```bash
curl http://localhost:8080/health
```

### Check Database Connection
```bash
psql "postgresql://postgres:Admin@011235@35.232.108.201:5432/livekit?sslmode=require" -c "\dt"
```

### Check Frontend Environment
```bash
cat .env.local | grep BACKEND_URL
cat .env.local | grep DATABASE_URL
```

### Verify Backend is Using Correct Database
```bash
curl http://localhost:8080/api/v1/organisations
```

---

## Status: ✅ ALL CONFIGURED CORRECTLY

Both backend and frontend are:
- ✅ Connected to the **livekit** database
- ✅ Using **localhost APIs** for communication
- ✅ Properly configured for local development

No changes needed - everything is already correctly configured!
