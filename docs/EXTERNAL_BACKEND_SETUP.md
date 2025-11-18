# External Backend Setup Guide 🚀

## Overview

This Next.js application is designed to work with a **separate FastAPI backend service** for MFA (Multi-Factor Authentication) functionality. The backend runs as an independent service with its own database and deployment.

## Architecture

```
┌─────────────────────────┐          ┌─────────────────────────┐
│   Next.js Frontend      │          │   FastAPI Backend       │
│   (This Project)        │  HTTP    │   (Separate Project)    │
│                         │ ◄─────► │                         │
│  • UI Components        │          │  • MFA Logic            │
│  • API Routes (Proxy)   │          │  • Database Access      │
│  • Authentication       │          │  • Business Logic       │
└─────────────────────────┘          └─────────────────────────┘
         │                                      │
         │                                      │
         ▼                                      ▼
    NextAuth.js                           PostgreSQL
    (Session Mgmt)                        (User Data + MFA)
```

## Frontend Configuration

### Environment Variables

Create or update `.env.local` in the root of this project:

```env
# Backend API URL
BACKEND_URL=http://localhost:8080
# Or for production:
# BACKEND_URL=https://your-backend-api.com

# NextAuth Configuration (existing)
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Database (for NextAuth sessions - if using database adapter)
DATABASE_URL=your-database-url-here
```

### Key Files in Frontend

#### 1. Backend Configuration (`src/lib/backend-config.ts`)
- Centralized backend URL management
- API client with error handling and retries
- Timeout and retry configuration
- Type-safe API calls

#### 2. MFA API Routes (Proxy Layer)
All routes in `src/app/api/mfa/`:

| Route | Method | Backend Endpoint | Description |
|-------|--------|------------------|-------------|
| `/api/mfa/setup` | POST | `/api/v1/mfa/setup` | Generate MFA secret & QR code |
| `/api/mfa/enable` | POST | `/api/v1/mfa/enable` | Enable MFA after verification |
| `/api/mfa/verify` | POST | `/api/v1/mfa/verify` | Verify MFA code at login |
| `/api/mfa/disable` | POST | `/api/v1/mfa/disable` | Disable MFA with password |
| `/api/mfa/backup-codes` | POST | `/api/v1/mfa/backup-codes` | Regenerate backup codes |
| `/api/mfa/status` | GET | `/api/v1/mfa/status` | Get MFA status for user |

#### 3. MFA UI Components
Located in `src/components/auth/`:
- `MfaSetup.tsx` - 3-step MFA setup wizard
- `MfaVerification.tsx` - Login verification component
- `MfaSettings.tsx` - Settings page management

#### 4. Login Integration
- `src/components/form/LoginForm.tsx` - Enhanced with MFA support
- `src/app/settings/security/page.tsx` - Security settings page

## Backend Requirements

Your FastAPI backend should implement the following endpoints:

### Required Endpoints

#### 1. Setup MFA
```
POST /api/v1/mfa/setup?email={email}
Response: {
  "secret": "BASE32SECRET",
  "qr_code": "data:image/png;base64,...",
  "manual_entry_key": "XXXX XXXX XXXX XXXX"
}
```

#### 2. Enable MFA
```
POST /api/v1/mfa/enable?email={email}
Body: {
  "code": "123456"
}
Response: {
  "message": "MFA enabled successfully",
  "backup_codes": ["code1", "code2", ...]
}
```

#### 3. Verify MFA
```
POST /api/v1/mfa/verify
Body: {
  "email": "user@example.com",
  "password": "userpassword",
  "code": "123456"
}
Response: {
  "success": true,
  "message": "MFA verified successfully",
  "backup_code_used": false
}
```

#### 4. Disable MFA
```
POST /api/v1/mfa/disable?email={email}
Body: {
  "password": "userpassword",
  "code": "123456" (optional)
}
Response: {
  "message": "MFA disabled successfully"
}
```

#### 5. Regenerate Backup Codes
```
POST /api/v1/mfa/backup-codes?email={email}
Response: {
  "message": "Backup codes regenerated",
  "backup_codes": ["code1", "code2", ...]
}
```

#### 6. Get MFA Status
```
GET /api/v1/mfa/status?email={email}
Response: {
  "mfa_enabled": true,
  "last_login": "2025-11-12T10:30:00Z"
}
```

### Backend Database Schema

Your backend needs these fields in the User model:

