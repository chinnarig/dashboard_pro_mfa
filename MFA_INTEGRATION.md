# MFA Integration Documentation

## Overview

This project now includes complete Multi-Factor Authentication (MFA) / Two-Factor Authentication (2FA) functionality using Time-based One-Time Passwords (TOTP). Users can secure their accounts with authenticator apps like Google Authenticator, Microsoft Authenticator, or Authy.

## Features Implemented

### 1. **Database Schema Updates**
- Added `mfaEnabled` (Boolean) field to track MFA status
- Added `mfaSecret` (String) field to store encrypted TOTP secret
- Added `mfaBackupCodes` (Text) field to store encrypted backup codes
- Added `lastLogin` (DateTime) field to track user activity

### 2. **MFA Utility Functions** (`src/lib/mfa.ts`)
- **Encryption/Decryption**: Secure storage of MFA secrets and backup codes
- **TOTP Generation**: Create secrets compatible with all major authenticator apps
- **QR Code Generation**: Generate scannable QR codes for easy setup
- **Code Verification**: Verify TOTP codes with time drift tolerance
- **Backup Codes**: Generate, encrypt, verify, and manage one-time backup codes

### 3. **API Routes**

#### `/api/mfa/setup` (POST)
- Generates a new MFA secret and QR code
- Returns: `{ secret, qrCode, manualEntryKey }`

#### `/api/mfa/enable` (POST)
- Verifies setup code and enables MFA
- Returns: `{ message, backupCodes }`
- Body: `{ code: "123456" }`

#### `/api/mfa/verify` (POST)
- Verifies MFA code during login
- Accepts both TOTP codes and backup codes
- Returns: `{ success, message, backupCodeUsed }`
- Body: `{ email, password, code }`

#### `/api/mfa/disable` (POST)
- Disables MFA with password confirmation
- Body: `{ password, code? }`

#### `/api/mfa/backup-codes` (POST)
- Regenerates backup codes
- Returns: `{ message, backupCodes }`

### 4. **Authentication Flow Updates** (`src/lib/auth.ts`)
- Enhanced `CredentialsProvider` to support MFA
- Checks if MFA is enabled before completing login
- Returns `MFA_REQUIRED` error if MFA code is needed
- Verifies MFA code via API before creating session

### 5. **UI Components**

#### `MfaSetup.tsx`
Complete setup wizard with three steps:
1. **Setup**: Explains MFA and starts the process
2. **Verify**: Shows QR code and manual entry key
3. **Backup**: Displays and allows saving of backup codes

#### `MfaVerification.tsx`
Login-time MFA code verification:
- Accepts 6-digit TOTP codes
- Accepts backup codes (XXXX-XXXX format)
- Clean, user-friendly interface

#### `MfaSettings.tsx`
Complete MFA management interface:
- Enable/Disable MFA
- Regenerate backup codes
- View MFA status
- Password-protected disable operation

### 6. **Updated LoginForm** (`src/components/form/LoginForm.tsx`)
- Detects when MFA is required
- Shows MFA verification card
- Supports both TOTP and backup codes
- Seamless user experience

### 7. **Security Settings Page** (`src/app/settings/security/page.tsx`)
Dedicated page for security management:
- MFA status display
- Enable/disable controls
- Backup code management
- Last login tracking

## How to Use

### For Users

#### Enabling MFA:
1. Go to `/settings/security`
2. Click "Enable Two-Factor Authentication"
3. Scan the QR code with your authenticator app (or enter the key manually)
4. Enter the 6-digit code from your app to verify
5. **Save the backup codes** in a secure location

#### Logging in with MFA:
1. Enter your email and password as usual
2. You'll be prompted for a 6-digit code
3. Open your authenticator app and enter the current code
4. Or use a backup code if you don't have access to your device

#### Disabling MFA:
1. Go to `/settings/security`
2. Click "Disable Two-Factor Authentication"
3. Enter your password
4. Optionally enter a current MFA code
5. Confirm the action

#### Regenerating Backup Codes:
1. Go to `/settings/security`
2. Click "Regenerate Backup Codes"
3. **Save the new codes** - old ones will no longer work

### For Developers

