# TubeInsight Gemini Workspace

This document provides a guide for using the Gemini CLI to develop and maintain the TubeInsight application.

## Project Overview

TubeInsight is a Next.js application that enables users to analyze their YouTube playlists using Google's Gemini AI. It provides intelligent insights, summaries, and analysis of video content at scale.

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Package Manager**: bun
- **Authentication**: NextAuth.js with Google OAuth
- **AI**: Google Gemini SDK
- **Styling**: TailwindCSS with shadcn/ui and Lucide React icons

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- bun (v1.0 or later)
- Google Cloud project with YouTube Data API v3 and Gemini API enabled

### Installation

1. **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd tube-insight
    ```

2. **Install dependencies using bun:**

    ```bash
    bun install
    ```

3. **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add the following variables:

    ```bash
    # Authentication
    GOOGLE_CLIENT_ID=
    GOOGLE_CLIENT_SECRET=
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=

    # APIs
    YOUTUBE_API_KEY=
    GEMINI_API_KEY=
    ```

    *`NEXTAUTH_SECRET` can be generated with `openssl rand -base64 32`*

### Running the Development Server

To start the development server, run:

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

## Development Commands

- **`bun run dev`**: Starts the development server.
- **`bun run build`**: Creates a production build.
- **`bun run start`**: Starts the production server.
- **`bun run lint`**: Lints the codebase using ESLint.

## Coding Conventions

- **Components**: Use functional components with TypeScript. Leverage `shadcn/ui` for UI components where possible.
- **Styling**: Use TailwindCSS for styling. Avoid plain CSS or CSS Modules unless absolutely necessary.
- **State Management**: Use React Query (TanStack Query) for server state and React Context or `useState` for UI state.
- **API Routes**: All API routes are located in `src/app/api/`. Follow the Next.js App Router conventions.
- **Types**: Define custom types in the `src/types/` directory.
- **Linting**: Adhere to the rules defined in `eslint.config.mjs`. Run `bun run lint` before committing changes.
