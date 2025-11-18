# Pre-Deletion Checklist for dashboard_pro Folder

## ✅ Completed Tasks

- [x] Excluded `dashboard_pro` from TypeScript compilation in `tsconfig.json`
- [x] Copied `AgentsTable.tsx` to `src/components/agent/`
- [x] Copied `voice-manage.tsx` to `src/components/voice/`
- [x] Copied `PaymentButton.tsx` to `src/components/billing/`
- [x] Copied `LogoutButton.tsx` and `UsersTable.tsx` to `src/components/user/`
- [x] Copied `api-client.ts`, `azure-storage.ts`, and `email.ts` to `src/lib/`
- [x] Fixed all unescaped apostrophes in MFA components and login page
- [x] Verified `src/actions/user.ts` is correct

## 🔍 Before Deleting dashboard_pro

### 1. Verify Key Files Exist in src/
Run these commands to confirm all important files are in place:

```bash
# Check components
ls -la src/components/agent/AgentsTable.tsx
ls -la src/components/voice/voice-manage.tsx
ls -la src/components/billing/PaymentButton.tsx
ls -la src/components/user/LogoutButton.tsx
ls -la src/components/user/UsersTable.tsx

# Check lib files
ls -la src/lib/api-client.ts
ls -la src/lib/azure-storage.ts
ls -la src/lib/email.ts

# Check actions
ls -la src/actions/user.ts
```

### 2. Run a Test Build (Optional but Recommended)
```bash
npm run build
```

Expected: Build should complete with warnings only (no errors).

### 3. Safe Deletion Commands

#### Option A: Move to Trash (Safest - Can recover if needed)
```bash
# On macOS
trash dashboard_pro

# Or manually drag to Trash in Finder
```

#### Option B: Remove Permanently
```bash
# Make a backup first (optional)
tar -czf dashboard_pro_backup_$(date +%Y%m%d).tar.gz dashboard_pro

# Then delete
rm -rf dashboard_pro
```

## 📋 Post-Deletion Verification

After deleting the folder:

1. **Verify TypeScript Compilation**
   ```bash
   npm run build
   ```

2. **Test Key Features**
   - Login with MFA
   - Access Agents page (`/admin/dashboard/agents`)
   - Access Voices page (`/admin/dashboard/voices`)
   - User management

3. **Check Git Status**
   ```bash
   git status
   ```
   
4. **Commit Changes**
   ```bash
   git add .
   git commit -m "Synced files from dashboard_pro and removed duplicate folder"
   ```

## 🚨 Rollback Plan (If Needed)

If you encounter issues after deletion:

1. **Restore from backup** (if you created tar.gz)
   ```bash
   tar -xzf dashboard_pro_backup_YYYYMMDD.tar.gz
   ```

2. **Or restore from Git** (if not committed yet)
   ```bash
   git checkout dashboard_pro
   ```

## ✅ Confirmation Checklist

Before marking this as complete, confirm:

- [ ] All files listed in SYNC_SUMMARY.md have been copied
- [ ] Test build runs without errors
- [ ] Key pages load in development mode (npm run dev)
- [ ] MFA components work correctly
- [ ] Agent and Voice management pages are accessible

Once all items are checked, you can safely remove the `dashboard_pro` folder! 🎉
