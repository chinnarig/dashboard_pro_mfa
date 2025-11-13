# Quick MFA Setup Guide

## Step 1: Apply Database Changes

Run the following command to update your database with the new MFA fields:

```powershell
npx prisma migrate dev --name add_mfa_fields
```

Or if you prefer to push without creating a migration file:

```powershell
npx prisma db push
```

## Step 2: Add Environment Variables

Add the following to your `.env` file (create it if it doesn't exist):

```env
# MFA Encryption Key (can use NEXTAUTH_SECRET if not set)
MFA_ENCRYPTION_KEY=your-secure-random-key-change-this-to-a-long-random-string

# Optional: Customize the app name shown in authenticator apps
MFA_ISSUER_NAME="Zlavox AI"
```

## Step 3: Test the Integration

1. **Start your development server:**
   ```powershell
   npm run dev
   ```

2. **Create or log into an account**

3. **Enable MFA:**
   - Navigate to: `http://localhost:3000/settings/security`
   - Click "Enable Two-Factor Authentication"
   - Scan the QR code with Google Authenticator or any TOTP app
   - Enter the 6-digit code to verify
   - **Important:** Save the backup codes shown!

4. **Test Login with MFA:**
   - Log out of your account
   - Log back in with your email and password
   - You'll be prompted for a 6-digit code
   - Enter the code from your authenticator app
   - Successfully log in!

## Step 4: Test Backup Codes

1. Log out
2. Log in with email and password
3. When prompted for MFA code, enter one of your backup codes (format: XXXX-XXXX)
4. That backup code will be consumed and can't be used again

## Features Available

✅ **MFA Setup** - Complete setup wizard with QR code
✅ **MFA Login** - Seamless verification during login
✅ **Backup Codes** - 8 one-time use emergency codes
✅ **MFA Management** - Enable/disable/regenerate from settings
✅ **Security Page** - Dedicated `/settings/security` page
✅ **Compatible** - Works with Google Authenticator, Microsoft Authenticator, Authy, etc.

## Accessing MFA Settings

Users can manage their MFA settings at:
- `/settings/security` - Main security settings page

## API Endpoints Created

- `POST /api/mfa/setup` - Generate MFA secret and QR code
- `POST /api/mfa/enable` - Enable MFA after verification
- `POST /api/mfa/verify` - Verify MFA code during login
- `POST /api/mfa/disable` - Disable MFA
- `POST /api/mfa/backup-codes` - Regenerate backup codes

## Troubleshooting

**Issue: "Module not found" errors**
Solution: Make sure all packages are installed:
```powershell
npm install
```

**Issue: Prisma client errors**
Solution: Regenerate Prisma client:
```powershell
npx prisma generate
```

**Issue: Database connection errors**
Solution: Check your `DATABASE_URL` in `.env`

**Issue: TypeScript errors**
Solution: Restart your TypeScript server or IDE

## Security Notes

- MFA secrets are encrypted before storage in the database
- Backup codes are encrypted and single-use
- Each backup code is automatically removed after use
- TOTP codes expire every 30 seconds
- 1-period time drift tolerance for clock skew

## Next Steps

1. Test thoroughly in development
2. Ensure your `MFA_ENCRYPTION_KEY` is secure in production
3. Consider adding MFA requirement for admin users
4. Add activity logs for security events (optional)
5. Document MFA usage for your users

---

**Need Help?** 
- Check `MFA_INTEGRATION.md` for detailed documentation
- Review the code comments in `src/lib/mfa.ts`
- Test each component individually
