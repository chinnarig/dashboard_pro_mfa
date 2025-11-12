# MFA Flow Diagrams

## 1. MFA Setup Flow

```
User navigates to /settings/security
           ↓
   Clicks "Enable 2FA"
           ↓
   POST /api/mfa/setup
           ↓
   Server generates TOTP secret
           ↓
   Server creates QR code
           ↓
   User scans QR with app
   (or enters manual key)
           ↓
   User enters 6-digit code
           ↓
   POST /api/mfa/enable
           ↓
   Server verifies code
           ↓
   Server generates backup codes
           ↓
   MFA enabled in database
           ↓
   User saves backup codes
           ↓
   Setup Complete! ✓
```

## 2. MFA Login Flow

```
User enters email/password
           ↓
   POST to NextAuth signin
           ↓
   Password verified ✓
           ↓
   Check: MFA enabled?
           ↓
    Yes ──────────┐        No
     ↓            ↓         ↓
Return "MFA    Login      Success!
REQUIRED"      Success     → Dashboard
error            ✓
     ↓
Show MFA input
     ↓
User enters code
(TOTP or backup)
     ↓
POST /api/mfa/verify
     ↓
Verify TOTP?
     ↓
  Valid ─→ Success!
     ↓
  Invalid? Try backup code
     ↓
  Valid ─→ Remove backup code
     ↓        → Success!
  Invalid ─→ Show error
```

## 3. MFA Verification Logic

```
Receive code input
        ↓
   Is 6 digits?
        ↓
    Yes → Try TOTP verification
        ↓
   speakeasy.verify()
        ↓
    Valid? → Return success ✓
        ↓
    Invalid → Try backup codes
        ↓
   Decrypt backup codes
        ↓
   Normalize input
   (remove hyphens)
        ↓
   Find matching code
        ↓
    Found? → Remove from list
        ↓
   Encrypt updated list
        ↓
   Save to database
        ↓
   Return success ✓
        ↓
   Not found → Return error ✗
```

## 4. Database Schema

```
User Table
├── id (String/UUID)
├── email (String)
├── password (String - hashed)
├── name (String)
├── username (String)
├── role (Enum)
├── mfaEnabled (Boolean) ← NEW
├── mfaSecret (Text/NULL) ← NEW (encrypted)
├── mfaBackupCodes (Text/NULL) ← NEW (encrypted JSON)
├── lastLogin (DateTime/NULL) ← NEW
├── created_at (DateTime)
└── updatedAt (DateTime)
```

## 5. Encryption Flow

```
Plain Secret: "JBSWY3DPEHPK3PXP"
        ↓
Generate random IV (16 bytes)
        ↓
Derive key from MFA_ENCRYPTION_KEY
        ↓
AES-256-CBC encryption
        ↓
Combine: IV:encrypted_data
        ↓
Store in database: "a1b2c3d4...:e5f6g7h8..."
        ↓
--- On Retrieval ---
        ↓
Split by colon ":"
        ↓
Extract IV and encrypted data
        ↓
Decrypt with same key
        ↓
Return plain secret
```

## 6. Component Hierarchy

```
LoginForm
    └── MfaVerification (conditional)
        └── Input for code
        └── Verify button

Settings/Security Page
    └── MfaSettings
        ├── Status display
        ├── Enable button → MfaSetup
        │   ├── Step 1: Instructions
        │   ├── Step 2: QR Code & Verify
        │   └── Step 3: Backup Codes
        ├── Regenerate codes button
        └── Disable button → AlertDialog
```

## 7. API Route Flow

```
API Routes Structure:

/api/mfa/
    ├── setup/route.ts
    │   POST → Generate secret & QR
    │
    ├── enable/route.ts
    │   POST → Verify code & enable
    │
    ├── verify/route.ts
    │   POST → Verify at login
    │
    ├── disable/route.ts
    │   POST → Disable MFA
    │
    └── backup-codes/route.ts
        POST → Regenerate codes
```

## 8. Security Layers

```
Layer 1: HTTPS/TLS
    ↓
Layer 2: NextAuth Session
    ↓
Layer 3: Password Hash (bcrypt)
    ↓
Layer 4: MFA TOTP (if enabled)
    ↓
Layer 5: Encrypted Storage
    ↓
Layer 6: Single-use Backup Codes
    ↓
Protected Resource Access ✓
```

## 9. User Journey Map

```
NEW USER
   └── Register → Email verification
   └── Login → Dashboard
   └── Settings → Enable MFA
   └── Setup → Scan QR
   └── Verify → Get backup codes
   └── Protected ✓

RETURNING USER (MFA enabled)
   └── Login → Enter password
   └── MFA prompt → Enter code
   └── Dashboard ✓

LOST DEVICE
   └── Login → Enter password
   └── MFA prompt → Use backup code
   └── Dashboard
   └── Settings → Regenerate codes
   └── Protected ✓
```

## 10. Error Handling

```
User Action → Validation
    ↓
  Valid?
    ↓
  Yes → Process
    ↓
  Try operation
    ↓
  Success? → Return result
    ↓
  Fail → Catch error
    ↓
  Log error (server)
    ↓
  Return user-friendly message
    ↓
  Display toast notification
    ↓
  User can retry
```

---

These diagrams illustrate the complete MFA implementation flow from setup to daily usage. Each component works together to provide a secure and user-friendly experience.
