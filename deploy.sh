#!/bin/bash

# ===========================================
# Next.js to Google Cloud Run Deployment Script
# ===========================================

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ===========================================
# Configuration Variables
# ===========================================

export PROJECT_ID="zlavox-ai"
export SERVICE_NAME="zlavox-dashboard-mfa"
export REGION="us-central1"
# export CLOUD_SQL_INSTANCE="zlavox-ai:us-central1:zlavoxdb"
export CLOUD_SQL_INSTANCE="zlavox-ai:us-central1:mfa"

# ===========================================
# Functions
# ===========================================

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ===========================================
# Pre-flight Checks
# ===========================================

print_info "Starting deployment process..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    print_error "Not logged in to gcloud. Run: gcloud auth login"
    exit 1
fi

# Check if env.yaml exists
if [ ! -f "env.yaml" ]; then
    print_error "env.yaml file not found!"
    print_info "Creating a template env.yaml file..."
    cat > env.yaml << 'EOF'
DATABASE_URL: "postgresql://postgres:Admin@011235@/postgres?host=/cloudsql/zlavox-ai:us-central1:mfa"
NEXTAUTH_URL: "https://dashboard.zlavox.ai"
NEXTAUTH_SECRET: "Jk7xZ9mQpL8nR3vW5yT2sC6fH1dG4bN0aE8uI7oP5qM="
NEXT_PUBLIC_APP_URL: "https://dashboard.zlavox.ai"
GCS_PROJECT_ID: "zlavox-ai"
GCS_BUCKET_NAME: "zlovoxai-images"
GCS_CLIENT_EMAIL: "your-service-account@project.iam.gserviceaccount.com"
GCS_PRIVATE_KEY: "your-private-key-here"
EOF
    print_warning "Please edit env.yaml with your actual values, then run this script again."
    exit 1
fi

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile not found!"
    exit 1
fi

print_info "All pre-flight checks passed ✓"

# ===========================================
# Set Google Cloud Project
# ===========================================

print_info "Setting Google Cloud project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# ===========================================
# Enable Required APIs
# ===========================================

print_info "Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# ===========================================
# Build Docker Image
# ===========================================

print_info "Building Docker image..."
print_info "This may take several minutes..."

gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

if [ $? -eq 0 ]; then
    print_info "Docker image built successfully ✓"
else
    print_error "Docker build failed!"
    exit 1
fi

# ===========================================
# Deploy to Cloud Run
# ===========================================

print_info "Deploying to Cloud Run..."

gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --env-vars-file env.yaml \
  --add-cloudsql-instances=$CLOUD_SQL_INSTANCE \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0

if [ $? -eq 0 ]; then
    print_info "Deployment successful! ✓"
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")
    
    echo ""
    print_info "=========================================="
    print_info "Deployment Complete!"
    print_info "=========================================="
    print_info "Service Name: $SERVICE_NAME"
    print_info "Region: $REGION"
    print_info "Service URL: $SERVICE_URL"
    print_info "=========================================="
    echo ""
    print_info "You can view your service at: $SERVICE_URL"
    print_info "View logs: gcloud run logs tail $SERVICE_NAME --region $REGION"
    
else
    print_error "Deployment failed!"
    exit 1
fi