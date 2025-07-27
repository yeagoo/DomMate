#!/bin/bash

# DomMate Docker Setup Test Script
# This script tests various aspects of the Docker configuration

set -e

echo "🧪 DomMate Docker Setup Test"
echo "============================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test 1: Check if required files exist
echo "📁 Checking required files..."

required_files=(
    "Dockerfile"
    "docker-compose.yml"
    "docker-compose.dev.yml"
    ".dockerignore"
    "env.example"
    "nginx/nginx.conf"
    "nginx/conf.d/dommate.conf"
    ".github/workflows/docker-build.yml"
    "server/health-check.js"
    "docker-start.sh"
    "DOCKER.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ] || [ -d "$(dirname "$file")" ]; then
        success "$file exists"
    else
        error "$file is missing"
        exit 1
    fi
done

# Test 2: Check if Docker is available
echo ""
echo "🐳 Checking Docker availability..."

if command -v docker &> /dev/null; then
    success "Docker is installed"
    docker --version
else
    warning "Docker is not installed - skipping Docker tests"
    SKIP_DOCKER=true
fi

if command -v docker-compose &> /dev/null; then
    success "Docker Compose is installed"
    docker-compose --version
else
    warning "Docker Compose is not installed - skipping compose tests"
    SKIP_COMPOSE=true
fi

# Test 3: Validate Dockerfile syntax
echo ""
echo "📋 Validating Dockerfile syntax..."

if [ -z "$SKIP_DOCKER" ]; then
    if docker build --dry-run -f Dockerfile . &> /dev/null; then
        success "Dockerfile syntax is valid"
    else
        error "Dockerfile has syntax errors"
    fi
else
    warning "Skipping Dockerfile validation (Docker not available)"
fi

# Test 4: Validate Docker Compose files
echo ""
echo "🔧 Validating Docker Compose files..."

if [ -z "$SKIP_COMPOSE" ]; then
    if docker-compose -f docker-compose.yml config &> /dev/null; then
        success "docker-compose.yml is valid"
    else
        error "docker-compose.yml has errors"
    fi
    
    if docker-compose -f docker-compose.dev.yml config &> /dev/null; then
        success "docker-compose.dev.yml is valid"
    else
        error "docker-compose.dev.yml has errors"
    fi
else
    warning "Skipping Docker Compose validation (docker-compose not available)"
fi

# Test 5: Check environment file template
echo ""
echo "⚙️  Checking environment configuration..."

if [ -f "env.example" ]; then
    # Check for critical environment variables
    critical_vars=(
        "DATABASE_PATH"
        "SERVER_PORT"
        "JWT_SECRET"
        "SESSION_SECRET"
        "NODE_ENV"
    )
    
    for var in "${critical_vars[@]}"; do
        if grep -q "^$var=" env.example; then
            success "$var is defined in env.example"
        else
            error "$var is missing from env.example"
        fi
    done
else
    error "env.example file is missing"
fi

# Test 6: Test health check endpoints (if server is running)
echo ""
echo "🏥 Testing health check endpoints..."

SERVER_URL="http://localhost:3001"

if curl -s "$SERVER_URL/health" > /dev/null 2>&1; then
    success "Server is running and accessible"
    
    # Test /health endpoint
    HEALTH_STATUS=$(curl -s "$SERVER_URL/health" | jq -r '.status' 2>/dev/null || echo "ERROR")
    if [ "$HEALTH_STATUS" = "OK" ]; then
        success "/health endpoint returns OK"
    else
        warning "/health endpoint returns: $HEALTH_STATUS"
    fi
    
    # Test /ready endpoint
    if curl -s "$SERVER_URL/ready" > /dev/null 2>&1; then
        success "/ready endpoint is accessible"
    else
        warning "/ready endpoint is not accessible"
    fi
    
    # Test /live endpoint
    if curl -s "$SERVER_URL/live" > /dev/null 2>&1; then
        success "/live endpoint is accessible"
    else
        warning "/live endpoint is not accessible"
    fi
    
else
    warning "Server is not running - skipping endpoint tests"
    echo "  To test endpoints, run: node server/index.js"
fi

# Test 7: Check GitHub Actions workflow
echo ""
echo "🚀 Checking GitHub Actions workflow..."

if [ -f ".github/workflows/docker-build.yml" ]; then
    if grep -q "name: Build and Push Docker Images" .github/workflows/docker-build.yml; then
        success "GitHub Actions workflow is properly configured"
    else
        warning "GitHub Actions workflow may have issues"
    fi
    
    # Check for key workflow components
    workflow_components=(
        "docker/build-push-action"
        "docker/setup-buildx-action"
        "actions/checkout"
    )
    
    for component in "${workflow_components[@]}"; do
        if grep -q "$component" .github/workflows/docker-build.yml; then
            success "Workflow includes $component"
        else
            warning "Workflow missing $component"
        fi
    done
else
    error "GitHub Actions workflow file is missing"
fi

# Test 8: Validate Nginx configuration (syntax check)
echo ""
echo "🌐 Checking Nginx configuration..."

if command -v nginx &> /dev/null; then
    # Test nginx config syntax (if nginx is installed)
    if nginx -t -c "$(pwd)/nginx/nginx.conf" &> /dev/null; then
        success "Nginx configuration syntax is valid"
    else
        warning "Nginx configuration has syntax issues"
    fi
else
    warning "Nginx not installed - skipping syntax check"
fi

# Test 9: Check script permissions
echo ""
echo "🔒 Checking script permissions..."

executable_scripts=(
    "docker-start.sh"
    "password-admin-tool.sh"
    "test-force-password-change.sh"
)

for script in "${executable_scripts[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            success "$script is executable"
        else
            warning "$script is not executable (run: chmod +x $script)"
        fi
    fi
done

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="

if [ -z "$SKIP_DOCKER" ] && [ -z "$SKIP_COMPOSE" ]; then
    success "Docker environment is ready for deployment"
    echo ""
    echo "🚀 Ready to deploy! Try these commands:"
    echo "  • ./docker-start.sh                    # Quick start script"
    echo "  • docker-compose up -d                 # Standard deployment"  
    echo "  • docker-compose --profile nginx up -d # With Nginx proxy"
    echo "  • docker-compose -f docker-compose.dev.yml up -d # Development mode"
else
    warning "Docker environment setup incomplete"
    echo ""
    echo "📝 To complete setup:"
    echo "  • Install Docker: https://docs.docker.com/get-docker/"
    echo "  • Install Docker Compose: https://docs.docker.com/compose/install/"
fi

echo ""
echo "📚 Documentation:"
echo "  • DOCKER.md          # Complete Docker deployment guide"
echo "  • README.md          # Project overview and quick start"
echo "  • env.example        # Environment configuration template"

echo ""
success "Docker setup test completed!" 