```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    
    # MFA fields
    mfa_enabled = Column(String, default='false')  # 'true' or 'false'
    mfa_secret = Column(Text)  # Encrypted TOTP secret
    mfa_backup_codes = Column(Text)  # Encrypted JSON array
    last_login = Column(DateTime(timezone=True))
```

### Backend Dependencies

Your `requirements.txt` should include:

```txt
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.9
pydantic>=2.0.0
passlib[bcrypt]>=1.7.4

# MFA specific
pyotp==2.9.0
qrcode[pil]==7.4.2
cryptography==42.0.0
```

### Backend Environment Variables

Your backend `.env` should have:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# MFA Configuration
MFA_SECRET_KEY=your-secure-encryption-key-minimum-32-chars
MFA_ISSUER_NAME=Your App Name

# Server
PORT=8080
HOST=0.0.0.0
ENVIRONMENT=production
```

## Development Setup

### 1. Start Backend (Separate Project)
```bash
# In your FastAPI backend project
cd /path/to/your/fastapi/project
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

### 2. Start Frontend (This Project)
```bash
# In this Next.js project
npm install
npm run dev
```

### 3. Access Applications
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Backend Swagger: http://localhost:8080/docs

## Testing the Integration

### 1. Health Check
```bash
# Check if backend is running
curl http://localhost:8080/health

# Should return: {"status": "healthy"}
```

### 2. Test MFA Flow
1. Navigate to http://localhost:3000/settings/security
2. Click "Enable Two-Factor Authentication"
3. Scan QR code with Google Authenticator
4. Enter verification code
5. Save backup codes
6. Log out and test MFA login

### 3. Check API Connectivity
```bash
# From frontend, check if it can reach backend
curl http://localhost:3000/api/mfa/status \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

## Production Deployment

### Frontend (Next.js)
Deploy to Vercel, Netlify, or your hosting platform:

```env
# Production .env
BACKEND_URL=https://api.yourapp.com
NEXTAUTH_URL=https://yourapp.com
```

### Backend (FastAPI)
Deploy to:
- **Google Cloud Run** (recommended)
- **AWS Lambda** with API Gateway
- **Heroku**
- **DigitalOcean App Platform**
- **Your own server** with Docker

### CORS Configuration (Backend)
Ensure your backend allows requests from your frontend domain:

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

## Security Considerations

1. **HTTPS Only in Production**
   - Always use HTTPS for both frontend and backend
   - Set `secure: true` for cookies

2. **API Authentication**
   - Backend should validate requests
   - Consider adding API keys for extra security
   - Rate limiting on sensitive endpoints

3. **Secrets Management**
   - Never commit `.env` files
   - Use secret management services (AWS Secrets Manager, Google Secret Manager)
   - Rotate MFA_SECRET_KEY regularly

4. **Database Security**
   - All MFA secrets are encrypted at rest
   - Use strong database passwords
   - Enable SSL for database connections

## Troubleshooting

### Backend Not Reachable
```bash
# Check if backend is running
curl http://localhost:8080/health

# Check environment variable
echo $BACKEND_URL  # Should output correct URL
```

### CORS Errors
- Verify backend CORS configuration
- Ensure frontend URL is in `allow_origins`
- Check browser console for specific CORS errors

### MFA Codes Not Working
- Verify device time is synchronized
- Check MFA_SECRET_KEY is set in backend
- Ensure encryption/decryption works correctly

### Session Issues
- Clear browser cookies
- Check NextAuth configuration
- Verify database connection

## API Client Usage (Optional)

You can use the backend API client directly in your components:

```typescript
import { backendApi } from '@/lib/backend-config';

// In your component
async function setupMfa(email: string) {
  try {
    const data = await backendApi.post('/mfa/setup', null, { email });
    return data;
  } catch (error) {
    console.error('MFA setup failed:', error);
    throw error;
  }
}
```

## Support

For issues related to:
- **Frontend/UI**: Check this project's issues
- **Backend/API**: Check your FastAPI project
- **Integration**: Verify environment variables and CORS settings

## Summary

✅ **Frontend is ready** - All MFA routes proxy to backend  
✅ **Configuration centralized** - Easy to update backend URL  
✅ **Error handling** - Graceful failures with proper messages  
✅ **Type-safe** - TypeScript interfaces for all API calls  
✅ **Production ready** - Supports multiple environments  

Your Next.js frontend is now properly configured to work with your separate FastAPI backend service!
