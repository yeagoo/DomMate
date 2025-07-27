#!/bin/bash

# DomMate Docker Quick Start Script
# This script helps you quickly set up and run DomMate using Docker

set -e

echo "🐳 DomMate Docker Quick Start"
echo "=============================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Create necessary directories
echo "📁 Creating data directories..."
mkdir -p docker-data/{data,logs,backups,temp}
chmod 755 docker-data
chmod 755 docker-data/*

# Check if environment file exists
if [ ! -f "env.production" ]; then
    if [ -f "env.example" ]; then
        echo "📝 Creating environment file from example..."
        cp env.example env.production
        echo "⚠️  Please edit env.production to configure your settings"
        echo "   Important: Change JWT_SECRET and SESSION_SECRET!"
    else
        echo "❌ No environment template found. Creating basic env.production..."
        cat > env.production << EOF
# Basic DomMate Configuration
NODE_ENV=production
SERVER_HOST=0.0.0.0
SERVER_PORT=3001
DATABASE_PATH=/app/data/domains.db

# Security (CHANGE THESE!)
JWT_SECRET=change-this-super-secret-jwt-key-in-production
SESSION_SECRET=change-this-super-secret-session-key-in-production

# Email (Optional)
EMAIL_ENABLED=false
EOF
        echo "⚠️  Basic environment file created. Please edit env.production to configure your settings!"
    fi
fi

# Ask user for deployment type
echo ""
echo "Select deployment option:"
echo "1) Standard deployment (just DomMate)"
echo "2) With Nginx reverse proxy"
echo "3) Development mode with admin tools"

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🚀 Starting DomMate in standard mode..."
        docker-compose up -d dommate
        ;;
    2)
        echo "🌐 Starting DomMate with Nginx..."
        if [ ! -d "nginx" ]; then
            echo "❌ Nginx configuration not found. Please ensure nginx/ directory exists."
            exit 1
        fi
        docker-compose --profile nginx up -d
        ;;
    3)
        echo "🛠️  Starting DomMate in development mode..."
        docker-compose -f docker-compose.dev.yml --profile admin --profile logs up -d
        ;;
    *)
        echo "Invalid choice. Starting in standard mode..."
        docker-compose up -d dommate
        ;;
esac

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 10

# Check container status
if docker-compose ps | grep -q "Up"; then
    echo "✅ DomMate is running!"
    echo ""
    echo "🌐 Access your application:"
    echo "   - Main app: http://localhost:3001"
    echo "   - Default password: admin123"
    echo ""
    
    if [ "$choice" = "3" ]; then
        echo "🛠️  Development tools:"
        echo "   - Database admin: http://localhost:8080"
        echo "   - Log viewer: http://localhost:9999"
        echo ""
    fi
    
    echo "📝 Next steps:"
    echo "   1. Open http://localhost:3001 in your browser"
    echo "   2. Login with password: admin123"
    echo "   3. Change your password immediately"
    echo "   4. Start adding domains to monitor"
    echo ""
    echo "📊 Monitor your deployment:"
    echo "   - View logs: docker-compose logs -f"
    echo "   - Check status: docker-compose ps"
    echo "   - Health check: curl http://localhost:3001/health"
    echo ""
    echo "🛑 To stop DomMate:"
    echo "   - docker-compose down"
else
    echo "❌ Failed to start DomMate. Check the logs:"
    echo "   docker-compose logs"
    exit 1
fi 