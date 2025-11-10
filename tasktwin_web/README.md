# TaskTwin Web Application

A Next.js 15 application for matching users into 25-minute focus sessions with shared goals.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL 16 + Prisma 5
- **Auth**: Clerk (Passkey + Magic Link)
- **Real-time**: WebSockets
- **Payments**: Stripe
- **Monitoring**: Sentry + OpenTelemetry

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- Clerk account
- Stripe account (for payments)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration.

3. Set up the database:

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema (for development)
npm run db:push
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
tasktwin_web/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/          # API routes
│   │   │   ├── health/
│   │   │   ├── match/
│   │   │   ├── room/
│   │   │   ├── recap/
│   │   │   ├── streaks/
│   │   │   └── stats/
│   │   ├── dashboard/    # Dashboard pages
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   ├── lib/             # Utilities
│   │   ├── prisma.ts    # Prisma client
│   │   └── utils.ts     # Helper functions
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── middleware.ts    # Clerk auth middleware
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## API Endpoints

### Health
- `GET /api/health` - Health check

### Matching
- `POST /api/match` - Enter matching queue
- `GET /api/match/status` - Check queue status
- `DELETE /api/match` - Leave queue

### Rooms
- `POST /api/room` - Create room
- `GET /api/room` - Get active rooms
- `GET /api/room/[roomId]` - Get room details
- `PATCH /api/room/[roomId]` - Update room (start/pause/resume/end)

### Recaps
- `POST /api/recap` - Create recap
- `GET /api/recap` - Get user's recaps
- `POST /api/recap/[recapId]/approve` - Approve recap

### Progress
- `GET /api/streaks` - Get streak data
- `GET /api/stats` - Get user statistics

## Database Schema

Key models:
- **User** - User profiles with Clerk integration
- **Room** - 25-minute focus sessions
- **Match** - User-room relationships
- **Recap** - Session summaries with mutual approval
- **Streak** - Daily completion tracking
- **MatchQueue** - Matching queue entries
- **Team** - Team workspaces (coming soon)
- **OKR** - Team objectives (coming soon)

## Features

- ✅ Passkey authentication
- ✅ Smart matching algorithm
- ✅ Real-time focus rooms
- ✅ Shared timer (25 minutes)
- ✅ Collaborative recaps
- ✅ Streak tracking
- ✅ Progress analytics
- 🚧 Team workspaces
- 🚧 OKR integration
- 🚧 Stripe payments

## Development

### Adding a new API endpoint

1. Create route handler in `src/app/api/[name]/route.ts`
2. Add Zod schema for validation
3. Use Clerk's `auth()` for authentication
4. Use Prisma client for database operations
5. Add types to `src/types/index.ts`

### Adding a new page

1. Create route in `src/app/[name]/page.tsx`
2. Protected routes automatically require auth (via middleware)
3. Use Clerk's `<SignedIn>` and `<SignedOut>` components

## License

[To be determined]
