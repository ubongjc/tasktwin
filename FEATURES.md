# TaskTwin - Features & Usage Documentation

**Last Updated:** 2025-11-10
**Branch:** claude/add-features-documentation-011CUzjbfwZWnKSSGBWvP8g9
**Status:** Project Initialization Phase

---

## Table of Contents
1. [Overview](#overview)
2. [Project Architecture](#project-architecture)
3. [Current Features](#current-features)
4. [Planned Features](#planned-features)
5. [Getting Started](#getting-started)
6. [Usage Guide](#usage-guide)
7. [Development Setup](#development-setup)
8. [API Reference](#api-reference)
9. [Change Log](#change-log)

---

## Overview

TaskTwin is a productivity application that matches users into 25-minute focus rooms with shared goals. Users work together with a shared timer, micro-checklist, and collaborative win recap that both participants approve.

### Key Concepts
- **Focus Rooms**: 25-minute collaborative work sessions
- **Smart Matching**: Pairs users based on topic and intent tags
- **Shared Timer**: Synchronized countdown for both participants
- **Win Recap**: Collaborative session summary requiring mutual approval
- **Accountability Nudges**: Ambient reminders to maintain streaks
- **Team Spaces**: Optional team collaboration with OKR linkage

---

## Project Architecture

### Platform Support
- **Web Application**: Progressive web app built with Next.js
- **iOS Application**: Native app built with SwiftUI
- **Repository Structure**:
  - `tasktwin_web/` - Web application
  - `tasktwin_ios/` - iOS application

### Technology Stack

#### Web Application
- **Framework**: Next.js 15 with App Router
- **UI**: React 18, TypeScript 5, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL 16 with Prisma 5
- **Vector Search**: pgvector for embeddings
- **Storage**: Cloudflare R2 (S3-compatible)
- **Authentication**: Passkey/WebAuthn-first (Clerk/Auth.js) with magic link fallback
- **Real-time**: WebSockets/SSE, WebRTC for peer connections
- **Observability**: Sentry + OpenTelemetry
- **Payments**: Stripe integration
- **API**: RESTful with OpenAPI documentation

#### iOS Application
- **Framework**: SwiftUI with Combine
- **Concurrency**: async/await patterns
- **Security**: CryptoKit for encryption
- **Media**: AVFoundation/Vision frameworks
- **Payments**: StoreKit with entitlements sync
- **Authentication**: Passkey support

#### Security & Privacy
- **Client-side encryption** for sensitive data
- **Anonymous-first profiles** for privacy
- **Minimal chat retention** policy
- **Safety filters** for content moderation
- **ABAC (Attribute-Based Access Control)** for authorization

---

## Current Features

### Phase: Repository Initialization
- [x] Git repository created
- [x] Branch strategy established
- [x] Documentation structure defined
- [ ] Web application scaffold
- [ ] iOS application scaffold
- [ ] Database schema design
- [ ] Authentication implementation
- [ ] Core API endpoints

---

## Planned Features

### MVP Features (In Priority Order)

#### 1. Authentication & User Management
- **Passkey Authentication**: WebAuthn-first sign-in
- **Magic Link Fallback**: Email-based authentication
- **Role-Based Access**: User roles and ABAC enforcement
- **Anonymous Profiles**: Privacy-first user profiles
- **Account Settings**: Profile management and preferences

#### 2. Matching System
- **Topic-Based Matching**: `POST /api/match` - Find partners with similar goals
- **Intent Tags**: Filter by work intention (focus, brainstorm, accountability)
- **Smart Algorithm**: AI-enhanced matching based on success rates
- **Queue Management**: Real-time waiting room with status updates

#### 3. Focus Rooms
- **Room Creation**: `POST /api/room/start` - Initialize 25-minute sessions
- **Shared Timer**: Synchronized countdown for both participants
- **Micro-Checklist**: Quick task items for the session
- **Live Presence**: WebSocket-based presence indicators
- **Room Controls**: Start, pause, end session controls

#### 4. Session Recap
- **Collaborative Recap**: `POST /api/recap` - Create session summary
- **Mutual Approval**: Both participants must approve recap
- **Achievement Tracking**: Track completed tasks and goals
- **History**: View past session recaps

#### 5. Accountability Features
- **Streak Tracking**: `GET /api/streaks` - Monitor daily consistency
- **Progress Nudges**: Gentle reminders to maintain habits
- **Statistics Dashboard**: Personal productivity metrics
- **Behavior Reporting**: Report toxic or disruptive behavior

#### 6. Team Spaces (Premium)
- **Team Creation**: Create collaborative workspaces
- **OKR Integration**: Link sessions to team objectives
- **Team Analytics**: Aggregate team productivity insights
- **Shared Goals**: Team-wide focus areas

#### 7. Payments & Monetization
- **Individual Plan**: $2.99/month subscription
- **Team Packs**: Multi-user pricing tiers
- **Stripe Integration**: Web payment processing
- **StoreKit Integration**: iOS in-app purchases
- **Entitlements Sync**: Cross-platform subscription management

#### 8. Data Rights & Privacy
- **Data Export**: Download all personal data
- **Account Deletion**: Complete data removal
- **Privacy Controls**: Granular privacy settings
- **Minimal Data Collection**: Privacy-first approach

---

## Getting Started

### Prerequisites
- Node.js 18+ (for web development)
- PostgreSQL 16+ (for database)
- Xcode 15+ (for iOS development)
- Cloudflare R2 account (for storage)
- Stripe account (for payments)

### Quick Start

#### Web Application Setup
```bash
# Navigate to web directory (once created)
cd tasktwin_web

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up database
npx prisma migrate dev

# Run development server
npm run dev

# Open browser to http://localhost:3000
```

#### iOS Application Setup
```bash
# Navigate to iOS directory (once created)
cd tasktwin_ios

# Open in Xcode
open TaskTwin.xcodeproj

# Configure signing & capabilities
# Add your development team

# Run on simulator or device
```

---

## Usage Guide

### For End Users

#### Getting Started
1. **Sign Up**: Use passkey or magic link to create account
2. **Set Goals**: Define what you want to accomplish
3. **Find Match**: Enter queue to be paired with compatible partner
4. **Focus Session**: Work together for 25 minutes
5. **Create Recap**: Collaborate on session summary
6. **Track Progress**: View streaks and statistics

#### Best Practices
- **Be Specific**: Use clear, specific goals for better matching
- **Stay Engaged**: Maintain presence during sessions
- **Be Respectful**: Create positive accountability partnerships
- **Review Recaps**: Take time to reflect on accomplishments
- **Build Streaks**: Consistency is key to habit formation

### For Team Admins

#### Setting Up Teams
1. **Create Team Space**: Upgrade to team plan
2. **Invite Members**: Send team invitations
3. **Define OKRs**: Set team objectives and key results
4. **Link Sessions**: Connect focus sessions to team goals
5. **Monitor Progress**: Review team analytics

---

## Development Setup

### Environment Variables

#### Web Application (.env.local)
```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/tasktwin"

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Storage
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="tasktwin-storage"

# Payments
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Monitoring
SENTRY_DSN="https://..."
NEXT_PUBLIC_SENTRY_DSN="https://..."

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
```

#### iOS Application (Config.xcconfig)
```bash
API_BASE_URL = https://api.tasktwin.com
SENTRY_DSN = https://...
```

### Database Schema

#### Core Tables
```sql
-- Users with anonymous profiles
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  streak_count INT DEFAULT 0,
  role TEXT DEFAULT 'user'
);

-- Focus rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY,
  topic TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 25,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User matches
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  room_id UUID REFERENCES rooms(id),
  role TEXT DEFAULT 'participant',
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session recaps
CREATE TABLE recaps (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  text TEXT NOT NULL,
  user_1_approved BOOLEAN DEFAULT FALSE,
  user_2_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks
CREATE TABLE streaks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  sessions_completed INT DEFAULT 0,
  UNIQUE(user_id, date)
);
```

---

## API Reference

### Authentication
```
POST /api/auth/passkey/register    - Register new passkey
POST /api/auth/passkey/login       - Authenticate with passkey
POST /api/auth/magic-link/send     - Send magic link email
GET  /api/auth/magic-link/verify   - Verify magic link token
POST /api/auth/logout              - End session
```

### Matching
```
POST /api/match                    - Enter matching queue
GET  /api/match/status            - Check queue status
DELETE /api/match                  - Leave queue
```

### Focus Rooms
```
POST /api/room/start              - Start new focus room
GET  /api/room/:id                - Get room details
PATCH /api/room/:id/pause         - Pause room timer
PATCH /api/room/:id/resume        - Resume room timer
POST /api/room/:id/end            - End room session
GET  /api/room/:id/participants   - List participants
```

### Recaps
```
POST /api/recap                   - Create session recap
GET  /api/recap/:id               - Get recap details
PATCH /api/recap/:id/approve      - Approve recap
GET  /api/user/recaps             - List user's recaps
```

### User Progress
```
GET  /api/streaks                 - Get user streaks
GET  /api/stats                   - Get user statistics
GET  /api/history                 - Get session history
```

### Team Management
```
POST /api/team                    - Create team
GET  /api/team/:id                - Get team details
POST /api/team/:id/invite         - Invite team member
GET  /api/team/:id/members        - List team members
POST /api/team/:id/okr            - Create OKR
GET  /api/team/:id/analytics      - Team analytics
```

### Data Rights
```
GET  /api/user/data/export        - Export all user data
DELETE /api/user/data             - Delete account and data
```

---

## Change Log

### 2025-11-10 - Project Initialization & Documentation Framework
**Branch:** `claude/add-features-documentation-011CUzjbfwZWnKSSGBWvP8g9`

#### Added
- Created comprehensive FEATURES.md documentation
- Established project vision and architecture
- Defined MVP feature set with priority ordering
- Documented complete API surface (15+ endpoints)
- Created development setup guide with environment variables
- Defined database schema for core tables
- Established documentation update workflow
- Added `.github/DOCUMENTATION_WORKFLOW.md` with update guidelines
- Created change log entry template
- Added pre-push checklist for documentation updates

#### Repository Status
- Clean repository with initial commit
- Branch structure established
- Documentation foundation complete
- Workflow guidelines in place

#### Next Steps
- Scaffold web application (Next.js 15 + TypeScript)
- Scaffold iOS application (SwiftUI)
- Implement database schema with Prisma
- Set up authentication system (Passkey + Magic Link)
- Create core API endpoints (health, auth, match, room)
- Implement matching algorithm
- Set up development environment (.env.example)

---

## Contributing

### Documentation Updates
This FEATURES.md file should be updated after every significant change:
1. **Before Push**: Update relevant sections
2. **Add to Change Log**: Document what changed
3. **Update Date**: Modify "Last Updated" timestamp
4. **Commit**: Include documentation in commit

### Change Log Entry Format
```markdown
### YYYY-MM-DD - Brief Description
**Branch:** `branch-name`

#### Added
- New features or files

#### Changed
- Modifications to existing features

#### Fixed
- Bug fixes

#### Removed
- Deprecated features

#### Next Steps
- Upcoming tasks
```

---

## Support & Resources

### Documentation
- Build Plan: See project root for detailed technical specifications
- API Docs: Auto-generated OpenAPI documentation at `/api/docs`
- Architecture: See `docs/architecture.md` (coming soon)

### Development
- Issue Tracking: GitHub Issues
- Development Branch: `claude/add-features-documentation-011CUzjbfwZWnKSSGBWvP8g9`
- Code Reviews: Required for all changes

### Security
- Report Security Issues: security@tasktwin.com (placeholder)
- Privacy Policy: See `PRIVACY.md` (coming soon)
- Data Protection: GDPR/CCPA compliant

---

## License

[To be determined]

---

**Note**: This is a living document. It will be updated regularly as features are implemented and the application evolves. Always refer to the latest version in the repository.
