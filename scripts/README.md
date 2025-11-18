# Scripts

This folder contains utility scripts for deployment, testing, and database operations.

## 🚀 Deployment

### `deploy.sh` - Production-Ready Deployment Script

Unified deployment script for deploying the Next.js dashboard to Google Cloud Run across multiple environments.

**Features:**
- Multi-environment support (dev, qa, prod)
- Automated build and deployment
- Environment-specific configuration
- Password protection for QA and PROD
- Comprehensive logging
- Error handling and validation

**Usage:**

```bash
# Deploy to development
./scripts/deploy.sh dev

# Deploy to QA (requires password)
./scripts/deploy.sh qa

# Deploy to production (requires password)
./scripts/deploy.sh prod
```

**Prerequisites:**
- Google Cloud SDK (`gcloud`)
- Node.js and npm
- Docker (optional, Cloud Build used if not available)
- Authenticated to Google Cloud: `gcloud auth login`

**Environment Configuration:**

Before deploying, create environment-specific YAML files:

```bash
# Copy example files
cp env.dev.yaml.example env.dev.yaml
cp env.qa.yaml.example env.qa.yaml
cp env.prod.yaml.example env.prod.yaml

# Edit with actual values
vim env.dev.yaml
```

**Environment Settings:**

| Environment | Project ID | Min Instances | Max Instances | Memory | CPU |
|-------------|-----------|---------------|---------------|--------|-----|
| dev         | zlavox-ai | 0             | 2             | 512Mi  | 1   |
| qa          | zlavox-qa | 1             | 5             | 1Gi    | 1   |
| prod        | zlavox-ai | 1             | 10            | 2Gi    | 2   |

**Security:**

QA and PROD deployments require password authentication. Update passwords in the script:
- QA Password: Line 71
- PROD Password: Line 72

---

## 🧪 Testing & Verification

### `test-apis.sh`
API testing script for backend endpoints.

**Usage:**
```bash
./scripts/test-apis.sh
```

### `verify-sync.sh`
Verifies database synchronization between environments.

**Usage:**
```bash
./scripts/verify-sync.sh
```

---

## 💾 Database Utilities

All database-related utility scripts are in the `database/` subfolder.

### Database Scripts (`database/`)

| Script | Description |
|--------|-------------|
| `check-db-schema.js` | Check database schema |
| `compare-users-tables.js` | Compare users tables |
| `drop-views.js` | Drop database views |
| `execute-schema.js` | Execute schema changes |
| `hash-passwords.js` | Hash user passwords |
| `run-migration.js` | Run database migrations |
| `update-backup-codes.js` | Update MFA backup codes |
| `verify-roles.js` | Verify user roles |
| `fix-schema-refs.sh` | Fix schema references |

**Usage:**

```bash
# Make scripts executable
chmod +x scripts/database/*.sh
chmod +x scripts/database/*.js

# Run from project root
node scripts/database/check-db-schema.js
```

---

## 📝 Notes

- All scripts should be run from the project root directory
- Ensure scripts have execution permissions: `chmod +x scripts/*.sh`
- Check logs for detailed deployment information
- Environment variables are stored in `env.{environment}.yaml` files

---

## 🔐 Security Best Practices

1. **Never commit** `env.*.yaml` files (they're in `.gitignore`)
2. **Update passwords** in deploy.sh before production use
3. **Rotate secrets** regularly in environment YAML files
4. **Use service accounts** with minimal required permissions
5. **Review logs** after deployment for any security warnings

---

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Project Documentation](../docs/README.md)
