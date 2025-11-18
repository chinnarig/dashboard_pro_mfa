# MFA Backend Separation Checklist ✅

## Frontend (This Project) - COMPLETE ✅

### Configuration
- [x] All MFA API routes proxy to external backend
- [x] Backend URL configuration (`src/lib/backend-config.ts`)
- [x] Environment variable setup (`.env.example` updated)
- [x] MFA status endpoint added
- [x] Error handling and retries implemented

### UI Components (Already Built)
- [x] MFA Setup wizard (`MfaSetup.tsx`)
- [x] Login verification (`MfaVerification.tsx`)
- [x] Settings management (`MfaSettings.tsx`)
- [x] Security settings page
- [x] Login form with MFA support

### Documentation
- [x] `EXTERNAL_BACKEND_SETUP.md` - Complete integration guide
- [x] `FRONTEND_MFA_READY.md` - Quick reference
- [x] `.env.example` - Environment variables documented

---

## Backend (Your Separate FastAPI Project) - TODO 📝

### 1. Database Schema
```sql
-- Run this migration in your backend database
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled VARCHAR(10) DEFAULT 'false';
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
```

### 2. Install Dependencies
```bash
pip install pyotp==2.9.0 qrcode[pil]==7.4.2 cryptography==42.0.0
```

Or add to your `requirements.txt`:
```txt
pyotp==2.9.0
qrcode[pil]==7.4.2
cryptography==42.0.0
passlib[bcrypt]>=1.7.4
```

### 3. Copy Backend Files
Copy these from the documentation to your FastAPI project:

**File Structure:**
```
your-fastapi-project/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   └── mfa_utils.py          ← Create this
│   │   ├── endpoints/
│   │   │   └── mfa_auth.py           ← Create this
│   │   └── routes.py                 ← Update this
│   ├── db/
│   │   └── models.py                 ← Update User model
│   └── schemas/
│       └── models.py                 ← Add MFA schemas
└── requirements.txt                  ← Update dependencies
```

**Files to implement:**
- [ ] `app/api/auth/mfa_utils.py` - MFA utility functions
- [ ] `app/api/endpoints/mfa_auth.py` - 6 MFA endpoints
- [ ] `app/db/models.py` - Add MFA fields to User model
- [ ] `app/schemas/models.py` - Add MFA Pydantic schemas
- [ ] `app/api/routes.py` - Include MFA router

### 4. Environment Variables
Add to your backend `.env`:
```env
# MFA Configuration
MFA_SECRET_KEY=your-secure-32-character-encryption-key-here
MFA_ISSUER_NAME=Your App Name

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Server
PORT=8080
HOST=0.0.0.0
```

### 5. CORS Configuration
Update your FastAPI CORS middleware:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        "https://yourapp.com",     # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6. Implement Endpoints
Your backend must have these endpoints:

- [ ] `POST /api/v1/mfa/setup?email={email}`
  - Generate secret and QR code
  - Return: `{secret, qr_code, manual_entry_key}`

- [ ] `POST /api/v1/mfa/enable?email={email}`
  - Verify code and enable MFA
  - Return: `{message, backup_codes[]}`

- [ ] `POST /api/v1/mfa/verify`
  - Verify TOTP or backup code
  - Body: `{email, password, code}`
  - Return: `{success, message, backup_code_used}`

- [ ] `POST /api/v1/mfa/disable?email={email}`
  - Disable MFA with password
  - Body: `{password, code?}`
  - Return: `{message}`

- [ ] `POST /api/v1/mfa/backup-codes?email={email}`
  - Regenerate backup codes
  - Return: `{message, backup_codes[]}`

- [ ] `GET /api/v1/mfa/status?email={email}`
  - Get MFA status
  - Return: `{mfa_enabled, last_login}`

### 7. Testing
- [ ] Start backend: `uvicorn app.main:app --reload --port 8080`
- [ ] Test health endpoint: `curl http://localhost:8080/health`
- [ ] Check Swagger docs: `http://localhost:8080/docs`
- [ ] Test MFA setup: `curl -X POST "http://localhost:8080/api/v1/mfa/setup?email=test@example.com"`

---

## Integration Testing - TODO 📝

### 1. Start Services
```bash
# Terminal 1 - Backend
cd /path/to/your-fastapi-project
uvicorn app.main:app --reload --port 8080

# Terminal 2 - Frontend
cd /path/to/dashboard_pro_mfa
npm run dev
```

### 2. Test Flow
- [ ] Navigate to `http://localhost:3000/settings/security`
- [ ] Click "Enable Two-Factor Authentication"
- [ ] Verify QR code displays
- [ ] Scan with Google Authenticator
- [ ] Enter verification code
- [ ] Save backup codes
- [ ] Log out
- [ ] Test login with MFA
- [ ] Test backup code login
- [ ] Test disable MFA

### 3. Check API Calls
Open browser DevTools (F12) and verify:
- [ ] Network tab shows calls to `http://localhost:8080/api/v1/mfa/*`
- [ ] No CORS errors
- [ ] Proper status codes (200, 400, 401, etc.)
- [ ] Response data matches expected format

---

## Deployment - TODO 📝

### Frontend Deployment
- [ ] Set production `BACKEND_URL` in environment variables
- [ ] Deploy to Vercel/Netlify/Your hosting
- [ ] Test MFA in production

### Backend Deployment
- [ ] Deploy to Google Cloud Run / AWS / Your hosting
- [ ] Set environment variables (MFA_SECRET_KEY, DATABASE_URL)
- [ ] Configure CORS with production frontend URL
- [ ] Run database migration
- [ ] Test backend health endpoint
- [ ] Update frontend `BACKEND_URL` to production backend

---

## Quick Reference

### Frontend Environment
```env
BACKEND_URL=http://localhost:8080  # or your backend URL
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

### Backend Environment
```env
MFA_SECRET_KEY=your-32-char-key
MFA_ISSUER_NAME=Your App
DATABASE_URL=postgresql://...
PORT=8080
```

### Test Commands
```bash
# Backend health
curl http://localhost:8080/health

# Backend Swagger
open http://localhost:8080/docs

# Frontend
open http://localhost:3000/settings/security
```

---

## 📚 Documentation Reference

- **`EXTERNAL_BACKEND_SETUP.md`** - Detailed integration guide
- **`FRONTEND_MFA_READY.md`** - Frontend quick start
- **`BACKEND_MFA_INTEGRATION.md`** - Original backend docs (reference for implementation)

---

## Summary

**Frontend Status:** ✅ COMPLETE - Ready to use  
**Backend Status:** ⏳ PENDING - Needs implementation in your FastAPI project

**Next Steps:**
1. Copy MFA code to your FastAPI backend project
2. Run database migration
3. Set environment variables
4. Test integration
5. Deploy both services

Your frontend is already configured correctly and requires no changes! 🎉
