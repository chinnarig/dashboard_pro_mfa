# Deployment Guide

Complete guide for deploying the Dashboard Pro application to Google Cloud Run across multiple environments.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Process](#deployment-process)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

The Dashboard Pro application uses a unified deployment script that supports three environments:

| Environment | Purpose | Auto-scaling | Password Required |
|-------------|---------|--------------|-------------------|
| **dev** | Development and testing | 0-2 instances | No |
| **qa** | Quality assurance and staging | 1-5 instances | Yes |
| **prod** | Production environment | 1-10 instances | Yes |

### Architecture

```
Next.js App → Cloud Build → Container Registry → Cloud Run
                                                    ↓
                                            Cloud SQL (PostgreSQL)
```

---

## Prerequisites

### Required Tools

1. **Google Cloud SDK**
   ```bash
   # Install gcloud
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL

   # Initialize and authenticate
   gcloud init
   gcloud auth login
   ```

2. **Node.js & npm**
   ```bash
   # Check versions
   node --version  # Should be 18+
   npm --version
   ```

3. **Project Access**
   - Editor or Owner role in the Google Cloud project
   - Cloud Run Admin permission
   - Cloud Build Editor permission
   - Storage Admin permission (for build artifacts)

### Project Configuration

Ensure you have access to these Google Cloud projects:

- **Development/Production:** `zlavox-ai` (Project #339293333933)
- **QA:** `zlavox-qa` (Project #1073093827343)

---

## Environment Setup

### Step 1: Create Environment Files

Copy the example files and fill in your actual values:

```bash
# Navigate to project root
cd dashboard_pro_mfa

# Copy example files
cp env.dev.yaml.example env.dev.yaml
cp env.qa.yaml.example env.qa.yaml
cp env.prod.yaml.example env.prod.yaml
```

### Step 2: Configure Environment Variables

Edit each environment file with your actual values:

#### Development (`env.dev.yaml`)

```yaml
# Database
DATABASE_URL: "postgresql://user:pass@/db?host=/cloudsql/zlavox-ai:us-central1:mfa"

# NextAuth
NEXTAUTH_URL: "https://dashboard-dev.zlavox.ai"
NEXTAUTH_SECRET: "your-dev-secret-min-32-chars"

# Application URLs
NEXT_PUBLIC_APP_URL: "https://dashboard-dev.zlavox.ai"
NEXT_PUBLIC_API_URL: "https://api-dev.zlavox.ai"

# Environment
NODE_ENV: "development"
ENVIRONMENT: "dev"
```

#### QA (`env.qa.yaml`)

Similar to dev but with QA-specific values and `NODE_ENV: "production"`

#### Production (`env.prod.yaml`)

Similar to QA but with production values and domains.

### Step 3: Update Deployment Passwords

Edit `scripts/deploy.sh` and update the passwords (lines 71-72):

```bash
vim scripts/deploy.sh
```

```bash
# Line 71
local QA_PASSWORD="your-secure-qa-password"

# Line 72
local PROD_PASSWORD="your-secure-prod-password"
```

**Important:** Use strong, unique passwords and store them securely (e.g., in a password manager).

---

## Deployment Process

### Development Deployment

```bash
# Deploy to dev (no password required)
./scripts/deploy.sh dev
```

**What happens:**
1. ✅ Checks prerequisites (gcloud, node, npm)
2. ✅ Configures dev environment settings
3. ✅ Verifies Google Cloud project access
4. ✅ Enables required APIs
5. ✅ Installs dependencies (`npm ci`)
6. ✅ Builds Next.js application
7. ✅ Creates/uses Dockerfile for containerization
8. ✅ Builds Docker image using Cloud Build
9. ✅ Deploys to Cloud Run (us-central1)
10. ✅ Displays service URL and logs

### QA Deployment

```bash
# Deploy to QA (password required)
./scripts/deploy.sh qa
```

You'll be prompted for the QA password before deployment proceeds.

### Production Deployment

```bash
# Deploy to production (password required)
./scripts/deploy.sh prod
```

You'll be prompted for the production password before deployment proceeds.

---

## Post-Deployment

### Verify Deployment

1. **Check Service URL**

   The script will display the service URL at the end:
   ```
   Service URL: https://zlavox-dashboard-dev-xxxxx-uc.a.run.app
   ```

2. **Test the Application**

   Open the URL in your browser and verify:
   - ✅ Application loads correctly
   - ✅ Login functionality works
   - ✅ MFA authentication works
   - ✅ API connections are successful

3. **Monitor Logs**

   ```bash
   # View real-time logs
   gcloud run logs tail zlavox-dashboard-dev --region us-central1 --project zlavox-ai

   # View logs in Cloud Console
   # https://console.cloud.google.com/run
   ```

### Performance Testing

```bash
# Test response time
curl -w "@curl-format.txt" -o /dev/null -s https://your-service-url.run.app

# Load testing (use Apache Bench or similar)
ab -n 100 -c 10 https://your-service-url.run.app/
```

---

## Troubleshooting

### Common Issues

#### 1. Build Fails

**Error:** `Docker build failed`

**Solutions:**
- Check that `package.json` has all required dependencies
- Ensure `npm run build` works locally
- Verify Cloud Build API is enabled
- Check Cloud Build logs in Google Cloud Console

#### 2. Deployment Permission Errors

**Error:** `You don't have access to project 'xxx'`

**Solutions:**
- Verify you're logged into the correct Google account
- Check IAM permissions in Google Cloud Console
- Ensure you have Cloud Run Admin role
- Try re-authenticating: `gcloud auth login`

#### 3. Service Won't Start

**Error:** Service deployed but returns 500 errors

**Solutions:**
- Check Cloud Run logs for errors
- Verify environment variables in `env.*.yaml`
- Ensure database connection string is correct
- Check Cloud SQL instance is running

#### 4. Out of Memory

**Error:** `Container terminated: Memory limit exceeded`

**Solutions:**
- Increase memory allocation in `scripts/deploy.sh`
- Optimize Next.js build (check bundle size)
- Enable caching for static assets

### Debug Commands

```bash
# View service details
gcloud run services describe SERVICE_NAME --region REGION --project PROJECT_ID

# View revision details
gcloud run revisions list --service SERVICE_NAME --region REGION

# View container logs
gcloud run logs read --service SERVICE_NAME --region REGION --limit 50

# Check service status
gcloud run services list --project PROJECT_ID
```

---

## Best Practices

### Security

1. **Never commit sensitive files**
   - `env.*.yaml` files are in `.gitignore`
   - Verify before committing: `git status`

2. **Rotate secrets regularly**
   - Change `NEXTAUTH_SECRET` every 90 days
   - Update database passwords quarterly
   - Rotate deployment passwords monthly

3. **Use Secret Manager (Optional Enhancement)**
   ```bash
   # Store secrets in Google Secret Manager
   echo -n "secret-value" | gcloud secrets create SECRET_NAME --data-file=-

   # Reference in Cloud Run
   gcloud run deploy SERVICE --set-secrets="ENV_VAR=SECRET_NAME:latest"
   ```

### Performance

1. **Enable CDN**
   ```bash
   # Add custom domain with Cloud CDN
   gcloud run domain-mappings create --service SERVICE_NAME --domain your-domain.com
   ```

2. **Optimize Images**
   - Use Next.js Image component
   - Enable image optimization in `next.config.ts`

3. **Monitor Performance**
   - Set up Cloud Monitoring alerts
   - Track response times and error rates
   - Monitor instance scaling behavior

### Cost Optimization

1. **Development Environment**
   - Set `MIN_INSTANCES=0` to scale to zero
   - Use smaller instance sizes
   - Delete old revisions regularly

2. **Production Environment**
   - Keep `MIN_INSTANCES=1` for better response times
   - Set appropriate `MAX_INSTANCES` based on traffic
   - Monitor costs in Cloud Console billing

---

## Environment-Specific Settings

### Development

```bash
Project: zlavox-ai
Service: zlavox-dashboard-dev
Min Instances: 0 (scale to zero)
Max Instances: 2
Memory: 512Mi
CPU: 1
```

**Use for:**
- Testing new features
- Development work
- Experimentation

### QA

```bash
Project: zlavox-qa
Service: zlavox-dashboard-qa
Min Instances: 1 (always running)
Max Instances: 5
Memory: 1Gi
CPU: 1
```

**Use for:**
- Quality assurance testing
- Stakeholder demos
- Integration testing

### Production

```bash
Project: zlavox-ai
Service: zlavox-dashboard-mfa
Min Instances: 1 (always running)
Max Instances: 10
Memory: 2Gi
CPU: 2
```

**Use for:**
- Live customer traffic
- Production workloads
- Mission-critical operations

---

## Rollback Procedure

If deployment fails or introduces issues:

```bash
# List revisions
gcloud run revisions list --service SERVICE_NAME --region REGION

# Rollback to previous revision
gcloud run services update-traffic SERVICE_NAME \
  --to-revisions=REVISION_NAME=100 \
  --region REGION
```

---

## Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Next.js Production Deployment](https://nextjs.org/docs/deployment)
- [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Scripts README](../scripts/README.md)

---

## Support

For deployment issues or questions:
1. Check this guide first
2. Review Cloud Run logs
3. Contact the development team
4. Create an issue in the project repository

---

**Last Updated:** 2025-01-18
