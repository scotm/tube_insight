# TubeInsight - AI-Powered YouTube Video Analysis Platform

## Project Overview

TubeInsight is a Next.js application that enables users to analyze their YouTube playlists using Google's Gemini AI. It provides intelligent insights, summaries, and analysis of video content at scale.

## Technical Stack

- **Frontend**: Next.js 15, TypeScript, TailwindCSS
- **TypeScript**: Use bun for installing packages and running the project.
- **Authentication**: NextAuth.js with Google OAuth
- **AI Integration**: Google Gemini SDK
- **Data Fetching**: React Query (TanStack Query)
- **Styling**: TailwindCSS + Lucide React icons + shadcn/ui
- **Database**: Optional PostgreSQL for caching (future)

## Architecture

### Core Features

#### 1. Authentication & User Management

- **Google OAuth 2.0** integration via NextAuth.js
- **Session Management** with secure HTTP-only cookies
- **Token Refresh** automatic handling for YouTube API access
- **Protected Routes** middleware for authenticated pages
- **User Profile** basic info from Google account

#### 2. YouTube Integration

- **Playlist Discovery** fetch all user playlists
- **Video Metadata** extract titles, descriptions, thumbnails
- **Batch Processing** handle large playlists efficiently
- **Rate Limiting** respect YouTube API quotas
- **Caching Strategy** React Query with 5-minute cache

#### 3. AI Analysis Engine

- **Multi-modal Analysis** using Gemini Pro Vision
- **Analysis Types**:
  - Content summary (200-300 words)
  - Key topics and themes
  - Sentiment analysis
  - Technical quality assessment
  - Engagement optimization suggestions
- **Processing Queue** background analysis with progress tracking
- **Result Caching** store analysis for 24 hours

#### 4. User Interface

- **Dashboard** overview of playlists and analysis status
- **Playlist View** grid/list toggle, search/filter
- **Video Analysis** detailed view with AI insights
- **Bulk Operations** analyze entire playlists
- **Export Options** PDF reports, CSV data

## File Structure

```plaintext
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts
│   ├── api/youtube/playlists/route.ts
│   ├── api/youtube/videos/route.ts
│   ├── api/analysis/route.ts
│   ├── auth/signin/page.tsx
│   ├── dashboard/page.tsx
│   ├── playlists/[id]/page.tsx
│   └── globals.css
├── components/
│   ├── auth/
│   ├── playlists/
│   ├── analysis/
│   └── ui/
├── lib/
│   ├── auth.ts
│   ├── youtube.ts
│   ├── gemini.ts
│   └── utils.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useYouTube.ts
│   └── useAnalysis.ts
└── types/
    ├── auth.ts
    ├── youtube.ts
    └── analysis.ts
```

## Environment Variables

```bash
# Authentication
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# APIs
YOUTUBE_API_KEY=
GEMINI_API_KEY=

# Optional Database
DATABASE_URL=
```

## API Design

### YouTube Endpoints

- `GET /api/youtube/playlists` - Fetch user playlists
- `GET /api/youtube/videos?playlistId=` - Fetch videos in playlist
- `GET /api/youtube/video/:id` - Get video details

### Analysis Endpoints

- `POST /api/analysis/video` - Analyze single video
- `POST /api/analysis/playlist` - Analyze playlist
- `GET /api/analysis/status/:id` - Check analysis progress

## Development Phases

### Phase 1: Foundation (Week 1)

- [ ] Set up NextAuth.js with Google OAuth
- [ ] Configure YouTube Data API v3
- [ ] Create basic layout and navigation
- [ ] Implement playlist fetching

### Phase 2: Core Features (Week 2)

- [ ] Gemini SDK integration
- [ ] Video analysis pipeline
- [ ] Dashboard with playlist overview
- [ ] Individual video analysis view

### Phase 3: Enhanced Features (Week 3)

- [ ] Bulk analysis operations
- [ ] Search and filter functionality
- [ ] Export capabilities
- [ ] Performance optimizations

### Phase 4: Polish & Deploy (Week 4)

- [ ] Error handling and loading states
- [ ] Responsive design improvements
- [ ] Testing and bug fixes
- [ ] Vercel deployment

## Performance Considerations

- **API Rate Limits**: YouTube (10,000 units/day), Gemini (60 requests/minute)
- **Caching**: React Query with intelligent cache invalidation
- **Lazy Loading**: Images and video data
- **Code Splitting**: Route-based code splitting with Next.js

## Security Measures

- **CSRF Protection**: NextAuth.js built-in protection
- **Input Validation**: Zod schemas for all API inputs
- **Rate Limiting**: API route rate limiting
- **Environment Variables**: No secrets exposed to client

## Future Enhancements

- **Real-time Updates**: WebSocket for analysis progress
- **Advanced Analytics**: User engagement tracking
- **Team Collaboration**: Share playlists and analyses
- **Mobile App**: React Native companion app
- **AI Model Selection**: Choose between Gemini models

## Testing Strategy

- **Unit Tests**: Jest for utilities and hooks
- **Integration Tests**: API route testing
- **E2E Tests**: Playwright for critical user flows
- **Performance Tests**: Lighthouse CI for web vitals

## Deployment

- **Vercel**: Primary deployment platform
- **Environment**: Separate staging and production
- **Monitoring**: Vercel Analytics and Error Tracking
- **CI/CD**: GitHub Actions for automated testing