#### Running Migrations:
```powershell
# Generate Prisma client with new fields
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_mfa_fields

# Or push schema changes directly (dev only)
npx prisma db push
```

#### Environment Variables:
Add to your `.env` file:
```env
# Required for encryption (defaults to NEXTAUTH_SECRET if not set)
MFA_ENCRYPTION_KEY=your-secure-random-key-here

# Optional: Customize the issuer name shown in authenticator apps
MFA_ISSUER_NAME="Dashboard Pro"

# Required for NextAuth (should already exist)
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

#### Testing the Integration:
1. Register a new user or use an existing account
2. Navigate to `/settings/security`
3. Enable MFA and scan the QR code with an authenticator app
4. Log out and log back in to test the MFA verification flow
5. Test backup codes by using one during login

## Security Features

### Encryption
- All MFA secrets and backup codes are encrypted using AES-256-CBC
- Encryption key derived from `MFA_ENCRYPTION_KEY` or `NEXTAUTH_SECRET`
- Each encrypted value uses a unique initialization vector (IV)

### TOTP Configuration
- 30-second time window (standard)
- SHA-1 algorithm (compatible with all authenticator apps)
- 6-digit codes
- 1-period time drift tolerance (allows for clock skew)

### Backup Codes
- 8 codes generated by default
- Each code is 8 characters (XXXX-XXXX format)
- Single-use only (removed after use)
- Can be regenerated at any time

### Session Management
- MFA verification required even with valid password
- Failed MFA attempts don't reveal valid credentials
- Last login timestamp tracked for security monitoring

## Compatible Authenticator Apps

The implementation is compatible with all major authenticator apps:
- **Google Authenticator** (Android, iOS)
- **Microsoft Authenticator** (Android, iOS)
- **Authy** (Android, iOS, Desktop)
- **1Password** (with TOTP support)
- **LastPass Authenticator**
- Any RFC 6238 compliant TOTP app

## File Structure

```
src/
├── lib/
│   ├── mfa.ts                          # Core MFA utility functions
│   ├── auth.ts                         # Updated with MFA support
│   └── validations/
│       └── schemas.ts                  # MFA validation schemas
├── app/
│   ├── api/
│   │   └── mfa/
│   │       ├── setup/route.ts          # Generate MFA secret
│   │       ├── enable/route.ts         # Enable MFA
│   │       ├── verify/route.ts         # Verify MFA code
│   │       ├── disable/route.ts        # Disable MFA
│   │       └── backup-codes/route.ts   # Regenerate backup codes
│   └── settings/
│       ├── layout.tsx                  # Protected settings layout
│       └── security/
│           └── page.tsx                # Security settings page
├── components/
│   └── auth/
│       ├── MfaSetup.tsx               # MFA setup wizard
│       ├── MfaVerification.tsx        # Login MFA verification
│       └── MfaSettings.tsx            # MFA management interface
└── types/
    └── index.ts                        # MFA TypeScript types

prisma/
└── schema.prisma                       # Updated User model with MFA fields
```

## Troubleshooting

### "Invalid MFA code" error
- Ensure your device's clock is synchronized
- Try waiting for the next code (codes change every 30 seconds)
- Use a backup code if the issue persists

### Can't scan QR code
- Use the manual entry key displayed below the QR code
- Make sure to remove spaces when entering the key

### Lost access to authenticator app
- Use one of your backup codes to log in
- After logging in, go to settings and regenerate new backup codes
- Or disable and re-enable MFA with a new device

### Database errors after migration
- Ensure Prisma client is regenerated: `npx prisma generate`
- Check that migrations are applied: `npx prisma migrate dev`
- Verify database connection in `.env`

## Future Enhancements

Possible improvements for future versions:
- SMS-based 2FA as alternative
- Email-based 2FA codes
- WebAuthn/FIDO2 support for hardware keys
- Per-device trusted sessions
- MFA enforcement at organization level
- Activity logs and login history
- Recovery email option

## Credits

Built with:
- **speakeasy**: TOTP generation and verification
- **qrcode**: QR code generation
- **Next.js**: Framework
- **NextAuth.js**: Authentication
- **Prisma**: Database ORM
- **Node.js crypto**: Encryption utilities

## License

Same as the main project.
