# DomMate - Professional Domain Monitoring Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/database-SQLite-blue.svg)](https://www.sqlite.org/)
[![GitHub Stars](https://img.shields.io/github/stars/yeagoo/DomMate.svg)](https://github.com/yeagoo/DomMate)

**Professional Domain Expiration Monitoring Solution**

[🌐 Official Website](https://dommate.com) | [📖 中文文档](./README_zh-CN.md) | [🚀 Demo](https://demo.dommate.com)

![DomMate Logo](./public/logo.svg)

</div>

## 🌟 About DomMate

**DomMate** is a powerful domain monitoring platform designed for individuals and businesses to provide comprehensive domain management and expiration monitoring services. With an intuitive interface and robust backend, DomMate ensures you never miss a critical domain renewal.

## ✨ Key Features

### 🔍 Smart Monitoring
- **Automated Domain Expiration Tracking**: Real-time monitoring of domain expiration dates
- **Bulk Operations**: Manage hundreds of domains efficiently
- **WHOIS Integration**: Automatic domain information retrieval
- **Custom Check Intervals**: Flexible monitoring schedules

### 📧 Advanced Notifications
- **Multi-Channel Alerts**: Email notifications with customizable templates
- **Smart Scheduling**: Daily, weekly, and custom notification rules
- **Notification History**: Complete audit trail of all alerts
- **Template Customization**: Personalized email templates

### 📊 Analytics & Insights
- **Comprehensive Dashboard**: Visual domain portfolio overview
- **Expiration Analytics**: Detailed statistics and trends
- **Export Capabilities**: CSV, JSON, Excel export options
- **Reporting Tools**: Scheduled reports and data visualization

### 🏷️ Organization Tools
- **Domain Grouping**: Flexible categorization system
- **Tagging System**: Mark important domains with star ratings
- **Notes & Comments**: Add detailed notes to each domain
- **Search & Filter**: Advanced search and filtering options

### 🔐 Security & Authentication
- **User Authentication**: Secure login with session management
- **CAPTCHA Protection**: Brute-force attack prevention
- **Password Policies**: Forced password changes and security rules
- **Session Management**: Secure token-based authentication

### 🌐 Multi-Language Support
- **Bilingual Interface**: Complete Chinese and English support
- **Internationalization**: i18n ready for additional languages
- **Localized Content**: Culture-specific date and time formatting

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0
- **Git** (for cloning the repository)

### Installation

#### Option 1: Standard Installation

```bash
# Clone the repository
git clone https://github.com/yeagoo/DomMate.git
cd DomMate

# Install dependencies
npm install

# Start the backend server
node server/index.js

# In a new terminal, start the frontend
npm run dev
```

#### Option 2: Docker Installation (Recommended)

```bash
# Using pre-built image
curl -O https://raw.githubusercontent.com/yeagoo/DomMate/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/yeagoo/DomMate/main/env.example

# Configure environment
cp env.example env.production
# Edit env.production with your settings

# Create data directories
mkdir -p docker-data/{data,logs,backups,temp}

# Start the application
docker-compose up -d

# Access the application at http://localhost:3001
```

#### Option 3: Build from Source with Docker

```bash
# Clone and build
git clone https://github.com/yeagoo/DomMate.git
cd DomMate

# Configure environment
cp env.example env.production

# Build and start
docker-compose up --build -d
```

### First Access

1. **Open your browser** and navigate to `http://localhost:4322`
2. **Login** with the default password: `admin123`
3. **Change your password** immediately for security
4. **Start adding domains** to monitor

## 📦 Project Structure

```
DomMate/
├── server/                    # Backend API server
│   ├── index.js              # Main server file
│   ├── database.js           # SQLite database operations
│   ├── authService.js        # Authentication service
│   ├── emailService.js       # Email notification service
│   └── exportService.js      # Data export service
├── src/                      # Frontend source code
│   ├── components/           # React components
│   ├── layouts/              # Astro layouts
│   ├── pages/                # Application pages
│   ├── lib/                  # Utility libraries
│   └── i18n/                 # Internationalization
├── public/                   # Static assets
└── docs/                     # Documentation
```

## 🛠️ Technology Stack

- **Frontend**: Astro + React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: SQLite
- **Authentication**: JWT + Session management
- **Email**: SMTP with template support
- **API**: RESTful API design

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Database configuration
DATABASE_PATH=./domain.db

# Server ports
SERVER_PORT=3001
CLIENT_PORT=4322

# Email configuration (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password

# Security settings
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

### Email Setup

Configure SMTP settings in the application:

1. Navigate to **Email Notification System**
2. Add your SMTP configuration
3. Test the connection
4. Set up notification rules

## 📚 API Documentation

### Authentication Endpoints

```bash
# Login
POST /api/auth/login
Content-Type: application/json
{
  "password": "your-password",
  "captcha": "captcha-value"
}

# Change Password
POST /api/auth/change-password
X-Session-Id: session-token
{
  "oldPassword": "old-password",
  "newPassword": "new-password"
}

# Logout
POST /api/auth/logout
X-Session-Id: session-token
```

### Domain Management

```bash
# Get all domains
GET /api/domains
X-Session-Id: session-token

# Add domain
POST /api/domains
X-Session-Id: session-token
{
  "domain": "example.com",
  "groupId": 1,
  "isImportant": false,
  "notes": "Optional notes"
}

# Update domain notes
PATCH /api/domains/:id/notes
X-Session-Id: session-token
{
  "notes": "Updated notes"
}

# Batch operations
POST /api/domains/batch-important
X-Session-Id: session-token
{
  "domainIds": [1, 2, 3],
  "isImportant": true
}
```

### Export APIs

```bash
# Export domains
POST /api/export/domains
X-Session-Id: session-token
{
  "format": "json",
  "fields": ["domain", "expiresAt", "status"],
  "language": "en"
}
```

## 🐳 Deployment

### Docker Deployment (Recommended)

DomMate provides complete Docker support with multi-architecture images and automated CI/CD.

#### Quick Start with Docker

```bash
# Method 1: Using pre-built images (Recommended)
curl -O https://raw.githubusercontent.com/yeagoo/DomMate/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/yeagoo/DomMate/main/env.example
cp env.example env.production
# Edit env.production with your settings
mkdir -p docker-data/{data,logs,backups,temp}
docker-compose up -d

# Method 2: One-click start script
./docker-start.sh

# Method 3: Build from source
git clone https://github.com/yeagoo/DomMate.git
cd DomMate
cp env.example env.production
docker-compose up --build -d
```

#### Docker Images

- **GitHub Container Registry**: `ghcr.io/yeagoo/dommate:latest`
- **Multi-Architecture**: AMD64 and ARM64 support
- **Automated Builds**: GitHub Actions CI/CD pipeline
- **Security Scanning**: Trivy vulnerability scanning

#### Docker Features

- 🔒 **Security**: Non-root user, minimal attack surface
- 📊 **Health Checks**: Comprehensive `/health`, `/ready`, `/live` endpoints
- 🚀 **Performance**: Multi-stage builds, optimized layers
- 🔄 **High Availability**: Auto-restart, resource limits
- 📈 **Monitoring**: Structured logging, metrics collection
- 🌐 **Reverse Proxy**: Nginx configuration included

#### Environment Configuration

Key environment variables for Docker deployment:

```bash
# Required settings
NODE_ENV=production
SERVER_HOST=0.0.0.0
SERVER_PORT=3001
DATABASE_PATH=/app/data/domains.db

# Security (MUST change these!)
JWT_SECRET=your-super-secret-jwt-key-change-this
SESSION_SECRET=your-super-secret-session-key-change-this

# Email notifications (optional)
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Deployment Options

```bash
# Standard deployment
docker-compose up -d

# With Nginx reverse proxy
docker-compose --profile nginx up -d

# Development mode with admin tools
docker-compose -f docker-compose.dev.yml --profile admin --profile logs up -d

# Check status and logs
docker-compose ps
docker-compose logs -f dommate

# Health check
curl http://localhost:3001/health
```

For complete Docker deployment guide, see [DOCKER.md](DOCKER.md).

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start backend service
pm2 start server/index.js --name dommate-api

# Start frontend service
pm2 start "npm run dev" --name dommate-web

# Save PM2 configuration
pm2 save
pm2 startup
```

### Production Build

```bash
# Build for production
npm run build

# Serve with a static server
npm run preview
```

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run integration tests
npm run test:integration

# Test authentication system
./test-force-password-change.sh

# Test password management
./password-admin-tool.sh
```

## 🔒 Security Features

- **Password Encryption**: SHA-256 hashing
- **Session Management**: Secure token-based sessions
- **Brute Force Protection**: Login attempt limiting
- **CAPTCHA Verification**: Mathematical challenge system
- **Forced Password Changes**: Security policy enforcement
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization

## 🌍 Internationalization

DomMate supports multiple languages:

- **English**: Full interface support
- **Chinese**: Complete localization
- **Extensible**: Easy to add new languages

To add a new language:
1. Create a new translation file in `src/i18n/`
2. Update the language selector
3. Add date/time localization

## 🤝 Contributing

We welcome contributions from the community!

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Write comprehensive tests
- Update documentation
- Use meaningful commit messages

### Reporting Issues

- Use the [GitHub Issues](https://github.com/yeagoo/DomMate/issues) page
- Provide detailed reproduction steps
- Include system information
- Attach relevant logs

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🏆 Awards & Recognition

- ⭐ Featured on GitHub Trending
- 🚀 Product Hunt Daily
- 💎 Open Source Project of the Month

## 🙏 Acknowledgments

- **Contributors**: Thanks to all who have contributed to this project
- **Libraries**: Built on top of amazing open-source projects
- **Community**: Grateful for the feedback and support

---

<div align="center">
**⭐ If this project helps you, please give it a star! ⭐**

[🌐 dommate.com](https://dommate.com) 

</div> 