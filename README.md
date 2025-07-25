# TubeInsight

TubeInsight is a Next.js application that leverages Google's Gemini AI to provide intelligent insights, summaries, and analysis of YouTube playlist content.

## Features

- **YouTube Playlist Analysis**: Get in-depth analysis and summaries of your YouTube playlists.
- **AI-Powered Insights**: Utilize Google Gemini AI for intelligent content understanding.
- **User Authentication**: Securely sign in with your Google account using NextAuth.js.

## Getting Started

Follow these steps to set up and run TubeInsight locally.

### Prerequisites

- Node.js (v18 or later)
- bun (v1.0 or later)
- Google Cloud project with YouTube Data API v3 and Gemini API enabled.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/tube-insight.git
    cd tube-insight
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of the project and add the following variables:

    ```
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

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google Gemini API Documentation](https://ai.google.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)

## Contributing

Contributions are welcome! Please see `CONTRIBUTING.md` for details.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
