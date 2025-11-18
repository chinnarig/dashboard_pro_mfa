#!/bin/bash

# Dashboard_Pro Sync Verification Script
# Run this to verify all files were synced correctly

echo "🔍 Dashboard_Pro Sync Verification"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for checks
passed=0
failed=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((passed++))
    else
        echo -e "${RED}✗${NC} $1 - MISSING!"
        ((failed++))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((passed++))
    else
        echo -e "${RED}✗${NC} $1/ - MISSING!"
        ((failed++))
    fi
}

echo "📁 Checking New Directories..."
check_dir "src/app/admin/dashboard/agents"
check_dir "src/app/admin/dashboard/billing"
check_dir "src/app/api/auth/forgot-password"
check_dir "src/app/api/stripe"
check_dir "src/components/agent"
check_dir "src/components/billing"
echo ""

echo "📄 Checking Critical New Files..."
check_file "src/app/admin/dashboard/agents/page.tsx"
check_file "src/app/admin/dashboard/billing/page.tsx"
check_file "src/components/agent/AgentsTable.tsx"
check_file "src/components/billing/PaymentButton.tsx"
check_file "src/components/user/LogoutButton.tsx"
check_file "src/components/user/UsersTable.tsx"
check_file "src/components/voice/voice-manage.tsx"
echo ""

echo "📚 Checking New Library Files..."
check_file "src/lib/api-client.ts"
check_file "src/lib/azure-storage.ts"
check_file "src/lib/email.ts"
echo ""

echo "🔐 Checking MFA Files (should have apostrophe fixes)..."
check_file "src/components/auth/MfaSettings.tsx"
check_file "src/components/auth/MfaSetup.tsx"
check_file "src/app/login/page.tsx"
check_file "src/components/form/LoginForm.tsx"
echo ""

echo "🌐 Checking API Routes..."
check_file "src/app/api/auth/forgot-password/route.ts"
check_file "src/app/api/auth/resend-verification/route.ts"
check_file "src/app/api/stripe/checkout/route.ts"
check_file "src/app/api/stripe/webhook/route.ts"
check_file "src/app/api/users/route.ts"
echo ""

echo "⚙️ Checking Configuration..."
if grep -q "dashboard_pro" tsconfig.json; then
    echo -e "${GREEN}✓${NC} tsconfig.json excludes dashboard_pro"
    ((passed++))
else
    echo -e "${RED}✗${NC} tsconfig.json does not exclude dashboard_pro"
    ((failed++))
fi
echo ""

echo "🔍 Checking MFA Features..."
if grep -q "onMfaStateChange" src/components/form/LoginForm.tsx; then
    echo -e "${GREEN}✓${NC} LoginForm has MFA support"
    ((passed++))
else
    echo -e "${YELLOW}⚠${NC} LoginForm may be missing MFA support"
    ((failed++))
fi

if grep -q "&apos;" src/components/auth/MfaSetup.tsx; then
    echo -e "${GREEN}✓${NC} MfaSetup has proper apostrophe escaping"
    ((passed++))
else
    echo -e "${YELLOW}⚠${NC} MfaSetup may have unescaped apostrophes"
    ((failed++))
fi
echo ""

echo "🔧 Checking Environment Variable Usage..."
if grep -q "NEXT_PUBLIC_BACKEND_URL" src/components/dashboard/DashboardPage.tsx; then
    echo -e "${GREEN}✓${NC} DashboardPage uses environment variable"
    ((passed++))
else
    echo -e "${YELLOW}⚠${NC} DashboardPage may have hard-coded URL"
    ((failed++))
fi
echo ""

echo "=================================="
echo -e "Results: ${GREEN}${passed} passed${NC}, ${RED}${failed} failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run build"
    echo "2. Test the application"
    echo "3. Remove dashboard_pro: rm -rf dashboard_pro"
    echo "4. Commit changes: git add . && git commit -m 'Synced all files from dashboard_pro'"
    exit 0
else
    echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
    echo ""
    echo "Please review the failed checks above and resolve any issues."
    exit 1
fi
